import json
import threading
import pandas as pd
from pathlib import Path
from django.http import JsonResponse
from django.db.models import Count, Max, Sum
from django.views.decorators.csrf import csrf_exempt
from .models import CommercialData, StoreInfo, ScoreData

# location_scores.csv 메모리 캐시
_location_df = None
_location_lock = threading.Lock()

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
    "11350": "도봉구", "11380": "노원구",  "11410": "은평구",
    "11440": "서대문구","11470": "마포구", "11500": "양천구",
    "11530": "강서구", "11545": "구로구",  "11560": "금천구",
    "11590": "영등포구","11620": "동작구", "11650": "관악구",
    "11680": "서초구", "11710": "강남구",  "11740": "송파구",
    "11770": "강동구",
}

def _get_location_df():
    global _location_df
    if _location_df is not None:
        return _location_df
    with _location_lock:
        if _location_df is not None:
            return _location_df
        path = Path(__file__).resolve().parents[2] / "ai" / "outputs" / "location_scores.csv"
        if path.exists():
            _location_df = pd.read_csv(path, encoding="utf-8-sig")
        else:
            _location_df = pd.DataFrame()
    return _location_df


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


def recommend_location(request):
    """소분류 업종 입력 → 최적 창업 행정동 추천 (GET, 업종=소분류명)"""
    소분류 = request.GET.get("업종", "").strip()
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

    cat_rows = list(
        _store_filter(소분류)
        .values("통합카테고리")
        .annotate(cnt=Count("id"))
        .order_by("-cnt")[:1]
    )
    if not cat_rows:
        return JsonResponse({"error": f'"{소분류}"에 해당하는 업종을 찾을 수 없습니다.'}, status=404)
    통합카테고리 = cat_rows[0]["통합카테고리"]

    # 2. ScoreData: 통합카테고리 기반 AI 성장확률 (행정동별)
    score_map = {
        row["행정동명"]: row
        for row in ScoreData.objects.filter(통합카테고리=통합카테고리).values(
            "행정동명", "성장확률", "등급", "상위_퍼센트"
        )
    }

    # 3. CommercialData: 최신 분기 지표 (행정동별)
    latest_q = (
        CommercialData.objects
        .filter(통합카테고리=통합카테고리)
        .aggregate(max=Max("기준_년분기_코드"))["max"]
    )
    if not latest_q:
        return JsonResponse({"error": "분석 데이터가 없습니다."}, status=404)

    commercial_map = {
        row["행정동명"]: row
        for row in CommercialData.objects.filter(
            통합카테고리=통합카테고리,
            기준_년분기_코드=latest_q,
        ).values(
            "행정동명", "당월매출합", "총유동인구", "업종_포화도",
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

    # 정규화 최대값
    max_유동 = max((commercial_map[d]["총유동인구"] or 0) for d in candidate_dongs) or 1
    max_소분류 = max(subdiv_stores.get(d, 0) for d in candidate_dongs) or 1
    max_경쟁강도 = max((commercial_map[d]["경쟁강도"] or 0) for d in candidate_dongs) or 1

    results = []
    for dong in candidate_dongs:
        c = commercial_map[dong]
        s = score_map.get(dong, {})

        성장확률 = s.get("성장확률") or 50.0
        포화도 = c.get("업종_포화도") or 0.5
        경쟁강도_raw = c.get("경쟁강도") or 0
        경쟁강도_norm = 경쟁강도_raw / max_경쟁강도  # 0~1 정규화
        유동인구 = c.get("총유동인구") or 0
        소분류_점포수 = subdiv_stores.get(dong, 0)

        # 소분류 경쟁 점수: 해당 소분류 점포가 적을수록 높음 (0~100)
        소분류_경쟁점수 = max(0.0, (1 - 소분류_점포수 / max_소분류)) * 100
        # 유동인구 점수: 많을수록 높음 (0~100)
        유동인구_점수 = (유동인구 / max_유동) * 100
        # 포화도 점수: 낮을수록 높음 (0~100)
        포화도_점수 = max(0.0, 1 - 포화도) * 100

        # 종합점수 = AI성장확률×40% + 소분류경쟁×30% + 유동인구×15% + 포화도×15%
        composite = (
            성장확률 * 0.40
            + 소분류_경쟁점수 * 0.30
            + 유동인구_점수 * 0.15
            + 포화도_점수 * 0.15
        )

        results.append({
            "dongName": dong,
            "score": round(composite, 1),
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

    # 정규화 최대값
    max_매출 = max((commercial_map[c]["당월매출합"] or 0) for c in categories) or 1
    max_유동 = max((commercial_map[c]["총유동인구"] or 0) for c in categories) or 1
    max_경쟁강도 = max((commercial_map[c]["경쟁강도"] or 0) for c in categories) or 1

    results = []
    for cat in categories:
        c = commercial_map[cat]
        s = score_map[cat]

        성장확률 = s.get("성장확률") or 50.0
        포화도 = c.get("업종_포화도") or 0.5
        경쟁강도_raw = c.get("경쟁강도") or 0
        경쟁강도_norm = 경쟁강도_raw / max_경쟁강도  # 0~1 정규화
        유동인구 = c.get("총유동인구") or 0
        매출 = c.get("당월매출합") or 0
        점포수 = c.get("점포수") or 0

        매출_점수 = (매출 / max_매출) * 100
        유동인구_점수 = (유동인구 / max_유동) * 100
        포화도_점수 = max(0.0, 1 - 포화도) * 100

        composite = (
            성장확률 * 0.40
            + 매출_점수 * 0.30
            + 유동인구_점수 * 0.15
            + 포화도_점수 * 0.15
        )

        results.append({
            "industry": cat,
            "category": cat,
            "score": round(composite, 1),
            "성장확률": round(성장확률, 1),
            "등급": s.get("등급", "-"),
            "revenue": 매출,
            "stores": 점포수,
            "경쟁강도_norm": round(경쟁강도_norm, 3),
            "업종_포화도": round(포화도, 3),
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

    # 같은 카테고리 전체 동 기준 정규화
    all_rows = list(
        CommercialData.objects.filter(통합카테고리=category, 기준_년분기_코드=latest_q)
        .values("당월매출합", "총유동인구", "경쟁강도")
    )
    max_매출 = max((r["당월매출합"] or 0) for r in all_rows) or 1
    max_유동 = max((r["총유동인구"] or 0) for r in all_rows) or 1
    max_경쟁강도 = max((r["경쟁강도"] or 0) for r in all_rows) or 1

    성장확률 = score_obj.성장확률 or 50.0
    경쟁강도_norm = (c.경쟁강도 or 0) / max_경쟁강도  # 0~1 정규화
    매출_점수 = round(((c.당월매출합 or 0) / max_매출) * 100, 1)
    유동인구_점수 = round(((c.총유동인구 or 0) / max_유동) * 100, 1)
    경쟁_점수 = round(max(0.0, 1 - 경쟁강도_norm) * 100, 1)
    성장_점수 = round(성장확률, 1)

    composite = round(
        성장_점수 * 0.40
        + 매출_점수 * 0.30
        + 유동인구_점수 * 0.15
        + 경쟁_점수 * 0.15,
        1
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
        "총유동인구": c.총유동인구 or 0,
        "폐업_률_평균": c.폐업_률_평균,
        "개업_율_평균": c.개업_율_평균,
    })

    summary = _make_score_summary(composite, dong, category, 경쟁강도_norm, 성장확률)

    return JsonResponse({
        "score": composite,
        "grade": grade,
        "summary": summary,
        "breakdown": [
            {"label": "성장 추세", "score": 성장_점수, "max": 100},
            {"label": "매출 잠재력", "score": 매출_점수, "max": 100},
            {"label": "유동인구", "score": 유동인구_점수, "max": 100},
            {"label": "경쟁 강도", "score": 경쟁_점수, "max": 100},
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
