"""
URLs da API REST para a aplicação aptos
"""
from django.urls import path, include
from .views import (
    health,
    upload_documento,
    download_documento,
    listar_documentos_inquilino,
    validar_documento,
    api_login,
    api_logout,
    api_logout_get,
    current_user,
)
from rest_framework.routers import DefaultRouter
from . import views

# Router para as ViewSets
router = DefaultRouter()
router.register(r'aptos', views.AptosViewSet, basename='aptos')
router.register(r'builders', views.BuildersViewSet, basename='builders')
router.register(r'inquilinos', views.InquilinoViewSet, basename='inquilinos')
router.register(r'status', views.StatusViewSet, basename='status')
router.register(r'associacoes', views.AssociacaoViewSet, basename='associacoes')
router.register(r'relatorios', views.RelatorioViewSet, basename='relatorios')
router.register(r'locadores', views.LocadorViewSet, basename='locadores')

urlpatterns = [
    # API endpoints via router
    path('', include(router.urls)),
    path('health/', health, name='health'),
    # Validação de documentos (para validação em tempo real no frontend)
    path('validar-documento/', validar_documento, name='validar_documento'),
    path('auth/login/', api_login, name='api_login'),
    path('auth/logout/', api_logout, name='api_logout'),
    path('auth/logout-alt/', api_logout_get, name='api_logout_get'),
    path('auth/me/', current_user, name='current_user'),

    # APIs de upload e gestão de documentos
    path('inquilinos/<int:inquilino_id>/upload-documento/', upload_documento, name='upload_documento'),
    path('documentos/<int:documento_id>/download/', download_documento, name='download_documento'),
    path('inquilinos/<int:inquilino_id>/documentos/', listar_documentos_inquilino, name='listar_documentos_inquilino'),

    # API de geração de contratos
    path('contratos/', include('aptos.contratos.urls')),
]
