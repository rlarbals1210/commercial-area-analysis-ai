"""
street_scores.csv + street_dataset.csv → DB 임포트
- StreetScoreData: street_scores.csv (최신 분기 AI 점수)
- StreetCommercialData: street_dataset.csv (최신 분기 상권 지표)
"""

import csv
import math
from pathlib import Path

from django.core.management.base import BaseCommand

from analysis.models import StreetScoreData, StreetCommercialData

SCORES_PATH = Path(__file__).resolve().parents[4] / "data" / "processed_data" / "street_scores.csv"
DATASET_PATH = Path(__file__).resolve().parents[4] / "data" / "processed_data" / "street_dataset.csv"
BATCH_SIZE = 1000


def safe_float(val):
    try:
        v = float(val)
        return None if math.isnan(v) else v
    except (ValueError, TypeError):
        return None


def safe_int(val):
    try:
        v = float(val)
        return None if math.isnan(v) else int(v)
    except (ValueError, TypeError):
        return None


class Command(BaseCommand):
    help = "street_scores.csv + street_dataset.csv → StreetScoreData, StreetCommercialData 임포트"

    def handle(self, *args, **options):
        self._import_scores()
        self._import_commercial()

    def _import_scores(self):
        if not SCORES_PATH.exists():
            self.stderr.write(f"파일 없음: {SCORES_PATH}")
            return

        self.stdout.write("StreetScoreData 기존 데이터 삭제 중...")
        StreetScoreData.objects.all().delete()

        objs, total = [], 0
        with open(SCORES_PATH, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                objs.append(StreetScoreData(
                    상권_코드           = int(row["상권_코드"]),
                    상권_코드_명        = row["상권_코드_명"],
                    통합카테고리        = row["통합카테고리"],
                    기준_년분기_코드    = int(row["기준_년분기_코드"]),
                    성장확률            = float(row["성장확률_pct"]),
                    업종내_순위         = int(row["업종내_순위"]),
                    업종내_전체상권수   = int(row["업종내_전체상권수"]),
                    상위_퍼센트        = float(row["상위_퍼센트"]),
                    등급                = row["등급"],
                ))
                if len(objs) >= BATCH_SIZE:
                    StreetScoreData.objects.bulk_create(objs)
                    total += len(objs)
                    objs = []

        if objs:
            StreetScoreData.objects.bulk_create(objs)
            total += len(objs)

        self.stdout.write(self.style.SUCCESS(f"StreetScoreData 완료: {total}개"))

    def _import_commercial(self):
        if not DATASET_PATH.exists():
            self.stderr.write(f"파일 없음: {DATASET_PATH}")
            return

        self.stdout.write("최신 분기 확인 중...")

        # 최신 분기만 로드
        latest_q = None
        with open(DATASET_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                q = int(row["기준_년분기_코드"])
                if latest_q is None or q > latest_q:
                    latest_q = q

        self.stdout.write(f"최신 분기: {latest_q}")
        self.stdout.write("StreetCommercialData 기존 데이터 삭제 중...")
        StreetCommercialData.objects.all().delete()

        objs, total = [], 0
        with open(DATASET_PATH, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                if int(row["기준_년분기_코드"]) != latest_q:
                    continue
                objs.append(StreetCommercialData(
                    기준_년분기_코드    = latest_q,
                    상권_코드           = int(row["상권_코드"]),
                    상권_코드_명        = row["상권_코드_명"],
                    통합카테고리        = row["통합카테고리"],
                    당월_매출_금액      = safe_int(row["당월_매출_금액"]) or 0,
                    당월_매출_건수      = safe_int(row["당월_매출_건수"]) or 0,
                    객단가              = safe_float(row.get("객단가")),
                    매출_증감률         = safe_float(row.get("매출_증감률")),
                    매출_주말비율       = safe_float(row.get("매출_주말비율")),
                    매출_저녁비율       = safe_float(row.get("매출_저녁비율")),
                    총_유동인구_수      = safe_int(row.get("총_유동인구_수")),
                    유동_증감률         = safe_float(row.get("유동_증감률")),
                    월_평균_소득_금액   = safe_float(row.get("월_평균_소득_금액")),
                    지출_총금액         = safe_float(row.get("지출_총금액")),
                ))
                if len(objs) >= BATCH_SIZE:
                    StreetCommercialData.objects.bulk_create(objs)
                    total += len(objs)
                    objs = []

        if objs:
            StreetCommercialData.objects.bulk_create(objs)
            total += len(objs)

        self.stdout.write(self.style.SUCCESS(f"StreetCommercialData 완료: {total}개"))
