# aptos/urls.py
from django.urls import path

from . import views

urlpatterns = [
    path("aptos/", views.lista_aptos, name="lista_aptos"),
    path("builders/", views.listar_builders, name="listar_builders"),

    # APIs de validação de documentos
    path("api/validar-documento/", views.validar_documento, name="validar_documento"),
    path("api/validar-cpf/", views.validar_cpf_endpoint, name="validar_cpf"),
    path("api/validar-cnpj/", views.validar_cnpj_endpoint, name="validar_cnpj"),
    path("api/documentos-teste/", views.documentos_teste, name="documentos_teste"),

    # APIs de upload e gestão de documentos
    path("api/inquilinos/<int:inquilino_id>/upload-documento/", views.upload_documento, name="upload_documento"),
    path("api/documentos/<int:documento_id>/download/", views.download_documento, name="download_documento"),
    path("api/inquilinos/<int:inquilino_id>/documentos/", views.listar_documentos_inquilino, name="listar_documentos_inquilino"),
]
