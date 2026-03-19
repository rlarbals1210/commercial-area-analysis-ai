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
from django.urls import path, include
from analysis.views import analysis, quarters, gu_analysis, gu_quarters, store_list, score, score_all, recommend_location, recommend_industry, recommend_score, suggest_industries

urlpatterns = [
    path('', include("accounts.urls")),
    path('api/analysis/', analysis),
    path('api/quarters/', quarters),
    path('api/gu-analysis/', gu_analysis),
    path('api/gu-quarters/', gu_quarters),
    path('api/stores/', store_list),
    path('api/score/', score),
    path('api/score-all/', score_all),
    path('api/recommend/location/', recommend_location),
    path('api/recommend/industry/', recommend_industry),
    path('api/recommend/score/', recommend_score),
    path('api/suggest/industries/', suggest_industries),
]
