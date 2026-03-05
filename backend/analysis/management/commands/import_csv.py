import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from analysis.models import CommercialData

# manage.py 기준 프로젝트 루트 → ai/outputs/final_dataset.csv
CSV_PATH = Path(__file__).resolve().parents[4] / "ai" / "outputs" / "final_dataset.csv"
BATCH_SIZE = 1000


class Command(BaseCommand):
    help = "final_dataset.csv를 CommercialData 테이블에 임포트합니다."

    def handle(self, *args, **options):
        if not CSV_PATH.exists():
            self.stderr.write(f"CSV 파일을 찾을 수 없습니다: {CSV_PATH}")
            return

        self.stdout.write("기존 데이터 삭제 중...")
        CommercialData.objects.all().delete()

        self.stdout.write(f"CSV 읽는 중: {CSV_PATH}")

        objs = []
        total = 0

        with open(CSV_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                objs.append(CommercialData(
                    기준_년분기_코드  = int(row["기준_년분기_코드"]),
                    행정동코드        = int(row["행정동코드"]),
                    행정동명          = row["행정동명"],
                    통합카테고리      = row["통합카테고리"],

                    당월매출합        = int(float(row["당월매출합"])),
                    매출_20대합       = int(float(row["매출_20대합"])),
                    행정동_전체매출   = int(float(row["행정동_전체매출"])),

                    총유동인구        = int(float(row["총유동인구"])),
                    유동_20대         = int(float(row["유동_20대"])),

                    점포수            = int(float(row["점포수"])),
                    행정동_전체점포수 = int(float(row["행정동_전체점포수"])),

                    업종_점포당매출   = float(row["업종_점포당매출"]),
                    업종_매출점유율   = float(row["업종_매출점유율"]),
                    업종_포화도       = float(row["업종_포화도"]),
                    경쟁강도          = float(row["경쟁강도"]),
                    매출_20대비율     = float(row["매출_20대비율"]),
                    유동_20대비율     = float(row["유동_20대비율"]),
                    MZ_차이           = float(row["MZ_차이"]),
                    유동대비매출      = float(row["유동대비매출"]),
                    점포대비유동      = float(row["점포대비유동"]),
                ))

                # BATCH_SIZE마다 DB에 저장
                if len(objs) >= BATCH_SIZE:
                    CommercialData.objects.bulk_create(objs)
                    total += len(objs)
                    objs = []
                    self.stdout.write(f"  {total}행 완료...")

        # 남은 데이터 저장
        if objs:
            CommercialData.objects.bulk_create(objs)
            total += len(objs)

        self.stdout.write(self.style.SUCCESS(f"완료! 총 {total}행 임포트됨."))
