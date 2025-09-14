"""
URLs da API REST para a aplicação aptos
"""
from django.urls import path, include
from .views import health
from rest_framework.routers import DefaultRouter
from . import views

# Router para as ViewSets
router = DefaultRouter()
router.register(r'aptos', views.AptosViewSet, basename='aptos')
router.register(r'builders', views.BuildersViewSet, basename='builders')

urlpatterns = [
    # API endpoints via router
    path('', include(router.urls)),
    path('health/', health, name='health'),
]
