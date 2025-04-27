# aptos/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("", views.lista_aptos, name="lista_aptos"),
]
