"""
Shapefile → GeoJSON 변환 스크립트
- 입력: 서울시 상권분석서비스(영역-상권배후지).shp (EPSG:5181)
- 출력: data/processed_data/street_boundaries.geojson (EPSG:4326 WGS84)
"""

import geopandas as gpd
from pathlib import Path

BASE = Path(__file__).parent.parent / "data"
SHP  = BASE / "raw_data" / "길단위원본데이터모음" / "서울시 상권분석서비스(영역-상권배후지)" / "서울시 상권분석서비스(영역-상권배후지).shp"
OUT  = BASE / "processed_data" / "street_boundaries.geojson"

print("=" * 50)
print("1. Shapefile 로드")
gdf = gpd.read_file(SHP)
print(f"  행 수: {len(gdf)}")
print(f"  원본 CRS: {gdf.crs}")

print("\n" + "=" * 50)
print("2. 좌표계 변환 (EPSG:5181 → EPSG:4326)")
gdf = gdf.to_crs(epsg=4326)
print(f"  변환 후 CRS: {gdf.crs}")

print("\n" + "=" * 50)
print("3. 컬럼 정리")
gdf = gdf.rename(columns={
    "ALLEY_TRDA": "상권_코드",
    "ALLEY_TR_1": "상권_코드_명",
    "SIGNGU_CD":  "시군구코드",
    "SIGNGU_CD_": "시군구명",
    "ADSTRD_CD":  "행정동코드",
    "ADSTRD_CD_": "행정동명",
    "RELM_AR":    "면적",
})
gdf = gdf.drop(columns=["XCNTS_VALU", "YDNTS_VALU"])
print(f"  최종 컬럼: {gdf.columns.tolist()}")

print("\n" + "=" * 50)
print("4. GeoJSON 저장")
gdf.to_file(OUT, driver="GeoJSON", encoding="utf-8")
print(f"  저장 완료: {OUT}")
print(f"  상권 수: {len(gdf)}")
print(f"  시군구 수: {gdf['시군구명'].nunique()}")
print(f"  행정동 수: {gdf['행정동명'].nunique()}")

# 샘플 확인
print("\n[샘플]")
print(gdf[["상권_코드", "상권_코드_명", "시군구명", "행정동명"]].head(5).to_string(index=False))
print("완료!")
