---
status: pending
parallelizable: false
blocked_by: ["1.0"]
unblocks: ["4.0", "5.0"]
---

<task_context>
<domain>backend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>database</dependencies>
</task_context>

# Tarefa 3.0: Implementação Django REST Framework API

## Visão Geral

Implementar APIs REST completas utilizando Django REST Framework para expor dados de apartamentos e Empreendimentos, mantendo 100% de paridade funcional com o sistema atual e preparando para consumo pelo frontend React.

<requirements>
- Django REST Framework configurado e funcional
- Serializers implementados para todos os models
- ViewSets com filtros, busca e paginação
- CORS configurado para frontend React
- Endpoints RESTful seguindo padrões
- Performance otimizada com select_related/prefetch_related
- Documentação automática da API
- Autenticação SessionAuthentication mantida
</requirements>

## Subtarefas

- [ ] 3.1 Configurar Django REST Framework
- [ ] 3.2 Implementar Serializers para Models
- [ ] 3.3 Criar ViewSets com filtros e busca
- [ ] 3.4 Configurar paginação e CORS
- [ ] 3.5 Implementar endpoints de media files
- [ ] 3.6 Otimizar queries para performance
- [ ] 3.7 Configurar documentação automática API
- [ ] 3.8 Implementar testes unitários API

## Detalhes de Implementação

### Serializers (conforme techspec.md):

```python
# serializers.py
from rest_framework import serializers
from .models import Builders, Aptos, Foto, BuilderFoto

class BuilderFotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = BuilderFoto
        fields = ['id', 'photos']

class FotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Foto
        fields = ['id', 'photos']

class BuildersSerializer(serializers.ModelSerializer):
    builder_fotos = BuilderFotoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Builders
        fields = '__all__'

class AptosSerializer(serializers.ModelSerializer):
    fotos = FotoSerializer(many=True, read_only=True)
    building_name = BuildersSerializer(read_only=True)
    
    class Meta:
        model = Aptos
        fields = '__all__'
```

### ViewSets com Filtros:

```python
# views.py
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import AptosSerializer, BuildersSerializer
from .models import Aptos, Builders

class AptosViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para apartamentos com filtros e busca
    """
    serializer_class = AptosSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = [
        'is_available', 'is_furnished', 'number_of_bedrooms', 
        'number_of_bathrooms', 'has_parking', 'has_air_conditioning'
    ]
    search_fields = ['unit_number', 'description', 'building_name__name']
    
    def get_queryset(self):
        return Aptos.objects.select_related('building_name').prefetch_related('fotos')

class BuildersViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para Empreendimentos
    """
    serializer_class = BuildersSerializer
    
    def get_queryset(self):
        return Builders.objects.prefetch_related('builder_fotos')
```

### URL Configuration:

```python
# urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register(r'aptos', views.AptosViewSet, basename='aptos')
router.register(r'builders', views.BuildersViewSet, basename='builders')

urlpatterns = [
    path('api/v1/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]
```

### Settings Configuration:

```python
# settings.py
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework',
    'django_filters',
    'corsheaders',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
    ]
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React dev server
    "https://yourdomain.com",  # Production domain
]
CORS_ALLOW_CREDENTIALS = True
```

### API Endpoints Resultantes:

- `GET /api/v1/aptos/` - Lista apartamentos com filtros
- `GET /api/v1/aptos/{id}/` - Detalhes apartamento específico
- `GET /api/v1/builders/` - Lista Empreendimentos
- `GET /api/v1/builders/{id}/` - Detalhes construtora específica

### Query Parameters Suportados:

- `?is_available=true` - Filtrar por disponibilidade
- `?number_of_bedrooms=2` - Filtrar por número de quartos
- `?search=centro` - Busca em unit_number, description, building_name
- `?page=2` - Paginação
- `?has_parking=true` - Filtrar por estacionamento

## Critérios de Sucesso

- Todos endpoints REST funcionais e retornando dados corretos
- Filtros e busca funcionando conforme especificação
- Paginação implementada e funcional
- Performance queries otimizada (<100ms média)
- CORS configurado e permitindo acesso React
- Documentação automática gerada e acessível
- Testes unitários cobrindo todos endpoints (>80% coverage)
- Serialização JSON correta com related objects
- Autenticação SessionAuthentication funcional
- Media files URLs corretas nos responses