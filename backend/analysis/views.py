import json
import os
import threading
import pandas as pd
from pathlib import Path
from django.http import JsonResponse
from django.db.models import Avg, Count, Max, Sum
from django.views.decorators.csrf import csrf_exempt
from .models import CommercialData, StoreInfo, ScoreData, StreetScoreData, StreetCommercialData
from shapely.geometry import Point, shape as shapely_shape

# location_scores.csv 메모리 캐시
_location_df = None
_location_lock = threading.Lock()

# street_boundaries.geojson 구→상권코드 매핑 캐시
_gu_street_map = None
_gu_street_map_lock = threading.Lock()

def _get_gu_street_map():
    """street_boundaries.geojson의 시군구명 속성을 이용해 {구명: [상권코드, ...]} 반환"""
    global _gu_street_map
    if _gu_street_map is not None:
        return _gu_street_map
    with _gu_street_map_lock:
        if _gu_street_map is not None:
            return _gu_street_map
        gj = _get_street_geojson()
        mapping = {}
        for feat in gj.get("features", []):
            props = feat.get("properties", {})
            gu = props.get("시군구명", "")
            code = props.get("상권_코드")
            if gu and code:
                mapping.setdefault(gu, []).append(int(code))
        _gu_street_map = mapping
    return _gu_street_map

# street_boundaries.geojson 메모리 캐시
_street_geojson = None
_street_geojson_lock = threading.Lock()

def _get_street_geojson():
    global _street_geojson
    if _street_geojson is not None:
        return _street_geojson
    with _street_geojson_lock:
        if _street_geojson is not None:
            return _street_geojson
        path = Path(__file__).resolve().parents[2] / "frontend-react" / "public" / "street_boundaries.geojson"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                _street_geojson = json.load(f)
        else:
            _street_geojson = {}
    return _street_geojson

# gu_rental.json 메모리 캐시
_gu_rental = None
_gu_rental_lock = threading.Lock()

def _get_gu_rental():
    global _gu_rental
    if _gu_rental is not None:
        return _gu_rental
    with _gu_rental_lock:
        if _gu_rental is not None:
            return _gu_rental
        path = Path(__file__).resolve().parents[2] / "ai" / "outputs" / "gu_rental.json"
        if path.exists():
            with open(path, encoding="utf-8") as f:
                _gu_rental = json.load(f)
        else:
            _gu_rental = {}
    return _gu_rental

# 행정동코드 앞 5자리 → 구명
_GU_CODE_MAP = {
    "11110": "종로구", "11140": "중구",    "11170": "용산구",
    "11200": "성동구", "11215": "광진구",  "11230": "동대문구",
    "11260": "중랑구", "11290": "성북구",  "11305": "강북구",
    "11320": "도봉구", "11350": "노원구",  "11380": "은평구",
    "11410": "서대문구","11440": "마포구", "11470": "양천구",
    "11500": "강서구", "11530": "구로구",  "11545": "금천구",
    "11560": "영등포구","11590": "동작구", "11620": "관악구",
    "11650": "서초구", "11680": "강남구",  "11710": "송파구",
    "11740": "강동구",
}

def _get_location_df():
    global _location_df
    if _location_df is not None:
        return _location_df
    with _location_lock:
        if _location_df is not None:
            return _location_df
        path = Path(__file__).resolve().parents[2] / "data" / "processed_data" / "location_scores.csv"
        if path.exists():
            _location_df = pd.read_csv(path, encoding="utf-8-sig")
        else:
            _location_df = pd.DataFrame()
    return _location_df


# StoreInfo 통합카테고리 → CommercialData 통합카테고리 매핑
# 파이프라인 재구성 후 두 테이블이 동일한 세분류 체계를 사용하므로 매핑 불필요
STORE_TO_COMMERCIAL_CAT: dict = {}

DONG_REMAP = {
    "신설동": "용신동",    # GeoJSON 경계명 → DB 행정동명
    "상일제1동": "상일동", # 분동 전 통합 데이터로 매핑
    "상일제2동": "상일동",
}

def normalize_dong(name: str) -> str:
    """GeoJSON의 가운뎃점(·)을 DB의 마침표(.)로 정규화 + 경계 없는 행정동 재매핑"""
    if not name:
        return name
    name = name.replace("\u00b7", ".")
    return DONG_REMAP.get(name, name)




def quarters(request):
    dong = normalize_dong(request.GET.get("dong"))
    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    qs = list(
        CommercialData.objects
        .filter(행정동명=dong)
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")
    )
    return JsonResponse({"quarters": qs})

def analysis(request):
    dong = normalize_dong(request.GET.get("dong"))
    quarter_param = request.GET.get("quarter")
    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    # 요청한 분기가 있으면 사용, 없으면 최신 분기
    if quarter_param:
        try:
            target = int(quarter_param)
            if not CommercialData.objects.filter(행정동명=dong, 기준_년분기_코드=target).exists():
                target = None
        except ValueError:
            target = None
    else:
        target = None

    if not target:
        target = (
            CommercialData.objects
            .filter(행정동명=dong)
            .order_by("-기준_년분기_코드")
            .values_list("기준_년분기_코드", flat=True)
            .first()
        )
    if not target:
        return JsonResponse({"dong": dong, "총매출": 0, "순위": None, "전체동수": 0, "industries": [], "quarter": None})

    # 업종별 데이터
    rows = list(
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=target)
        .values("통합카테고리", "당월매출합", "점포수")
        .order_by("-당월매출합")
    )

    # 시간대/성별/주중주말 집계 (업종 전체 합산)
    from django.db.models import Sum
    agg = (
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=target)
        .aggregate(
            남성매출합=Sum("남성매출합"),
            여성매출합=Sum("여성매출합"),
            주중매출합=Sum("주중매출합"),
            주말매출합=Sum("주말매출합"),
            시간대_00_06=Sum("시간대_00_06_매출"),
            시간대_06_11=Sum("시간대_06_11_매출"),
            시간대_11_14=Sum("시간대_11_14_매출"),
            시간대_14_17=Sum("시간대_14_17_매출"),
            시간대_17_21=Sum("시간대_17_21_매출"),
            시간대_21_24=Sum("시간대_21_24_매출"),
        )
    )

    # 해당 행정동 총 매출
    총매출 = (
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=target)
        .values_list("행정동_전체매출", flat=True)
        .first() or 0
    )

    # 전체 행정동 순위 (총 매출 기준)
    dong_revenues = (
        CommercialData.objects
        .filter(기준_년분기_코드=target)
        .values("행정동명")
        .annotate(총매출=Max("행정동_전체매출"))
    )
    전체동수 = dong_revenues.count()
    상위동수 = dong_revenues.filter(총매출__gt=총매출).count()
    순위 = 상위동수 + 1

    # 전년도 동 분기 매출 (YoY)
    prev_yoy_target = target - 10
    prev_yoy_총매출 = (
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=prev_yoy_target)
        .values_list("행정동_전체매출", flat=True)
        .first() or 0
    )
    매출변동률 = round((총매출 - prev_yoy_총매출) / prev_yoy_총매출 * 100, 1) if prev_yoy_총매출 > 0 else None

    return JsonResponse({
        "dong": dong,
        "총매출": 총매출,
        "순위": 순위,
        "전체동수": 전체동수,
        "industries": rows,
        "quarter": target,
        "매출변동률": 매출변동률,
        "성별": {
            "남성": agg["남성매출합"] or 0,
            "여성": agg["여성매출합"] or 0,
        },
        "주중주말": {
            "주중": agg["주중매출합"] or 0,
            "주말": agg["주말매출합"] or 0,
        },
        "시간대": {
            "00~06": agg["시간대_00_06"] or 0,
            "06~11": agg["시간대_06_11"] or 0,
            "11~14": agg["시간대_11_14"] or 0,
            "14~17": agg["시간대_14_17"] or 0,
            "17~21": agg["시간대_17_21"] or 0,
            "21~24": agg["시간대_21_24"] or 0,
        },
    })


def gu_quarters(request):
    """구에 속한 행정동 목록을 받아 사용 가능한 분기 목록 반환 (GET, dongs=comma-separated)"""
    dongs_param = request.GET.get("dongs", "")
    if not dongs_param:
        return JsonResponse({"error": "dongs 파라미터가 필요합니다."}, status=400)
    dongs = [normalize_dong(d.strip()) for d in dongs_param.split(",") if d.strip()]
    qs = list(
        CommercialData.objects
        .filter(행정동명__in=dongs)
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")
    )
    return JsonResponse({"quarters": qs})


@csrf_exempt
def gu_analysis(request):
    """구 단위 분석 (POST, body: { gu, dongs, gu_dongs_map, quarter })"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "잘못된 JSON"}, status=400)

    gu = body.get("gu")
    dongs = [normalize_dong(d) for d in body.get("dongs", [])]
    gu_dongs_map = {g: [normalize_dong(d) for d in dl] for g, dl in body.get("gu_dongs_map", {}).items()}
    quarter_param = body.get("quarter")

    if not gu or not dongs:
        return JsonResponse({"error": "gu, dongs 필요"}, status=400)

    # 분기 결정
    target = None
    if quarter_param:
        try:
            target = int(quarter_param)
            if not CommercialData.objects.filter(행정동명__in=dongs, 기준_년분기_코드=target).exists():
                target = None
        except (ValueError, TypeError):
            target = None

    if not target:
        target = (
            CommercialData.objects
            .filter(행정동명__in=dongs)
            .order_by("-기준_년분기_코드")
            .values_list("기준_년분기_코드", flat=True)
            .first()
        )
    if not target:
        return JsonResponse({"gu": gu, "총매출": 0, "순위": None, "전체구수": 0, "industries": [], "quarter": None})

    # 구 내 업종별 합계
    industries = list(
        CommercialData.objects
        .filter(행정동명__in=dongs, 기준_년분기_코드=target)
        .values("통합카테고리")
        .annotate(당월매출합=Sum("당월매출합"), 점포수=Sum("점포수"))
        .order_by("-당월매출합")
    )
    총매출 = sum(item["당월매출합"] for item in industries)

    # 구끼리 순위 계산
    순위 = None
    전체구수 = len(gu_dongs_map) if gu_dongs_map else 25
    if gu_dongs_map:
        # 모든 구의 행정동을 한 번에 조회해 집계
        all_dong_to_gu = {}
        for gu_name, dong_list in gu_dongs_map.items():
            for dong in dong_list:
                all_dong_to_gu[dong] = gu_name
        all_dongs = list(all_dong_to_gu.keys())

        dong_totals = (
            CommercialData.objects
            .filter(행정동명__in=all_dongs, 기준_년분기_코드=target)
            .values("행정동명")
            .annotate(total=Sum("당월매출합"))
        )
        gu_totals = {}
        for row in dong_totals:
            gn = all_dong_to_gu[row["행정동명"]]
            gu_totals[gn] = gu_totals.get(gn, 0) + row["total"]

        상위구수 = sum(1 for v in gu_totals.values() if v > 총매출)
        순위 = 상위구수 + 1
        전체구수 = len(gu_totals)

    # 전년도 동 분기 매출 계산 (YoY)
    prev_yoy_target = target - 10
    prev_industries = (
        CommercialData.objects
        .filter(행정동명__in=dongs, 기준_년분기_코드=prev_yoy_target)
        .values("통합카테고리")
        .annotate(당월매출합=Sum("당월매출합"))
    )
    prev_총매출 = sum(item["당월매출합"] for item in prev_industries)
    매출변동률 = round((총매출 - prev_총매출) / prev_총매출 * 100, 1) if prev_총매출 > 0 else None

    return JsonResponse({
        "gu": gu,
        "총매출": 총매출,
        "순위": 순위,
        "전체구수": 전체구수,
        "industries": industries,
        "quarter": target,
        "매출변동률": 매출변동률,
    })


@csrf_exempt
def gu_all_ranking(request):
    """전체 구 매출 순위 반환 (POST, body: { gu_dongs_map })"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "잘못된 JSON"}, status=400)

    gu_dongs_map = {g: [normalize_dong(d) for d in dl] for g, dl in body.get("gu_dongs_map", {}).items()}
    if not gu_dongs_map:
        return JsonResponse({"rankings": []})

    all_dong_to_gu = {}
    for gu_name, dong_list in gu_dongs_map.items():
        for dong in dong_list:
            all_dong_to_gu[dong] = gu_name
    all_dongs = list(all_dong_to_gu.keys())

    latest_quarter = (
        CommercialData.objects
        .filter(행정동명__in=all_dongs)
        .order_by("-기준_년분기_코드")
        .values_list("기준_년분기_코드", flat=True)
        .first()
    )
    if not latest_quarter:
        return JsonResponse({"rankings": []})

    dong_totals = (
        CommercialData.objects
        .filter(행정동명__in=all_dongs, 기준_년분기_코드=latest_quarter)
        .values("행정동명")
        .annotate(total=Sum("당월매출합"))
    )
    gu_totals = {}
    for row in dong_totals:
        gn = all_dong_to_gu.get(row["행정동명"])
        if gn:
            gu_totals[gn] = gu_totals.get(gn, 0) + row["total"]

    rankings = sorted(
        [{"gu": gu, "총매출": total} for gu, total in gu_totals.items()],
        key=lambda x: x["총매출"],
        reverse=True
    )
    for i, item in enumerate(rankings):
        item["순위"] = i + 1

    return JsonResponse({"rankings": rankings, "quarter": latest_quarter})


def score(request):
    """창업 적합도 점수 (GET, dong + category 필수)"""
    dong = normalize_dong(request.GET.get("dong"))
    category = request.GET.get("category")
    if not dong or not category:
        return JsonResponse({"error": "dong, category 파라미터가 필요합니다."}, status=400)

    obj = ScoreData.objects.filter(행정동명=dong, 통합카테고리=category).first()
    if not obj:
        return JsonResponse({"error": "데이터 없음"}, status=404)

    return JsonResponse({
        "dong": dong,
        "category": category,
        "성장확률": obj.성장확률,
        "업종내_순위": obj.업종내_순위,
        "업종내_전체동수": obj.업종내_전체동수,
        "상위_퍼센트": obj.상위_퍼센트,
        "등급": obj.등급,
        "기준_년분기_코드": obj.기준_년분기_코드,
    })


def score_all(request):
    """행정동 내 전체 업종 점수 목록 (GET, dong 필수)"""
    dong = normalize_dong(request.GET.get("dong"))
    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    rows = list(
        ScoreData.objects
        .filter(행정동명=dong)
        .values("통합카테고리", "성장확률", "업종내_순위", "업종내_전체동수", "상위_퍼센트", "등급")
        .order_by("업종내_순위")
    )
    return JsonResponse({"dong": dong, "scores": rows})


def store_list(request):
    """행정동 내 개별 상가 목록 반환 (GET, dong 필수 / category 선택)"""
    dong = normalize_dong(request.GET.get("dong"))
    category = request.GET.get("category")
    limit = min(int(request.GET.get("limit", 500)), 1000)

    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    qs = StoreInfo.objects.filter(행정동명=dong)
    if category:
        qs = qs.filter(통합카테고리=category)

    total = qs.count()
    stores = list(
        qs.values("상호명", "통합카테고리", "상권업종소분류명", "도로명주소", "위도", "경도")[:limit]
    )
    return JsonResponse({"stores": stores, "total": total})


def suggest_industries(request):
    """소분류 업종명 자동완성 (GET, q=검색어)"""
    q = request.GET.get("q", "").strip()
    if not q:
        return JsonResponse({"suggestions": []})

    results = (
        StoreInfo.objects
        .filter(상권업종소분류명__icontains=q)
        .values("상권업종소분류명")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")[:10]
    )
    suggestions = [r["상권업종소분류명"] for r in results]

    # 공백 없는 입력("기타한식음식점")으로 공백 있는 소분류("기타 한식 음식점") 매칭
    if not suggestions:
        from django.db.models.functions import Replace
        from django.db.models import Value
        q_no_space = q.replace(" ", "")
        results2 = (
            StoreInfo.objects
            .annotate(소분류_no_space=Replace("상권업종소분류명", Value(" "), Value("")))
            .filter(소분류_no_space__icontains=q_no_space)
            .values("상권업종소분류명")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")[:10]
        )
        suggestions = [r["상권업종소분류명"] for r in results2]

    return JsonResponse({"suggestions": suggestions})


def suggest_industries_with_category(request):
    """창업비용 계산기용 업종 자동완성 (GET, q=검색어)
    기존 suggest_industries와 달리 통합카테고리도 함께 반환하여
    프론트엔드에서 STARTUP_COSTS 카테고리로 바로 매핑할 수 있게 함"""
    q = request.GET.get("q", "").strip()
    if not q:
        return JsonResponse({"suggestions": []})

    # 소분류명으로 검색
    results = (
        StoreInfo.objects
        .filter(상권업종소분류명__icontains=q)
        .values("상권업종소분류명", "통합카테고리")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")[:10]
    )
    suggestions = [
        {"소분류명": r["상권업종소분류명"], "통합카테고리": r["통합카테고리"]}
        for r in results
    ]

    # 공백 없는 입력으로도 매칭 시도 (예: "피자전문점" → "피자 전문점")
    if not suggestions:
        from django.db.models.functions import Replace
        from django.db.models import Value
        q_no_space = q.replace(" ", "")
        results2 = (
            StoreInfo.objects
            .annotate(소분류_no_space=Replace("상권업종소분류명", Value(" "), Value("")))
            .filter(소분류_no_space__icontains=q_no_space)
            .values("상권업종소분류명", "통합카테고리")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")[:10]
        )
        suggestions = [
            {"소분류명": r["상권업종소분류명"], "통합카테고리": r["통합카테고리"]}
            for r in results2
        ]

    # 통합카테고리명으로도 검색해서 추가 (예: "베이커리" → "베이커리/디저트")
    cat_results = (
        StoreInfo.objects
        .filter(통합카테고리__icontains=q)
        .values("통합카테고리")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")[:5]
    )
    existing_cats = {s["통합카테고리"] for s in suggestions}
    for r in cat_results:
        if r["통합카테고리"] not in existing_cats:
            suggestions.insert(0, {"소분류명": r["통합카테고리"], "통합카테고리": r["통합카테고리"]})

    return JsonResponse({"suggestions": suggestions[:10]})


def recommend_location(request):
    """소분류 업종 입력 → 최적 창업 행정동 추천 (GET, 업종=소분류명, gu=구명(선택))"""
    소분류 = request.GET.get("업종", "").strip()
    gu_filter = request.GET.get("gu", "").strip()  # 선택: 특정 구 내 행정동만 추천
    if not 소분류:
        return JsonResponse({"error": "업종 파라미터가 필요합니다."}, status=400)

    # 1. 소분류 → 통합카테고리 매핑 (StoreInfo 기반)
    # 공백 없는 입력("기타한식음식점")도 공백 있는 소분류("기타 한식 음식점")와 매칭
    from django.db.models.functions import Replace
    from django.db.models import Value

    def _store_filter(q):
        qs = StoreInfo.objects.filter(상권업종소분류명__icontains=q)
        if not qs.exists():
            q_ns = q.replace(" ", "")
            qs = (StoreInfo.objects
                  .annotate(소분류_ns=Replace("상권업종소분류명", Value(" "), Value("")))
                  .filter(소분류_ns__icontains=q_ns))
        return qs

    # 통합카테고리명 직접 입력 시 바로 사용 (카테고리 그리드 선택 케이스)
    if StoreInfo.objects.filter(통합카테고리=소분류).exists():
        통합카테고리 = 소분류
    else:
        cat_rows = list(
            _store_filter(소분류)
            .values("통합카테고리")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")[:1]
        )
        if not cat_rows:
            return JsonResponse({"error": f'"{소분류}"에 해당하는 업종을 찾을 수 없습니다.'}, status=404)
        통합카테고리 = cat_rows[0]["통합카테고리"]

    # CommercialData/ScoreData 조회용 카테고리 (구분류 체계)
    commercial_카테고리 = STORE_TO_COMMERCIAL_CAT.get(통합카테고리, 통합카테고리)

    # 2. ScoreData: 통합카테고리 기반 AI 성장확률 (행정동별)
    score_map = {
        row["행정동명"]: row
        for row in ScoreData.objects.filter(통합카테고리=commercial_카테고리).values(
            "행정동명", "성장확률", "등급", "상위_퍼센트"
        )
    }

    # 3. CommercialData: 최신 분기 지표 (행정동별)
    cd_qs = CommercialData.objects.filter(통합카테고리=commercial_카테고리)
    if gu_filter:
        # 구 코드(5자리) 조회 → 행정동코드 prefix 필터
        gu_code = next((k for k, v in _GU_CODE_MAP.items() if v == gu_filter), None)
        if gu_code:
            cd_qs = cd_qs.filter(행정동코드__gte=int(gu_code) * 1000,
                                  행정동코드__lt=(int(gu_code) + 1) * 1000)

    latest_q = cd_qs.aggregate(max=Max("기준_년분기_코드"))["max"]
    if not latest_q:
        return JsonResponse({"error": "분석 데이터가 없습니다."}, status=404)

    commercial_map = {
        row["행정동명"]: row
        for row in cd_qs.filter(기준_년분기_코드=latest_q).values(
            "행정동명", "행정동코드", "당월매출합", "총유동인구", "업종_포화도",
            "경쟁강도", "점포수", "행정동_전체점포수", "업종_점포당매출",
        )
    }

    # 4. StoreInfo: 통합카테고리 기반 점포수 (행정동별) — 경쟁 밀도 계산용
    subdiv_stores = {
        row["행정동명"]: row["cnt"]
        for row in StoreInfo.objects.filter(통합카테고리=통합카테고리)
        .values("행정동명")
        .annotate(cnt=Count("id"))
    }

    # 5. 후보 행정동: ScoreData + CommercialData 교집합
    candidate_dongs = set(score_map.keys()) & set(commercial_map.keys())
    if not candidate_dongs:
        return JsonResponse({"error": "추천할 수 있는 상권 데이터가 없습니다."}, status=404)

    # 로컬 정규화 최대값 (후보 행정동 기준)
    max_유동   = max((commercial_map[d]["총유동인구"] or 0) for d in candidate_dongs) or 1
    max_포화도 = max((commercial_map[d]["업종_포화도"] or 0) for d in candidate_dongs) or 1
    max_소분류 = max(subdiv_stores.values(), default=0) or 1
    max_경쟁   = max((commercial_map[d]["경쟁강도"] or 0) for d in candidate_dongs) or 1

    results = []
    for dong in candidate_dongs:
        c = commercial_map[dong]
        s = score_map.get(dong, {})

        성장확률      = s.get("성장확률") or 50.0
        유동인구      = c.get("총유동인구") or 0
        소분류_점포수 = subdiv_stores.get(dong, 0)
        포화도        = c.get("업종_포화도") or 0.5
        경쟁강도_norm = (c.get("경쟁강도") or 0) / max_경쟁

        유동인구_점수   = (유동인구 / max_유동) * 100
        소분류경쟁_점수 = max(0.0, 1 - 소분류_점포수 / max_소분류) * 100
        포화도_점수     = max(0.0, 1 - 포화도 / max_포화도) * 100

        composite = round(
            성장확률 * 0.40 + 소분류경쟁_점수 * 0.30 + 유동인구_점수 * 0.15 + 포화도_점수 * 0.15, 1
        )

        dong_code = c.get("행정동코드") or 0
        gu_prefix = str(int(dong_code) // 1000) if dong_code else ""
        results.append({
            "dongName": dong,
            "guName": _GU_CODE_MAP.get(gu_prefix, ""),
            "score": composite,
            "성장확률": round(성장확률, 1),
            "등급": s.get("등급", "-"),
            "소분류_점포수": 소분류_점포수,
            "경쟁강도": round(경쟁강도_norm, 3),
            "업종_포화도": round(포화도, 3),
            "총유동인구": 유동인구,
            "당월매출합": c.get("당월매출합") or 0,
            "점포수": c.get("점포수") or 0,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    top = results[:10]

    for i, r in enumerate(top):
        r["rank"] = i + 1
        r["reason"] = _make_reason(r, 소분류)
        r["tags"] = _make_tags(r)
        r["competition"] = (
            "낮음" if r["경쟁강도"] < 0.33 else
            "중간" if r["경쟁강도"] < 0.66 else
            "높음"
        )

    return JsonResponse({
        "results": top,
        "통합카테고리": 통합카테고리,
        "소분류": 소분류,
        "quarter": latest_q,
    })


def recommend_industry(request):
    """행정동 입력 → 유망 업종 추천 (GET, dong 필수)"""
    dong = normalize_dong(request.GET.get("dong", "").strip())
    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    # ScoreData: 해당 행정동의 모든 업종 성장확률
    score_map = {
        row["통합카테고리"]: row
        for row in ScoreData.objects.filter(행정동명=dong).values(
            "통합카테고리", "성장확률", "등급", "상위_퍼센트"
        )
    }
    if not score_map:
        return JsonResponse({"error": "해당 행정동의 AI 점수 데이터가 없습니다."}, status=404)

    # CommercialData: 최신 분기 해당 행정동 전 업종
    latest_q = (
        CommercialData.objects
        .filter(행정동명=dong)
        .aggregate(max=Max("기준_년분기_코드"))["max"]
    )
    if not latest_q:
        return JsonResponse({"error": "상권 데이터가 없습니다."}, status=404)

    commercial_map = {
        row["통합카테고리"]: row
        for row in CommercialData.objects.filter(행정동명=dong, 기준_년분기_코드=latest_q).values(
            "통합카테고리", "당월매출합", "총유동인구", "업종_포화도", "경쟁강도", "점포수"
        )
    }

    # 교집합 업종만 사용
    categories = set(score_map.keys()) & set(commercial_map.keys())
    if not categories:
        return JsonResponse({"error": "추천할 수 있는 업종 데이터가 없습니다."}, status=404)

    # 전국 기준 정규화 최대값 (recommend_score와 동일한 방식)
    global_max_cache = {}
    for cat in categories:
        all_rows = list(
            CommercialData.objects.filter(통합카테고리=cat, 기준_년분기_코드=latest_q)
            .values("당월매출합", "총유동인구", "경쟁강도")
        )
        global_max_cache[cat] = {
            "max_매출": max((r["당월매출합"] or 0) for r in all_rows) or 1,
            "max_유동": max((r["총유동인구"] or 0) for r in all_rows) or 1,
            "max_경쟁강도": max((r["경쟁강도"] or 0) for r in all_rows) or 1,
        }

    results = []
    for cat in categories:
        c = commercial_map[cat]
        s = score_map[cat]

        max_매출 = global_max_cache[cat]["max_매출"]
        max_유동 = global_max_cache[cat]["max_유동"]
        max_경쟁강도 = global_max_cache[cat]["max_경쟁강도"]

        성장확률 = s.get("성장확률") or 50.0
        경쟁강도_raw = c.get("경쟁강도") or 0
        경쟁강도_norm = 경쟁강도_raw / max_경쟁강도  # 전국 기준 0~1 정규화
        유동인구 = c.get("총유동인구") or 0
        매출 = c.get("당월매출합") or 0
        점포수 = c.get("점포수") or 0

        매출_점수 = round((매출 / max_매출) * 100, 1)
        유동인구_점수 = round((유동인구 / max_유동) * 100, 1)
        경쟁_점수 = round(max(0.0, 1 - 경쟁강도_norm) * 100, 1)

        composite = round(
            성장확률 * 0.40
            + 매출_점수 * 0.30
            + 유동인구_점수 * 0.15
            + 경쟁_점수 * 0.15,
            1
        )

        results.append({
            "industry": cat,
            "category": cat,
            "score": composite,
            "성장확률": round(성장확률, 1),
            "등급": s.get("등급", "-"),
            "revenue": 매출,
            "stores": 점포수,
            "경쟁강도_norm": round(경쟁강도_norm, 3),
            "업종_포화도": round(c.get("업종_포화도") or 0.5, 3),
            "총유동인구": 유동인구,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    top = results[:5]

    for i, r in enumerate(top):
        r["rank"] = i + 1
        r["reason"] = _make_industry_reason(r, dong)
        r["tags"] = _make_industry_tags(r)
        r["competition"] = (
            "낮음" if r["경쟁강도_norm"] < 0.33 else
            "중간" if r["경쟁강도_norm"] < 0.66 else
            "높음"
        )

    return JsonResponse({"results": top, "dong": dong, "quarter": latest_q})


def recommend_score(request):
    """행정동+업종 적합도 점수 (GET, dong + category 필수)"""
    dong = normalize_dong(request.GET.get("dong", "").strip())
    category = request.GET.get("category", "").strip()
    if not dong or not category:
        return JsonResponse({"error": "dong, category 파라미터가 필요합니다."}, status=400)

    score_obj = ScoreData.objects.filter(행정동명=dong, 통합카테고리=category).first()
    if not score_obj:
        return JsonResponse({"error": "AI 점수 데이터가 없습니다."}, status=404)

    latest_q = (
        CommercialData.objects
        .filter(통합카테고리=category)
        .aggregate(max=Max("기준_년분기_코드"))["max"]
    )
    c = CommercialData.objects.filter(행정동명=dong, 통합카테고리=category, 기준_년분기_코드=latest_q).first()
    if not c:
        return JsonResponse({"error": "상권 데이터가 없습니다."}, status=404)

    # 전국 기준 정규화 최대값
    all_rows = list(
        CommercialData.objects.filter(통합카테고리=category, 기준_년분기_코드=latest_q)
        .values("당월매출합", "총유동인구", "경쟁강도")
    )
    max_매출 = max((r["당월매출합"] or 0) for r in all_rows) or 1
    max_유동 = max((r["총유동인구"] or 0) for r in all_rows) or 1
    max_경쟁 = max((r["경쟁강도"] or 0) for r in all_rows) or 1

    성장확률    = score_obj.성장확률 or 50.0
    매출        = c.당월매출합 or 0
    유동인구    = c.총유동인구 or 0

    # breakdown 개별 점수 (UI 표시용)
    매출_점수     = round((매출 / max_매출) * 100, 1)
    유동인구_점수 = round((유동인구 / max_유동) * 100, 1)
    경쟁강도_norm = (c.경쟁강도 or 0) / max_경쟁
    경쟁강도_점수 = round(max(0.0, 1 - 경쟁강도_norm) * 100, 1)

    composite = round(
        성장확률 * 0.40 + 매출_점수 * 0.30 + 유동인구_점수 * 0.15 + 경쟁강도_점수 * 0.15, 1
    )

    grade = (
        "A" if composite >= 75 else
        "B" if composite >= 55 else
        "C" if composite >= 35 else
        "D"
    )

    pros, cons = _make_score_pros_cons({
        "성장확률": 성장확률,
        "경쟁강도_norm": 경쟁강도_norm,
        "업종_포화도": c.업종_포화도 or 0.5,
        "총유동인구": 유동인구,
        "폐업_률_평균": c.폐업_률_평균,
        "개업_율_평균": c.개업_율_평균,
    })

    summary = _make_score_summary(composite, dong, category, 경쟁강도_norm, 성장확률)

    return JsonResponse({
        "score": composite,
        "grade": grade,
        "summary": summary,
        "breakdown": [
            {"label": "성장 추세",  "score": round(성장확률, 1), "max": 100},
            {"label": "매출 잠재력", "score": 매출_점수,         "max": 100},
            {"label": "유동인구",   "score": 유동인구_점수,      "max": 100},
            {"label": "경쟁 강도",   "score": 경쟁강도_점수,     "max": 100},
        ],
        "pros": pros,
        "cons": cons,
        "dong": dong,
        "category": category,
        "quarter": latest_q,
    })


def _make_industry_reason(r: dict, dong: str) -> str:
    parts = []
    if r["성장확률"] >= 70:
        parts.append(f"AI 성장 확률 {r['성장확률']}%로 높은 성장세가 예상됩니다")
    elif r["성장확률"] >= 55:
        parts.append(f"AI 성장 확률 {r['성장확률']}%로 양호한 성장세입니다")
    if r["업종_포화도"] < 0.2:
        parts.append("업종 포화도가 낮아 신규 진입 여지가 충분합니다")
    elif r["업종_포화도"] < 0.4:
        parts.append("업종 포화도가 적정 수준으로 안정적인 시장입니다")
    if r["총유동인구"] >= 50000:
        parts.append("유동인구가 풍부한 상권입니다")
    elif r["총유동인구"] >= 20000:
        parts.append("적정 수준의 유동인구가 확보된 지역입니다")
    if r["경쟁강도_norm"] < 0.33:
        parts.append("경쟁 강도가 낮아 안정적인 창업 환경입니다")
    return ". ".join(parts) + "." if parts else f"{dong}에서 유망한 업종입니다."


def _make_industry_tags(r: dict) -> list:
    tags = []
    if r["성장확률"] >= 70:
        tags.append("성장 업종")
    if r["경쟁강도_norm"] < 0.33:
        tags.append("경쟁 낮음")
    elif r["경쟁강도_norm"] >= 0.66:
        tags.append("경쟁 높음")
    if r["총유동인구"] >= 50000:
        tags.append("유동인구 多")
    if r["업종_포화도"] < 0.2:
        tags.append("포화도 낮음")
    if r["등급"] in ("A", "B"):
        tags.append(f"AI 등급 {r['등급']}")
    return tags[:4]


def _make_score_summary(composite: float, dong: str, category: str, 경쟁강도: float, 성장확률: float) -> str:
    if composite >= 75:
        base = f"{dong}은 {category} 창업에 매우 적합한 지역입니다."
    elif composite >= 55:
        base = f"{dong}은 {category} 창업 시 평균 이상의 적합도를 보입니다."
    elif composite >= 35:
        base = f"{dong}은 {category} 창업에 보통 수준의 적합도를 보입니다."
    else:
        base = f"{dong}은 {category} 창업 시 신중한 검토가 필요합니다."

    if 경쟁강도 >= 0.66:  # 경쟁강도_norm (0~1)
        base += " 경쟁 강도가 높아 차별화 전략이 중요합니다."
    elif 경쟁강도 < 0.33:
        base += " 경쟁 강도가 낮아 안정적인 운영이 가능합니다."
    if 성장확률 >= 65:
        base += f" AI 성장 확률 {round(성장확률, 1)}%로 업종 전망이 밝습니다."
    return base


def _make_score_pros_cons(r: dict) -> tuple:
    pros, cons = [], []
    if r["성장확률"] >= 65:
        pros.append(f"AI 성장 확률 {round(r['성장확률'], 1)}%로 업종 전망 우수")
    else:
        cons.append(f"AI 성장 확률 {round(r['성장확률'], 1)}%로 성장 가능성 주의 필요")
    if r["경쟁강도_norm"] < 0.33:
        pros.append("경쟁 강도 낮아 안정적 운영 가능")
    elif r["경쟁강도_norm"] >= 0.66:
        cons.append("경쟁 강도 높음 — 차별화 전략 필요")
    if r["업종_포화도"] < 0.3:
        pros.append("업종 포화도 낮아 신규 진입 적기")
    elif r["업종_포화도"] >= 0.6:
        cons.append("업종 포화도 높음 — 틈새 전략 필요")
    if r["총유동인구"] >= 50000:
        pros.append("풍부한 유동인구로 고객 확보 유리")
    elif r["총유동인구"] < 10000:
        cons.append("유동인구 적어 고정 고객 확보 중요")
    # 폐업_률_평균, 개업_율_평균은 이미 % 단위 (예: 5.0 = 5%)
    if r.get("폐업_률_평균") and r["폐업_률_평균"] >= 20:
        cons.append(f"폐업률 {round(r['폐업_률_평균'], 1)}%로 주의 필요")
    elif r.get("개업_율_평균") and r["개업_율_평균"] >= 15:
        pros.append(f"개업률 {round(r['개업_율_평균'], 1)}%로 활발한 창업 시장")
    return pros[:3], cons[:3]


def _make_reason(r: dict, 소분류: str) -> str:
    parts = []
    if r["소분류_점포수"] == 0:
        parts.append(f"현재 {소분류} 점포가 없는 블루오션 지역입니다")
    elif r["소분류_점포수"] <= 2:
        parts.append(f"{소분류} 경쟁 점포가 {r['소분류_점포수']}개로 매우 적습니다")
    else:
        parts.append(f"{소분류} 관련 점포가 {r['소분류_점포수']}개 영업 중입니다")

    if r["성장확률"] >= 70:
        parts.append(f"업종 성장 확률이 {r['성장확률']}%로 높습니다")
    elif r["성장확률"] >= 55:
        parts.append(f"업종 성장 확률이 {r['성장확률']}%로 양호합니다")

    if r["총유동인구"] >= 50000:
        parts.append("유동인구가 풍부한 상권입니다")
    elif r["총유동인구"] >= 20000:
        parts.append("적정 수준의 유동인구가 확보된 지역입니다")

    if r["업종_포화도"] < 0.2:
        parts.append("업종 포화도가 낮아 진입 여지가 충분합니다")

    return ". ".join(parts) + "."


def _make_tags(r: dict) -> list:
    tags = []
    if r["소분류_점포수"] == 0:
        tags.append("블루오션")
    elif r["경쟁강도"] < 0.33:
        tags.append("경쟁 낮음")
    elif r["경쟁강도"] >= 0.66:
        tags.append("경쟁 높음")

    if r["성장확률"] >= 70:
        tags.append("성장 업종")

    if r["총유동인구"] >= 50000:
        tags.append("유동인구 多")

    if r["업종_포화도"] < 0.2:
        tags.append("포화도 낮음")

    if r["등급"] in ("A", "B"):
        tags.append(f"AI 등급 {r['등급']}")

    return tags[:4]


def recommend_spot(request):
    """행정동 + 업종 → 행정동 내 추천 위치 반환 (GET)
    params: dong (행정동명), category (통합카테고리)
    """
    dong     = normalize_dong(request.GET.get("dong", "").strip())
    category = request.GET.get("category", "").strip()
    if not dong or not category:
        return JsonResponse({"error": "dong, category 파라미터가 필요합니다."}, status=400)

    df = _get_location_df()
    if df.empty:
        return JsonResponse({"error": "위치 점수 데이터가 없습니다. build_location_scores.py를 먼저 실행하세요."}, status=503)

    filtered = df[(df["행정동명"] == dong) & (df["통합카테고리"] == category)]
    if filtered.empty:
        return JsonResponse({"error": f'"{dong}"의 "{category}" 위치 데이터가 없습니다.'}, status=404)

    top = filtered.nlargest(5, "입지점수").copy()

    results = []
    for rank, (_, row) in enumerate(top.iterrows(), 1):
        생존율  = row["생존율"]
        경쟁밀도 = int(row["경쟁밀도"])
        보완밀도 = int(row["보완밀도"])
        활성도  = int(row["상권활성도"])
        점수    = row["입지점수"]

        # 추천 근거 생성
        reasons = []
        if 생존율 >= 60:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 높은 편")
        elif 생존율 >= 40:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 평균 수준")
        else:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 낮은 편")

        if 경쟁밀도 <= 2:
            reasons.append("반경 300m 내 동업종 경쟁 적음")
        elif 경쟁밀도 <= 5:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개")
        else:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개로 경쟁 많음")

        if 보완밀도 >= 10:
            reasons.append(f"시너지 업종 {보완밀도}개로 집객 유리")
        elif 보완밀도 >= 5:
            reasons.append(f"시너지 업종 {보완밀도}개 인근")

        results.append({
            "rank":       rank,
            "lat":        round(row["grid_lat"], 4),
            "lng":        round(row["grid_lng"], 4),
            "score":      점수,
            "생존율":     round(생존율, 1),
            "경쟁밀도":   경쟁밀도,
            "보완밀도":   보완밀도,
            "상권활성도": 활성도,
            "reasons":    reasons,
        })

    return JsonResponse({
        "dong":     dong,
        "category": category,
        "results":  results,
    })


def rental_regions(request):
    """
    GET /api/rental/regions/
    구별 임대료 데이터 전체 반환 (프론트 캐시용)
    """
    return JsonResponse(_get_gu_rental())


def rental_calculate(request):
    """
    GET /api/rental/calculate/?dong=역삼1동&dong_code=11710670&floor=1층
    행정동코드 → 구명 → 구 평균 임대료 반환
    """
    dong      = request.GET.get("dong", "").strip()
    dong_code = request.GET.get("dong_code", "").strip()
    floor     = request.GET.get("floor", "1층").strip()

    # 행정동코드 앞 5자리로 구명 조회
    gu명 = None
    if dong_code:
        gu명 = _GU_CODE_MAP.get(str(dong_code)[:5])

    if not gu명:
        return JsonResponse({"error": f"'{dong}'의 구 정보를 찾을 수 없습니다."}, status=404)

    data = _get_gu_rental()
    gu_data = data.get(gu명)
    if not gu_data:
        return JsonResponse({"error": f"'{gu명}' 임대료 데이터가 없습니다."}, status=404)

    floor_data = gu_data.get(floor)
    if not floor_data:
        available = list(gu_data.keys())
        return JsonResponse({"error": f"'{floor}' 데이터 없음", "가능한_층": available}, status=400)

    return JsonResponse({
        "행정동": dong,
        "구":     gu명,
        "층":     floor,
        "임대료_만원per㎡": floor_data.get("임대료_만원per㎡"),
        "효용비율_%":       floor_data.get("효용비율_%"),
        "1층_임대료_만원per㎡": gu_data.get("1층", {}).get("임대료_만원per㎡"),
    })


def recommend_gu_streets(request):
    """구 + 업종 입력 → 해당 구 내 길단위 상권 추천 Top 5 (GET, gu + category 필수)"""
    gu = request.GET.get("gu", "").strip()
    category = request.GET.get("category", "").strip()
    if not gu or not category:
        return JsonResponse({"error": "gu, category 파라미터가 필요합니다."}, status=400)

    # 해당 구에 속한 상권코드 목록
    gu_street_map = _get_gu_street_map()
    gu_codes = gu_street_map.get(gu, [])
    if not gu_codes:
        return JsonResponse({"error": f"'{gu}'에 해당하는 길단위 상권 데이터가 없습니다."}, status=404)

    # StreetScoreData: 해당 구 내 상권 × 업종 AI 점수
    score_rows = list(
        StreetScoreData.objects.filter(상권_코드__in=gu_codes, 통합카테고리=category)
        .values("상권_코드", "상권_코드_명", "통합카테고리", "성장확률", "등급", "상위_퍼센트")
    )
    if not score_rows:
        return JsonResponse({"error": f"'{gu}' 내 '{category}' AI 점수 데이터가 없습니다."}, status=404)

    score_map = {r["상권_코드"]: r for r in score_rows}
    candidate_codes = list(score_map.keys())

    # StreetCommercialData: 매출·유동·소득 지표
    commercial_map = {
        row["상권_코드"]: row
        for row in StreetCommercialData.objects.filter(
            상권_코드__in=candidate_codes, 통합카테고리=category
        ).values("상권_코드", "당월_매출_금액", "총_유동인구_수", "월_평균_소득_금액", "매출_증감률")
    }

    # 교집합 상권만 사용
    valid_codes = [c for c in candidate_codes if c in commercial_map]
    if not valid_codes:
        return JsonResponse({"error": "추천할 수 있는 상권 데이터가 없습니다."}, status=404)

    # 전국 기준 정규화 최대값
    all_rows = list(
        StreetCommercialData.objects.filter(통합카테고리=category)
        .values("당월_매출_금액", "총_유동인구_수", "월_평균_소득_금액")
    )
    max_매출 = max((r["당월_매출_금액"] or 0) for r in all_rows) or 1
    max_유동  = max((r["총_유동인구_수"] or 0) for r in all_rows) or 1
    max_소득  = max((r["월_평균_소득_금액"] or 0) for r in all_rows) or 1

    results = []
    for code in valid_codes:
        s = score_map[code]
        c = commercial_map[code]

        성장확률 = s.get("성장확률") or 50.0
        매출 = c.get("당월_매출_금액") or 0
        유동인구 = c.get("총_유동인구_수") or 0
        소득 = c.get("월_평균_소득_금액") or 0
        매출_증감률 = c.get("매출_증감률") or 0

        매출_점수 = (매출 / max_매출) * 100
        유동인구_점수 = (유동인구 / max_유동) * 100
        소득_점수 = (소득 / max_소득) * 100

        composite = round(
            성장확률 * 0.40
            + 매출_점수 * 0.30
            + 유동인구_점수 * 0.15
            + 소득_점수 * 0.15,
            1
        )

        tags = []
        if 성장확률 >= 70:
            tags.append("성장 업종")
        if 매출_증감률 > 0.05:
            tags.append("매출 상승세")
        if 유동인구 >= 50000:
            tags.append("유동인구 多")
        if 소득 >= 5000000:
            tags.append("고소득 상권")
        if s.get("등급") in ("A", "B"):
            tags.append(f"AI {s['등급']}등급")

        results.append({
            "상권코드": code,
            "상권명": s["상권_코드_명"],
            "score": composite,
            "성장확률": round(성장확률, 1),
            "등급": s.get("등급", "-"),
            "revenue": 매출,
            "총유동인구": 유동인구,
            "월_평균_소득": round(소득),
            "매출_증감률": round(매출_증감률, 3),
            "tags": tags[:4],
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    top = results[:5]
    for i, r in enumerate(top):
        r["rank"] = i + 1

    return JsonResponse({"results": top, "gu": gu, "category": category})


def recommend_street_industry(request):
    """상권코드 입력 → 유망 업종 추천 Top 5 (GET, 상권코드 필수)"""
    상권코드_param = request.GET.get("상권코드", "").strip()
    if not 상권코드_param:
        return JsonResponse({"error": "상권코드 파라미터가 필요합니다."}, status=400)

    try:
        상권코드 = int(상권코드_param)
    except ValueError:
        return JsonResponse({"error": "상권코드는 숫자여야 합니다."}, status=400)

    # StreetScoreData: 해당 상권의 모든 업종 AI 성장확률
    score_map = {
        row["통합카테고리"]: row
        for row in StreetScoreData.objects.filter(상권_코드=상권코드).values(
            "통합카테고리", "성장확률", "등급", "상위_퍼센트"
        )
    }
    if not score_map:
        return JsonResponse({"error": "해당 상권의 AI 점수 데이터가 없습니다."}, status=404)

    상권_코드_명 = (
        StreetScoreData.objects.filter(상권_코드=상권코드)
        .values_list("상권_코드_명", flat=True).first() or str(상권코드)
    )

    # StreetCommercialData: 해당 상권 전 업종 지표
    commercial_map = {
        row["통합카테고리"]: row
        for row in StreetCommercialData.objects.filter(상권_코드=상권코드).values(
            "통합카테고리", "당월_매출_금액", "총_유동인구_수",
            "매출_증감률", "월_평균_소득_금액",
        )
    }

    categories = set(score_map.keys()) & set(commercial_map.keys())
    if not categories:
        return JsonResponse({"error": "추천할 수 있는 업종 데이터가 없습니다."}, status=404)

    # 전체 상권 기준 정규화 최대값
    global_max_cache = {}
    for cat in categories:
        all_rows = list(
            StreetCommercialData.objects.filter(통합카테고리=cat)
            .values("당월_매출_금액", "총_유동인구_수", "월_평균_소득_금액")
        )
        global_max_cache[cat] = {
            "max_매출": max((r["당월_매출_금액"] or 0) for r in all_rows) or 1,
            "max_유동": max((r["총_유동인구_수"] or 0) for r in all_rows) or 1,
            "max_소득": max((r["월_평균_소득_금액"] or 0) for r in all_rows) or 1,
        }

    results = []
    for cat in categories:
        c = commercial_map[cat]
        s = score_map[cat]
        m = global_max_cache[cat]

        성장확률 = s.get("성장확률") or 50.0
        매출 = c.get("당월_매출_금액") or 0
        유동인구 = c.get("총_유동인구_수") or 0
        소득 = c.get("월_평균_소득_금액") or 0
        매출_증감률 = c.get("매출_증감률") or 0

        매출_점수 = round((매출 / m["max_매출"]) * 100, 1)
        유동인구_점수 = round((유동인구 / m["max_유동"]) * 100, 1)
        소득_점수 = round((소득 / m["max_소득"]) * 100, 1)

        composite = round(
            성장확률 * 0.40
            + 매출_점수 * 0.30
            + 유동인구_점수 * 0.15
            + 소득_점수 * 0.15,
            1
        )

        tags = []
        if 성장확률 >= 70:
            tags.append("성장 업종")
        if 매출_증감률 > 0.05:
            tags.append("매출 상승세")
        if 유동인구 >= 50000:
            tags.append("유동인구 多")
        if 소득 >= 5000000:
            tags.append("고소득 상권")
        if s.get("등급") in ("A", "B"):
            tags.append(f"AI 등급 {s['등급']}")

        results.append({
            "industry": cat,
            "category": cat,
            "score": composite,
            "성장확률": round(성장확률, 1),
            "등급": s.get("등급", "-"),
            "revenue": 매출,
            "총유동인구": 유동인구,
            "월_평균_소득": round(소득),
            "매출_증감률": round(매출_증감률, 3),
            "tags": tags[:4],
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    top = results[:5]
    for i, r in enumerate(top):
        r["rank"] = i + 1

    return JsonResponse({"results": top, "상권코드": 상권코드, "상권명": 상권_코드_명})


def recommend_street_score(request):
    """상권코드 + 업종 → 적합도 점수 (GET, 상권코드 + category 필수)"""
    상권코드_param = request.GET.get("상권코드", "").strip()
    category = request.GET.get("category", "").strip()
    if not 상권코드_param or not category:
        return JsonResponse({"error": "상권코드, category 파라미터가 필요합니다."}, status=400)

    try:
        상권코드 = int(상권코드_param)
    except ValueError:
        return JsonResponse({"error": "상권코드는 숫자여야 합니다."}, status=400)

    score_obj = StreetScoreData.objects.filter(상권_코드=상권코드, 통합카테고리=category).first()
    if not score_obj:
        return JsonResponse({"error": "AI 점수 데이터가 없습니다."}, status=404)

    c = StreetCommercialData.objects.filter(상권_코드=상권코드, 통합카테고리=category).first()
    if not c:
        return JsonResponse({"error": "상권 데이터가 없습니다."}, status=404)

    # 전체 상권 기준 정규화
    all_rows = list(
        StreetCommercialData.objects.filter(통합카테고리=category)
        .values("당월_매출_금액", "총_유동인구_수", "월_평균_소득_금액")
    )
    max_매출 = max((r["당월_매출_금액"] or 0) for r in all_rows) or 1
    max_유동 = max((r["총_유동인구_수"] or 0) for r in all_rows) or 1
    max_소득 = max((r["월_평균_소득_금액"] or 0) for r in all_rows) or 1

    성장확률 = score_obj.성장확률 or 50.0
    매출_점수 = round(((c.당월_매출_금액 or 0) / max_매출) * 100, 1)
    유동인구_점수 = round(((c.총_유동인구_수 or 0) / max_유동) * 100, 1)
    소득_점수 = round(((c.월_평균_소득_금액 or 0) / max_소득) * 100, 1)

    composite = round(
        성장확률 * 0.40
        + 매출_점수 * 0.30
        + 유동인구_점수 * 0.15
        + 소득_점수 * 0.15,
        1
    )

    grade = (
        "A" if composite >= 75 else
        "B" if composite >= 55 else
        "C" if composite >= 35 else
        "D"
    )

    # 장점/단점 생성
    pros, cons = [], []
    if 성장확률 >= 65:
        pros.append(f"AI 성장 확률 {round(성장확률, 1)}%로 업종 전망 우수")
    else:
        cons.append(f"AI 성장 확률 {round(성장확률, 1)}%로 성장 가능성 주의 필요")
    if (c.매출_증감률 or 0) > 0.05:
        pros.append(f"매출 증감률 {round((c.매출_증감률 or 0)*100, 1)}%로 상승세")
    elif (c.매출_증감률 or 0) < -0.05:
        cons.append(f"매출 증감률 {round((c.매출_증감률 or 0)*100, 1)}%로 하락세 주의")
    if (c.총_유동인구_수 or 0) >= 50000:
        pros.append("풍부한 유동인구로 고객 확보 유리")
    elif (c.총_유동인구_수 or 0) < 10000:
        cons.append("유동인구 적어 고정 고객 확보 중요")
    if (c.월_평균_소득_금액 or 0) >= 5000000:
        pros.append("고소득 상권으로 객단가 높은 업종에 유리")

    if composite >= 75:
        summary = f"{score_obj.상권_코드_명}은 {category} 창업에 매우 적합한 상권입니다."
    elif composite >= 55:
        summary = f"{score_obj.상권_코드_명}은 {category} 창업 시 평균 이상의 적합도를 보입니다."
    elif composite >= 35:
        summary = f"{score_obj.상권_코드_명}은 {category} 창업에 보통 수준의 적합도를 보입니다."
    else:
        summary = f"{score_obj.상권_코드_명}은 {category} 창업 시 신중한 검토가 필요합니다."

    return JsonResponse({
        "score": composite,
        "grade": grade,
        "summary": summary,
        "breakdown": [
            {"label": "성장 추세", "score": 성장확률, "max": 100},
            {"label": "매출 잠재력", "score": 매출_점수, "max": 100},
            {"label": "유동인구", "score": 유동인구_점수, "max": 100},
            {"label": "소득 수준", "score": 소득_점수, "max": 100},
        ],
        "pros": pros[:3],
        "cons": cons[:3],
        "상권코드": 상권코드,
        "상권명": score_obj.상권_코드_명,
        "category": category,
        "기준_년분기_코드": score_obj.기준_년분기_코드,
    })


def recommend_street_spot(request):
    """상권코드 + 업종 → 상권 경계 내 추천 위치 Top 5 (GET)
    params: 상권코드, category
    """
    상권코드_param = request.GET.get("상권코드", "").strip()
    category = request.GET.get("category", "").strip()
    if not 상권코드_param or not category:
        return JsonResponse({"error": "상권코드, category 파라미터가 필요합니다."}, status=400)

    try:
        상권코드 = int(상권코드_param)
    except ValueError:
        return JsonResponse({"error": "상권코드는 숫자여야 합니다."}, status=400)

    # 1) GeoJSON에서 해당 상권 폴리곤 조회
    geojson = _get_street_geojson()
    if not geojson:
        return JsonResponse({"error": "상권 경계 데이터를 불러올 수 없습니다."}, status=503)

    polygon = None
    상권명 = ""
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        if int(props.get("상권_코드", -1)) == 상권코드:
            polygon = shapely_shape(feature["geometry"])
            상권명 = props.get("상권_코드_명", "")
            break

    if polygon is None:
        return JsonResponse({"error": f"상권코드 {상권코드}의 경계 데이터가 없습니다."}, status=404)

    # 2) location_scores 로드
    df = _get_location_df()
    if df.empty:
        return JsonResponse({"error": "위치 점수 데이터가 없습니다. build_location_scores.py를 먼저 실행하세요."}, status=503)

    # 3) 업종 필터
    filtered = df[df["통합카테고리"] == category]
    if filtered.empty:
        return JsonResponse({"error": f'"{category}" 위치 데이터가 없습니다.'}, status=404)

    # 4) Point-in-polygon 필터
    mask = filtered.apply(
        lambda row: polygon.contains(Point(row["grid_lng"], row["grid_lat"])),
        axis=1,
    )
    inside = filtered[mask]

    if inside.empty:
        return JsonResponse({"error": f"상권 경계 내 '{category}' 위치 데이터가 없습니다. 인근 행정동 데이터를 이용해주세요."}, status=404)

    top = inside.nlargest(5, "입지점수").copy()

    results = []
    for rank, (_, row) in enumerate(top.iterrows(), 1):
        생존율  = row["생존율"]
        경쟁밀도 = int(row["경쟁밀도"])
        보완밀도 = int(row["보완밀도"])
        활성도  = int(row["상권활성도"])
        점수    = row["입지점수"]

        reasons = []
        if 생존율 >= 60:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 높은 편")
        elif 생존율 >= 40:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 평균 수준")
        else:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 낮은 편")

        if 경쟁밀도 <= 2:
            reasons.append("반경 300m 내 동업종 경쟁 적음")
        elif 경쟁밀도 <= 5:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개")
        else:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개로 경쟁 많음")

        if 보완밀도 >= 10:
            reasons.append(f"시너지 업종 {보완밀도}개로 집객 유리")
        elif 보완밀도 >= 5:
            reasons.append(f"시너지 업종 {보완밀도}개 인근")

        results.append({
            "rank":       rank,
            "lat":        round(row["grid_lat"], 4),
            "lng":        round(row["grid_lng"], 4),
            "score":      점수,
            "생존율":     round(생존율, 1),
            "경쟁밀도":   경쟁밀도,
            "보완밀도":   보완밀도,
            "상권활성도": 활성도,
            "reasons":    reasons,
        })

    return JsonResponse({
        "상권코드": 상권코드,
        "상권명": 상권명,
        "category": category,
        "results": results,
    })


@csrf_exempt
def recommend_custom_spot(request):
    """사용자가 직접 그린 폴리곤 + 업종 → 영역 내 추천 위치 Top 5 (POST)
    body: { "coordinates": [[lat, lng], ...], "category": "카페" }
    """
    if request.method != "POST":
        return JsonResponse({"error": "POST 요청만 허용됩니다."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON 파싱 오류입니다."}, status=400)

    coordinates = body.get("coordinates", [])
    category = body.get("category", "").strip()

    if not category:
        return JsonResponse({"error": "category가 필요합니다."}, status=400)
    if len(coordinates) < 3:
        return JsonResponse({"error": "폴리곤은 최소 3개의 꼭짓점이 필요합니다."}, status=400)

    # 1) 전송받은 좌표로 폴리곤 생성 (coordinates: [[lat, lng], ...])
    try:
        from shapely.geometry import Polygon as ShapelyPolygon
        # shapely는 (lng, lat) 순서
        polygon = ShapelyPolygon([(lng, lat) for lat, lng in coordinates])
    except Exception:
        return JsonResponse({"error": "유효하지 않은 폴리곤 좌표입니다."}, status=400)

    if not polygon.is_valid or polygon.area == 0:
        return JsonResponse({"error": "유효하지 않은 폴리곤입니다."}, status=400)

    # 최소 면적 검증 (0.001도 ≈ 100m → 0.001*0.001 = 0.000001 제곱도)
    # 대략 300m x 300m 이상 권장 → 0.003 * 0.003 = 0.000009
    MIN_AREA = 0.000004  # 약 200m x 200m
    if polygon.area < MIN_AREA:
        return JsonResponse({"error": "선택 영역이 너무 작습니다. 더 넓게 그려주세요."}, status=400)

    # 2) location_scores 로드
    df = _get_location_df()
    if df.empty:
        return JsonResponse({"error": "위치 점수 데이터가 없습니다. build_location_scores.py를 먼저 실행하세요."}, status=503)

    # 3) 업종 필터
    filtered = df[df["통합카테고리"] == category]
    if filtered.empty:
        return JsonResponse({"error": f'"{category}" 위치 데이터가 없습니다.'}, status=404)

    # 4) Point-in-polygon 필터
    mask = filtered.apply(
        lambda row: polygon.contains(Point(row["grid_lng"], row["grid_lat"])),
        axis=1,
    )
    inside = filtered[mask]

    if inside.empty:
        return JsonResponse({"error": f"선택 영역 내 '{category}' 위치 데이터가 없습니다. 영역을 더 넓게 그려주세요."}, status=404)

    top = inside.nlargest(5, "입지점수").copy()

    results = []
    for rank, (_, row) in enumerate(top.iterrows(), 1):
        생존율  = row["생존율"]
        경쟁밀도 = int(row["경쟁밀도"])
        보완밀도 = int(row["보완밀도"])
        활성도  = int(row["상권활성도"])
        점수    = row["입지점수"]

        reasons = []
        if 생존율 >= 60:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 높은 편")
        elif 생존율 >= 40:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 평균 수준")
        else:
            reasons.append(f"2년 생존율 {생존율:.0f}%로 낮은 편")

        if 경쟁밀도 <= 2:
            reasons.append("반경 300m 내 동업종 경쟁 적음")
        elif 경쟁밀도 <= 5:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개")
        else:
            reasons.append(f"반경 300m 내 동업종 {경쟁밀도}개로 경쟁 많음")

        if 보완밀도 >= 10:
            reasons.append(f"시너지 업종 {보완밀도}개로 집객 유리")
        elif 보완밀도 >= 5:
            reasons.append(f"시너지 업종 {보완밀도}개 인근")

        results.append({
            "rank":       rank,
            "lat":        round(row["grid_lat"], 4),
            "lng":        round(row["grid_lng"], 4),
            "score":      점수,
            "생존율":     round(생존율, 1),
            "경쟁밀도":   경쟁밀도,
            "보완밀도":   보완밀도,
            "상권활성도": 활성도,
            "reasons":    reasons,
        })

    return JsonResponse({
        "category": category,
        "results": results,
    })


@csrf_exempt
def trend_categories(request):
    """업종별 트렌드 - 전체 서울 업종별 매출 합산 및 전 분기 대비 증감률"""
    quarters = list(
        CommercialData.objects
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")[:2]
    )
    if len(quarters) < 2:
        return JsonResponse({"results": []})

    latest_q, prev_q = quarters[0], quarters[1]

    latest = {
        r["통합카테고리"]: r
        for r in CommercialData.objects
        .filter(기준_년분기_코드=latest_q)
        .values("통합카테고리")
        .annotate(매출=Sum("당월매출합"), 점포=Sum("점포수"))
    }
    prev = {
        r["통합카테고리"]: r
        for r in CommercialData.objects
        .filter(기준_년분기_코드=prev_q)
        .values("통합카테고리")
        .annotate(매출=Sum("당월매출합"), 점포=Sum("점포수"))
    }

    results = []
    for cat, data in latest.items():
        prev_data = prev.get(cat, {})
        curr_매출 = data["매출"] or 0
        prev_매출 = prev_data.get("매출") or 0
        매출_증감 = round((curr_매출 - prev_매출) / prev_매출 * 100, 1) if prev_매출 else 0
        results.append({
            "통합카테고리": cat,
            "매출": curr_매출,
            "매출_증감률": 매출_증감,
        })

    results.sort(key=lambda x: x["매출"], reverse=True)
    return JsonResponse({"latest_quarter": latest_q, "prev_quarter": prev_q, "results": results})


@csrf_exempt
def trend_gu_industries(request):
    """구별 인기 업종 - 해당 구의 행정동 리스트를 받아 업종 순위 반환"""
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON 파싱 오류"}, status=400)

    gu = body.get("gu", "")
    dongs = [normalize_dong(d) for d in body.get("dongs", [])]

    if not dongs:
        return JsonResponse({"results": []})

    quarters = list(
        CommercialData.objects
        .filter(행정동명__in=dongs)
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")[:2]
    )
    if not quarters:
        return JsonResponse({"gu": gu, "results": []})

    latest_q = quarters[0]
    prev_q = quarters[1] if len(quarters) > 1 else None

    latest = list(
        CommercialData.objects
        .filter(행정동명__in=dongs, 기준_년분기_코드=latest_q)
        .values("통합카테고리")
        .annotate(매출=Sum("당월매출합"), 점포=Sum("점포수"))
        .order_by("-매출")
    )

    prev = {}
    if prev_q:
        for r in (
            CommercialData.objects
            .filter(행정동명__in=dongs, 기준_년분기_코드=prev_q)
            .values("통합카테고리")
            .annotate(매출=Sum("당월매출합"), 점포=Sum("점포수"))
        ):
            prev[r["통합카테고리"]] = r

    # 카테고리별 최고 행정동
    best_dong = {}
    for r in (
        CommercialData.objects
        .filter(행정동명__in=dongs, 기준_년분기_코드=latest_q)
        .values("통합카테고리", "행정동명")
        .annotate(매출=Sum("당월매출합"))
        .order_by("통합카테고리", "-매출")
    ):
        if r["통합카테고리"] not in best_dong:
            best_dong[r["통합카테고리"]] = r["행정동명"]

    results = []
    for i, item in enumerate(latest, 1):
        cat = item["통합카테고리"]
        p = prev.get(cat, {})
        curr_매출 = item["매출"] or 0
        prev_매출 = p.get("매출") or 0
        curr_점포 = item["점포"] or 0
        prev_점포 = p.get("점포") or 0
        매출_증감 = round((curr_매출 - prev_매출) / prev_매출 * 100, 1) if prev_매출 else 0
        점포_증감 = round((curr_점포 - prev_점포) / prev_점포 * 100, 1) if prev_점포 else 0
        results.append({
            "순위": i,
            "통합카테고리": cat,
            "최고_행정동": best_dong.get(cat, ""),
            "매출": curr_매출,
            "매출_증감률": 매출_증감,
            "점포수": curr_점포,
            "점포_증감률": 점포_증감,
        })

    return JsonResponse({"gu": gu, "quarter": latest_q, "results": results})


@csrf_exempt
def trend_mz_industries(request):
    """MZ 인기 업종 - 20대 매출 비율이 높은 업종 순위"""
    latest_q = (
        CommercialData.objects
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")
        .first()
    )
    if not latest_q:
        return JsonResponse({"results": []})

    from django.db.models import Avg
    rows = list(
        CommercialData.objects
        .filter(기준_년분기_코드=latest_q)
        .values("통합카테고리")
        .annotate(
            매출_20대합=Sum("매출_20대합"),
            총매출=Sum("당월매출합"),
            avg_20대비율=Avg("매출_20대비율"),
            avg_mz_차이=Avg("MZ_차이"),
        )
        .order_by("-avg_20대비율")
    )

    results = []
    for i, r in enumerate(rows, 1):
        총매출 = r["총매출"] or 0
        매출_20대 = r["매출_20대합"] or 0
        비율 = round(매출_20대 / 총매출 * 100, 1) if 총매출 else 0
        results.append({
            "순위": i,
            "통합카테고리": r["통합카테고리"],
            "20대_매출비율": 비율,
            "20대_매출": 매출_20대,
            "MZ_지수": round(r["avg_mz_차이"] or 0, 2),
        })

    return JsonResponse({"quarter": latest_q, "results": results})


@csrf_exempt
def trend_worker_industries(request):
    """직장인 인기 업종 - 주중 매출 비율이 높은 업종 순위"""
    from django.db.models import Avg
    latest_q = (
        CommercialData.objects
        .values_list("기준_년분기_코드", flat=True)
        .distinct()
        .order_by("-기준_년분기_코드")
        .first()
    )
    if not latest_q:
        return JsonResponse({"results": []})

    rows = list(
        CommercialData.objects
        .filter(기준_년분기_코드=latest_q)
        .exclude(주중매출합__isnull=True)
        .values("통합카테고리")
        .annotate(
            총매출=Sum("당월매출합"),
            주중매출=Sum("주중매출합"),
            avg_주말비율=Avg("매출_주말비율"),
        )
        .order_by("-총매출")  # 전체 매출 기준 정렬
    )

    results = []
    for i, r in enumerate(rows, 1):
        총매출 = r["총매출"] or 0
        주중매출 = r["주중매출"] or 0
        주중비율 = round(주중매출 / 총매출 * 100, 1) if 총매출 else 0
        주말비율 = round((r["avg_주말비율"] or 0) * 100, 1)
        results.append({
            "순위": i,
            "통합카테고리": r["통합카테고리"],
            "주중_매출비율": 주중비율,
            "주말_매출비율": 주말비율,
            "직장인_지수": round(1 - (r["avg_주말비율"] or 0), 4),
        })

    return JsonResponse({"quarter": latest_q, "results": results})


def report(request):
    dong = normalize_dong(request.GET.get("dong", ""))
    category = request.GET.get("category", "")

    if not dong:
        return JsonResponse({"error": "dong 파라미터가 필요합니다."}, status=400)

    target = (
        CommercialData.objects
        .filter(행정동명=dong)
        .order_by("-기준_년분기_코드")
        .values_list("기준_년분기_코드", flat=True)
        .first()
    )
    if not target:
        return JsonResponse({"error": "데이터 없음"}, status=404)

    총매출 = (
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=target)
        .values_list("행정동_전체매출", flat=True)
        .first() or 0
    )

    dong_revenues = (
        CommercialData.objects
        .filter(기준_년분기_코드=target)
        .values("행정동명")
        .annotate(총매출=Max("행정동_전체매출"))
    )
    전체동수 = dong_revenues.count()
    순위 = dong_revenues.filter(총매출__gt=총매출).count() + 1

    first_row = CommercialData.objects.filter(행정동명=dong, 기준_년분기_코드=target).first()
    총유동인구 = int(first_row.총유동인구) if first_row and first_row.총유동인구 else 0
    주거인구 = int(first_row.주거인구) if first_row and first_row.주거인구 else 0
    직장인구 = int(first_row.총_직장_인구_수) if first_row and first_row.총_직장_인구_수 else 0

    industries = list(
        CommercialData.objects
        .filter(행정동명=dong, 기준_년분기_코드=target)
        .values("통합카테고리", "당월매출합", "점포수")
        .order_by("-당월매출합")[:5]
    )

    agg = CommercialData.objects.filter(행정동명=dong, 기준_년분기_코드=target).aggregate(
        남성매출=Sum("남성매출합"),
        여성매출=Sum("여성매출합"),
        주중매출=Sum("주중매출합"),
        주말매출=Sum("주말매출합"),
        t00_06=Sum("시간대_00_06_매출"),
        t06_11=Sum("시간대_06_11_매출"),
        t11_14=Sum("시간대_11_14_매출"),
        t14_17=Sum("시간대_14_17_매출"),
        t17_21=Sum("시간대_17_21_매출"),
        t21_24=Sum("시간대_21_24_매출"),
    )

    성별합 = (agg["남성매출"] or 0) + (agg["여성매출"] or 0)
    남성비율 = round((agg["남성매출"] or 0) / 성별합 * 100, 1) if 성별합 > 0 else 50
    주중주말합 = (agg["주중매출"] or 0) + (agg["주말매출"] or 0)
    주중비율 = round((agg["주중매출"] or 0) / 주중주말합 * 100, 1) if 주중주말합 > 0 else 70

    data = {
        "dong": dong,
        "총매출": 총매출,
        "순위": 순위,
        "전체동수": 전체동수,
        "총유동인구": 총유동인구,
        "주거인구": 주거인구,
        "직장인구": 직장인구,
        "top_업종": [{"업종": r["통합카테고리"], "매출": r["당월매출합"], "점포수": r["점포수"]} for r in industries],
        "성별": {"남성비율": 남성비율, "여성비율": round(100 - 남성비율, 1)},
        "주중주말": {"주중비율": 주중비율, "주말비율": round(100 - 주중비율, 1)},
        "시간대": {
            "새벽(0~6시)": agg["t00_06"] or 0,
            "오전(6~11시)": agg["t06_11"] or 0,
            "점심(11~14시)": agg["t11_14"] or 0,
            "오후(14~17시)": agg["t14_17"] or 0,
            "저녁(17~21시)": agg["t17_21"] or 0,
            "심야(21~24시)": agg["t21_24"] or 0,
        },
    }

    if category:
        cat_row = CommercialData.objects.filter(행정동명=dong, 기준_년분기_코드=target, 통합카테고리=category).first()
        score_row = ScoreData.objects.filter(행정동명=dong, 기준_년분기_코드=target, 통합카테고리=category).first()
        if cat_row:
            점포수 = cat_row.점포수 or 0
            프랜차이즈 = cat_row.프랜차이즈_점포수 or 0
            data["category_data"] = {
                "category": category,
                "점포당매출": int(cat_row.업종_점포당매출) if cat_row.업종_점포당매출 else 0,
                "프랜차이즈비율": round(프랜차이즈 / 점포수 * 100, 1) if 점포수 > 0 else 0,
                "점포수": 점포수,
                "개업률": float(cat_row.개업_율_평균) if cat_row.개업_율_평균 else 0,
                "폐업률": float(cat_row.폐업_률_평균) if cat_row.폐업_률_평균 else 0,
                "경쟁강도": float(cat_row.경쟁강도) if cat_row.경쟁강도 else 0,
                "업종포화도": round(float(cat_row.업종_포화도 or 0), 4),
                "20대매출비율": round(float(cat_row.매출_20대비율 or 0) * 100, 1),
                "성장확률": float(score_row.성장확률) if score_row else None,
                "AI등급": score_row.등급 if score_row else None,
                "업종내순위": score_row.업종내_순위 if score_row else None,
                "업종내전체동수": score_row.업종내_전체동수 if score_row else None,
            }

    ai_descriptions = {}
    try:
        import requests as http_requests
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if api_key:
            has_category = bool(category and data.get("category_data"))
            if has_category:
                required_keys = ["상권_개요", "인기_업종", "유동인구_분석", "소비_패턴", "비용_수익", "기타_통계"]
                prompt = (
                    "다음 서울 행정동 상권 데이터를 분석해서 아래 JSON 형식으로만 반환해줘. "
                    "반드시 6개 키를 모두 포함하고, 각 항목마다 2~3문장으로 설명해줘. "
                    "다른 텍스트나 코드 블록 없이 JSON만 반환해.\n\n"
                    f"데이터: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"
                    '형식: {"상권_개요":"...","인기_업종":"...","유동인구_분석":"...","소비_패턴":"...","비용_수익":"...","기타_통계":"..."}'
                )
            else:
                required_keys = ["상권_개요", "인기_업종", "유동인구_분석"]
                prompt = (
                    "다음 서울 행정동 상권 데이터를 분석해서 아래 JSON 형식으로만 반환해줘. "
                    "반드시 3개 키를 모두 포함하고, 각 항목마다 2~3문장으로 설명해줘. "
                    "다른 텍스트나 코드 블록 없이 JSON만 반환해.\n\n"
                    f"데이터: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"
                    '형식: {"상권_개요":"...","인기_업종":"...","유동인구_분석":"..."}'
                )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            body = {"contents": [{"parts": [{"text": prompt}]}]}
            import time
            for attempt in range(3):
                resp = http_requests.post(url, json=body, timeout=60)
                if resp.status_code == 200:
                    parts = resp.json()["candidates"][0]["content"]["parts"]
                    text = next((p["text"] for p in reversed(parts) if not p.get("thought", False)), "").strip()
                    if "```" in text:
                        for part in text.split("```"):
                            part = part.strip().lstrip("json").strip()
                            if part.startswith("{"):
                                text = part
                                break
                    parsed = json.loads(text)
                    if all(k in parsed and parsed[k] for k in required_keys):
                        ai_descriptions = parsed
                        break
                    elif attempt < 2:
                        time.sleep(5)
                elif resp.status_code == 429 and attempt < 2:
                    time.sleep(10)
                else:
                    break
    except Exception as e:
        ai_descriptions = {"error": str(e)}

    return JsonResponse({
        "data": data,
        "ai_descriptions": ai_descriptions,
        "quarter": target,
        "category": category,
    })


@csrf_exempt
def gu_report(request):
    if request.method != "POST":
        return JsonResponse({"error": "POST만 지원합니다."}, status=405)
    try:
        body = json.loads(request.body)
    except Exception:
        return JsonResponse({"error": "잘못된 JSON"}, status=400)

    gu = body.get("gu", "")
    dongs = [normalize_dong(d) for d in body.get("dongs", [])]
    category = body.get("category", "")
    if not gu or not dongs:
        return JsonResponse({"error": "gu, dongs 필요"}, status=400)

    target = (
        CommercialData.objects
        .filter(행정동명__in=dongs)
        .order_by("-기준_년분기_코드")
        .values_list("기준_년분기_코드", flat=True)
        .first()
    )
    if not target:
        return JsonResponse({"error": "데이터 없음"}, status=404)

    industries = list(
        CommercialData.objects
        .filter(행정동명__in=dongs, 기준_년분기_코드=target)
        .values("통합카테고리")
        .annotate(당월매출합=Sum("당월매출합"), 점포수=Sum("점포수"))
        .order_by("-당월매출합")
    )
    총매출 = sum(item["당월매출합"] or 0 for item in industries)

    gu_revenues = (
        CommercialData.objects
        .filter(기준_년분기_코드=target)
        .values("행정동명")
        .annotate(총매출=Max("행정동_전체매출"))
    )
    gu_totals = {}
    for row in gu_revenues:
        pass

    agg = CommercialData.objects.filter(행정동명__in=dongs, 기준_년분기_코드=target).aggregate(
        총유동인구=Sum("총유동인구"),
        주거인구=Sum("주거인구"),
        직장인구=Sum("총_직장_인구_수"),
        남성매출=Sum("남성매출합"),
        여성매출=Sum("여성매출합"),
        주중매출=Sum("주중매출합"),
        주말매출=Sum("주말매출합"),
        t00_06=Sum("시간대_00_06_매출"),
        t06_11=Sum("시간대_06_11_매출"),
        t11_14=Sum("시간대_11_14_매출"),
        t14_17=Sum("시간대_14_17_매출"),
        t17_21=Sum("시간대_17_21_매출"),
        t21_24=Sum("시간대_21_24_매출"),
    )

    성별합 = (agg["남성매출"] or 0) + (agg["여성매출"] or 0)
    남성비율 = round((agg["남성매출"] or 0) / 성별합 * 100, 1) if 성별합 > 0 else 50
    주중주말합 = (agg["주중매출"] or 0) + (agg["주말매출"] or 0)
    주중비율 = round((agg["주중매출"] or 0) / 주중주말합 * 100, 1) if 주중주말합 > 0 else 70

    data = {
        "gu": gu,
        "총매출": 총매출,
        "행정동수": len(dongs),
        "총유동인구": int(agg["총유동인구"] or 0),
        "주거인구": int(agg["주거인구"] or 0),
        "직장인구": int(agg["직장인구"] or 0),
        "top_업종": [{"업종": r["통합카테고리"], "매출": r["당월매출합"], "점포수": r["점포수"]} for r in industries[:5]],
        "성별": {"남성비율": 남성비율, "여성비율": round(100 - 남성비율, 1)},
        "주중주말": {"주중비율": 주중비율, "주말비율": round(100 - 주중비율, 1)},
        "시간대": {
            "새벽(0~6시)": agg["t00_06"] or 0,
            "오전(6~11시)": agg["t06_11"] or 0,
            "점심(11~14시)": agg["t11_14"] or 0,
            "오후(14~17시)": agg["t14_17"] or 0,
            "저녁(17~21시)": agg["t17_21"] or 0,
            "심야(21~24시)": agg["t21_24"] or 0,
        },
    }

    if category:
        cat_agg = CommercialData.objects.filter(
            행정동명__in=dongs, 기준_년분기_코드=target, 통합카테고리=category
        ).aggregate(
            점포수=Sum("점포수"),
            프랜차이즈=Sum("프랜차이즈_점포수"),
            개업률=Avg("개업_율_평균"),
            폐업률=Avg("폐업_률_평균"),
            경쟁강도=Avg("경쟁강도"),
            업종포화도=Avg("업종_포화도"),
            매출_20대비율=Avg("매출_20대비율"),
            점포당매출=Avg("업종_점포당매출"),
        )
        score_rows = ScoreData.objects.filter(
            행정동명__in=dongs, 기준_년분기_코드=target, 통합카테고리=category
        )
        avg_성장확률 = score_rows.aggregate(avg=Avg("성장확률"))["avg"]
        점포수 = cat_agg["점포수"] or 0
        프랜차이즈 = cat_agg["프랜차이즈"] or 0
        data["category_data"] = {
            "category": category,
            "점포당매출": int(cat_agg["점포당매출"] or 0),
            "프랜차이즈비율": round(프랜차이즈 / 점포수 * 100, 1) if 점포수 > 0 else 0,
            "점포수": 점포수,
            "개업률": round(float(cat_agg["개업률"] or 0), 2),
            "폐업률": round(float(cat_agg["폐업률"] or 0), 2),
            "경쟁강도": round(float(cat_agg["경쟁강도"] or 0), 2),
            "업종포화도": round(float(cat_agg["업종포화도"] or 0), 4),
            "20대매출비율": round(float(cat_agg["매출_20대비율"] or 0) * 100, 1),
            "성장확률": round(float(avg_성장확률), 1) if avg_성장확률 else None,
        }

    ai_descriptions = {}
    try:
        import requests as http_requests
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if api_key:
            has_category = bool(category and data.get("category_data"))
            if has_category:
                required_keys = ["상권_개요", "인기_업종", "유동인구_분석", "소비_패턴", "비용_수익", "기타_통계"]
                prompt = (
                    "다음 서울 구(區) 단위 상권 데이터를 분석해서 아래 JSON 형식으로만 반환해줘. "
                    "반드시 6개 키를 모두 포함하고, 각 항목마다 2~3문장으로 설명해줘. "
                    "다른 텍스트나 코드 블록 없이 JSON만 반환해.\n\n"
                    f"데이터: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"
                    '형식: {"상권_개요":"...","인기_업종":"...","유동인구_분석":"...","소비_패턴":"...","비용_수익":"...","기타_통계":"..."}'
                )
            else:
                required_keys = ["상권_개요", "인기_업종", "유동인구_분석"]
                prompt = (
                    "다음 서울 구(區) 단위 상권 데이터를 분석해서 아래 JSON 형식으로만 반환해줘. "
                    "반드시 3개 키를 모두 포함하고, 각 항목마다 2~3문장으로 설명해줘. "
                    "다른 텍스트나 코드 블록 없이 JSON만 반환해.\n\n"
                    f"데이터: {json.dumps(data, ensure_ascii=False, default=str)}\n\n"
                    '형식: {"상권_개요":"...","인기_업종":"...","유동인구_분석":"..."}'
                )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            body = {"contents": [{"parts": [{"text": prompt}]}]}
            import time
            for attempt in range(3):
                resp = http_requests.post(url, json=body, timeout=60)
                if resp.status_code == 200:
                    parts = resp.json()["candidates"][0]["content"]["parts"]
                    text = next((p["text"] for p in reversed(parts) if not p.get("thought", False)), "").strip()
                    if "```" in text:
                        for part in text.split("```"):
                            part = part.strip().lstrip("json").strip()
                            if part.startswith("{"):
                                text = part
                                break
                    parsed = json.loads(text)
                    if all(k in parsed and parsed[k] for k in required_keys):
                        ai_descriptions = parsed
                        break
                    elif attempt < 2:
                        time.sleep(5)
                elif resp.status_code == 429 and attempt < 2:
                    time.sleep(10)
                else:
                    break
    except Exception as e:
        ai_descriptions = {"error": str(e)}

    return JsonResponse({
        "data": data,
        "ai_descriptions": ai_descriptions,
        "quarter": target,
        "gu": gu,
        "category": category,
    })


def compare_region(request):
    """업종 기준 두 지역 비교 (GET)
    params:
      type     = "dong" | "gu"
      a        = 첫 번째 지역명
      b        = 두 번째 지역명
      category = 통합카테고리 (필수)
    """
    from collections import Counter
    region_type = request.GET.get("type", "dong")
    a = request.GET.get("a", "").strip()
    b = request.GET.get("b", "").strip()
    category = request.GET.get("category", "").strip()
    if not a or not b or not category:
        return JsonResponse({"error": "a, b, category 파라미터가 필요합니다."}, status=400)

    def _get_dong_list(region_name):
        if region_type == "dong":
            name = normalize_dong(region_name)
            return [name] if CommercialData.objects.filter(행정동명=name).exists() else None
        else:
            gu_prefix = next((k for k, v in _GU_CODE_MAP.items() if v == region_name), None)
            if not gu_prefix:
                return None
            dongs = list(
                CommercialData.objects.filter(행정동코드__startswith=int(gu_prefix))
                .values_list("행정동명", flat=True).distinct()
            )
            return dongs if dongs else None

    def _get_metrics(dong_list, region_name):
        latest = (
            CommercialData.objects.filter(행정동명__in=dong_list, 통합카테고리=category)
            .order_by("-기준_년분기_코드")
            .values_list("기준_년분기_코드", flat=True)
            .first()
        )
        if not latest:
            return None, None
        agg = CommercialData.objects.filter(
            행정동명__in=dong_list, 통합카테고리=category, 기준_년분기_코드=latest
        ).aggregate(
            점포수=Sum("점포수"),
            매출합=Sum("당월매출합"),
            경쟁강도=Avg("경쟁강도"),
            업종_포화도=Avg("업종_포화도"),
            업종_매출점유율=Avg("업종_매출점유율"),
            점포당매출=Avg("업종_점포당매출"),
            개업률=Avg("개업_율_평균"),
            폐업률=Avg("폐업_률_평균"),
        )
        score_qs = ScoreData.objects.filter(행정동명__in=dong_list, 통합카테고리=category)
        score_agg = score_qs.aggregate(성장확률=Avg("성장확률"))
        grades = list(score_qs.values_list("등급", flat=True))
        등급 = Counter(grades).most_common(1)[0][0] if grades else "-"
        return {
            "name": region_name,
            "점포수": int(agg["점포수"] or 0),
            "월매출": int(agg["매출합"] or 0),
            "점포당매출": round(agg["점포당매출"] or 0, 0),
            "경쟁강도": round(agg["경쟁강도"] or 0, 1),
            "업종_포화도": round((agg["업종_포화도"] or 0) * 100, 1),
            "업종_매출점유율": round((agg["업종_매출점유율"] or 0) * 100, 1),
            "개업률": round(agg["개업률"] or 0, 1),
            "폐업률": round(agg["폐업률"] or 0, 1),
            "성장확률": round((score_agg["성장확률"] or 0) * 100, 1),
            "등급": 등급,
        }, latest

    dong_list_a = _get_dong_list(a)
    dong_list_b = _get_dong_list(b)
    if dong_list_a is None:
        return JsonResponse({"error": f"'{a}' 지역을 찾을 수 없습니다."}, status=404)
    if dong_list_b is None:
        return JsonResponse({"error": f"'{b}' 지역을 찾을 수 없습니다."}, status=404)

    name_a = normalize_dong(a) if region_type == "dong" else a
    name_b = normalize_dong(b) if region_type == "dong" else b
    data_a, q_a = _get_metrics(dong_list_a, name_a)
    data_b, q_b = _get_metrics(dong_list_b, name_b)

    if data_a is None:
        return JsonResponse({"error": f"'{a}'에서 '{category}' 데이터를 찾을 수 없습니다."}, status=404)
    if data_b is None:
        return JsonResponse({"error": f"'{b}'에서 '{category}' 데이터를 찾을 수 없습니다."}, status=404)

    return JsonResponse({"a": data_a, "b": data_b, "quarter": q_a, "type": region_type, "category": category})


def compare_industry(request):
    """한 지역 내 두 업종 비교 (GET)
    params:
      region      = 행정동명 또는 구명
      region_type = "dong" | "gu"
      cat_a       = 업종 A
      cat_b       = 업종 B
    """
    region = normalize_dong(request.GET.get("region", "").strip())
    region_type = request.GET.get("region_type", "dong")
    cat_a = request.GET.get("cat_a", "").strip()
    cat_b = request.GET.get("cat_b", "").strip()
    if not region or not cat_a or not cat_b:
        return JsonResponse({"error": "region, cat_a, cat_b 파라미터가 필요합니다."}, status=400)

    def _get_industry_metrics(dong_list, cat, region_name):
        latest = (
            CommercialData.objects.filter(행정동명__in=dong_list, 통합카테고리=cat)
            .order_by("-기준_년분기_코드")
            .values_list("기준_년분기_코드", flat=True)
            .first()
        )
        if not latest:
            return None
        agg = CommercialData.objects.filter(행정동명__in=dong_list, 통합카테고리=cat, 기준_년분기_코드=latest).aggregate(
            점포수=Sum("점포수"),
            매출합=Sum("당월매출합"),
            경쟁강도=Avg("경쟁강도"),
            업종_포화도=Avg("업종_포화도"),
            업종_매출점유율=Avg("업종_매출점유율"),
            점포당매출=Avg("업종_점포당매출"),
            개업률=Avg("개업_율_평균"),
            폐업률=Avg("폐업_률_평균"),
        )
        # ScoreData (행정동 모드에서는 정확한 행정동, 구 모드에서는 평균)
        score_qs = ScoreData.objects.filter(행정동명__in=dong_list, 통합카테고리=cat)
        score_agg = score_qs.aggregate(성장확률=Avg("성장확률"))
        # 등급은 가장 많은 등급으로
        from collections import Counter
        grades = list(score_qs.values_list("등급", flat=True))
        등급 = Counter(grades).most_common(1)[0][0] if grades else "-"

        return {
            "category": cat,
            "점포수": int(agg["점포수"] or 0),
            "월매출": int(agg["매출합"] or 0),
            "점포당매출": round(agg["점포당매출"] or 0, 0),
            "경쟁강도": round(agg["경쟁강도"] or 0, 1),
            "업종_포화도": round((agg["업종_포화도"] or 0) * 100, 1),
            "업종_매출점유율": round((agg["업종_매출점유율"] or 0) * 100, 1),
            "개업률": round(agg["개업률"] or 0, 1),
            "폐업률": round(agg["폐업률"] or 0, 1),
            "성장확률": round((score_agg["성장확률"] or 0) * 100, 1),
            "등급": 등급,
        }

    if region_type == "dong":
        dong_list = [region]
    else:
        gu_prefix = next((k for k, v in _GU_CODE_MAP.items() if v == region), None)
        if not gu_prefix:
            return JsonResponse({"error": f"'{region}' 구를 찾을 수 없습니다."}, status=404)
        dong_list = list(
            CommercialData.objects.filter(행정동코드__startswith=int(gu_prefix))
            .values_list("행정동명", flat=True).distinct()
        )

    metrics_a = _get_industry_metrics(dong_list, cat_a, region)
    metrics_b = _get_industry_metrics(dong_list, cat_b, region)

    if metrics_a is None:
        return JsonResponse({"error": f"'{region}'에서 '{cat_a}' 데이터를 찾을 수 없습니다."}, status=404)
    if metrics_b is None:
        return JsonResponse({"error": f"'{region}'에서 '{cat_b}' 데이터를 찾을 수 없습니다."}, status=404)

    return JsonResponse({"a": metrics_a, "b": metrics_b, "region": region, "region_type": region_type})


def search_regions(request):
    """행정동/구 검색 자동완성 (GET)
    params:
      q    = 검색어
      type = "dong" | "gu"
    """
    q = request.GET.get("q", "").strip()
    region_type = request.GET.get("type", "dong")
    if not q:
        return JsonResponse({"results": []})

    if region_type == "gu":
        GU_LIST = list(_GU_CODE_MAP.values())
        results = [g for g in GU_LIST if q in g]
        return JsonResponse({"results": results[:10]})

    # 행정동 검색
    dongs = list(
        CommercialData.objects.filter(행정동명__icontains=q)
        .values("행정동명", "행정동코드")
        .distinct()
        .order_by("행정동명")[:20]
    )
    # 구명 추가
    out = []
    seen = set()
    for row in dongs:
        name = row["행정동명"]
        if name in seen:
            continue
        seen.add(name)
        code_str = str(row["행정동코드"])[:5]
        gu = _GU_CODE_MAP.get(code_str, "")
        out.append({"dong": name, "gu": gu})
    return JsonResponse({"results": out})
