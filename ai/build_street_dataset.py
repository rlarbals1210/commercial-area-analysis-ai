"""
street_dataset.csv 생성 스크립트
- 입력: 길단위원본데이터모음/ 내 3종 raw 파일
  1. 추정매출-상권 (2020~2024년, 5개 파일)
  2. 길단위인구-상권 (1개 파일)
  3. 소득소비-상권 (1개 파일)
- 출력: data/processed_data/street_dataset.csv
  단위: 분기 × 상권코드 × 통합카테고리
"""

import glob
import numpy as np
import pandas as pd
from pathlib import Path

BASE = Path(__file__).parent.parent / "data"
RAW  = BASE / "raw_data" / "길단위원본데이터모음"
OUT  = BASE / "processed_data" / "street_dataset.csv"

# ──────────────────────────────────────────────
# 1. 추정매출 로드 & 통합카테고리 매핑
# ──────────────────────────────────────────────
print("=" * 50)
print("1. 추정매출 로드")

매출_files = sorted(glob.glob(str(RAW / "서울시_상권분석서비스(추정매출-상권(20~25)" / "*.csv")))
print(f"  파일 수: {len(매출_files)}개")

매출_cols = [
    "기준_년분기_코드", "상권_코드", "상권_코드_명",
    "서비스_업종_코드_명",
    "당월_매출_금액", "당월_매출_건수",
    "주중_매출_금액", "주말_매출_금액",
    "시간대_00~06_매출_금액", "시간대_06~11_매출_금액",
    "시간대_11~14_매출_금액", "시간대_14~17_매출_금액",
    "시간대_17~21_매출_금액", "시간대_21~24_매출_금액",
    "남성_매출_금액", "여성_매출_금액",
    "연령대_10_매출_금액", "연령대_20_매출_금액", "연령대_30_매출_금액",
    "연령대_40_매출_금액", "연령대_50_매출_금액", "연령대_60_이상_매출_금액",
    "당월_매출_건수",
]
# 중복 컬럼 제거
매출_cols = list(dict.fromkeys(매출_cols))

dfs = []
for f in 매출_files:
    dfs.append(pd.read_csv(f, encoding="euc-kr", usecols=매출_cols))
df_sales = pd.concat(dfs, ignore_index=True)
print(f"  총 행 수: {len(df_sales):,}")

# 업종 매핑
cat_map = pd.read_csv(
    BASE / "category_maps" / "sales_category_map.csv", encoding="utf-8"
)
cat_map.columns = ["서비스_업종_코드_명", "통합카테고리"]
df_sales = df_sales.merge(cat_map, on="서비스_업종_코드_명", how="left")

# 매핑 안 된 업종 제거 (기존 모델 범위 밖)
unmapped = df_sales["통합카테고리"].isna().sum()
print(f"  매핑 제외 행 수: {unmapped:,}")
df_sales = df_sales.dropna(subset=["통합카테고리"])

# 세부업종 → 통합카테고리 단위로 합산
num_cols = [
    "당월_매출_금액", "당월_매출_건수",
    "주중_매출_금액", "주말_매출_금액",
    "시간대_00~06_매출_금액", "시간대_06~11_매출_금액",
    "시간대_11~14_매출_금액", "시간대_14~17_매출_금액",
    "시간대_17~21_매출_금액", "시간대_21~24_매출_금액",
    "남성_매출_금액", "여성_매출_금액",
    "연령대_10_매출_금액", "연령대_20_매출_금액", "연령대_30_매출_금액",
    "연령대_40_매출_금액", "연령대_50_매출_금액", "연령대_60_이상_매출_금액",
]
key_cols = ["기준_년분기_코드", "상권_코드", "상권_코드_명", "통합카테고리"]
df_sales = df_sales.groupby(key_cols, as_index=False)[num_cols].sum()
print(f"  집계 후 행 수: {len(df_sales):,} (분기×상권×통합카테고리)")

# ──────────────────────────────────────────────
# 2. 길단위 유동인구 로드
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("2. 길단위인구 로드")

인구_file = RAW / "서울시 상권분석서비스(길단위인구-상권)" / "서울시 상권분석서비스(길단위인구-상권).csv"
df_pop = pd.read_csv(인구_file, encoding="euc-kr")
print(f"  행 수: {len(df_pop):,}")

df_pop = df_pop[[
    "기준_년분기_코드", "상권_코드",
    "총_유동인구_수",
    "남성_유동인구_수", "여성_유동인구_수",
    "연령대_10_유동인구_수", "연령대_20_유동인구_수",
    "연령대_30_유동인구_수", "연령대_40_유동인구_수",
    "연령대_50_유동인구_수", "연령대_60_이상_유동인구_수",
    "시간대_00_06_유동인구_수", "시간대_06_11_유동인구_수",
    "시간대_11_14_유동인구_수", "시간대_14_17_유동인구_수",
    "시간대_17_21_유동인구_수", "시간대_21_24_유동인구_수",
]]

# ──────────────────────────────────────────────
# 3. 소득소비 로드
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("3. 소득소비 로드")

소득_file = RAW / "서울시 상권분석서비스(소득소비-상권)" / "서울시 상권분석서비스(소득소비-상권).csv"
df_income = pd.read_csv(소득_file, encoding="euc-kr")
print(f"  행 수: {len(df_income):,}")

# 소득_구간_코드별로 행이 쪼개져 있음 → 분기×상권 단위로 평균 집계
income_agg_cols = [
    "월_평균_소득_금액", "지출_총금액",
    "식료품_지출_총금액", "의류_신발_지출_총금액",
    "생활용품_지출_총금액", "의료비_지출_총금액",
    "교통_지출_총금액", "여가_지출_총금액",
    "문화_지출_총금액", "교육_지출_총금액",
    "유흥_지출_총금액",
]
df_income = df_income.groupby(
    ["기준_년분기_코드", "상권_코드"], as_index=False
)[income_agg_cols].mean()
print(f"  집계 후 행 수: {len(df_income):,}")

# ──────────────────────────────────────────────
# 4. 데이터 병합
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("4. 데이터 병합")

df = df_sales.merge(df_pop, on=["기준_년분기_코드", "상권_코드"], how="left")
df = df.merge(df_income, on=["기준_년분기_코드", "상권_코드"], how="left")
print(f"  병합 후 행 수: {len(df):,}")
print(f"  분기 범위: {sorted(df['기준_년분기_코드'].unique())}")

# ──────────────────────────────────────────────
# 5. 피처 엔지니어링
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("5. 피처 엔지니어링")

df = df.sort_values(["상권_코드", "통합카테고리", "기준_년분기_코드"]).reset_index(drop=True)
group_key = ["상권_코드", "통합카테고리"]

# 객단가
df["객단가"] = (
    df["당월_매출_금액"] / df["당월_매출_건수"].replace(0, np.nan)
).fillna(0)

# 매출 시계열 피처
df["매출_증감률"] = (
    df.groupby(group_key)["당월_매출_금액"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["매출_2분기평균"] = df.groupby(group_key)["당월_매출_금액"].transform(
    lambda x: x.rolling(2, min_periods=1).mean()
)
df["매출_4분기평균"] = df.groupby(group_key)["당월_매출_금액"].transform(
    lambda x: x.rolling(4, min_periods=1).mean()
)
df["매출_4분기std"] = (
    df.groupby(group_key)["당월_매출_금액"]
    .transform(lambda x: x.rolling(4, min_periods=2).std()).fillna(0)
)
df["매출_모멘텀"] = df["매출_2분기평균"] - df["매출_4분기평균"]
df["매출건수_증감률"] = (
    df.groupby(group_key)["당월_매출_건수"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["객단가_증감률"] = (
    df.groupby(group_key)["객단가"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
df["객단가_4분기평균"] = df.groupby(group_key)["객단가"].transform(
    lambda x: x.rolling(4, min_periods=1).mean()
)

# 매출 구성 비율
총매출 = df["당월_매출_금액"].replace(0, np.nan)
df["매출_주말비율"]    = (df["주말_매출_금액"] / 총매출).fillna(0)
df["매출_점심비율"]    = (df["시간대_11~14_매출_금액"] / 총매출).fillna(0)
df["매출_저녁비율"]    = (df["시간대_17~21_매출_금액"] / 총매출).fillna(0)
df["매출_심야비율"]    = (df["시간대_21~24_매출_금액"] / 총매출).fillna(0)
df["매출_남성비율"]    = (df["남성_매출_금액"] / 총매출).fillna(0)
df["매출_여성비율"]    = (df["여성_매출_금액"] / 총매출).fillna(0)
df["매출_20대비율"]    = (df["연령대_20_매출_금액"] / 총매출).fillna(0)
df["매출_30대비율"]    = (df["연령대_30_매출_금액"] / 총매출).fillna(0)
df["매출_40대비율"]    = (df["연령대_40_매출_금액"] / 총매출).fillna(0)
df["매출_50대비율"]    = (df["연령대_50_매출_금액"] / 총매출).fillna(0)
df["매출_60대이상비율"] = (df["연령대_60_이상_매출_금액"] / 총매출).fillna(0)
df["MZ_차이"] = df["매출_20대비율"] + df["매출_30대비율"] - df["매출_40대비율"] - df["매출_50대비율"]

# 유동인구 피처
df["유동_증감률"] = (
    df.groupby(group_key)["총_유동인구_수"]
    .pct_change().replace([np.inf, -np.inf], 0).fillna(0)
)
총유동 = df["총_유동인구_수"].replace(0, np.nan)
df["유동_아침비율"] = (df["시간대_06_11_유동인구_수"] / 총유동).fillna(0)
df["유동_점심비율"] = (df["시간대_11_14_유동인구_수"] / 총유동).fillna(0)
df["유동_저녁비율"] = (df["시간대_17_21_유동인구_수"] / 총유동).fillna(0)
df["유동_심야비율"] = (df["시간대_21_24_유동인구_수"] / 총유동).fillna(0)
df["유동_20대비율"] = (df["연령대_20_유동인구_수"] / 총유동).fillna(0)
df["유동_30대비율"] = (df["연령대_30_유동인구_수"] / 총유동).fillna(0)
df["유동_40대비율"] = (df["연령대_40_유동인구_수"] / 총유동).fillna(0)
df["유동_50대비율"] = (df["연령대_50_유동인구_수"] / 총유동).fillna(0)
df["유동_여성비율"] = (df["여성_유동인구_수"] / 총유동).fillna(0)
df["유동대비매출"]  = (df["당월_매출_금액"] / 총유동).fillna(0)

# 소득소비 비율 (지출_총금액 대비 각 항목 비율)
총지출 = df["지출_총금액"].replace(0, np.nan)
df["식료품_지출비율"] = (df["식료품_지출_총금액"] / 총지출).fillna(0)
df["여가_지출비율"]   = (df["여가_지출_총금액"] / 총지출).fillna(0)
df["교육_지출비율"]   = (df["교육_지출_총금액"] / 총지출).fillna(0)
df["외식_지출비율"]   = (df["식료품_지출_총금액"] / df["월_평균_소득_금액"].replace(0, np.nan)).fillna(0)

print("  피처 엔지니어링 완료")

# ──────────────────────────────────────────────
# 6. 타겟 변수 생성 (기존 모델과 동일한 방식)
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("6. 타겟 변수 생성")

df["다음분기_매출"] = df.groupby(group_key)["당월_매출_금액"].shift(-1)
df["다음분기_증감률"] = (
    (df["다음분기_매출"] - df["당월_매출_금액"]) /
    df["당월_매출_금액"].replace(0, np.nan)
)
# 업종×분기 코호트 내 중앙값 기준 이진 분류
df["label"] = (
    df.groupby(["통합카테고리", "기준_년분기_코드"])["다음분기_증감률"]
    .transform(lambda x: (x >= x.median()).astype(int))
)

labeled = df[df["다음분기_매출"].notna() & df["다음분기_증감률"].notna()].copy()
print(f"  학습 가능 샘플: {len(labeled):,}개")
print(f"  label 분포:\n{labeled['label'].value_counts()}")

# ──────────────────────────────────────────────
# 7. 저장
# ──────────────────────────────────────────────
print("\n" + "=" * 50)
print("7. 저장")

df.to_csv(OUT, index=False, encoding="utf-8-sig")
print(f"  저장 완료: {OUT}")
print(f"  총 행 수: {len(df):,}")
print(f"  컬럼 수: {len(df.columns)}")
print(f"  상권 수: {df['상권_코드'].nunique()}")
print(f"  통합카테고리 수: {df['통합카테고리'].nunique()}")
print(f"  분기 범위: {df['기준_년분기_코드'].min()} ~ {df['기준_년분기_코드'].max()}")
print("완료!")