"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from analysis.views import analysis, quarters, gu_analysis, gu_quarters, gu_all_ranking, store_list, score, score_all, recommend_location, recommend_industry, recommend_gu_industry, recommend_gu, recommend_score, suggest_industries, suggest_industries_with_category, recommend_spot, rental_regions, rental_calculate, recommend_street_industry, recommend_street_score, recommend_street_spot, recommend_custom_spot, recommend_gu_streets, trend_categories, trend_gu_industries, trend_mz_industries, trend_weekday_industries, trend_weekend_industries, trend_age_breakdown, report, gu_report, compare_region, compare_industry, search_regions, recommend_top_industries, subcategory_trend

urlpatterns = [
    path('admin/', admin.site.urls),     # Django 관리자 페이지
    path('', include("accounts.urls")),
    path('api/analysis/', analysis),
    path('api/quarters/', quarters),
    path('api/gu-analysis/', gu_analysis),
    path('api/gu-quarters/', gu_quarters),
    path('api/gu-all-ranking/', gu_all_ranking),
    path('api/stores/', store_list),
    path('api/score/', score),
    path('api/score-all/', score_all),
    path('api/recommend/location/', recommend_location),
    path('api/recommend/gu/', recommend_gu),
    path('api/recommend/industry/', recommend_industry),
    path('api/recommend/gu-industry/', recommend_gu_industry),
    path('api/recommend/score/', recommend_score),
    path('api/suggest/industries/', suggest_industries),
    path('api/suggest/industries-with-category/', suggest_industries_with_category),  # 창업비용 계산기용
    path('api/recommend/spot/', recommend_spot),
    path('api/rental/regions/', rental_regions),
    path('api/rental/calculate/', rental_calculate),
    path('api/recommend/street-industry/', recommend_street_industry),
    path('api/recommend/street-score/', recommend_street_score),
    path('api/recommend/street-spot/', recommend_street_spot),
    path('api/recommend/custom-spot/', recommend_custom_spot),
    path('api/recommend/gu-streets/', recommend_gu_streets),
    path('api/trend/categories/', trend_categories),
    path('api/trend/gu-industries/', trend_gu_industries),
    path('api/trend/mz-industries/', trend_mz_industries),
    path('api/trend/weekday-industries/', trend_weekday_industries),
    path('api/trend/weekend-industries/', trend_weekend_industries),
    path('api/trend/age-breakdown/', trend_age_breakdown),
    path('api/report/', report),
    path('api/gu-report/', gu_report),
    path('api/compare/region/', compare_region),
    path('api/compare/industry/', compare_industry),
    path('api/search/regions/', search_regions),
    path('api/recommend/top-industries/', recommend_top_industries),
    path('api/subcategory/trend/', subcategory_trend),
]
