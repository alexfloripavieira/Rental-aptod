---
status: pending
parallelizable: false
blocked_by: ["1.0"]
---

<task_context>
<domain>backend/api</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>7.0,8.0,9.0</unblocks>
</task_context>

# Tarefa 4.0: Implementar endpoints REST API para CRUD de inquilinos

## Visão Geral
Desenvolver API REST completa para gerenciamento de inquilinos usando Django REST Framework, incluindo operações CRUD, busca avançada, filtros e paginação. API deve seguir padrões RESTful e incluir serialização adequada para frontend React.

## Requisitos
- Endpoints CRUD completos para inquilinos
- Serialização otimizada para frontend
- Validação integrada (CPF/CNPJ da tarefa 2.0)
- Sistema de busca e filtros avançados
- Paginação para listas grandes
- Permissões e autenticação
- Documentação API automática
- Tratamento de erros padronizado

## Subtarefas
- [ ] 4.1 Configurar Django REST Framework
- [ ] 4.2 Criar serializers para modelo Inquilino
- [ ] 4.3 Implementar ViewSets para CRUD
- [ ] 4.4 Adicionar sistema de busca e filtros
- [ ] 4.5 Configurar paginação e ordenação
- [ ] 4.6 Implementar permissões e autenticação
- [ ] 4.7 Adicionar tratamento de erros e validação
- [ ] 4.8 Configurar documentação automática da API

## Sequenciamento
- Bloqueado por: 1.0 (Modelo Inquilino criado)
- Desbloqueia: 7.0 (Frontend base), 8.0 (Formulários), 9.0 (Busca)
- Paralelizável: Não (base para frontend)

## Detalhes de Implementação

### Serializers
```python
# aptos/serializers.py
from rest_framework import serializers
from .models import Inquilino, InquilinoApartamento, HistoricoStatus
from .validators import validar_cpf, validar_cnpj

class InquilinoSerializer(serializers.ModelSerializer):
    apartamentos_ativos = serializers.SerializerMethodField()
    documento_principal = serializers.SerializerMethodField()
    tempo_como_inquilino = serializers.SerializerMethodField()

    class Meta:
        model = Inquilino
        fields = [
            'id', 'tipo', 'nome_completo', 'razao_social', 'nome_fantasia',
            'cpf', 'cnpj', 'rg', 'email', 'telefone', 'status',
            'data_nascimento', 'estado_civil', 'profissao', 'renda',
            'inscricao_estadual', 'responsavel_legal', 'endereco_completo',
            'observacoes', 'apartamentos_ativos', 'documento_principal',
            'tempo_como_inquilino', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_apartamentos_ativos(self, obj):
        """Retorna apartamentos com locação ativa"""
        apartamentos = obj.apartamentos.filter(
            inquilinoapartamento__ativo=True
        ).values('id', 'unit_number', 'building_name__name')
        return list(apartamentos)

    def get_documento_principal(self, obj):
        """Retorna CPF ou CNPJ formatado"""
        if obj.tipo == 'PF' and obj.cpf:
            return obj.cpf
        elif obj.tipo == 'PJ' and obj.cnpj:
            return obj.cnpj
        return None

    def get_tempo_como_inquilino(self, obj):
        """Calcula tempo total como inquilino"""
        from datetime import date
        associacoes = obj.inquilinoapartamento_set.all()
        if not associacoes:
            return 0

        total_dias = 0
        for assoc in associacoes:
            inicio = assoc.data_inicio
            fim = assoc.data_fim or date.today()
            total_dias += (fim - inicio).days

        return total_dias

    def validate(self, data):
        """Validação customizada para tipo PF/PJ"""
        tipo = data.get('tipo')

        if tipo == 'PF':
            # Validar campos obrigatórios para PF
            required_fields = ['nome_completo', 'cpf', 'email']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        f'{field} é obrigatório para pessoa física.'
                    )

            # Validar CPF
            if data.get('cpf'):
                try:
                    validar_cpf(data['cpf'])
                except ValidationError as e:
                    raise serializers.ValidationError({'cpf': str(e)})

        elif tipo == 'PJ':
            # Validar campos obrigatórios para PJ
            required_fields = ['razao_social', 'cnpj', 'email']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(
                        f'{field} é obrigatório para pessoa jurídica.'
                    )

            # Validar CNPJ
            if data.get('cnpj'):
                try:
                    validar_cnpj(data['cnpj'])
                except ValidationError as e:
                    raise serializers.ValidationError({'cnpj': str(e)})

        return data

class InquilinoListSerializer(serializers.ModelSerializer):
    """Serializer otimizado para listagem"""
    nome_exibicao = serializers.SerializerMethodField()
    documento = serializers.SerializerMethodField()
    apartamentos_count = serializers.SerializerMethodField()

    class Meta:
        model = Inquilino
        fields = [
            'id', 'tipo', 'nome_exibicao', 'documento', 'email',
            'telefone', 'status', 'apartamentos_count', 'created_at'
        ]

    def get_nome_exibicao(self, obj):
        if obj.tipo == 'PF':
            return obj.nome_completo
        return obj.razao_social or obj.nome_fantasia

    def get_documento(self, obj):
        if obj.tipo == 'PF':
            return obj.cpf
        return obj.cnpj

    def get_apartamentos_count(self, obj):
        return obj.apartamentos.filter(
            inquilinoapartamento__ativo=True
        ).count()
```

### ViewSets
```python
# aptos/views.py
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from .models import Inquilino
from .serializers import InquilinoSerializer, InquilinoListSerializer

class InquilinoFilter(filters.BaseFilterBackend):
    """Filtro customizado para busca avançada"""

    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get('search', '')
        tipo = request.query_params.get('tipo', '')
        status = request.query_params.get('status', '')
        apartamento = request.query_params.get('apartamento', '')

        if search:
            queryset = queryset.filter(
                Q(nome_completo__icontains=search) |
                Q(razao_social__icontains=search) |
                Q(nome_fantasia__icontains=search) |
                Q(cpf__icontains=search) |
                Q(cnpj__icontains=search) |
                Q(email__icontains=search) |
                Q(telefone__icontains=search)
            )

        if tipo:
            queryset = queryset.filter(tipo=tipo)

        if status:
            queryset = queryset.filter(status=status)

        if apartamento:
            queryset = queryset.filter(
                apartamentos__unit_number__icontains=apartamento
            )

        return queryset.distinct()

class InquilinoViewSet(viewsets.ModelViewSet):
    queryset = Inquilino.objects.all().prefetch_related(
        'apartamentos',
        'apartamentos__building_name',
        'historico_status'
    )
    permission_classes = [IsAuthenticated]
    filter_backends = [InquilinoFilter, filters.OrderingFilter]
    ordering_fields = ['created_at', 'nome_completo', 'razao_social', 'status']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return InquilinoListSerializer
        return InquilinoSerializer

    @action(detail=True, methods=['post'])
    def alterar_status(self, request, pk=None):
        """Endpoint para alteração de status"""
        inquilino = self.get_object()
        novo_status = request.data.get('status')
        motivo = request.data.get('motivo', '')

        if novo_status not in dict(Inquilino.STATUS_CHOICES):
            return Response(
                {'error': 'Status inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Registrar no histórico
        HistoricoStatus.objects.create(
            inquilino=inquilino,
            status_anterior=inquilino.status,
            status_novo=novo_status,
            motivo=motivo,
            usuario=request.user
        )

        inquilino.status = novo_status
        inquilino.save()

        return Response({
            'success': True,
            'status': novo_status
        })

    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """Endpoint para estatísticas gerais"""
        total = self.get_queryset().count()
        ativos = self.get_queryset().filter(status='ATIVO').count()
        inadimplentes = self.get_queryset().filter(status='INADIMPLENTE').count()
        pf = self.get_queryset().filter(tipo='PF').count()
        pj = self.get_queryset().filter(tipo='PJ').count()

        return Response({
            'total_inquilinos': total,
            'ativos': ativos,
            'inadimplentes': inadimplentes,
            'pessoa_fisica': pf,
            'pessoa_juridica': pj
        })
```

### URLs
```python
# aptos/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InquilinoViewSet

router = DefaultRouter()
router.register(r'inquilinos', InquilinoViewSet)

urlpatterns = [
    path('api/v1/', include(router.urls)),
    # outros endpoints...
]
```

### Configuração DRF
```python
# app/settings.py
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'django_filters',
    'drf_spectacular',  # Para documentação
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Sistema de Gestão de Inquilinos API',
    'DESCRIPTION': 'API para gerenciamento de inquilinos e apartamentos',
    'VERSION': '1.0.0',
}
```

## Critérios de Sucesso
- [ ] Todos os endpoints CRUD funcionando corretamente
- [ ] Serialização adequada para frontend React
- [ ] Sistema de busca retornando resultados relevantes
- [ ] Filtros funcionando conforme especificado
- [ ] Paginação implementada e otimizada
- [ ] Validações integradas (CPF/CNPJ)
- [ ] Permissões de acesso funcionando
- [ ] Documentação automática da API gerada
- [ ] Testes de API cobrindo cenários principais
- [ ] Performance adequada (< 500ms por request)