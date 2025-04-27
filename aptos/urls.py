# aptos/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("aptos/", views.lista_aptos, name="lista_aptos"),
    path("builders/", views.listar_builders, name="listar_builders"),
]
