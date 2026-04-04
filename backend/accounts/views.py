import requests as http_requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.http import JsonResponse, HttpResponseRedirect
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


# ── 회원가입 ─────────────────────────────────────────────
# POST /api/accounts/signup/
# body: { "username": "...", "password": "...", "nickname": "..." }
#
# 흐름:
#   1. username 중복 확인
#   2. User.objects.create_user() → 비밀번호 자동 해시 후 DB 저장
#   3. 201 반환
@api_view(['POST'])
def signup(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()
    nickname = request.data.get('nickname', '').strip()
    email = request.data.get('email', '').strip() or None  # 빈 문자열은 None으로 (unique 제약 때문에)

    if not username or not password:
        return JsonResponse({'error': '아이디와 비밀번호는 필수입니다.'}, status=400)

    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': '이미 사용 중인 아이디입니다.'}, status=400)

    if email and User.objects.filter(email=email).exists():
        return JsonResponse({'error': '이미 사용 중인 이메일입니다.'}, status=400)

    user = User.objects.create_user(
        username=username,
        password=password,
        nickname=nickname,
        email=email,
        login_type='local',
    )
    return JsonResponse({'message': '회원가입이 완료되었습니다.', 'username': user.username}, status=201)


# ── 로그인 ───────────────────────────────────────────────
# POST /api/accounts/login/
# body: { "username": "...", "password": "..." }
#
# 흐름:
#   1. authenticate() → Django가 비밀번호 해시 비교
#   2. 성공 시 JWT access + refresh 토큰 발급
#   3. 프론트는 access 토큰을 localStorage에 저장해서 API 호출 시 헤더에 포함
@api_view(['POST'])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    user = authenticate(username=username, password=password)
    if user is None:
        return JsonResponse({'error': '아이디 또는 비밀번호가 올바르지 않습니다.'}, status=401)

    refresh = RefreshToken.for_user(user)
    return JsonResponse({
        'access': str(refresh.access_token),   # 짧게 유효 (2시간)
        'refresh': str(refresh),               # 길게 유효 (7일), 토큰 갱신용
        'user': {
            'username': user.username,
            'nickname': user.nickname,
            'profile_image': user.profile_image,
            'login_type': user.login_type,
        }
    })


# ── 토큰 갱신 ────────────────────────────────────────────
# POST /api/accounts/token/refresh/
# body: { "refresh": "..." }
#
# access 토큰이 만료(2시간)됐을 때 refresh 토큰으로 새 access 토큰을 받는 엔드포인트.
# simplejwt의 TokenRefreshView가 자동 처리 → urls.py에서 등록


# ── 내 정보 조회 ─────────────────────────────────────────
# GET /api/accounts/me/
# Header: Authorization: Bearer {access_token}
#
# @permission_classes([IsAuthenticated]) 데코레이터가
# 토큰 없거나 만료된 요청을 자동으로 401로 막아줌
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user   # JWT 검증 후 Django가 자동으로 user 객체를 채워줌
    return JsonResponse({
        'username': user.username,
        'nickname': user.nickname,
        'email': user.email,
        'profile_image': user.profile_image,
        'login_type': user.login_type,
        'created_at': user.created_at.isoformat(),
    })


# ── 로그아웃 ─────────────────────────────────────────────
# POST /api/accounts/logout/
# body: { "refresh": "..." }
# Header: Authorization: Bearer {access_token}
#
# JWT는 서버가 상태를 기억하지 않기 때문에
# "토큰 자체를 무효화"하려면 refresh 토큰을 블랙리스트에 등록해야 함.
# 프론트에서도 localStorage의 토큰을 삭제해야 완전히 로그아웃됨.
# ── 카카오 로그인 시작 ───────────────────────────────────
# GET /api/accounts/kakao/login/
#
# 흐름:
#   프론트가 이 URL을 호출하면 카카오 로그인 페이지 URL을 반환
#   프론트는 그 URL로 사용자를 이동시킴 (window.location.href = url)
@api_view(['GET'])
def kakao_login(request):
    kakao_auth_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={settings.KAKAO_REST_API_KEY}"
        f"&redirect_uri={settings.KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return JsonResponse({"url": kakao_auth_url})


# ── 카카오 콜백 ──────────────────────────────────────────
# GET /api/accounts/kakao/callback/
#
# 흐름:
#   1. 카카오가 이 URL로 "인증코드(code)"를 전달함
#   2. 그 코드로 카카오 액세스 토큰 요청
#   3. 카카오 토큰으로 유저 정보(kakao_id, 닉네임, 프로필사진) 요청
#   4. DB에 유저 없으면 생성, 있으면 조회
#   5. 우리 JWT 발급 → 프론트로 리다이렉트 (토큰을 쿼리스트링으로 전달)
@api_view(['GET'])
def kakao_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': '인증 코드가 없습니다.'}, status=400)

    # 1. 인증코드 → 카카오 액세스 토큰
    token_res = http_requests.post(
        "https://kauth.kakao.com/oauth/token",
        data={
            "grant_type": "authorization_code",
            "client_id": settings.KAKAO_REST_API_KEY,
            "client_secret": settings.KAKAO_CLIENT_SECRET,
            "redirect_uri": settings.KAKAO_REDIRECT_URI,
            "code": code,
        },
    )
    token_data = token_res.json()
    print("카카오 토큰 응답:", token_data)  # 디버그용
    kakao_access_token = token_data.get("access_token")
    if not kakao_access_token:
        return JsonResponse({'error': '카카오 토큰 발급 실패', 'detail': token_data}, status=400)

    # 2. 카카오 토큰 → 유저 정보
    user_res = http_requests.get(
        "https://kapi.kakao.com/v2/user/me",
        headers={"Authorization": f"Bearer {kakao_access_token}"},
    )
    user_data = user_res.json()
    kakao_id = str(user_data.get("id"))
    kakao_account = user_data.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    nickname = profile.get("nickname", "")
    profile_image = profile.get("profile_image_url", "")
    email = kakao_account.get("email", None)

    # 3. DB에서 유저 조회 또는 생성
    user, created = User.objects.get_or_create(
        kakao_id=kakao_id,
        defaults={
            "username": f"kakao_{kakao_id}",
            "nickname": nickname,
            "profile_image": profile_image,
            "email": email,
            "login_type": "kakao",
        }
    )
    # 기존 유저면 닉네임/프로필 최신화
    if not created:
        user.nickname = nickname
        user.profile_image = profile_image
        user.save(update_fields=["nickname", "profile_image"])

    # 4. 우리 JWT 발급 → 프론트로 리다이렉트
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    refresh_token = str(refresh)

    # 토큰을 쿼리스트링으로 프론트에 전달 (프론트가 받아서 localStorage에 저장)
    import urllib.parse
    user_info = urllib.parse.quote_plus(f'{{"username":"{user.username}","nickname":"{user.nickname}","profile_image":"{user.profile_image}","login_type":"{user.login_type}"}}')
    frontend_url = f"http://localhost:5173/social-callback?access={access}&refresh={refresh_token}&user={user_info}"
    return HttpResponseRedirect(frontend_url)


# ── 프로필 조회 / 수정 ───────────────────────────────────
# GET  /api/accounts/profile/  → 내 정보 조회
# PUT  /api/accounts/profile/  → 닉네임, 이메일, 생년월일 수정
@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    if request.method == 'GET':
        return JsonResponse({
            'username': user.username,
            'nickname': user.nickname,
            'email': user.email or '',
            'profile_image': user.profile_image,
            'login_type': user.login_type,
            'birth_date': user.birth_date.isoformat() if user.birth_date else '',
            'created_at': user.created_at.isoformat(),
        })

    nickname = request.data.get('nickname', '').strip()
    email = request.data.get('email', '').strip() or None
    birth_date = request.data.get('birth_date', '').strip() or None

    if email and User.objects.filter(email=email).exclude(pk=user.pk).exists():
        return JsonResponse({'error': '이미 사용 중인 이메일입니다.'}, status=400)

    user.nickname = nickname
    user.email = email
    user.birth_date = birth_date
    user.save(update_fields=['nickname', 'email', 'birth_date'])
    return JsonResponse({'message': '프로필이 수정되었습니다.'})


# ── 비밀번호 변경 ────────────────────────────────────────
# POST /api/accounts/change-password/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    if user.login_type != 'local':
        return JsonResponse({'error': '소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.'}, status=400)

    current = request.data.get('current_password', '')
    new_pw = request.data.get('new_password', '')

    if not user.check_password(current):
        return JsonResponse({'error': '현재 비밀번호가 올바르지 않습니다.'}, status=400)
    if len(new_pw) < 8:
        return JsonResponse({'error': '새 비밀번호는 8자 이상이어야 합니다.'}, status=400)

    user.set_password(new_pw)
    user.save()
    return JsonResponse({'message': '비밀번호가 변경되었습니다. 다시 로그인해 주세요.'})


# ── 회원 탈퇴 ────────────────────────────────────────────
# DELETE /api/accounts/delete/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return JsonResponse({'message': '계정이 삭제되었습니다.'})


# ── 로그아웃 ─────────────────────────────────────────────
# POST /api/accounts/logout/
# body: { "refresh": "..." }
# Header: Authorization: Bearer {access_token}
#
# JWT는 서버가 상태를 기억하지 않기 때문에
# "토큰 자체를 무효화"하려면 refresh 토큰을 블랙리스트에 등록해야 함.
# 프론트에서도 localStorage의 토큰을 삭제해야 완전히 로그아웃됨.
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()   # refresh 토큰 블랙리스트 등록 → 재사용 불가
        return JsonResponse({'message': '로그아웃 되었습니다.'})
    except Exception:
        return JsonResponse({'error': '유효하지 않은 토큰입니다.'}, status=400)
