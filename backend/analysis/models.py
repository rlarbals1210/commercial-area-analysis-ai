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

    # 유동인구
    총유동인구          = models.BigIntegerField()
    유동_20대           = models.BigIntegerField()

    # 점포
    점포수              = models.IntegerField()
    행정동_전체점포수   = models.IntegerField()

    # 분석 지표 (소수점 있음)
    업종_점포당매출     = models.FloatField()
    업종_매출점유율     = models.FloatField()
    업종_포화도         = models.FloatField()
    경쟁강도            = models.FloatField()
    매출_20대비율       = models.FloatField()
    유동_20대비율       = models.FloatField()
    MZ_차이             = models.FloatField()
    유동대비매출        = models.FloatField()
    점포대비유동        = models.FloatField()

    class Meta:
        indexes = [
            models.Index(fields=["행정동명"]),          # API 조회 속도
            models.Index(fields=["행정동명", "통합카테고리"]),
        ]