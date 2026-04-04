from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts import views

urlpatterns = [
    path('api/accounts/signup/', views.signup),
    path('api/accounts/login/', views.login),
    path('api/accounts/logout/', views.logout),
    path('api/accounts/me/', views.me),
    path('api/accounts/token/refresh/', TokenRefreshView.as_view()),
    path('api/accounts/kakao/login/', views.kakao_login),
    path('api/accounts/kakao/callback/', views.kakao_callback),
    path('api/accounts/profile/', views.profile),
    path('api/accounts/change-password/', views.change_password),
    path('api/accounts/delete/', views.delete_account),
]
