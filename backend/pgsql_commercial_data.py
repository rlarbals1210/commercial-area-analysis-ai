import os
import django
import pandas as pd
import numpy as np
from pathlib import Path

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from analysis.models import CommercialData

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = PROJECT_ROOT / "data" / "processed_data" / "final_dataset.csv"

INT_COLUMNS = [
    "기준_년분기_코드", "행정동코드",
    "당월매출합", "당월매출건수",
    "매출_10대합", "매출_20대합", "매출_30대합", "매출_40대합", "매출_50대합", "매출_60대이상합",
    "매출건수_10대", "매출건수_20대", "매출건수_30대", "매출건수_40대", "매출건수_50대", "매출건수_60대이상",
    "남성매출합", "여성매출합", "주중매출합", "주말매출합",
    "월요일매출합", "화요일매출합", "수요일매출합", "목요일매출합", "금요일매출합", "토요일매출합", "일요일매출합",
    "시간대_00_06_매출", "시간대_06_11_매출", "시간대_11_14_매출",
    "시간대_14_17_매출", "시간대_17_21_매출", "시간대_21_24_매출",
    "행정동_전체매출",
    "총유동인구",
    "유동_10대", "유동_20대", "유동_30대", "유동_40대", "유동_50대", "유동_60대이상",
    "월요일유동", "화요일유동", "수요일유동", "목요일유동", "금요일유동", "토요일유동", "일요일유동",
    "시간대_00_06_유동", "시간대_06_11_유동", "시간대_11_14_유동",
    "시간대_14_17_유동", "시간대_17_21_유동", "시간대_21_24_유동",
    "총_직장_인구_수", "직장_20대_인구", "직장_30대_인구", "직장_40대_인구", "직장_50대_인구", "직장_60대이상_인구",
    "주거인구",
    "점포수", "행정동_전체점포수",
    "프랜차이즈_점포수",
]

FLOAT_COLUMNS = [
    "업종_점포당매출", "업종_매출점유율", "업종_포화도",
    "경쟁강도", "매출_20대비율", "유동_20대비율",
    "직장_20대_비율", "MZ_차이", "유동대비매출", "점포대비유동",
    "개업_율_평균", "폐업_률_평균",
]

STR_COLUMNS = ["행정동명", "통합카테고리"]

MODEL_COLUMNS = INT_COLUMNS + FLOAT_COLUMNS + STR_COLUMNS


def clean_numeric(series):
    return (
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace({"nan": np.nan, "None": np.nan, "": np.nan})
    )


def main():
    print("CSV 읽는 중...")
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig", low_memory=False)

    missing_cols = [col for col in MODEL_COLUMNS if col not in df.columns]
    if missing_cols:
        print("CSV에 없는 컬럼 (건너뜀):")
        for col in missing_cols:
            print("-", col)
        MODEL_COLUMNS_ACTUAL = [c for c in MODEL_COLUMNS if c in df.columns]
    else:
        MODEL_COLUMNS_ACTUAL = MODEL_COLUMNS

    df = df[[c for c in MODEL_COLUMNS_ACTUAL]].copy()

    for col in INT_COLUMNS:
        if col not in df.columns:
            df[col] = 0
            continue
        df[col] = clean_numeric(df[col])
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    for col in FLOAT_COLUMNS:
        if col not in df.columns:
            df[col] = 0.0
            continue
        df[col] = clean_numeric(df[col])
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype(float)

    for col in STR_COLUMNS:
        df[col] = df[col].fillna("").astype(str).str.strip()

    print("저장할 행 개수:", len(df))

    CommercialData.objects.all().delete()
    print("기존 데이터 삭제 완료")

    def safe_int(row, col):
        return int(row[col]) if col in row.index else 0

    objects = [
        CommercialData(
            기준_년분기_코드=row["기준_년분기_코드"],
            행정동코드=row["행정동코드"],
            행정동명=row["행정동명"],
            통합카테고리=row["통합카테고리"],
            당월매출합=row["당월매출합"],
            매출_20대합=row["매출_20대합"],
            행정동_전체매출=row["행정동_전체매출"],
            총유동인구=row["총유동인구"],
            유동_20대=row["유동_20대"],
            점포수=row["점포수"],
            행정동_전체점포수=row["행정동_전체점포수"],
            업종_점포당매출=row["업종_점포당매출"],
            업종_매출점유율=row["업종_매출점유율"],
            업종_포화도=row["업종_포화도"],
            경쟁강도=row["경쟁강도"],
            매출_20대비율=row["매출_20대비율"],
            유동_20대비율=row["유동_20대비율"],
            MZ_차이=row["MZ_차이"],
            유동대비매출=row["유동대비매출"],
            점포대비유동=row["점포대비유동"],
            # 성별 매출
            남성매출합=safe_int(row, "남성매출합"),
            여성매출합=safe_int(row, "여성매출합"),
            # 주중/주말
            주중매출합=safe_int(row, "주중매출합"),
            주말매출합=safe_int(row, "주말매출합"),
            # 요일별 매출
            월요일매출합=safe_int(row, "월요일매출합"),
            화요일매출합=safe_int(row, "화요일매출합"),
            수요일매출합=safe_int(row, "수요일매출합"),
            목요일매출합=safe_int(row, "목요일매출합"),
            금요일매출합=safe_int(row, "금요일매출합"),
            토요일매출합=safe_int(row, "토요일매출합"),
            일요일매출합=safe_int(row, "일요일매출합"),
            # 나이별 매출 금액
            매출_10대합=safe_int(row, "매출_10대합"),
            매출_30대합=safe_int(row, "매출_30대합"),
            매출_40대합=safe_int(row, "매출_40대합"),
            매출_50대합=safe_int(row, "매출_50대합"),
            매출_60대이상합=safe_int(row, "매출_60대이상합"),
            # 나이별 결제 건수
            매출건수_10대=safe_int(row, "매출건수_10대"),
            매출건수_20대=safe_int(row, "매출건수_20대"),
            매출건수_30대=safe_int(row, "매출건수_30대"),
            매출건수_40대=safe_int(row, "매출건수_40대"),
            매출건수_50대=safe_int(row, "매출건수_50대"),
            매출건수_60대이상=safe_int(row, "매출건수_60대이상"),
            # 시간대별 매출
            시간대_00_06_매출=safe_int(row, "시간대_00_06_매출"),
            시간대_06_11_매출=safe_int(row, "시간대_06_11_매출"),
            시간대_11_14_매출=safe_int(row, "시간대_11_14_매출"),
            시간대_14_17_매출=safe_int(row, "시간대_14_17_매출"),
            시간대_17_21_매출=safe_int(row, "시간대_17_21_매출"),
            시간대_21_24_매출=safe_int(row, "시간대_21_24_매출"),
            # 나이별 유동인구
            유동_10대=safe_int(row, "유동_10대"),
            유동_30대=safe_int(row, "유동_30대"),
            유동_40대=safe_int(row, "유동_40대"),
            유동_50대=safe_int(row, "유동_50대"),
            유동_60대이상=safe_int(row, "유동_60대이상"),
            # 요일별 유동인구
            월요일유동=safe_int(row, "월요일유동"),
            화요일유동=safe_int(row, "화요일유동"),
            수요일유동=safe_int(row, "수요일유동"),
            목요일유동=safe_int(row, "목요일유동"),
            금요일유동=safe_int(row, "금요일유동"),
            토요일유동=safe_int(row, "토요일유동"),
            일요일유동=safe_int(row, "일요일유동"),
            # 시간대별 유동인구
            시간대_00_06_유동=safe_int(row, "시간대_00_06_유동"),
            시간대_06_11_유동=safe_int(row, "시간대_06_11_유동"),
            시간대_11_14_유동=safe_int(row, "시간대_11_14_유동"),
            시간대_14_17_유동=safe_int(row, "시간대_14_17_유동"),
            시간대_17_21_유동=safe_int(row, "시간대_17_21_유동"),
            시간대_21_24_유동=safe_int(row, "시간대_21_24_유동"),
            # 직장/주거인구
            총_직장_인구_수=safe_int(row, "총_직장_인구_수"),
            직장_20대_인구=safe_int(row, "직장_20대_인구"),
            주거인구=safe_int(row, "주거인구"),
            # 개업/폐업/프랜차이즈
            개업_율_평균=float(row["개업_율_평균"]) if "개업_율_평균" in row.index else 0.0,
            폐업_률_평균=float(row["폐업_률_평균"]) if "폐업_률_평균" in row.index else 0.0,
            프랜차이즈_점포수=safe_int(row, "프랜차이즈_점포수"),
        )
        for _, row in df.iterrows()
    ]

    CommercialData.objects.bulk_create(objects, batch_size=1000)
    print(f"저장 완료: {len(objects)}건")


if __name__ == "__main__":
    main()
