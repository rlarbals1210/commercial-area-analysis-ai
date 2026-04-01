from django.db import models

class CommercialData(models.Model):
    기준_년분기_코드    = models.IntegerField()        # 예: 20251
    행정동코드          = models.BigIntegerField()
    행정동명            = models.CharField(max_length=50)
    통합카테고리        = models.CharField(max_length=50)

    # 매출
    당월매출합          = models.BigIntegerField()
    매출_20대합         = models.BigIntegerField()
    행정동_전체매출     = models.BigIntegerField()

    # 성별 매출
    남성매출합          = models.BigIntegerField(null=True)
    여성매출합          = models.BigIntegerField(null=True)
    매출_남성비율       = models.FloatField(null=True)
    매출_여성비율       = models.FloatField(null=True)

    # 주중/주말 매출
    주중매출합          = models.BigIntegerField(null=True)
    주말매출합          = models.BigIntegerField(null=True)
    매출_주말비율       = models.FloatField(null=True)

    # 요일별 매출
    월요일매출합        = models.BigIntegerField(null=True)
    화요일매출합        = models.BigIntegerField(null=True)
    수요일매출합        = models.BigIntegerField(null=True)
    목요일매출합        = models.BigIntegerField(null=True)
    금요일매출합        = models.BigIntegerField(null=True)
    토요일매출합        = models.BigIntegerField(null=True)
    일요일매출합        = models.BigIntegerField(null=True)

    # 나이별 매출 금액
    매출_10대합         = models.BigIntegerField(null=True)
    매출_30대합         = models.BigIntegerField(null=True)
    매출_40대합         = models.BigIntegerField(null=True)
    매출_50대합         = models.BigIntegerField(null=True)
    매출_60대이상합     = models.BigIntegerField(null=True)

    # 나이별 결제 건수
    매출건수_10대       = models.BigIntegerField(null=True)
    매출건수_20대       = models.BigIntegerField(null=True)
    매출건수_30대       = models.BigIntegerField(null=True)
    매출건수_40대       = models.BigIntegerField(null=True)
    매출건수_50대       = models.BigIntegerField(null=True)
    매출건수_60대이상   = models.BigIntegerField(null=True)

    # 시간대별 매출
    시간대_00_06_매출   = models.BigIntegerField(null=True)
    시간대_06_11_매출   = models.BigIntegerField(null=True)
    시간대_11_14_매출   = models.BigIntegerField(null=True)
    시간대_14_17_매출   = models.BigIntegerField(null=True)
    시간대_17_21_매출   = models.BigIntegerField(null=True)
    시간대_21_24_매출   = models.BigIntegerField(null=True)

    # 유동인구
    총유동인구          = models.BigIntegerField()
    유동_10대           = models.BigIntegerField(null=True)
    유동_20대           = models.BigIntegerField()
    유동_30대           = models.BigIntegerField(null=True)
    유동_40대           = models.BigIntegerField(null=True)
    유동_50대           = models.BigIntegerField(null=True)
    유동_60대이상       = models.BigIntegerField(null=True)

    # 요일별 유동인구
    월요일유동          = models.BigIntegerField(null=True)
    화요일유동          = models.BigIntegerField(null=True)
    수요일유동          = models.BigIntegerField(null=True)
    목요일유동          = models.BigIntegerField(null=True)
    금요일유동          = models.BigIntegerField(null=True)
    토요일유동          = models.BigIntegerField(null=True)
    일요일유동          = models.BigIntegerField(null=True)

    # 시간대별 유동인구
    시간대_00_06_유동   = models.BigIntegerField(null=True)
    시간대_06_11_유동   = models.BigIntegerField(null=True)
    시간대_11_14_유동   = models.BigIntegerField(null=True)
    시간대_14_17_유동   = models.BigIntegerField(null=True)
    시간대_17_21_유동   = models.BigIntegerField(null=True)
    시간대_21_24_유동   = models.BigIntegerField(null=True)

    # 직장·주거인구 (신규)
    총_직장_인구_수     = models.BigIntegerField(null=True)
    직장_20대_인구      = models.BigIntegerField(null=True)
    주거인구            = models.BigIntegerField(null=True)

    # 점포
    점포수              = models.IntegerField()
    행정동_전체점포수   = models.IntegerField()

    # 개업/폐업/프랜차이즈 (신규)
    개업_율_평균        = models.FloatField(null=True)
    폐업_률_평균        = models.FloatField(null=True)
    프랜차이즈_점포수   = models.IntegerField(null=True)

    # 분석 지표 (소수점 있음)
    업종_점포당매출     = models.FloatField()
    업종_매출점유율     = models.FloatField()
    업종_포화도         = models.FloatField()
    경쟁강도            = models.FloatField()
    매출_20대비율       = models.FloatField()
    유동_20대비율       = models.FloatField()
    직장_20대_비율      = models.FloatField(null=True)
    MZ_차이             = models.FloatField()
    유동대비매출        = models.FloatField()
    점포대비유동        = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["행정동명"]),
            models.Index(fields=["행정동명", "기준_년분기_코드"]),
            models.Index(fields=["기준_년분기_코드"]),
            models.Index(fields=["행정동명", "통합카테고리"]),
        ]


class ScoreData(models.Model):
    """AI 창업 적합도 점수 (업종×행정동, 최신 분기)"""
    행정동명        = models.CharField(max_length=50)
    통합카테고리    = models.CharField(max_length=50)
    기준_년분기_코드 = models.IntegerField()
    성장확률        = models.FloatField()   # 0~100
    업종내_순위     = models.IntegerField()
    업종내_전체동수 = models.IntegerField()
    상위_퍼센트    = models.FloatField()   # 낮을수록 좋음
    등급            = models.CharField(max_length=2)  # A/B/C/D

    class Meta:
        indexes = [
            models.Index(fields=["행정동명"]),
            models.Index(fields=["행정동명", "통합카테고리"]),
        ]


class StreetScoreData(models.Model):
    """AI 창업 적합도 점수 (업종×상권, 최신 분기)"""
    상권_코드           = models.BigIntegerField()
    상권_코드_명        = models.CharField(max_length=100)
    통합카테고리        = models.CharField(max_length=50)
    기준_년분기_코드    = models.IntegerField()
    성장확률            = models.FloatField()   # 0~100
    업종내_순위         = models.IntegerField()
    업종내_전체상권수   = models.IntegerField()
    상위_퍼센트        = models.FloatField()
    등급                = models.CharField(max_length=2)  # A/B/C/D

    class Meta:
        indexes = [
            models.Index(fields=["상권_코드"]),
            models.Index(fields=["상권_코드", "통합카테고리"]),
            models.Index(fields=["통합카테고리"]),
        ]


class StreetCommercialData(models.Model):
    """상권 단위 상권 지표 (최신 분기)"""
    기준_년분기_코드    = models.IntegerField()
    상권_코드           = models.BigIntegerField()
    상권_코드_명        = models.CharField(max_length=100)
    통합카테고리        = models.CharField(max_length=50)

    # 매출
    당월_매출_금액      = models.BigIntegerField()
    당월_매출_건수      = models.BigIntegerField()
    객단가              = models.FloatField(null=True)
    매출_증감률         = models.FloatField(null=True)
    매출_주말비율       = models.FloatField(null=True)
    매출_저녁비율       = models.FloatField(null=True)

    # 유동인구
    총_유동인구_수      = models.BigIntegerField(null=True)
    유동_증감률         = models.FloatField(null=True)

    # 소득소비
    월_평균_소득_금액   = models.FloatField(null=True)
    지출_총금액         = models.FloatField(null=True)

    class Meta:
        indexes = [
            models.Index(fields=["상권_코드"]),
            models.Index(fields=["상권_코드", "통합카테고리"]),
            models.Index(fields=["통합카테고리"]),
        ]


class StoreInfo(models.Model):
    """개별 상가 정보 (소상공인 상가(상권)정보 원본 데이터)"""
    상가업소번호        = models.CharField(max_length=30, unique=True)
    상호명              = models.CharField(max_length=100)
    통합카테고리        = models.CharField(max_length=50)       # store_category_map 기반
    상권업종소분류명    = models.CharField(max_length=100)
    행정동명            = models.CharField(max_length=50)
    도로명주소          = models.CharField(max_length=200, blank=True)
    위도                = models.FloatField()
    경도                = models.FloatField()
    기준_년분기_코드    = models.IntegerField()                  # 예: 20254

    class Meta:
        indexes = [
            models.Index(fields=["행정동명"]),
            models.Index(fields=["행정동명", "통합카테고리"]),
            models.Index(fields=["행정동명", "기준_년분기_코드"]),
        ]