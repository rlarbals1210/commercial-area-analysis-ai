import os
import django
import pandas as pd
import numpy as np

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from analysis.models import CommercialData

CSV_PATH = r"C:\Users\김성광\Desktop\commercial-area-analysis-ai\backend\final_dataset.csv"

MODEL_COLUMNS = [
    "기준_년분기_코드",
    "행정동코드",
    "행정동명",
    "통합카테고리",
    "당월매출합",
    "매출_20대합",
    "행정동_전체매출",
    "총유동인구",
    "유동_20대",
    "점포수",
    "행정동_전체점포수",
    "업종_점포당매출",
    "업종_매출점유율",
    "업종_포화도",
    "경쟁강도",
    "매출_20대비율",
    "유동_20대비율",
    "MZ_차이",
    "유동대비매출",
    "점포대비유동",
]

INT_COLUMNS = [
    "기준_년분기_코드",
    "행정동코드",
    "당월매출합",
    "매출_20대합",
    "행정동_전체매출",
    "총유동인구",
    "유동_20대",
    "점포수",
    "행정동_전체점포수",
]

FLOAT_COLUMNS = [
    "업종_점포당매출",
    "업종_매출점유율",
    "업종_포화도",
    "경쟁강도",
    "매출_20대비율",
    "유동_20대비율",
    "MZ_차이",
    "유동대비매출",
    "점포대비유동",
]

STR_COLUMNS = [
    "행정동명",
    "통합카테고리",
]

def clean_numeric(series):
    return (
        series.astype(str)
        .str.replace(",", "", regex=False)
        .str.strip()
        .replace({"nan": np.nan, "None": np.nan, "": np.nan})
    )

def main():
    print("CSV 읽는 중...")
    df = pd.read_csv(CSV_PATH, encoding="utf-8")

    missing_cols = [col for col in MODEL_COLUMNS if col not in df.columns]
    if missing_cols:
        print("CSV에 없는 컬럼:")
        for col in missing_cols:
            print("-", col)
        return

    df = df[MODEL_COLUMNS].copy()

    for col in INT_COLUMNS:
        df[col] = clean_numeric(df[col])
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    for col in FLOAT_COLUMNS:
        df[col] = clean_numeric(df[col])
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0.0).astype(float)

    for col in STR_COLUMNS:
        df[col] = df[col].fillna("").astype(str).str.strip()

    print("저장할 행 개수:", len(df))

    CommercialData.objects.all().delete()
    print("기존 데이터 삭제 완료")

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
        )
        for _, row in df.iterrows()
    ]

    CommercialData.objects.bulk_create(objects, batch_size=1000)
    print(f"저장 완료: {len(objects)}건")

if __name__ == "__main__":
    main()