from django.contrib import admin
from .models import Post, Like, Comment

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'board', 'title', 'author', 'view_count', 'created_at')
    list_filter = ('board',)
    search_fields = ('title', 'author__username', 'author__nickname')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'post', 'author', 'content', 'created_at')
    search_fields = ('author__username', 'content')
