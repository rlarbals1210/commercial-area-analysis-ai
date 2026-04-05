from django.conf import settings
from django.db import models


class Post(models.Model):
    BOARD_CHOICES = [
        ('free', '자유게시판'),
        ('info', '정보게시판'),
        ('notice', '공지'),
    ]

    board = models.CharField(max_length=10, choices=BOARD_CHOICES)
    title = models.CharField(max_length=100)
    content = models.TextField()
    image = models.TextField(blank=True, default='')  # Base64 인코딩 이미지
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.board}] {self.title}"


class Like(models.Model):
    """게시글 좋아요 — 유저당 1개만 (unique_together)"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('post', 'user')


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comments'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.author.nickname or self.author.username}: {self.content[:30]}"
