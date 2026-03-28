"""
street_scores.csv 생성 스크립트
- 입력: data/processed_data/street_dataset.csv
- 출력: data/processed_data/street_scores.csv
  단위: 상권코드 × 통합카테고리
"""

import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score
from pathlib import Path

print("=" * 50)
print("1. 데이터 로드")
df = pd.read_csv("../data/processed_data/street_dataset.csv")

# 소득소비 NaN → 0 (소득소비 데이터가 없는 상권)
소득소비_cols = [
    "월_평균_소득_금액", "지출_총금액",
    "식료품_지출비율", "여가_지출비율", "교육_지출비율", "외식_지출비율",
]
df[소득소비_cols] = df[소득소비_cols].fillna(0)

# 크롤링 피처 NaN → 업종 평균
crawl_cols = ["crawl_avg_price", "crawl_price_range",
              "crawl_1인비율", "crawl_회식비율", "crawl_목적다양성", "crawl_menu_count"]
for col in crawl_cols:
    if col in df.columns:
        df[col] = df[col].fillna(df.groupby("통합카테고리")[col].transform("mean"))
        df[col] = df[col].fillna(df[col].mean())

# 유동인구 NaN → 0
유동_cols = [
    "총_유동인구_수",
    "유동_증감률", "유동대비매출",
    "유동_아침비율", "유동_점심비율", "유동_저녁비율", "유동_심야비율",
    "유동_20대비율", "유동_30대비율", "유동_40대비율", "유동_50대비율", "유동_여성비율",
]
df[유동_cols] = df[유동_cols].fillna(0)

df = df.dropna()

print(f"총 상권 수: {df['상권_코드'].nunique()}")
print(f"총 통합카테고리 수: {df['통합카테고리'].nunique()}")
print(df["기준_년분기_코드"].value_counts().sort_index())

print("\n" + "=" * 50)
print("2. 학습 설정")
le = LabelEncoder()
df["업종_encoded"] = le.fit_transform(df["통합카테고리"])
df["분기번호"] = df["기준_년분기_코드"] % 10

labeled = df[df["다음분기_매출"].notna() & df["다음분기_증감률"].notna()].copy()
print(f"학습 가능 샘플 수: {len(labeled):,}")

feature_cols = [
    # 매출 시계열
    "매출_증감률", "매출_4분기std", "매출_모멘텀",
    "객단가", "객단가_4분기평균", "객단가_증감률",
    "매출건수_증감률",
    # 매출 구성 비율
    "매출_20대비율", "매출_30대비율", "매출_40대비율", "매출_50대비율", "매출_60대이상비율",
    "매출_남성비율", "매출_여성비율",
    "매출_주말비율", "매출_점심비율", "매출_저녁비율", "매출_심야비율",
    "MZ_차이",
    # 유동인구
    "유동_증감률", "유동대비매출",
    "유동_아침비율", "유동_점심비율", "유동_저녁비율", "유동_심야비율",
    "유동_20대비율", "유동_30대비율", "유동_40대비율", "유동_50대비율", "유동_여성비율",
    # 소득소비 (상권 단위 신규 피처)
    "월_평균_소득_금액",
    "식료품_지출비율", "여가_지출비율", "교육_지출비율", "외식_지출비율",
    # 크롤링 피처 (네이버 플레이스 실측 데이터)
    "crawl_avg_price", "crawl_price_range",
    "crawl_1인비율", "crawl_회식비율", "crawl_목적다양성", "crawl_menu_count",
    # 메타
    "업종_encoded", "분기번호",
]
print(f"피처 수: {len(feature_cols)}")

quarters = sorted(labeled["기준_년분기_코드"].unique())
train_mask = labeled["기준_년분기_코드"] < quarters[-1]
test_mask  = labeled["기준_년분기_코드"] == quarters[-1]

X_train, y_train = labeled.loc[train_mask, feature_cols], labeled.loc[train_mask, "label"]
X_test,  y_test  = labeled.loc[test_mask,  feature_cols], labeled.loc[test_mask,  "label"]
print(f"훈련: {len(X_train):,}개 | 테스트: {len(X_test):,}개")

print("\n" + "=" * 50)
print("3. LightGBM 학습 중...")
model = lgb.LGBMClassifier(n_estimators=500, class_weight="balanced", random_state=42, verbose=-1)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]
print(classification_report(y_test, y_pred, target_names=["감소", "성장"]))
print("AUC-ROC:", round(roc_auc_score(y_test, y_prob), 4))

fi = pd.Series(model.feature_importances_, index=feature_cols).sort_values(ascending=False)
print("\n[Feature 중요도]")
print(fi.to_string())

print("\n" + "=" * 50)
print("4. street_scores.csv 생성")
latest_q = df["기준_년분기_코드"].max()
all_latest = df[df["기준_년분기_코드"] == latest_q].copy()
all_latest["업종_encoded"] = le.transform(all_latest["통합카테고리"])
all_latest["분기번호"] = all_latest["기준_년분기_코드"] % 10
all_latest["성장확률"] = model.predict_proba(all_latest[feature_cols])[:, 1]

all_latest["업종내_순위"] = (
    all_latest.groupby("통합카테고리")["성장확률"]
    .rank(ascending=False, method="min").astype(int)
)
all_latest["업종내_전체상권수"] = (
    all_latest.groupby("통합카테고리")["성장확률"].transform("count").astype(int)
)
all_latest["상위_퍼센트"] = (
    all_latest["업종내_순위"] / all_latest["업종내_전체상권수"] * 100
).round(1)

def to_grade(pct):
    if pct <= 25:   return "A"
    elif pct <= 50: return "B"
    elif pct <= 75: return "C"
    else:           return "D"

all_latest["등급"] = all_latest["상위_퍼센트"].apply(to_grade)
all_latest["성장확률_pct"] = (all_latest["성장확률"] * 100).round(1)

scores_df = all_latest[[
    "상권_코드", "상권_코드_명", "통합카테고리", "기준_년분기_코드",
    "성장확률_pct", "업종내_순위", "업종내_전체상권수", "상위_퍼센트", "등급",
]].copy()

OUT = Path("../data/processed_data/street_scores.csv")
scores_df.to_csv(OUT, index=False, encoding="utf-8-sig")
print(f"저장 완료: {OUT}")
print(f"총 {len(scores_df):,}개 (상권×업종)")
print(f"포함된 상권 수: {scores_df['상권_코드'].nunique()}")
print(f"포함된 통합카테고리 수: {scores_df['통합카테고리'].nunique()}")
print("완료!")
