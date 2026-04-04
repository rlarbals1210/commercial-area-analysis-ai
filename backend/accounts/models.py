from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    커스텀 User 모델.
    AbstractUser를 상속받아 Django 기본 필드(username, password, email 등)를 그대로 쓰면서
    우리 서비스에 필요한 필드를 추가한다.
    """

    # 이메일을 고유값으로 — 소셜 로그인에서 이메일로 기존 계정 찾을 때 필요
    # blank=True, null=True: 카카오처럼 이메일 제공 안 하는 경우도 있어서 필수값은 아님
    email = models.EmailField(unique=True, blank=True, null=True)

    # 닉네임 — 커뮤니티에서 표시될 이름
    nickname = models.CharField(max_length=50, blank=True)

    # 프로필 이미지 URL — 소셜 로그인 시 플랫폼에서 받아온 이미지 저장
    profile_image = models.URLField(blank=True)

    # 소셜 로그인 ID — 각 플랫폼의 고유 사용자 ID
    # null=True: 자체 회원가입 유저는 이 값이 없음
    kakao_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    naver_id = models.CharField(max_length=100, blank=True, null=True, unique=True)

    # 가입 경로 추적 — 'local'(자체), 'kakao', 'naver'
    login_type = models.CharField(
        max_length=10,
        choices=[('local', '자체가입'), ('kakao', '카카오'), ('naver', '네이버')],
        default='local',
    )

    # 생년월일 — 선택 입력
    birth_date = models.DateField(blank=True, null=True)

    # 계정 생성일 (자동 저장)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nickname or self.username} ({self.login_type})"
