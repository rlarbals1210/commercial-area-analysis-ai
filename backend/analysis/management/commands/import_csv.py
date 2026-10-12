import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import models, transaction

from analysis.models import CommercialData

# manage.py 기준 프로젝트 루트 → data/processed_data/final_dataset.csv
CSV_PATH = Path(__file__).resolve().parents[4] / "data" / "processed_data" / "final_dataset.csv"
BATCH_SIZE = 1000

INT_TYPES = (models.IntegerField, models.BigIntegerField, models.SmallIntegerField)


def _convert(field, raw):
    """CSV 문자열 값을 모델 필드 타입에 맞게 변환한다. 비어 있으면 null 허용 필드는 None, 아니면 0."""
    empty = raw is None or str(raw).strip() in ("", "nan", "NaN", "None")
    if isinstance(field, INT_TYPES):
        if empty:
            return None if field.null else 0
        try:
            return int(float(raw))
        except (ValueError, TypeError):
            return None if field.null else 0
    if isinstance(field, models.FloatField):
        if empty:
            return None if field.null else 0.0
        try:
            return float(raw)
        except (ValueError, TypeError):
            return None if field.null else 0.0
    if empty:
        return None if field.null else ""
    return str(raw)


class Command(BaseCommand):
    help = "final_dataset.csv를 CommercialData 테이블에 임포트합니다. (모델의 모든 컬럼을 CSV 헤더 이름으로 매칭)"

    def handle(self, *args, **options):
        if not CSV_PATH.exists():
            self.stderr.write(f"CSV 파일을 찾을 수 없습니다: {CSV_PATH}")
            return

        fields = [f for f in CommercialData._meta.concrete_fields if not f.primary_key]

        with open(CSV_PATH, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            header = set(reader.fieldnames or [])
            used = [fld for fld in fields if fld.name in header]
            missing = [fld.name for fld in fields if fld.name not in header]
            self.stdout.write(f"CSV 읽는 중: {CSV_PATH}")
            self.stdout.write(f"매칭된 컬럼 {len(used)}개 / 모델 컬럼 {len(fields)}개")
            if missing:
                self.stdout.write("CSV에 없어 비워 두는 컬럼: " + ", ".join(missing))

            with transaction.atomic():
                self.stdout.write("기존 데이터 삭제 중...")
                CommercialData.objects.all().delete()

                objs, total = [], 0
                for row in reader:
                    objs.append(CommercialData(**{fld.name: _convert(fld, row.get(fld.name)) for fld in used}))
                    if len(objs) >= BATCH_SIZE:
                        CommercialData.objects.bulk_create(objs)
                        total += len(objs)
                        objs = []
                        if total % 50000 == 0:
                            self.stdout.write(f"  {total}행 완료...")
                if objs:
                    CommercialData.objects.bulk_create(objs)
                    total += len(objs)

        self.stdout.write(self.style.SUCCESS(f"완료! 총 {total}행 임포트됨."))
