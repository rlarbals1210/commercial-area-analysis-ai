"""
위치 추천용 격자 점수 계산 스크립트
- 분기별 상가 스냅샷으로 격자별 생존율 계산 (2년 기준)
- 격자별 경쟁 밀도, 보완 업종 밀도, 상권 활성도 계산
- location_scores.csv 저장
"""
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.spatial import cKDTree

PROJECT_ROOT = Path(__file__).resolve().parents[2]
STORE_DIR    = PROJECT_ROOT / "data" / "raw_data" / "store_info"
CAT_MAP_PATH = PROJECT_ROOT / "data" / "category_maps" / "store_category_map.csv"
OUT_PATH     = PROJECT_ROOT / "ai" / "outputs" / "location_scores.csv"

# 격자 해상도: 0.001도 ≈ 100m
GRID_RES = 0.001
# 밀도 계산 반경: 0.003도 ≈ 300m
RADIUS = 0.003
# 생존 기준: 8분기(2년) 후에도 존재
SURVIVAL_GAP = 8

# 업종별 보완 업종 (시너지)
COMPLEMENT_MAP = {
    "한식":        ["카페", "주점", "편의점", "분식/간식"],
    "분식/간식":   ["카페", "한식", "편의점"],
    "중식":        ["카페", "주점", "편의점"],
    "일식":        ["카페", "주점", "편의점"],
    "양식/기타외식": ["카페", "주점", "편의점"],
    "카페":        ["한식", "분식/간식", "뷰티/화장품", "의류/패션"],
    "주점":        ["한식", "분식/간식", "일식", "편의점"],
    "편의점":      ["한식", "카페", "분식/간식", "주점"],
    "식품 소매":   ["한식", "편의점"],
    "의류/패션":   ["뷰티/화장품", "미용실", "카페"],
    "뷰티/화장품": ["의류/패션", "미용실", "카페"],
    "미용실":      ["뷰티/화장품", "의류/패션", "카페"],
    "의료/약국":   ["뷰티/화장품", "편의점"],
    "전자/통신":   ["카페", "편의점"],
    "생활용품 소매": ["편의점", "카페"],
    "스포츠/레저": ["카페", "편의점", "뷰티/화장품"],
    "교육":        ["카페", "편의점", "분식/간식"],
    "애완동물":    ["카페", "편의점"],
}

# 소분류 레벨 오버라이드 (중분류 매핑보다 우선 적용)
소분류_오버라이드 = {
    "치킨":  "패스트푸드/치킨",
    "버거":  "패스트푸드/치킨",
}

def load_quarter(quarter_name):
    path = STORE_DIR / quarter_name / "상가_서울.csv"
    if not path.exists():
        return None
    df = pd.read_csv(path, encoding="utf-8-sig", low_memory=False,
                     usecols=["상가업소번호", "상권업종중분류명", "상권업종소분류명", "행정동명", "경도", "위도"])
    df = df.dropna(subset=["경도", "위도", "상권업종중분류명"])
    df["경도"] = pd.to_numeric(df["경도"], errors="coerce")
    df["위도"] = pd.to_numeric(df["위도"], errors="coerce")
    df = df.dropna(subset=["경도", "위도"])
    # 서울 범위 필터
    df = df[(df["위도"].between(37.4, 37.7)) & (df["경도"].between(126.7, 127.2))]
    # 소분류 오버라이드: 소분류명이 오버라이드 키에 해당하면 해당 통합카테고리 적용
    df["통합카테고리"] = df["상권업종소분류명"].map(소분류_오버라이드).fillna(df["상권업종중분류명"].map(cat_dict))
    return df

def snap_grid(df):
    """좌표를 격자 중심점으로 스냅"""
    df = df.copy()
    df["grid_lat"] = (df["위도"] / GRID_RES).round() * GRID_RES
    df["grid_lng"] = (df["경도"] / GRID_RES).round() * GRID_RES
    return df

print("=" * 50)
print("1. 카테고리 매핑 로드")
cat_map = pd.read_csv(CAT_MAP_PATH, encoding="utf-8-sig")
cat_map.columns = ["상권업종중분류명", "통합카테고리"]
cat_dict = dict(zip(cat_map["상권업종중분류명"], cat_map["통합카테고리"]))

print("=" * 50)
print("2. 분기 목록 로드")
quarters = sorted([d.name for d in STORE_DIR.iterdir() if d.is_dir()])
print(f"총 {len(quarters)}개 분기: {quarters[0]} ~ {quarters[-1]}")

print("=" * 50)
print("3. 생존율 계산 (2년 간격)")

survival_records = []
for i, q_start in enumerate(quarters):
    end_idx = i + SURVIVAL_GAP
    if end_idx >= len(quarters):
        break
    q_end = quarters[end_idx]

    df_start = load_quarter(q_start)
    df_end   = load_quarter(q_end)
    if df_start is None or df_end is None:
        continue

    df_start = df_start.dropna(subset=["통합카테고리"])
    df_start = snap_grid(df_start)

    survived_ids = set(df_end["상가업소번호"].astype(str))

    df_start["survived"] = df_start["상가업소번호"].astype(str).isin(survived_ids).astype(int)

    grouped = (
        df_start.groupby(["grid_lat", "grid_lng", "통합카테고리", "행정동명"])
        .agg(total=("survived", "count"), survived=("survived", "sum"))
        .reset_index()
    )
    grouped["생존율"] = grouped["survived"] / grouped["total"]
    survival_records.append(grouped)
    print(f"  {q_start} → {q_end} 완료")

print("생존율 집계 중...")
df_survival = pd.concat(survival_records, ignore_index=True)
df_survival = (
    df_survival.groupby(["grid_lat", "grid_lng", "통합카테고리", "행정동명"])
    .agg(생존율=("생존율", "mean"), 샘플수=("total", "sum"))
    .reset_index()
)
print(f"생존율 격자 수: {len(df_survival):,}")

print("=" * 50)
print("4. 경쟁/보완 밀도 계산 (최신 분기 기준)")
df_latest = load_quarter(quarters[-1])
df_latest = df_latest.dropna(subset=["통합카테고리"])
df_latest = snap_grid(df_latest)

# 전체 좌표 KDTree
all_coords = df_latest[["위도", "경도"]].values
tree = cKDTree(all_coords)

categories = df_survival["통합카테고리"].unique()
density_records = []

for cat in categories:
    cat_df = df_latest[df_latest["통합카테고리"] == cat]
    if cat_df.empty:
        continue

    comp_cats = COMPLEMENT_MAP.get(cat, [])
    comp_df = df_latest[df_latest["통합카테고리"].isin(comp_cats)]

    cat_coords    = cat_df[["위도", "경도"]].values
    cat_tree      = cKDTree(cat_coords) if len(cat_coords) > 0 else None
    comp_coords   = comp_df[["위도", "경도"]].values
    comp_tree     = cKDTree(comp_coords) if len(comp_coords) > 0 else None

    # 생존율 있는 격자만
    grids = df_survival[df_survival["통합카테고리"] == cat][["grid_lat", "grid_lng"]].drop_duplicates()

    for _, row in grids.iterrows():
        pt = np.array([[row["grid_lat"], row["grid_lng"]]])

        # 경쟁 밀도: 반경 300m 내 같은 업종 수
        경쟁밀도 = len(cat_tree.query_ball_point(pt[0], RADIUS)) if cat_tree else 0
        # 보완 밀도: 반경 300m 내 보완 업종 수
        보완밀도 = len(comp_tree.query_ball_point(pt[0], RADIUS)) if comp_tree else 0
        # 상권 활성도: 반경 300m 내 전체 업종 수
        활성도 = len(tree.query_ball_point(pt[0], RADIUS))

        density_records.append({
            "grid_lat": row["grid_lat"],
            "grid_lng": row["grid_lng"],
            "통합카테고리": cat,
            "경쟁밀도": 경쟁밀도,
            "보완밀도": 보완밀도,
            "상권활성도": 활성도,
        })

    print(f"  {cat} 완료 ({len(grids)}개 격자)")

df_density = pd.DataFrame(density_records)

print("=" * 50)
print("5. 입지 점수 계산")
df = pd.merge(df_survival, df_density, on=["grid_lat", "grid_lng", "통합카테고리"], how="left")
df = df.fillna({"경쟁밀도": 0, "보완밀도": 0, "상권활성도": 0})

# 카테고리별 정규화 후 점수 계산
def normalize(series):
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series([0.5] * len(series), index=series.index)
    return (series - mn) / (mx - mn)

score_rows = []
for cat, grp in df.groupby("통합카테고리"):
    grp = grp.copy()
    grp["생존율_norm"]   = normalize(grp["생존율"])
    grp["경쟁밀도_norm"] = normalize(grp["경쟁밀도"])
    grp["보완밀도_norm"] = normalize(grp["보완밀도"])
    grp["활성도_norm"]   = normalize(grp["상권활성도"])

    # 입지점수 = 생존율×40% + 보완밀도×25% + 활성도×20% - 경쟁밀도×15%
    grp["입지점수"] = (
        grp["생존율_norm"]   * 0.40
        + grp["보완밀도_norm"] * 0.25
        + grp["활성도_norm"]  * 0.20
        - grp["경쟁밀도_norm"] * 0.15
    ).clip(0, 1)
    grp["입지점수"] = (grp["입지점수"] * 100).round(1)
    score_rows.append(grp)

df_final = pd.concat(score_rows, ignore_index=True)
df_final = df_final[[
    "grid_lat", "grid_lng", "행정동명", "통합카테고리",
    "생존율", "샘플수", "경쟁밀도", "보완밀도", "상권활성도", "입지점수"
]]
df_final["생존율"] = (df_final["생존율"] * 100).round(1)

# 샘플 수 적은 격자 제거 (신뢰도 낮음)
df_final = df_final[df_final["샘플수"] >= 3]

df_final.to_csv(OUT_PATH, index=False, encoding="utf-8-sig")
print(f"\n저장 완료: {OUT_PATH}")
print(f"총 {len(df_final):,}개 격자×업종")
print(f"행정동 수: {df_final['행정동명'].nunique()}")
print(f"업종 수: {df_final['통합카테고리'].nunique()}")
print("\n[입지점수 분포]")
print(df_final["입지점수"].describe().round(1))
print("완료!")
