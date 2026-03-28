"""
크롤링 데이터(naver_place_info.csv) → 상권코드×업종 피처 집계
geopandas spatial join으로 각 상점을 상권에 매핑
→ street_dataset.csv에 조인하여 저장
"""
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from pathlib import Path

ROOT        = Path(__file__).resolve().parents[1]
CRAWL_PATH  = ROOT / "data" / "processed_data" / "naver_place_info.csv"
CAT_PATH    = ROOT / "data" / "category_maps" / "store_category_map.csv"
GEO_PATH    = ROOT / "frontend-react" / "public" / "street_boundaries.geojson"
DATA_PATH   = ROOT / "data" / "processed_data" / "street_dataset.csv"
OUT_PATH    = ROOT / "data" / "processed_data" / "street_dataset.csv"

print("=" * 50)
print("1. 크롤링 데이터 로드 및 카테고리 매핑")
crawl = pd.read_csv(CRAWL_PATH, encoding="utf-8-sig")
print(f"  {len(crawl):,}행 로드")

cat_map  = pd.read_csv(CAT_PATH, encoding="utf-8-sig")
cat_dict = dict(zip(cat_map["상권업종중분류명"].str.strip(), cat_map["통합_카테고리"]))

def apply_category(row):
    mid = str(row["상권업종중분류명"]).strip()
    소분류 = str(row.get("상권업종소분류명", "")).strip() if "상권업종소분류명" in row.index else ""
    if mid == "기타 간이":
        if 소분류 == "치킨": return "치킨전문점"
        if 소분류 in {"피자", "버거", "토스트/샌드위치/샐러드"}: return "패스트푸드"
        if 소분류 in {"빵/도넛", "떡/한과", "아이스크림/빙수"}: return "베이커리/디저트"
    return cat_dict.get(mid, "기타")

crawl["통합카테고리"] = crawl.apply(apply_category, axis=1)

# avg_price null → 업종 평균
cat_price_mean = crawl.groupby("통합카테고리")["avg_price"].mean()
crawl["avg_price_filled"] = crawl["avg_price"].fillna(
    crawl["통합카테고리"].map(cat_price_mean)
)

# price_range
crawl["price_range"] = (crawl["price_max"] - crawl["price_min"]).clip(lower=0)
cat_range_mean = crawl.groupby("통합카테고리")["price_range"].mean()
crawl["price_range_filled"] = crawl["price_range"].fillna(
    crawl["통합카테고리"].map(cat_range_mean)
)

# visit_purpose 파싱
crawl["vp_1인"]    = crawl["visit_purpose"].str.contains("1인",     na=False).astype(int)
crawl["vp_회식"]   = crawl["visit_purpose"].str.contains("회식/접대", na=False).astype(int)
crawl["vp_다양성"]  = crawl["visit_purpose"].apply(
    lambda x: len(str(x).split("|")) if pd.notna(x) and x != "기타" else 1
)

crawl["menu_count_clean"] = crawl["menu_count"].replace(0, np.nan)
cat_menu_mean = crawl.groupby("통합카테고리")["menu_count_clean"].mean()
crawl["menu_count_filled"] = crawl["menu_count_clean"].fillna(
    crawl["통합카테고리"].map(cat_menu_mean)
)

print("=" * 50)
print("2. GeoDataFrame 변환 및 상권 폴리곤 로드")
gdf_stores = gpd.GeoDataFrame(
    crawl,
    geometry=gpd.points_from_xy(crawl["경도"], crawl["위도"]),
    crs="EPSG:4326",
)
gdf_street = gpd.read_file(GEO_PATH)
gdf_street = gdf_street[["상권_코드", "상권_코드_명", "geometry"]].copy()
gdf_street["상권_코드"] = gdf_street["상권_코드"].astype(int)
print(f"  상권 폴리곤 수: {len(gdf_street):,}")

print("=" * 50)
print("3. Spatial join (point-in-polygon)")
joined = gpd.sjoin(gdf_stores, gdf_street, how="inner", predicate="within")
print(f"  상권 내 매칭 상점: {len(joined):,} / {len(crawl):,}")

print("=" * 50)
print("4. 상권코드×업종 집계")
agg = joined.groupby(["상권_코드", "통합카테고리"]).agg(
    crawl_avg_price   = ("avg_price_filled",  "mean"),
    crawl_price_range = ("price_range_filled", "mean"),
    crawl_1인비율      = ("vp_1인",            "mean"),
    crawl_회식비율     = ("vp_회식",           "mean"),
    crawl_목적다양성   = ("vp_다양성",          "mean"),
    crawl_menu_count  = ("menu_count_filled",  "mean"),
    crawl_샘플수       = ("avg_price_filled",  "count"),
).reset_index()

# 샘플 3개 미만 → 업종 평균으로 대체
cat_agg = joined.groupby("통합카테고리").agg(
    crawl_avg_price_cat   = ("avg_price_filled",  "mean"),
    crawl_price_range_cat = ("price_range_filled", "mean"),
    crawl_1인비율_cat      = ("vp_1인",            "mean"),
    crawl_회식비율_cat     = ("vp_회식",           "mean"),
    crawl_목적다양성_cat   = ("vp_다양성",          "mean"),
    crawl_menu_count_cat  = ("menu_count_filled",  "mean"),
).reset_index()

agg = agg.merge(cat_agg, on="통합카테고리", how="left")
for col in ["crawl_avg_price", "crawl_price_range", "crawl_1인비율",
            "crawl_회식비율", "crawl_목적다양성", "crawl_menu_count"]:
    mask = agg["crawl_샘플수"] < 3
    agg.loc[mask, col] = agg.loc[mask, f"{col}_cat"]

agg = agg[["상권_코드", "통합카테고리",
           "crawl_avg_price", "crawl_price_range",
           "crawl_1인비율", "crawl_회식비율",
           "crawl_목적다양성", "crawl_menu_count"]]
agg = agg.rename(columns={"상권_코드": "상권_코드_join"})

print(f"  집계 결과: {len(agg):,}개 (상권×업종)")
print(f"  커버 상권 수: {agg['상권_코드_join'].nunique()}")

print("=" * 50)
print("5. street_dataset에 조인")
df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")
print(f"  기존 street_dataset: {len(df):,}행, {len(df.columns)}컬럼")

crawl_cols = [c for c in df.columns if c.startswith("crawl_")]
if crawl_cols:
    df = df.drop(columns=crawl_cols)
    print(f"  기존 crawl 컬럼 {len(crawl_cols)}개 제거")

df = df.merge(
    agg.rename(columns={"상권_코드_join": "상권_코드"}),
    on=["상권_코드", "통합카테고리"],
    how="left",
)

# 조인 후 null → 업종 전체 평균 보완
for col in ["crawl_avg_price", "crawl_price_range", "crawl_1인비율",
            "crawl_회식비율", "crawl_목적다양성", "crawl_menu_count"]:
    col_mean = df.groupby("통합카테고리")[col].transform("mean")
    df[col] = df[col].fillna(col_mean)
    df[col] = df[col].fillna(df[col].mean())

null_counts = df[["crawl_avg_price", "crawl_price_range", "crawl_1인비율",
                   "crawl_회식비율", "crawl_목적다양성", "crawl_menu_count"]].isnull().sum()
print(f"  조인 후 null 현황:\n{null_counts}")
print(f"  최종 컬럼 수: {len(df.columns)}")

df.to_csv(OUT_PATH, index=False, encoding="utf-8-sig")
print(f"\n저장 완료: {OUT_PATH}")
print("완료!")
