from django.http import HttpResponse

def hello(request):
    return HttpResponse("Hello, World!")

# Configure a URL pattern in urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('hello/', views.hello, name='hello'),
]
