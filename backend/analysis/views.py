import json
from django.http import JsonResponse
from django.db.models import Max, Sum
from django.views.decorators.csrf import csrf_exempt
from .models import CommercialData, StoreInfo, ScoreData


DONG_REMAP = {
    "신설동": "용신동",  # GeoJSON 경계명 → DB 행정동명
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
