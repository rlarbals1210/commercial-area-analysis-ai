from django.http import JsonResponse
from django.db.models import Max
from .models import CommercialData

def quarters(request):
    dong = request.GET.get("dong")
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
    dong = request.GET.get("dong")
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

    return JsonResponse({
        "dong": dong,
        "총매출": 총매출,
        "순위": 순위,
        "전체동수": 전체동수,
        "industries": rows,
        "quarter": target,
    })
