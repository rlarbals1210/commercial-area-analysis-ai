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

                # 소분류 기반 보정
                if mid == "기타 간이":
                    if 소분류 == "치킨":
                        cat = "치킨전문점"
                    elif 소분류 in {"피자", "버거", "토스트/샌드위치/샐러드"}:
                        cat = "패스트푸드"
                    elif 소분류 in {"빵/도넛", "떡/한과", "아이스크림/빙수"}:
                        cat = "베이커리/디저트"
                elif mid == "의약·화장품 소매":
                    if 소분류 == "약국":
                        cat = "의약품"
                    elif 소분류 == "의료기기 소매업":
                        cat = "의료기기"
                elif mid == "의원":
                    if 소분류 == "치과의원":
                        cat = "치과의원"
                    elif 소분류 == "한의원":
                        cat = "한의원"
                elif mid == "이용·미용":
                    if 소분류 == "네일숍":
                        cat = "네일숍"
                    elif 소분류 == "피부 관리실":
                        cat = "피부관리실"
                elif mid == "유원지·오락":
                    if 소분류 == "노래방":
                        cat = "노래방"
                    elif 소분류 == "PC방":
                        cat = "PC방"
                elif mid == "스포츠 서비스":
                    if 소분류 == "골프 연습장":
                        cat = "골프연습장"
                    elif 소분류 == "당구장":
                        cat = "당구장"
                    elif 소분류 in {"헬스장", "종합 스포츠시설", "기타 스포츠시설 운영업",
                                    "수영장", "볼링장", "스쿼시/라켓볼장", "탁구장", "테니스장"}:
                        cat = "스포츠클럽"
                elif mid == "섬유·의복·신발 소매":
                    if 소분류 == "신발 소매업":
                        cat = "신발"
                    elif 소분류 in {"가방 소매업", "액세서리/잡화 소매업"}:
                        cat = "가방"
                    elif 소분류 in {"침구류/커튼 소매업", "실/섬유제품 소매업"}:
                        cat = "섬유제품"
                    elif 소분류 in {"기타 의류 소매업", "여성 의류 소매업", "남성 의류 소매업",
                                    "유아용 의류 소매업", "가발 소매업", "한복 소매업"}:
                        cat = "일반의류"
                elif mid == "식료품 소매":
                    if 소분류 == "정육점":
                        cat = "육류판매"
                    elif 소분류 == "채소/과일 소매업":
                        cat = "청과상"
                    elif 소분류 == "반찬/식료품 소매업":
                        cat = "반찬가게"
                    elif 소분류 in {"수산물 소매업", "건어물/젓갈 소매업"}:
                        cat = "수산물판매"
                    elif 소분류 == "곡물/곡분 소매업":
                        cat = "미곡판매"
                elif mid == "가전·통신 소매":
                    if 소분류 == "핸드폰 소매업":
                        cat = "핸드폰"
                    elif 소분류 == "컴퓨터/소프트웨어 소매업":
                        cat = "컴퓨터및주변장치판매"
                    elif 소분류 == "가전제품 소매업":
                        cat = "가전제품"
                elif mid == "기타 교육":
                    if 소분류 == "외국어학원":
                        cat = "외국어학원"
                    elif 소분류 in {"요가/필라테스 학원", "태권도/무술학원",
                                    "기타 예술/스포츠 교육기관", "레크리에이션 교육기관"}:
                        cat = "스포츠 강습"
                elif mid == "철물·건설자재 소매":
                    if 소분류 in {"벽지/장판/마루 소매업", "기타 건설/건축자재 소매업",
                                  "건설/건축자재 소매업"}:
                        cat = "인테리어"

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
