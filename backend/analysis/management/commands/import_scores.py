import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from analysis.models import ScoreData

CSV_PATH = Path(__file__).resolve().parents[4] / "ai" / "outputs" / "scores.csv"
BATCH_SIZE = 1000


class Command(BaseCommand):
    help = "scores.csv → ScoreData 테이블 임포트"

    def handle(self, *args, **options):
        if not CSV_PATH.exists():
            self.stderr.write(f"파일 없음: {CSV_PATH}")
            return

        self.stdout.write("기존 점수 데이터 삭제 중...")
        ScoreData.objects.all().delete()

        objs = []
        total = 0

        with open(CSV_PATH, encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                objs.append(ScoreData(
                    행정동명        = row["행정동명"],
                    통합카테고리    = row["통합카테고리"],
                    기준_년분기_코드 = int(row["기준_년분기_코드"]),
                    성장확률        = float(row["성장확률_pct"]),
                    업종내_순위     = int(row["업종내_순위"]),
                    업종내_전체동수 = int(row["업종내_전체동수"]),
                    상위_퍼센트    = float(row["상위_퍼센트"]),
                    등급            = row["등급"],
                ))
                if len(objs) >= BATCH_SIZE:
                    ScoreData.objects.bulk_create(objs)
                    total += len(objs)
                    objs = []

        if objs:
            ScoreData.objects.bulk_create(objs)
            total += len(objs)

        self.stdout.write(self.style.SUCCESS(f"완료! {total}개 임포트됨."))
