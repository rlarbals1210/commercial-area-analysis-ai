"""
층별임대료 및 층별효용비율 데이터 전처리 스크립트
소규모/중대형 상가 CSV → 정제된 JSON (ai/outputs/rental_data.json)
"""
import pandas as pd
import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data", "raw_data", "rental_fee_info")
OUTPUT_PATH = os.path.join(BASE_DIR, "ai", "outputs", "rental_data.json")

FILES = {
    "소규모": "임대동향 층별임대료 및 층별효용비율(2024년3분기~)_소규모 상가.csv",
    "중대형": "임대동향 층별임대료 및 층별효용비율(2024년3분기~)_중대형 상가.csv",
}

# 소규모: 지하1층, 1층, 2층
# 중대형: 지하1층, 1층, 2층, 3층, 4층, 5층, 6층이상
FLOORS = {
    "소규모": ["지하1층", "1층", "2층"],
    "중대형": ["지하1층", "1층", "2층", "3층", "4층", "5층", "6층이상"],
}


def parse_file(path, store_type, floors):
    df = pd.read_csv(path, encoding="cp949", header=None)

    # 헤더 2행 제거 후 데이터만
    data = df.iloc[2:].reset_index(drop=True)

    # 컬럼명 지정
    col_names = ["No", "시도", "권역", "상권명", "항목", "단위", "통계자료"] + floors
    data.columns = col_names

    # 전국/시도 집계 행 제외 (상권명 == 시도 이면 집계행)
    # 상권명이 시도명과 동일하거나 '전국'인 행 제외
    data = data[data["상권명"] != data["시도"]]
    data = data[data["상권명"] != "전국"]
    data = data[data["항목"].isin(["임대료", "효용비율"])]

    results = []

    # 임대료 행과 효용비율 행을 상권명 기준으로 합치기
    rent_rows = data[data["항목"] == "임대료"].copy()
    util_rows = data[data["항목"] == "효용비율"].copy()

    rent_rows = rent_rows.reset_index(drop=True)
    util_rows = util_rows.reset_index(drop=True)

    for i in range(len(rent_rows)):
        rent = rent_rows.iloc[i]
        # 같은 상권명의 효용비율 행 찾기
        util_match = util_rows[util_rows["상권명"] == rent["상권명"]]
        if util_match.empty:
            continue
        util = util_match.iloc[0]

        entry = {
            "상가유형": store_type,
            "시도": rent["시도"],
            "권역": rent["권역"],
            "상권명": rent["상권명"],
            "층별": {},
        }

        for floor in floors:
            try:
                rent_val = float(rent[floor]) if pd.notna(rent[floor]) else None
                util_val = float(util[floor]) if pd.notna(util[floor]) else None
            except (ValueError, TypeError):
                rent_val, util_val = None, None

            entry["층별"][floor] = {
                "임대료_만원per㎡": rent_val,
                "효용비율_%": util_val,
            }

        results.append(entry)

    return results


def main():
    all_data = []
    for store_type, filename in FILES.items():
        path = os.path.join(DATA_DIR, filename)
        floors = FLOORS[store_type]
        records = parse_file(path, store_type, floors)
        all_data.extend(records)
        print(f"{store_type}: {len(records)}개 상권 처리 완료")

    # 상권명 목록 (중복 제거)
    regions = sorted(set(
        (r["시도"], r["권역"], r["상권명"]) for r in all_data
    ), key=lambda x: (x[0], x[1], x[2]))

    output = {
        "regions": [{"시도": s, "권역": g, "상권명": n} for s, g, n in regions],
        "data": all_data,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n저장 완료: {OUTPUT_PATH}")
    print(f"총 레코드: {len(all_data)}개 / 상권 수: {len(regions)}개")


if __name__ == "__main__":
    main()
