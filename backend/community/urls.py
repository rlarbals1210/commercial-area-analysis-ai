from django.urls import path
from community import views

urlpatterns = [
    path('api/community/posts/', views.post_list),                          # 목록/작성
    path('api/community/posts/<int:post_id>/', views.post_detail),          # 상세/수정/삭제
    path('api/community/posts/<int:post_id>/like/', views.post_like),       # 좋아요 토글
    path('api/community/posts/<int:post_id>/comments/', views.comment_create),  # 댓글 작성
    path('api/community/comments/<int:comment_id>/', views.comment_delete), # 댓글 삭제
    path('api/community/my-posts/',    views.my_posts),    # 내가 쓴 글
    path('api/community/my-likes/',    views.my_likes),    # 좋아요한 글
    path('api/community/my-comments/', views.my_comments), # 댓글 단 글
]
