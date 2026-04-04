from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # 목록 화면에서 보여줄 컬럼
    list_display = ('username', 'nickname', 'email', 'login_type', 'is_staff', 'created_at')
    # 오른쪽 필터 패널
    list_filter = ('login_type', 'is_staff', 'is_active')
    # 검색창
    search_fields = ('username', 'nickname', 'email')
    ordering = ('-created_at',)

    # 상세 편집 화면에 우리가 추가한 필드도 표시
    fieldsets = BaseUserAdmin.fieldsets + (
        ('추가 정보', {'fields': ('nickname', 'profile_image', 'kakao_id', 'naver_id', 'login_type', 'created_at')}),
    )
    readonly_fields = ('created_at',)
