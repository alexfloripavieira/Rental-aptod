"""
URL configuration for app project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path("admin/", admin.site.urls),
    # API REST endpoints
    path("api/v1/", include("aptos.api_urls")),
    # API Authentication (Django REST framework)
    path("api-auth/", include("rest_framework.urls")),
    # Documentação da API (drf-spectacular)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    # (Opcional) Rotas antigas de templates server-side ficaram sob /legacy/
    # path("legacy/", include("aptos.urls")),
    # Catch-all do SPA: envia tudo que não for API/Admin/Static/Media para index.html
    re_path(r"^(?!admin/|api/|static/|media/).*$", TemplateView.as_view(template_name="index.html"), name="frontend"),
] 

# Media serving: database storage or filesystem
if getattr(settings, 'DEFAULT_FILE_STORAGE', '') == 'db_file_storage.storage.DatabaseFileStorage':
    urlpatterns += [path("media/", include("db_file_storage.urls"))]
else:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
