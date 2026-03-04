from django.http import JsonResponse
from django.shortcuts import render

# Create your views here.

def ping(request):
    # return JsonResponse({"ok": True, "app": "accounts"})
    return JsonResponse({"message": "hello world! "})

