"""
모델 재학습 + scores.csv 재생성 스크립트
- 직장인구 5개 피처 제거
- 저중요도 피처 제거 (41개 피처 유지)
- LightGBM 재학습 → scores.csv 저장
"""
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, roc_auc_score
from pathlib import Path

print("=" * 50)
print("1. 데이터 로드")
df = pd.read_csv("../outputs/final_dataset.csv")

# 직장인구 NaN → 0 (10개 행정동 직장인구 데이터 미집계)
직장인구_cols = [
    "총_직장_인구_수", "직장_20대_비율", "직장_30대_비율", "직장_40대_비율", "직장_여성비율",
    "직장_20대_인구", "직장_30대_인구", "직장_40대_인구", "직장_50대_인구",
    "직장_60대이상_인구", "남성_직장_인구", "여성_직장_인구",
]
df[직장인구_cols] = df[직장인구_cols].fillna(0)

# 점포 수 0인 카테고리에서 나누기 0으로 인한 NaN → 0 처리
파생_cols = ["업종_점포당매출", "업종_포화도", "점포대비유동"]
df[파생_cols] = df[파생_cols].fillna(0)

df = df.dropna()

print(f"총 행정동 수: {df['행정동명'].nunique()}")
print(df["기준_년분기_코드"].value_counts().sort_index())

print("\n" + "=" * 50)
print("2. 피처 엔지니어링")
df = df.sort_values(["행정동코드", "통합카테고리", "기준_년분기_코드"])

df["매출_증감률"] = (
    df.groupby(["행정동코드", "통합카테고리"])["당월매출합"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["매출_2분기평균"] = df.groupby(["행정동코드", "통합카테고리"])["당월매출합"].transform(
    lambda x: x.rolling(2, min_periods=1).mean()
)
df["매출_4분기평균"] = df.groupby(["행정동코드", "통합카테고리"])["당월매출합"].transform(
    lambda x: x.rolling(4, min_periods=1).mean()
)
df["매출_4분기std"] = (
    df.groupby(["행정동코드", "통합카테고리"])["당월매출합"]
    .transform(lambda x: x.rolling(4, min_periods=2).std()).fillna(0)
)
df["매출_모멘텀"] = df["매출_2분기평균"] - df["매출_4분기평균"]
df["유동_증감률"] = (
    df.groupby(["행정동코드", "통합카테고리"])["총유동인구"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["객단가_증감률"] = (
    df.groupby(["행정동코드", "통합카테고리"])["객단가"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["객단가_4분기평균"] = df.groupby(["행정동코드", "통합카테고리"])["객단가"].transform(
    lambda x: x.rolling(4, min_periods=1).mean()
)

# 시간대별 유동인구 비율 피처
총유동 = df["총유동인구"].replace(0, pd.NA)
df["유동_아침비율"] = (df["시간대_06_11_유동"] / 총유동).fillna(0)
df["유동_점심비율"] = (df["시간대_11_14_유동"] / 총유동).fillna(0)
df["유동_저녁비율"] = (df["시간대_17_21_유동"] / 총유동).fillna(0)
df["유동_심야비율"] = (df["시간대_21_24_유동"] / 총유동).fillna(0)

# 매출건수 증감률
df["매출건수_증감률"] = (
    df.groupby(["행정동코드", "통합카테고리"])["당월매출건수"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)

# 점포수 증감률
df["점포수_증감률"] = (
    df.groupby(["행정동코드", "통합카테고리"])["점포수"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)

df["다음분기_매출"] = df.groupby(["행정동코드", "통합카테고리"])["당월매출합"].shift(-1)
df["다음분기_증감률"] = (df["다음분기_매출"] - df["당월매출합"]) / df["당월매출합"].replace(0, pd.NA)
df["label"] = (
    df.groupby(["통합카테고리", "기준_년분기_코드"])["다음분기_증감률"]
    .transform(lambda x: (x >= x.median()).astype(int))
)
labeled = df[df["다음분기_매출"].notna() & df["다음분기_증감률"].notna()].copy()
print(f"학습 가능 샘플 수: {len(labeled):,}")

print("\n" + "=" * 50)
print("3. 학습 설정")
le = LabelEncoder()
labeled["업종_encoded"] = le.fit_transform(labeled["통합카테고리"])
labeled["분기번호"] = labeled["기준_년분기_코드"] % 10

feature_cols = [
    "유동_증감률",
    "유동_20대비율", "유동_30대비율", "유동_40대비율", "유동_50대비율", "유동_여성비율",
    "매출_증감률", "매출_4분기std", "매출_모멘텀",
    "객단가", "객단가_4분기평균", "객단가_증감률",
    "매출_20대비율", "매출_30대비율", "매출_40대비율", "매출_50대비율", "매출_60대이상비율",
    "매출_남성비율", "매출_여성비율",
    "매출_주말비율", "매출_점심비율", "매출_저녁비율", "매출_심야비율",
    "업종_점포당매출", "업종_매출점유율", "경쟁강도", "업종_포화도",
    "MZ_차이", "유동대비매출", "점포대비유동",
    "주거인구",
    "유동_아침비율", "유동_점심비율", "유동_저녁비율", "유동_심야비율",
    "매출건수_증감률", "점포수_증감률",
    "개업_율_평균", "폐업_률_평균",
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
print("4. LightGBM 학습 중...")
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
print("5. scores.csv 생성")
latest_q = df["기준_년분기_코드"].max()
all_latest = df[df["기준_년분기_코드"] == latest_q].copy()
all_latest["업종_encoded"] = le.transform(all_latest["통합카테고리"])
all_latest["분기번호"] = all_latest["기준_년분기_코드"] % 10
all_latest["성장확률"] = model.predict_proba(all_latest[feature_cols])[:, 1]

all_latest["업종내_순위"] = (
    all_latest.groupby("통합카테고리")["성장확률"]
    .rank(ascending=False, method="min").astype(int)
)
all_latest["업종내_전체동수"] = (
    all_latest.groupby("통합카테고리")["성장확률"].transform("count").astype(int)
)
all_latest["상위_퍼센트"] = (all_latest["업종내_순위"] / all_latest["업종내_전체동수"] * 100).round(1)

def to_grade(pct):
    if pct <= 25:   return "A"
    elif pct <= 50: return "B"
    elif pct <= 75: return "C"
    else:           return "D"

all_latest["등급"] = all_latest["상위_퍼센트"].apply(to_grade)
all_latest["성장확률_pct"] = (all_latest["성장확률"] * 100).round(1)

scores_df = all_latest[[
    "행정동명", "통합카테고리", "기준_년분기_코드",
    "성장확률_pct", "업종내_순위", "업종내_전체동수", "상위_퍼센트", "등급"
]].copy()

SCORES_PATH = Path("../outputs/scores.csv")
scores_df.to_csv(SCORES_PATH, index=False, encoding="utf-8-sig")
print(f"저장 완료: {SCORES_PATH}")
print(f"총 {len(scores_df):,}개 (행정동×업종)")
print(f"포함된 행정동 수: {scores_df['행정동명'].nunique()}")

missing = ['가양2동', '구로1동', '둔촌1동', '신정6동', '암사3동', '위례동', '일원본동', '잠실7동', '하계2동', '항동']
found = [d for d in missing if d in scores_df['행정동명'].values]
print(f"\n새로 추가된 행정동: {found}")
print("완료!")
