from django.db.models import Q
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from .models import Post, Like, Comment


def post_to_dict(post, user=None):
    """게시글 객체 → dict (목록용)"""
    return {
        'id': post.id,
        'board': post.board,
        'title': post.title,
        'author': post.author.nickname or post.author.username,
        'author_id': post.author.id,
        'author_is_staff': post.author.is_staff,
        'created_at': post.created_at.strftime('%Y.%m.%d'),
        'view_count': post.view_count,
        'like_count': post.likes.count(),
        'comment_count': post.comments.count(),
        'has_image': bool(post.image),  # 목록에서 Base64 전체 대신 유무만 전달
    }


def post_detail_dict(post, user=None):
    """게시글 객체 → dict (상세용, 본문 + 댓글 포함)"""
    liked = False
    if user and user.is_authenticated:
        liked = post.likes.filter(user=user).exists()
    comments = [
        {
            'id': c.id,
            'author': c.author.nickname or c.author.username,
            'author_id': c.author.id,
            'author_is_staff': c.author.is_staff,
            'content': c.content,
            'created_at': c.created_at.strftime('%Y.%m.%d %H:%M'),
        }
        for c in post.comments.all()
    ]
    return {
        'id': post.id,
        'board': post.board,
        'title': post.title,
        'content': post.content,
        'image': post.image,
        'author': post.author.nickname or post.author.username,
        'author_id': post.author.id,
        'author_is_staff': post.author.is_staff,
        'created_at': post.created_at.strftime('%Y.%m.%d %H:%M'),
        'view_count': post.view_count,
        'like_count': post.likes.count(),
        'liked': liked,
        'comments': comments,
    }


# ── 게시글 목록 / 작성 ────────────────────────────────────
# GET  /api/community/posts/?board=free&page=1
# POST /api/community/posts/
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def post_list(request):
    if request.method == 'GET':
        board = request.GET.get('board', 'free')
        page = int(request.GET.get('page', 1))
        page_size = 10
        search_type = request.GET.get('search_type', 'title')  # title | author
        search_q = request.GET.get('q', '').strip()

        qs = Post.objects.filter(board=board).select_related('author')
        if search_q:
            if search_type == 'author':
                qs = qs.filter(Q(author__nickname__icontains=search_q) | Q(author__username__icontains=search_q))
            else:
                qs = qs.filter(title__icontains=search_q)
        qs = qs.order_by('-created_at')
        total = qs.count()
        posts = qs[(page - 1) * page_size: page * page_size]
        return JsonResponse({
            'total': total,
            'page': page,
            'page_size': page_size,
            'posts': [post_to_dict(p, request.user) for p in posts],
        })

    # POST — 글 작성
    board = request.data.get('board', 'free')

    # 공지게시판은 어드민만 작성 가능
    if board == 'notice' and not request.user.is_staff:
        return JsonResponse({'error': '공지게시판은 관리자만 작성할 수 있습니다.'}, status=403)

    title = request.data.get('title', '').strip()
    content = request.data.get('content', '').strip()
    image = request.data.get('image', '')
    if not title or not content:
        return JsonResponse({'error': '제목과 내용을 입력해주세요.'}, status=400)

    post = Post.objects.create(board=board, title=title, content=content, image=image, author=request.user)
    return JsonResponse(post_to_dict(post), status=201)


# ── 게시글 상세 / 수정 / 삭제 ────────────────────────────
# GET    /api/community/posts/<id>/
# PUT    /api/community/posts/<id>/
# DELETE /api/community/posts/<id>/
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def post_detail(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': '게시글을 찾을 수 없습니다.'}, status=404)

    if request.method == 'GET':
        # 조회수 증가 (본인 제외)
        if request.user != post.author:
            Post.objects.filter(id=post_id).update(view_count=post.view_count + 1)
            post.refresh_from_db()
        return JsonResponse(post_detail_dict(post, request.user))

    # 수정/삭제는 본인 또는 어드민만
    if request.user != post.author and not request.user.is_staff:
        return JsonResponse({'error': '권한이 없습니다.'}, status=403)

    if request.method == 'PUT':
        post.title = request.data.get('title', post.title).strip()
        post.content = request.data.get('content', post.content).strip()
        post.image = request.data.get('image', post.image)
        post.save()
        return JsonResponse(post_detail_dict(post, request.user))

    # DELETE
    post.delete()
    return JsonResponse({'message': '삭제되었습니다.'})


# ── 좋아요 토글 ───────────────────────────────────────────
# POST /api/community/posts/<id>/like/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_like(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': '게시글을 찾을 수 없습니다.'}, status=404)

    like, created = Like.objects.get_or_create(post=post, user=request.user)
    if not created:
        like.delete()   # 이미 좋아요 → 취소
        liked = False
    else:
        liked = True

    return JsonResponse({'liked': liked, 'like_count': post.likes.count()})


# ── 댓글 작성 ─────────────────────────────────────────────
# POST /api/community/posts/<id>/comments/
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_create(request, post_id):
    try:
        post = Post.objects.get(id=post_id)
    except Post.DoesNotExist:
        return JsonResponse({'error': '게시글을 찾을 수 없습니다.'}, status=404)

    content = request.data.get('content', '').strip()
    if not content:
        return JsonResponse({'error': '댓글 내용을 입력해주세요.'}, status=400)

    comment = Comment.objects.create(post=post, author=request.user, content=content)
    return JsonResponse({
        'id': comment.id,
        'author': comment.author.nickname or comment.author.username,
        'author_id': comment.author.id,
        'content': comment.content,
        'created_at': comment.created_at.strftime('%Y.%m.%d %H:%M'),
    }, status=201)


# ── 댓글 삭제 ─────────────────────────────────────────────
# DELETE /api/community/comments/<id>/
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def comment_delete(request, comment_id):
    try:
        comment = Comment.objects.get(id=comment_id)
    except Comment.DoesNotExist:
        return JsonResponse({'error': '댓글을 찾을 수 없습니다.'}, status=404)

    if request.user != comment.author and not request.user.is_staff:
        return JsonResponse({'error': '권한이 없습니다.'}, status=403)

    comment.delete()
    return JsonResponse({'message': '삭제되었습니다.'})
