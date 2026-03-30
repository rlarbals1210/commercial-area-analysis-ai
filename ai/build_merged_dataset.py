#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import re
import pandas as pd
from pathlib import Path

# ----------------------------------------
# 0) 경로 설정
# ----------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parents[1] if "__file__" in dir() else Path().resolve().parent
RAW_DIR  = PROJECT_ROOT / "data" / "raw_data"
MAP_DIR  = PROJECT_ROOT / "data" / "category_maps"
OUT_DIR  = PROJECT_ROOT / "data" / "processed_data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SALES_DIR     = RAW_DIR / "sales_info"
STORE_DIR     = RAW_DIR / "store_info"
POP_PATH      = RAW_DIR / "population_info" / "유동인구.csv"
BS_DIR        = RAW_DIR / "BS_info"
WORK_POP_PATH = RAW_DIR / "working-population_info" / "서울시_상권분석서비스(직장인구-행정동).csv"
RES_POP_DIR   = RAW_DIR / "residential-population_info"

SALES_MAP_PATH = MAP_DIR / "sales_category_map.csv"
STORE_MAP_PATH = MAP_DIR / "store_category_map.csv"

OUT_PATH = OUT_DIR / "final_dataset.csv"


# ----------------------------------------
# 1) 한글 CSV 안전 로더
# ----------------------------------------
def read_csv_kor(path: Path, usecols=None, encodings=("utf-8-sig", "cp949", "euc-kr")):
    for enc in encodings:
        try:
            return pd.read_csv(path, encoding=enc, usecols=usecols, low_memory=False)
        except Exception:
            pass
        try:
            return pd.read_csv(path, encoding=enc, usecols=usecols,
                               engine="python", on_bad_lines="skip")
        except Exception:
            pass
    raise RuntimeError(f"CSV 읽기 실패: {path}")


# ----------------------------------------
# 2) 카테고리 매핑 로드
# ----------------------------------------
sales_map_df = read_csv_kor(SALES_MAP_PATH)
store_map_df = read_csv_kor(STORE_MAP_PATH)

SALES_CATEGORY_MAP = dict(zip(sales_map_df["서비스_업종_코드_명"], sales_map_df["통합_카테고리"]))
STORE_CATEGORY_MAP = dict(zip(store_map_df["상권업종중분류명"].str.strip(), store_map_df["통합_카테고리"]))


# ----------------------------------------
# 3) 기존 원본 로드
# ----------------------------------------

# 매출: 연도별 파일 전체 합치기
sales_df = pd.concat(
    [read_csv_kor(f) for f in sorted(SALES_DIR.glob("매출_*.csv"))],
    ignore_index=True
)

# 유동인구: 단일 파일
pop_df = read_csv_kor(POP_PATH)

# 상가: 분기별 폴더 순회 → 폴더명으로 기준_년분기_코드 생성
store_parts = []
for folder in sorted(STORE_DIR.iterdir()):
    if not folder.is_dir():
        continue
    store_file = folder / "상가_서울.csv"
    if not store_file.exists():
        print(f"파일 없음 (건너뜀): {folder.name}")
        continue
    quarter_code = int(folder.name.replace("-", ""))  # "2020-1" → 20201
    df = read_csv_kor(store_file)
    df["기준_년분기_코드"] = quarter_code
    store_parts.append(df)

store_df = pd.concat(store_parts, ignore_index=True)

print(f"매출 행 수: {len(sales_df):,}")
print(f"유동인구 행 수: {len(pop_df):,}")
print(f"상가 행 수: {len(store_df):,}")
print(f"상가 분기: {sorted(store_df['기준_년분기_코드'].unique())}")


# ----------------------------------------
# 3-1) BS_info: 개업률 / 폐업률 / 프랜차이즈 점포수
# ----------------------------------------
bs_parts = []
for fn in sorted(BS_DIR.glob("*.csv")):
    bs_parts.append(read_csv_kor(fn))

bs_df = pd.concat(bs_parts, ignore_index=True)
bs_df = bs_df.rename(columns={"행정동_코드": "행정동코드", "행정동_코드_명": "행정동명"})
bs_df["행정동코드"] = pd.to_numeric(bs_df["행정동코드"], errors="coerce").astype("Int64")
bs_df["통합_카테고리"] = bs_df["서비스_업종_코드_명"].map(SALES_CATEGORY_MAP)
bs_df = bs_df.dropna(subset=["통합_카테고리"])

bs_agg = (
    bs_df.groupby(["기준_년분기_코드", "행정동코드", "통합_카테고리"], dropna=False)
    .agg(
        개업_율_평균=("개업_율", "mean"),
        폐업_률_평균=("폐업_률", "mean"),
        프랜차이즈_점포수=("프랜차이즈_점포_수", "sum"),
    )
    .reset_index()
)

print(f"\nBS_info 행 수: {len(bs_df):,}")
print(f"BS_info 분기 범위: {sorted(bs_df['기준_년분기_코드'].unique())[:4]} ... {sorted(bs_df['기준_년분기_코드'].unique())[-4:]}")


# ----------------------------------------
# 3-2) 직장인구 (전 연령대 + 성별 추가)
# ----------------------------------------
work_df = read_csv_kor(WORK_POP_PATH)
work_df = work_df.rename(columns={"행정동_코드": "행정동코드", "행정동_코드_명": "행정동명"})
work_df["행정동코드"] = pd.to_numeric(work_df["행정동코드"], errors="coerce").astype("Int64")

for col in ["총_직장_인구_수", "연령대_20_직장_인구_수", "연령대_30_직장_인구_수",
            "연령대_40_직장_인구_수", "연령대_50_직장_인구_수", "연령대_60_이상_직장_인구_수",
            "남성_직장_인구_수", "여성_직장_인구_수"]:
    work_df[col] = pd.to_numeric(work_df[col], errors="coerce")

work_agg = (
    work_df.groupby(["기준_년분기_코드", "행정동코드"], dropna=False)
    .agg(
        총_직장_인구_수=("총_직장_인구_수", "sum"),
        직장_20대_인구=("연령대_20_직장_인구_수", "sum"),
        직장_30대_인구=("연령대_30_직장_인구_수", "sum"),
        직장_40대_인구=("연령대_40_직장_인구_수", "sum"),
        직장_50대_인구=("연령대_50_직장_인구_수", "sum"),
        직장_60대이상_인구=("연령대_60_이상_직장_인구_수", "sum"),
        남성_직장_인구=("남성_직장_인구_수", "sum"),
        여성_직장_인구=("여성_직장_인구_수", "sum"),
    )
    .reset_index()
)

print(f"\n직장인구 행 수: {len(work_df):,}")
print(f"직장인구 분기 범위: {sorted(work_df['기준_년분기_코드'].unique())[:4]} ... {sorted(work_df['기준_년분기_코드'].unique())[-4:]}")


# ----------------------------------------
# 3-3) 주거인구 (wide → long)
# ----------------------------------------
def parse_quarter_str(q_str):
    """'2022. 1/4' → 20221"""
    m = re.match(r'(\d{4})\.\s*(\d)/4', str(q_str).strip())
    if m:
        return int(m.group(1)) * 10 + int(m.group(2))
    return None

res_parts = []
for fn in sorted(RES_POP_DIR.glob("*.csv")):
    df = read_csv_kor(fn)
    df = df[(df["구분별"] == "계") & (df["항목"] == "주민등록인구(동별)")]
    df = df[~df["동별"].isin(["합계"]) & ~df["동별"].str.endswith("구")]
    quarter_cols = [c for c in df.columns if re.match(r'\d{4}\.\s*\d/4', str(c).strip())]
    df = df[["동별"] + quarter_cols].copy()
    df = df.melt(id_vars="동별", var_name="분기_str", value_name="주거인구")
    df["기준_년분기_코드"] = df["분기_str"].map(parse_quarter_str)
    df = df.dropna(subset=["기준_년분기_코드"])
    df["기준_년분기_코드"] = df["기준_년분기_코드"].astype(int)
    df["주거인구"] = pd.to_numeric(df["주거인구"].astype(str).str.replace(",", ""), errors="coerce")
    df = df.rename(columns={"동별": "행정동명"})
    res_parts.append(df[["기준_년분기_코드", "행정동명", "주거인구"]])

res_df = pd.concat(res_parts, ignore_index=True)
res_df = res_df.groupby(["기준_년분기_코드", "행정동명"])["주거인구"].sum().reset_index()

print(f"\n주거인구 행 수: {len(res_df):,}")
print(f"주거인구 분기 범위: {sorted(res_df['기준_년분기_코드'].unique())[:4]} ... {sorted(res_df['기준_년분기_코드'].unique())[-4:]}")


# ----------------------------------------
# 4) 컬럼명 통일
# ----------------------------------------
sales_df = sales_df.rename(columns={"행정동_코드": "행정동코드", "행정동_코드_명": "행정동명"})
pop_df   = pop_df.rename(columns={"행정동_코드": "행정동코드", "행정동_코드_명": "행정동명"})

for df in (sales_df, pop_df, store_df):
    df["행정동코드"] = pd.to_numeric(df["행정동코드"], errors="coerce").astype("Int64")


# ----------------------------------------
# 5) 매출 집계 (분기 × 행정동 × 업종)
# ----------------------------------------
sales_df["통합_카테고리"] = sales_df["서비스_업종_코드_명"].map(SALES_CATEGORY_MAP)
sales_df = sales_df.dropna(subset=["통합_카테고리"]).copy()

sales_agg = (
    sales_df.groupby(["기준_년분기_코드", "행정동코드", "통합_카테고리"], dropna=False)
    .agg(
        당월매출합=("당월_매출_금액", "sum"),
        당월매출건수=("당월_매출_건수", "sum"),
        매출_10대합=("연령대_10_매출_금액", "sum"),
        매출_20대합=("연령대_20_매출_금액", "sum"),
        매출_30대합=("연령대_30_매출_금액", "sum"),
        매출_40대합=("연령대_40_매출_금액", "sum"),
        매출_50대합=("연령대_50_매출_금액", "sum"),
        매출_60대이상합=("연령대_60_이상_매출_금액", "sum"),
        남성매출합=("남성_매출_금액", "sum"),
        여성매출합=("여성_매출_금액", "sum"),
        주중매출합=("주중_매출_금액", "sum"),
        주말매출합=("주말_매출_금액", "sum"),
        시간대_00_06_매출=("시간대_00~06_매출_금액", "sum"),
        시간대_06_11_매출=("시간대_06~11_매출_금액", "sum"),
        시간대_11_14_매출=("시간대_11~14_매출_금액", "sum"),
        시간대_14_17_매출=("시간대_14~17_매출_금액", "sum"),
        시간대_17_21_매출=("시간대_17~21_매출_금액", "sum"),
        시간대_21_24_매출=("시간대_21~24_매출_금액", "sum"),
    )
    .reset_index()
)


# ----------------------------------------
# 6) 상가 집계 (분기 × 행정동 × 업종 → 점포수)
# ----------------------------------------
store_df["상권업종중분류명"] = store_df["상권업종중분류명"].str.strip()
store_df["상권업종소분류명"] = store_df["상권업종소분류명"].str.strip()
store_df["통합_카테고리"] = store_df["상권업종중분류명"].map(STORE_CATEGORY_MAP)

# 행정동 재편 대응
DONG_REMAP_CODE = {11230515: 11230536, 11230533: 11230536,
                   11740525: 11740520, 11740526: 11740520}
DONG_REMAP_NAME = {11230515: "용신동",  11230533: "용신동",
                   11740525: "상일동",  11740526: "상일동"}
remap_mask = store_df["행정동코드"].isin(DONG_REMAP_CODE)
store_df.loc[remap_mask, "행정동명"]   = store_df.loc[remap_mask, "행정동코드"].map(DONG_REMAP_NAME)
store_df.loc[remap_mask, "행정동코드"] = store_df.loc[remap_mask, "행정동코드"].map(DONG_REMAP_CODE)

# 기타 간이 소분류 세분화 매핑
_base = store_df["상권업종중분류명"] == "기타 간이"
store_df.loc[_base & (store_df["상권업종소분류명"] == "치킨"), "통합_카테고리"] = "치킨전문점"
store_df.loc[_base & store_df["상권업종소분류명"].isin({"피자", "버거", "토스트/샌드위치/샐러드"}), "통합_카테고리"] = "패스트푸드"
store_df.loc[_base & store_df["상권업종소분류명"].isin({"빵/도넛", "떡/한과", "아이스크림/빙수"}), "통합_카테고리"] = "베이커리/디저트"

# 의원 소분류 세분화 (치과의원, 한의원 분리)
_의원 = store_df["상권업종중분류명"] == "의원"
store_df.loc[_의원 & (store_df["상권업종소분류명"] == "치과의원"), "통합_카테고리"] = "치과의원"
store_df.loc[_의원 & (store_df["상권업종소분류명"] == "한의원"), "통합_카테고리"] = "한의원"

# 이용·미용 소분류 세분화 (네일숍, 피부관리실 분리)
_미용 = store_df["상권업종중분류명"] == "이용·미용"
store_df.loc[_미용 & (store_df["상권업종소분류명"] == "네일숍"), "통합_카테고리"] = "네일숍"
store_df.loc[_미용 & (store_df["상권업종소분류명"] == "피부 관리실"), "통합_카테고리"] = "피부관리실"

# 유원지·오락 소분류 세분화 (노래방, PC방 분리; 당구장은 스포츠 서비스에 있음)
_오락 = store_df["상권업종중분류명"] == "유원지·오락"
store_df.loc[_오락 & (store_df["상권업종소분류명"] == "노래방"), "통합_카테고리"] = "노래방"
store_df.loc[_오락 & (store_df["상권업종소분류명"] == "PC방"), "통합_카테고리"] = "PC방"

# 스포츠 서비스 소분류 세분화 (골프연습장, 당구장, 스포츠클럽 분리)
_스포츠 = store_df["상권업종중분류명"] == "스포츠 서비스"
store_df.loc[_스포츠 & (store_df["상권업종소분류명"] == "골프 연습장"), "통합_카테고리"] = "골프연습장"
store_df.loc[_스포츠 & (store_df["상권업종소분류명"] == "당구장"), "통합_카테고리"] = "당구장"
store_df.loc[_스포츠 & store_df["상권업종소분류명"].isin({
    "헬스장", "종합 스포츠시설", "기타 스포츠시설 운영업",
    "수영장", "볼링장", "스쿼시/라켓볼장", "탁구장", "테니스장"
}), "통합_카테고리"] = "스포츠클럽"

# 섬유·의복·신발 소매 소분류 세분화 (신발, 가방, 섬유제품, 일반의류 분리)
_섬유 = store_df["상권업종중분류명"] == "섬유·의복·신발 소매"
store_df.loc[_섬유 & (store_df["상권업종소분류명"] == "신발 소매업"), "통합_카테고리"] = "신발"
store_df.loc[_섬유 & store_df["상권업종소분류명"].isin({"가방 소매업", "액세서리/잡화 소매업"}), "통합_카테고리"] = "가방"
store_df.loc[_섬유 & store_df["상권업종소분류명"].isin({"침구류/커튼 소매업", "실/섬유제품 소매업"}), "통합_카테고리"] = "섬유제품"
store_df.loc[_섬유 & store_df["상권업종소분류명"].isin({
    "기타 의류 소매업", "여성 의류 소매업", "남성 의류 소매업",
    "유아용 의류 소매업", "가발 소매업", "한복 소매업"
}), "통합_카테고리"] = "일반의류"

# 식료품 소매 소분류 세분화 (기본: 슈퍼마켓 → 각 품목별 분리)
_식료 = store_df["상권업종중분류명"] == "식료품 소매"
store_df.loc[_식료 & (store_df["상권업종소분류명"] == "정육점"), "통합_카테고리"] = "육류판매"
store_df.loc[_식료 & (store_df["상권업종소분류명"] == "채소/과일 소매업"), "통합_카테고리"] = "청과상"
store_df.loc[_식료 & (store_df["상권업종소분류명"] == "반찬/식료품 소매업"), "통합_카테고리"] = "반찬가게"
store_df.loc[_식료 & store_df["상권업종소분류명"].isin({"수산물 소매업", "건어물/젓갈 소매업"}), "통합_카테고리"] = "수산물판매"
store_df.loc[_식료 & (store_df["상권업종소분류명"] == "곡물/곡분 소매업"), "통합_카테고리"] = "미곡판매"

# 가전·통신 소매 소분류 세분화 (핸드폰, 컴퓨터, 가전제품 분리)
_가전 = store_df["상권업종중분류명"] == "가전·통신 소매"
store_df.loc[_가전 & (store_df["상권업종소분류명"] == "핸드폰 소매업"), "통합_카테고리"] = "핸드폰"
store_df.loc[_가전 & (store_df["상권업종소분류명"] == "컴퓨터/소프트웨어 소매업"), "통합_카테고리"] = "컴퓨터및주변장치판매"
store_df.loc[_가전 & (store_df["상권업종소분류명"] == "가전제품 소매업"), "통합_카테고리"] = "가전제품"

# 기타 교육 소분류 세분화 (외국어학원, 스포츠 강습 분리; 기본: 예술학원)
_기타교육 = store_df["상권업종중분류명"] == "기타 교육"
store_df.loc[_기타교육 & (store_df["상권업종소분류명"] == "외국어학원"), "통합_카테고리"] = "외국어학원"
store_df.loc[_기타교육 & store_df["상권업종소분류명"].isin({
    "요가/필라테스 학원", "태권도/무술학원",
    "기타 예술/스포츠 교육기관", "레크리에이션 교육기관"
}), "통합_카테고리"] = "스포츠 강습"

# 철물·건설자재 소매 소분류 세분화 (인테리어 분리; 기본: 기타 B2B서비스)
_철물 = store_df["상권업종중분류명"] == "철물·건설자재 소매"
store_df.loc[_철물 & store_df["상권업종소분류명"].isin({
    "벽지/장판/마루 소매업", "기타 건설/건축자재 소매업", "건설/건축자재 소매업"
}), "통합_카테고리"] = "인테리어"

# 의약·화장품 소매 소분류 세분화 (약국→의약품, 의료기기 분리; 기본: 화장품)
_의약 = store_df["상권업종중분류명"] == "의약·화장품 소매"
store_df.loc[_의약 & (store_df["상권업종소분류명"] == "약국"), "통합_카테고리"] = "의약품"
store_df.loc[_의약 & (store_df["상권업종소분류명"] == "의료기기 소매업"), "통합_카테고리"] = "의료기기"

store_df = store_df.dropna(subset=["통합_카테고리"]).copy()

store_agg = (
    store_df.groupby(["기준_년분기_코드", "행정동코드", "통합_카테고리"], dropna=False)
    .size()
    .reset_index(name="점포수")
)

dong_name = store_df[["행정동코드", "행정동명"]].drop_duplicates()


# ----------------------------------------
# 7) 유동인구 집계
# ----------------------------------------
pop_agg = (
    pop_df.groupby(["기준_년분기_코드", "행정동코드"], dropna=False)
    .agg(
        총유동인구=("총_유동인구_수", "sum"),
        유동_10대=("연령대_10_유동인구_수", "sum"),
        유동_20대=("연령대_20_유동인구_수", "sum"),
        유동_30대=("연령대_30_유동인구_수", "sum"),
        유동_40대=("연령대_40_유동인구_수", "sum"),
        유동_50대=("연령대_50_유동인구_수", "sum"),
        유동_60대이상=("연령대_60_이상_유동인구_수", "sum"),
        남성유동=("남성_유동인구_수", "sum"),
        여성유동=("여성_유동인구_수", "sum"),
        시간대_00_06_유동=("시간대_00_06_유동인구_수", "sum"),
        시간대_06_11_유동=("시간대_06_11_유동인구_수", "sum"),
        시간대_11_14_유동=("시간대_11_14_유동인구_수", "sum"),
        시간대_14_17_유동=("시간대_14_17_유동인구_수", "sum"),
        시간대_17_21_유동=("시간대_17_21_유동인구_수", "sum"),
        시간대_21_24_유동=("시간대_21_24_유동인구_수", "sum"),
    )
    .reset_index()
)


# ----------------------------------------
# 8) 병합
# ----------------------------------------
merged = pd.merge(sales_agg, store_agg, on=["기준_년분기_코드", "행정동코드", "통합_카테고리"], how="left")
merged = pd.merge(merged, pop_agg, on=["기준_년분기_코드", "행정동코드"], how="left")
merged = pd.merge(merged, bs_agg, on=["기준_년분기_코드", "행정동코드", "통합_카테고리"], how="left")
merged = pd.merge(merged, work_agg, on=["기준_년분기_코드", "행정동코드"], how="left")
merged = pd.merge(merged, dong_name, on="행정동코드", how="left")
merged = pd.merge(merged, res_df, on=["기준_년분기_코드", "행정동명"], how="left")


# ----------------------------------------
# 9) 행정동 전체 집계 파생 컬럼
# ----------------------------------------
dong_total = (
    merged.groupby(["기준_년분기_코드", "행정동코드"], dropna=False)
    .agg(행정동_전체매출=("당월매출합", "sum"), 행정동_전체점포수=("점포수", "sum"))
    .reset_index()
)
merged = pd.merge(merged, dong_total, on=["기준_년분기_코드", "행정동코드"], how="left")


# ----------------------------------------
# 10) 파생 feature 계산
# ----------------------------------------
merged["점포수"] = merged["점포수"].fillna(0)

merged["업종_점포당매출"]  = merged["당월매출합"] / merged["점포수"].replace(0, pd.NA)
merged["업종_매출점유율"]  = merged["당월매출합"] / merged["행정동_전체매출"].replace(0, pd.NA)
merged["업종_포화도"]      = merged["점포수"] / merged["행정동_전체점포수"].replace(0, pd.NA)
merged["경쟁강도"]         = merged["점포수"]
merged["유동대비매출"]     = merged["당월매출합"] / merged["총유동인구"].replace(0, pd.NA)
merged["점포대비유동"]     = merged["총유동인구"] / merged["점포수"].replace(0, pd.NA)
merged["객단가"]           = merged["당월매출합"] / merged["당월매출건수"].replace(0, pd.NA)

merged["매출_10대비율"]     = merged["매출_10대합"]    / merged["당월매출합"].replace(0, pd.NA)
merged["매출_20대비율"]     = merged["매출_20대합"]    / merged["당월매출합"].replace(0, pd.NA)
merged["매출_30대비율"]     = merged["매출_30대합"]    / merged["당월매출합"].replace(0, pd.NA)
merged["매출_40대비율"]     = merged["매출_40대합"]    / merged["당월매출합"].replace(0, pd.NA)
merged["매출_50대비율"]     = merged["매출_50대합"]    / merged["당월매출합"].replace(0, pd.NA)
merged["매출_60대이상비율"] = merged["매출_60대이상합"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_남성비율"]     = merged["남성매출합"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_여성비율"]     = merged["여성매출합"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_주말비율"]     = merged["주말매출합"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_점심비율"]     = merged["시간대_11_14_매출"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_저녁비율"]     = merged["시간대_17_21_매출"] / merged["당월매출합"].replace(0, pd.NA)
merged["매출_심야비율"]     = merged["시간대_21_24_매출"] / merged["당월매출합"].replace(0, pd.NA)

merged["유동_20대비율"]  = merged["유동_20대"] / merged["총유동인구"].replace(0, pd.NA)
merged["유동_30대비율"]  = merged["유동_30대"] / merged["총유동인구"].replace(0, pd.NA)
merged["유동_40대비율"]  = merged["유동_40대"] / merged["총유동인구"].replace(0, pd.NA)
merged["유동_50대비율"]  = merged["유동_50대"] / merged["총유동인구"].replace(0, pd.NA)
merged["유동_여성비율"]  = merged["여성유동"] / merged["총유동인구"].replace(0, pd.NA)

merged["직장_20대_비율"] = merged["직장_20대_인구"] / merged["총_직장_인구_수"].replace(0, pd.NA)
merged["직장_30대_비율"] = merged["직장_30대_인구"] / merged["총_직장_인구_수"].replace(0, pd.NA)
merged["직장_40대_비율"] = merged["직장_40대_인구"] / merged["총_직장_인구_수"].replace(0, pd.NA)
merged["직장_여성비율"]  = merged["여성_직장_인구"] / merged["총_직장_인구_수"].replace(0, pd.NA)

merged["MZ_차이"] = merged["매출_20대비율"] - merged["유동_20대비율"]
merged = merged.rename(columns={"통합_카테고리": "통합카테고리"})


# ----------------------------------------
# 11) 저장
# ----------------------------------------
col_order = [
    "기준_년분기_코드", "행정동코드", "통합카테고리", "행정동명",
    "당월매출합", "당월매출건수",
    "매출_10대합", "매출_20대합", "매출_30대합", "매출_40대합", "매출_50대합", "매출_60대이상합",
    "남성매출합", "여성매출합", "주중매출합", "주말매출합",
    "시간대_00_06_매출", "시간대_06_11_매출", "시간대_11_14_매출",
    "시간대_14_17_매출", "시간대_17_21_매출", "시간대_21_24_매출",
    "총유동인구",
    "유동_10대", "유동_20대", "유동_30대", "유동_40대", "유동_50대", "유동_60대이상",
    "남성유동", "여성유동",
    "시간대_00_06_유동", "시간대_06_11_유동", "시간대_11_14_유동",
    "시간대_14_17_유동", "시간대_17_21_유동", "시간대_21_24_유동",
    "총_직장_인구_수",
    "직장_20대_인구", "직장_30대_인구", "직장_40대_인구", "직장_50대_인구", "직장_60대이상_인구",
    "남성_직장_인구", "여성_직장_인구", "주거인구",
    "점포수", "행정동_전체매출", "행정동_전체점포수",
    "개업_율_평균", "폐업_률_평균", "프랜차이즈_점포수",
    "업종_점포당매출", "업종_매출점유율", "업종_포화도",
    "경쟁강도", "유동대비매출", "점포대비유동", "객단가",
    "매출_10대비율", "매출_20대비율", "매출_30대비율",
    "매출_40대비율", "매출_50대비율", "매출_60대이상비율",
    "매출_남성비율", "매출_여성비율", "매출_주말비율",
    "매출_점심비율", "매출_저녁비율", "매출_심야비율",
    "유동_20대비율", "유동_30대비율", "유동_40대비율", "유동_50대비율", "유동_여성비율",
    "직장_20대_비율", "직장_30대_비율", "직장_40대_비율", "직장_여성비율",
    "MZ_차이",
]
merged = merged[col_order].dropna(subset=["통합카테고리"])
merged.to_csv(OUT_PATH, index=False, encoding="utf-8-sig")

print(f"\n저장 완료: {OUT_PATH}")
print(f"행 수: {len(merged):,}")
print(f"카테고리 목록: {sorted(merged['통합카테고리'].unique())}")
print(merged.head(3))

