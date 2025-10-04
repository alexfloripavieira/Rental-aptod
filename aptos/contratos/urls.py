"""
URLs para o modulo de contratos.
"""
from django.urls import path
from .views import GerarContratoView

urlpatterns = [
    path('gerar/', GerarContratoView.as_view(), name='gerar-contrato'),
]
