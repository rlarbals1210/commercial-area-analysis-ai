"""
소상공인 상가(상권)정보 CSV → StoreInfo 테이블 임포트

사용법:
    python manage.py import_store_info              # 최신 분기 자동 선택
    python manage.py import_store_info --quarter 2025-4
"""
import csv
from pathlib import Path

from django.core.management.base import BaseCommand

from analysis.models import StoreInfo

RAW_DIR = Path(__file__).resolve().parents[4] / "data" / "raw_data" / "store_info"
CAT_MAP_PATH = Path(__file__).resolve().parents[4] / "data" / "category_maps" / "store_category_map.csv"
BATCH_SIZE = 2000


def load_category_map():
    """상권업종중분류명 → 통합카테고리 매핑 딕셔너리 반환"""
    cat_map = {}
    with open(CAT_MAP_PATH, encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            cat_map[row["상권업종중분류명"]] = row["통합_카테고리"]
    return cat_map


def latest_quarter_dir():
    """RAW_DIR 아래 'YYYY-Q' 형식 디렉터리 중 가장 최신 반환"""
    dirs = [d for d in RAW_DIR.iterdir() if d.is_dir() and "-" in d.name]

    def sort_key(d):
        parts = d.name.split("-")
        return (int(parts[0]), int(parts[1]))

    return sorted(dirs, key=sort_key)[-1]


def quarter_code(quarter_str: str) -> int:
    """'2025-4' → 20254"""
    year, q = quarter_str.split("-")
    return int(year) * 10 + int(q)


class Command(BaseCommand):
    help = "상가_서울.csv → StoreInfo 테이블 임포트 (기본: 최신 분기)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--quarter",
            type=str,
            default=None,
            help="임포트할 분기 (예: 2025-4). 미입력 시 최신 분기 자동 선택.",
        )

    def handle(self, *args, **options):
        # 분기 디렉터리 결정
        if options["quarter"]:
            qdir = RAW_DIR / options["quarter"]
        else:
            qdir = latest_quarter_dir()

        csv_path = qdir / "상가_서울.csv"
        if not csv_path.exists():
            self.stderr.write(f"CSV 파일 없음: {csv_path}")
            return

        qcode = quarter_code(qdir.name)
        self.stdout.write(f"분기: {qdir.name}  (코드: {qcode})")
        self.stdout.write(f"CSV: {csv_path}")

        # 카테고리 맵 로드
        cat_map = load_category_map()
        self.stdout.write(f"카테고리 매핑: {len(cat_map)}개")

        # 기존 해당 분기 데이터 삭제
        deleted, _ = StoreInfo.objects.filter(기준_년분기_코드=qcode).delete()
        if deleted:
            self.stdout.write(f"기존 {deleted}행 삭제 완료")

        objs = []
        total = 0
        skipped = 0

        def tofloat(v):
            try:
                return float(v)
            except (ValueError, TypeError):
                return None

        with open(csv_path, encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            for row in reader:
                lat = tofloat(row.get("위도"))
                lng = tofloat(row.get("경도"))
                if lat is None or lng is None:
                    skipped += 1
                    continue

                mid = row.get("상권업종중분류명", "").strip()
                소분류 = row.get("상권업종소분류명", "").strip()

                # 중분류 기반 매핑 (공백 제거 후 조회)
                cat = cat_map.get(mid, "기타")

                # 소분류 기반 보정: 기타 간이 → 치킨/피자/버거는 패스트푸드/치킨
                if mid == "기타 간이" and 소분류 in {"치킨", "피자", "버거", "토스트/샌드위치/샐러드"}:
                    cat = "패스트푸드/치킨"

                objs.append(StoreInfo(
                    상가업소번호     = row["상가업소번호"],
                    상호명           = row.get("상호명", "")[:100],
                    통합카테고리     = cat,
                    상권업종소분류명 = row.get("상권업종소분류명", "")[:100],
                    행정동명         = row.get("행정동명", ""),
                    도로명주소       = row.get("도로명주소", "")[:200],
                    위도             = lat,
                    경도             = lng,
                    기준_년분기_코드 = qcode,
                ))

                if len(objs) >= BATCH_SIZE:
                    StoreInfo.objects.bulk_create(objs, ignore_conflicts=True)
                    total += len(objs)
                    objs = []
                    self.stdout.write(f"  {total}행 완료...")

        if objs:
            StoreInfo.objects.bulk_create(objs, ignore_conflicts=True)
            total += len(objs)

        self.stdout.write(self.style.SUCCESS(
            f"완료! {total}행 임포트 / {skipped}행 좌표 없음으로 건너뜀"
        ))
