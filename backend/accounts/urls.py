from django.contrib import admin
from django.urls import path, include
from accounts import views

urlpatterns = [
    path('api/ping/',views.ping, name="ping")
]