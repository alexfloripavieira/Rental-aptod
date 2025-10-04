import json
from datetime import date, datetime

from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import ValidationError
from django.db import IntegrityError, models
from django.db.models import Q
from django.http import HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from rest_framework import filters, serializers, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.authentication import SessionAuthentication
from django.conf import settings
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from aptos.models import (
    Aptos,
    Builders,
    DocumentoInquilino,
    HistoricoAssociacao,
    HistoricoStatus,
    Inquilino,
    InquilinoApartamento,
    Locador,
    MetricaOcupacao,
    RegraStatus,
    RelatorioExecucao,
    RelatorioTemplate,
    StatusInquilino,
)
from aptos.serializers import (
    AptosListSerializer,
    AptosSerializer,
    AssociacaoListSerializer,
    AssociacaoSerializer,
    BuilderFotoSerializer,
    BuildersSerializer,
    FotoSerializer,
    HistoricoAssociacaoSerializer,
    HistoricoStatusSerializer,
    InquilinoListSerializer,
    InquilinoSerializer,
    LocadorSerializer,
)
from aptos.utils import formatar_cnpj, formatar_cpf, limpar_documento
from aptos.validators import validar_cnpj, validar_cpf
from aptos.decorators import cache_api_response


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """SessionAuthentication sem verificação CSRF (apenas para dev/endpoints específicos).

    Mantém sessão e permissões, mas ignora enforce_csrf em métodos não seguros.
    """

    def enforce_csrf(self, request):
        return  # ignora verificação CSRF


def lista_aptos(request):
    aptos = Aptos.objects.select_related("building_name").prefetch_related("fotos")
    return render(request, "aptos/aptos_lista.html", {"aptos": aptos})


def listar_builders(request):
    builders = Builders.objects.prefetch_related("builder_fotos").all()
    return render(request, "aptos/builders_lista.html", {"builders": builders})


class LocadorViewSet(viewsets.ModelViewSet):
    """CRUD de Locadores (proprietários) para preencher contratos."""

    queryset = Locador.objects.all().order_by('-updated_at')
    serializer_class = LocadorSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields = ['nome_completo', 'cpf', 'email']
    ordering_fields = ['nome_completo', 'updated_at', 'created_at']
    ordering = ['nome_completo']


# ===== AUTENTICAÇÃO SPA =====


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"error": "Informe usuário e senha."}, status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {"error": "Credenciais inválidas."}, status=status.HTTP_400_BAD_REQUEST
        )

    if not user.is_superuser:
        return Response(
            {"error": "Acesso restrito a superusuários."},
            status=status.HTTP_403_FORBIDDEN,
        )

    login(request, user)
    get_token(request)
    return Response(
        {
            "success": True,
            "username": user.username,
            "is_superuser": user.is_superuser,
        }
    )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def api_logout(request):
    logout(request)
    return Response({"success": True})


@api_view(["GET"])
@permission_classes([AllowAny])
def api_logout_get(request):
    """Logout via GET - sem CSRF para facilitar debug"""
    logout(request)
    return Response({"success": True, "method": "GET"})


@api_view(["GET"])
@permission_classes([AllowAny])
def current_user(request):
    get_token(request)
    if request.user.is_authenticated:
        return Response(
            {
                "is_authenticated": True,
                "is_superuser": request.user.is_superuser,
                "username": request.user.username,
            }
        )
    return Response(
        {"is_authenticated": False, "is_superuser": False, "username": None}
    )


# API ViewSets


@extend_schema_view(
    list=extend_schema(
        summary="Lista todos os apartamentos",
        description="Retorna lista paginada de apartamentos com filtros disponíveis",
    ),
    retrieve=extend_schema(
        summary="Detalhes do apartamento",
        description="Retorna detalhes completos de um apartamento específico incluindo fotos",
    ),
)
class AptosViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para apartamentos com filtros, busca e paginação.

    Filtros disponíveis:
    - is_available: filtrar por disponibilidade
    - is_furnished: filtrar por apartamentos mobiliados
    - number_of_bedrooms: filtrar por número de quartos
    - number_of_bathrooms: filtrar por número de banheiros
    - has_parking: filtrar por vaga de estacionamento
    - has_air_conditioning: filtrar por ar condicionado
    - rental_price_min: preço mínimo de aluguel
    - rental_price_max: preço máximo de aluguel

    Busca:
    - Busca em unit_number, description, building_name__name

    Ordenação:
    - rental_price, number_of_bedrooms, created_at
    """

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = {
        "is_available": ["exact"],
        "is_furnished": ["exact"],
        "number_of_bedrooms": ["exact", "gte", "lte"],
        "number_of_bathrooms": ["exact", "gte", "lte"],
        "has_parking": ["exact"],
        "has_air_conditioning": ["exact"],
        "has_laundry": ["exact"],
        "has_internet": ["exact"],
        "is_pets_allowed": ["exact"],
        "rental_price": ["gte", "lte"],
    }
    search_fields = [
        "unit_number",
        "description",
        "building_name__name",
        "building_name__neighborhood",
    ]
    ordering_fields = ["rental_price", "number_of_bedrooms", "created_at", "updated_at"]
    ordering = ["-created_at"]  # Ordenação padrão

    def get_queryset(self):
        """
        Otimiza queries com select_related e prefetch_related
        """
        return Aptos.objects.select_related("building_name").prefetch_related(
            "fotos", "building_name__builder_fotos"
        )

    def get_serializer_class(self):
        """
        Usa serializer otimizado para listagem e completo para detalhes
        """
        if self.action == "list":
            return AptosListSerializer
        return AptosSerializer

    @extend_schema(
        summary="Apartamentos disponíveis",
        description="Retorna apenas apartamentos disponíveis para aluguel",
    )
    @action(detail=False, methods=["get"])
    def available(self, request):
        """Endpoint para listar apenas apartamentos disponíveis"""
        queryset = self.get_queryset().filter(is_available=True)
        serializer = AptosListSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        summary="Estatísticas de apartamentos",
        description="Retorna estatísticas gerais dos apartamentos",
    )
    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Endpoint para estatísticas dos apartamentos"""
        queryset = self.get_queryset()

        stats = {
            "total": queryset.count(),
            "available": queryset.filter(is_available=True).count(),
            "furnished": queryset.filter(is_furnished=True).count(),
            "with_parking": queryset.filter(has_parking=True).count(),
            "average_price": queryset.aggregate(avg_price=models.Avg("rental_price"))[
                "avg_price"
            ],
            "bedrooms_distribution": list(
                queryset.values("number_of_bedrooms")
                .annotate(count=models.Count("id"))
                .order_by("number_of_bedrooms")
            ),
        }

        return Response(stats)


@extend_schema_view(
    list=extend_schema(
        summary="Lista todas as Empreendimentos",
        description="Retorna lista de Empreendimentos com suas fotos",
    ),
    retrieve=extend_schema(
        summary="Detalhes da construtora",
        description="Retorna detalhes completos de uma construtora específica",
    ),
)
class BuildersViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para Empreendimentos.

    Filtros disponíveis:
    - city: filtrar por cidade
    - state: filtrar por estado

    Busca:
    - Busca em name, city, neighborhood, street
    """

    serializer_class = BuildersSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["city", "state", "neighborhood"]
    search_fields = ["name", "city", "neighborhood", "street"]
    ordering_fields = ["name", "city", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        """
        Otimiza queries com prefetch_related para fotos
        """
        return Builders.objects.prefetch_related("builder_fotos", "aptos_building_name")

    @extend_schema(
        summary="Apartamentos da construtora",
        description="Retorna todos os apartamentos de uma construtora específica",
    )
    @action(detail=True, methods=["get"])
    def apartments(self, request, pk=None):
        """Endpoint para listar apartamentos de uma construtora específica"""
        builder = self.get_object()
        apartments = builder.aptos_building_name.select_related(
            "building_name"
        ).prefetch_related("fotos")
        serializer = AptosListSerializer(
            apartments, many=True, context={"request": request}
        )
        return Response(serializer.data)


# Sistema de filtros customizado para Inquilinos
class InquilinoFilter(filters.BaseFilterBackend):
    """Filtro customizado para busca avançada de inquilinos"""

    def filter_queryset(self, request, queryset, view):
        search = request.query_params.get("search", "")
        tipo = request.query_params.get("tipo", "")
        status = request.query_params.get("status", "")
        apartamento = request.query_params.get("apartamento", "")

        if search:
            queryset = queryset.filter(
                Q(nome_completo__icontains=search)
                | Q(razao_social__icontains=search)
                | Q(nome_fantasia__icontains=search)
                | Q(cpf__icontains=search.replace(".", "").replace("-", ""))
                | Q(
                    cnpj__icontains=search.replace(".", "")
                    .replace("/", "")
                    .replace("-", "")
                )
                | Q(email__icontains=search)
                | Q(telefone__icontains=search)
            )

        if tipo:
            queryset = queryset.filter(tipo=tipo)

        if status:
            queryset = queryset.filter(status=status)

        if apartamento:
            queryset = queryset.filter(apartamentos__unit_number__icontains=apartamento)

        return queryset.distinct()


@extend_schema_view(
    list=extend_schema(
        summary="Lista todos os inquilinos",
        description="Retorna lista paginada de inquilinos com filtros e busca",
        parameters=[
            OpenApiParameter(
                name="search",
                type=str,
                description="Busca por nome, documento, email ou telefone",
            ),
            OpenApiParameter(
                name="tipo",
                type=str,
                enum=["PF", "PJ"],
                description="Filtrar por tipo (PF=Pessoa Física, PJ=Pessoa Jurídica)",
            ),
            OpenApiParameter(
                name="status",
                type=str,
                enum=["ATIVO", "INATIVO", "INADIMPLENTE", "BLOQUEADO"],
                description="Filtrar por status",
            ),
            OpenApiParameter(
                name="apartamento",
                type=str,
                description="Filtrar por número do apartamento",
            ),
        ],
    ),
    create=extend_schema(
        summary="Criar novo inquilino",
        description="Cria um novo inquilino (pessoa física ou jurídica)",
    ),
    retrieve=extend_schema(
        summary="Detalhes do inquilino",
        description="Retorna detalhes completos de um inquilino específico",
    ),
    update=extend_schema(
        summary="Atualizar inquilino",
        description="Atualiza todas as informações de um inquilino",
    ),
    partial_update=extend_schema(
        summary="Atualização parcial do inquilino",
        description="Atualiza campos específicos de um inquilino",
    ),
    destroy=extend_schema(
        summary="Excluir inquilino", description="Remove um inquilino do sistema"
    ),
)
class InquilinoViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gestão de inquilinos.

    Oferece operações CRUD completas com:
    - Busca avançada por nome, documento, email, telefone
    - Filtros por tipo (PF/PJ), status, apartamento
    - Paginação automática
    - Validação integrada de CPF/CNPJ
    - Endpoints especiais para alteração de status e estatísticas
    """

    queryset = Inquilino.objects.get_list_optimized()
    # Desabilita verificação de CSRF para chamadas via SessionAuthentication (necessário para frontend dev em outra origem)
    class CsrfExemptSessionAuthentication(SessionAuthentication):
        def enforce_csrf(self, request):
            return

    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAdminUser]
    filter_backends = [InquilinoFilter, filters.OrderingFilter]
    ordering_fields = ["created_at", "nome_completo", "razao_social", "status"]
    ordering = ["-created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return InquilinoListSerializer
        return InquilinoSerializer

    @extend_schema(
        summary="Alterar status do inquilino",
        description="Altera o status de um inquilino e registra no histórico",
        request=inline_serializer(
            name="AlterarStatusRequest",
            fields={
                "status": serializers.ChoiceField(choices=Inquilino.STATUS_CHOICES),
                "motivo": serializers.CharField(max_length=500, required=False),
            },
        ),
        responses={
            200: inline_serializer(
                name="AlterarStatusResponse",
                fields={
                    "success": serializers.BooleanField(),
                    "status": serializers.CharField(),
                    "message": serializers.CharField(),
                },
            )
        },
    )
    @action(detail=True, methods=["post"])
    def alterar_status(self, request, pk=None):
        """Endpoint para alteração de status com histórico"""
        inquilino = self.get_object()
        novo_status = request.data.get("status")
        motivo = request.data.get("motivo", "")

        if novo_status not in dict(Inquilino.STATUS_CHOICES):
            return Response(
                {"error": "Status inválido"}, status=status.HTTP_400_BAD_REQUEST
            )

        if inquilino.status == novo_status:
            return Response(
                {"error": "Status já é o mesmo"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Registrar no histórico
        HistoricoStatus.objects.create(
            inquilino=inquilino,
            status_anterior=inquilino.status,
            status_novo=novo_status,
            motivo=motivo,
            usuario=request.user if request.user.is_authenticated else None,
        )

        status_anterior = inquilino.status
        inquilino.status = novo_status
        inquilino.save()

        return Response(
            {
                "success": True,
                "status": novo_status,
                "message": f"Status alterado de {status_anterior} para {novo_status}",
            }
        )

    @extend_schema(
        summary="Estatísticas gerais de inquilinos",
        description="Retorna estatísticas agregadas dos inquilinos",
        responses={
            200: inline_serializer(
                name="EstatisticasResponse",
                fields={
                    "total_inquilinos": serializers.IntegerField(),
                    "ativos": serializers.IntegerField(),
                    "inativos": serializers.IntegerField(),
                    "inadimplentes": serializers.IntegerField(),
                    "bloqueados": serializers.IntegerField(),
                    "pessoa_fisica": serializers.IntegerField(),
                    "pessoa_juridica": serializers.IntegerField(),
                },
            )
        },
    )
    @action(detail=False, methods=["get"])
    @cache_api_response(timeout=600, key_prefix='inquilinos_stats')
    def estatisticas(self, request):
        """Endpoint para estatísticas gerais com cache de 10 minutos"""
        # Usar métodos otimizados do manager
        metrics = Inquilino.objects.get_dashboard_metrics(use_cache=True)
        ocupacao = Inquilino.objects.get_ocupacao_metrics(use_cache=True)

        return Response(
            {
                "total_inquilinos": metrics['total_inquilinos'],
                "inquilinos_ativos": metrics['ativos'],
                "inquilinos_inativos": metrics['inativos'],
                "inquilinos_inadimplentes": metrics['inadimplentes'],
                "inquilinos_bloqueados": metrics['bloqueados'],
                "inquilinos_pf": metrics['pessoa_fisica'],
                "inquilinos_pj": metrics['pessoa_juridica'],
                "apartamentos_ocupados": ocupacao['ocupados'],
                "taxa_ocupacao": round(ocupacao['taxa_ocupacao'], 1),
            }
        )

    @extend_schema(
        summary="Histórico de status do inquilino",
        description="Retorna histórico completo de alterações de status",
    )
    @action(detail=True, methods=["get"])
    def historico_status(self, request, pk=None):
        """Endpoint para histórico de status"""
        inquilino = self.get_object()
        # Ordena pelo carimbo de tempo de criação
        historico = inquilino.historico_status.all().order_by("-timestamp")
        serializer = HistoricoStatusSerializer(historico, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Apartamentos do inquilino",
        description="Retorna apartamentos associados ao inquilino (ativos e histórico)",
    )
    @action(detail=True, methods=["get"])
    def apartamentos(self, request, pk=None):
        """Endpoint para apartamentos do inquilino"""
        inquilino = self.get_object()
        associacoes = inquilino.associacoes_apartamento.all().order_by("-data_inicio")
        serializer = InquilinoApartamentoSerializer(associacoes, many=True)
        return Response(serializer.data)


class StatusViewSet(viewsets.ModelViewSet):
    """ViewSet para gestão de status de inquilinos"""

    queryset = HistoricoStatus.objects.all()
    serializer_class = HistoricoStatusSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=["post"])
    def alterar_status_inquilino(self, request):
        """Altera status de um inquilino"""
        inquilino_id = request.data.get("inquilino_id")
        novo_status = request.data.get("status")
        motivo = request.data.get("motivo", "")
        categoria = request.data.get("categoria", "MANUAL")

        try:
            inquilino = Inquilino.objects.get(id=inquilino_id)

            # Verificar permissões
            if not self._can_change_status(request.user, inquilino, novo_status):
                return Response(
                    {"error": "Sem permissão para alterar este status"},
                    status=status.HTTP_403_FORBIDDEN,
                )

            # Executar transição
            StatusInquilino.objects.transition_to(
                inquilino=inquilino,
                novo_status=novo_status,
                motivo=motivo,
                usuario=request.user if request.user.is_authenticated else None,
            )

            # Registrar metadados da requisição
            historico = HistoricoStatus.objects.filter(inquilino=inquilino).first()

            if historico:
                historico.ip_address = self._get_client_ip(request)
                historico.user_agent = request.META.get("HTTP_USER_AGENT", "")
                historico.categoria_motivo = categoria
                historico.save()

            return Response(
                {
                    "success": True,
                    "message": f"Status alterado para {novo_status}",
                    "status_anterior": inquilino.status,
                    "status_novo": novo_status,
                }
            )

        except Inquilino.DoesNotExist:
            return Response(
                {"error": "Inquilino não encontrado"}, status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def historico_inquilino(self, request):
        """Retorna histórico de status de um inquilino"""
        inquilino_id = request.query_params.get("inquilino_id")

        if not inquilino_id:
            return Response(
                {"error": "inquilino_id é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        historico = HistoricoStatus.objects.filter(
            inquilino_id=inquilino_id
        ).select_related("usuario")

        serializer = HistoricoStatusSerializer(historico, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[AllowAny])
    def relatorio_status(self, request):
        """Relatório de distribuição de status"""
        from datetime import timedelta

        from django.db.models import Count
        from django.utils import timezone

        # Distribuição atual
        distribuicao = (
            Inquilino.objects.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        # Mudanças no último mês
        ultimo_mes = timezone.now() - timedelta(days=30)
        mudancas_recentes = (
            HistoricoStatus.objects.filter(timestamp__gte=ultimo_mes)
            .values("status_novo")
            .annotate(count=Count("id"))
            .order_by("status_novo")
        )

        # Top motivos de mudança
        top_motivos = (
            HistoricoStatus.objects.filter(timestamp__gte=ultimo_mes)
            .values("categoria_motivo")
            .annotate(count=Count("id"))
            .order_by("-count")[:5]
        )

        return Response(
            {
                "distribuicao_atual": list(distribuicao),
                "mudancas_ultimo_mes": list(mudancas_recentes),
                "top_motivos": list(top_motivos),
                "total_inquilinos": Inquilino.objects.count(),
                "ativos": Inquilino.objects.filter(status="ATIVO").count(),
                "inadimplentes": Inquilino.objects.filter(
                    status="INADIMPLENTE"
                ).count(),
            }
        )

    @action(detail=False, methods=["post"])
    def aplicar_regras_automaticas(self, request):
        """Aplica regras automatizadas de status"""
        regras_ativas = RegraStatus.objects.filter(ativa=True, automatica=True)
        inquilinos_processados = 0
        alteracoes_realizadas = 0

        for regra in regras_ativas:
            inquilinos = Inquilino.objects.all()

            for inquilino in inquilinos:
                inquilinos_processados += 1

                if regra.avaliar_inquilino(inquilino):
                    regra.executar_acao(
                        inquilino,
                        request.user if request.user.is_authenticated else None,
                    )
                    alteracoes_realizadas += 1

        return Response(
            {
                "inquilinos_processados": inquilinos_processados,
                "alteracoes_realizadas": alteracoes_realizadas,
                "regras_aplicadas": regras_ativas.count(),
            }
        )

    def _can_change_status(self, user, inquilino, novo_status):
        """Verifica se usuário pode alterar status"""
        if not getattr(user, "is_authenticated", False):
            return True

        if novo_status == "BLOQUEADO":
            return user.has_perm("aptos.can_block_inquilino")

        return user.has_perm("aptos.change_inquilino")

    def _get_client_ip(self, request):
        """Obtém IP do cliente"""
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0]
        else:
            ip = request.META.get("REMOTE_ADDR")
        return ip


@api_view(["GET"])
def health(request):
    """Lightweight health endpoint for load balancers and deploy checks."""
    return JsonResponse(
        {
            "status": "ok",
            "service": "aptos",
            "timestamp": request._request.META.get("REQUEST_TIME", None),
        }
    )


# ===== VALIDAÇÃO DE DOCUMENTOS EM TEMPO REAL =====


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def validar_documento(request):
    """
    Endpoint para validação em tempo real de CPF/CNPJ.

    Body:
    {
        "documento": "123.456.789-01",
        "tipo": "CPF"
    }

    Response:
    {
        "valid": true,
        "formatted": "123.456.789-01",
        "exists": false,
        "message": "Documento válido"
    }
    """
    if request.method != "POST":
        return JsonResponse(
            {"valid": False, "error": "Método não permitido"}, status=405
        )

    # Permitir acesso sem autenticação para facilitar validação

    try:
        data = json.loads(request.body)
        documento = data.get("documento", "").strip()
        tipo = data.get("tipo", "").upper()
        inquilino_id = data.get(
            "inquilino_id"
        )  # Para excluir da verificação de unicidade

        if not documento:
            return JsonResponse({"valid": False, "error": "Documento é obrigatório"})

        if tipo not in ["CPF", "CNPJ"]:
            return JsonResponse({"valid": False, "error": "Tipo deve ser CPF ou CNPJ"})

        # Validar documento
        try:
            if tipo == "CPF":
                documento_limpo = validar_cpf(documento)
                formatado = formatar_cpf(documento_limpo)
                campo_busca = "cpf"
            else:  # CNPJ
                documento_limpo = validar_cnpj(documento)
                formatado = formatar_cnpj(documento_limpo)
                campo_busca = "cnpj"

        except ValidationError as e:
            return JsonResponse({"valid": False, "error": str(e.message)})

        # Verificar se documento já existe
        queryset = Inquilino.objects.filter(**{campo_busca: documento_limpo})

        # Excluir o próprio inquilino se estiver editando
        if inquilino_id:
            queryset = queryset.exclude(pk=inquilino_id)

        exists = queryset.exists()
        existing_inquilino = None

        if exists:
            existing_inquilino = queryset.first()

        return JsonResponse(
            {
                "valid": True,
                "formatted": formatado,
                "documento_limpo": documento_limpo,
                "exists": exists,
                "existing_inquilino": {
                    "id": existing_inquilino.id,
                    "nome": existing_inquilino.nome_principal,
                    "status": existing_inquilino.status,
                }
                if existing_inquilino
                else None,
                "message": "Documento válido",
            }
        )

    except json.JSONDecodeError:
        return JsonResponse({"valid": False, "error": "JSON inválido"}, status=400)

    except Exception as e:
        return JsonResponse(
            {"valid": False, "error": f"Erro interno: {str(e)}"}, status=500
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def validar_cpf_endpoint(request):
    """
    Endpoint específico para validação de CPF.

    Body:
    {
        "cpf": "123.456.789-01",
        "inquilino_id": 123  // opcional, para edição
    }
    """
    if request.method != "POST":
        return JsonResponse(
            {"valid": False, "error": "Método não permitido"}, status=405
        )

    # Permitir acesso sem autenticação para facilitar validação

    try:
        data = json.loads(request.body)
        cpf = data.get("cpf", "").strip()
        inquilino_id = data.get("inquilino_id")

        if not cpf:
            return JsonResponse({"valid": False, "error": "CPF é obrigatório"})

        try:
            cpf_limpo = validar_cpf(cpf)
            cpf_formatado = formatar_cpf(cpf_limpo)

            # Verificar unicidade
            queryset = Inquilino.objects.filter(cpf=cpf_limpo)
            if inquilino_id:
                queryset = queryset.exclude(pk=inquilino_id)

            exists = queryset.exists()

            return JsonResponse(
                {
                    "valid": True,
                    "cpf_limpo": cpf_limpo,
                    "cpf_formatado": cpf_formatado,
                    "exists": exists,
                    "message": "CPF válido",
                }
            )

        except ValidationError as e:
            return JsonResponse({"valid": False, "error": str(e.message)})

    except json.JSONDecodeError:
        return JsonResponse({"valid": False, "error": "JSON inválido"}, status=400)

    except Exception as e:
        return JsonResponse(
            {"valid": False, "error": f"Erro interno: {str(e)}"}, status=500
        )


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def validar_cnpj_endpoint(request):
    """
    Endpoint específico para validação de CNPJ.

    Body:
    {
        "cnpj": "12.345.678/0001-95",
        "inquilino_id": 123  // opcional, para edição
    }
    """
    if request.method != "POST":
        return JsonResponse(
            {"valid": False, "error": "Método não permitido"}, status=405
        )

    # Permitir acesso sem autenticação para facilitar validação

    try:
        data = json.loads(request.body)
        cnpj = data.get("cnpj", "").strip()
        inquilino_id = data.get("inquilino_id")

        if not cnpj:
            return JsonResponse({"valid": False, "error": "CNPJ é obrigatório"})

        try:
            cnpj_limpo = validar_cnpj(cnpj)
            cnpj_formatado = formatar_cnpj(cnpj_limpo)

            # Verificar unicidade
            queryset = Inquilino.objects.filter(cnpj=cnpj_limpo)
            if inquilino_id:
                queryset = queryset.exclude(pk=inquilino_id)

            exists = queryset.exists()

            return JsonResponse(
                {
                    "valid": True,
                    "cnpj_limpo": cnpj_limpo,
                    "cnpj_formatado": cnpj_formatado,
                    "exists": exists,
                    "message": "CNPJ válido",
                }
            )

        except ValidationError as e:
            return JsonResponse({"valid": False, "error": str(e.message)})

    except json.JSONDecodeError:
        return JsonResponse({"valid": False, "error": "JSON inválido"}, status=400)

    except Exception as e:
        return JsonResponse(
            {"valid": False, "error": f"Erro interno: {str(e)}"}, status=500
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def documentos_teste(request):
    """
    Endpoint para obter documentos válidos para testes.
    """
    from .utils import gerar_cnpjs_teste, gerar_cpfs_teste

    return JsonResponse(
        {
            "cpfs_validos": [formatar_cpf(cpf) for cpf in gerar_cpfs_teste()],
            "cnpjs_validos": [formatar_cnpj(cnpj) for cnpj in gerar_cnpjs_teste()],
            "message": "Documentos para testes - não usar em produção",
        }
    )


@csrf_exempt
def upload_documento(request, inquilino_id):
    """Upload de documento para inquilino"""
    if not request.user.is_authenticated or not (
        request.user.is_superuser or request.user.is_staff
    ):
        return JsonResponse(
            {"success": False, "error": "Acesso não autorizado"}, status=403
        )

    if request.method == "POST":
        try:
            inquilino = Inquilino.objects.get(id=inquilino_id)
            arquivo = request.FILES.get("arquivo")
            tipo_documento = request.POST.get("tipo_documento")

            if not arquivo:
                return JsonResponse(
                    {"success": False, "error": "Arquivo não fornecido"}
                )

            if not tipo_documento:
                return JsonResponse(
                    {"success": False, "error": "Tipo de documento não fornecido"}
                )

            # Verificar versão
            ultima_versao = (
                DocumentoInquilino.objects.filter(
                    inquilino=inquilino, tipo_documento=tipo_documento
                ).aggregate(max_versao=models.Max("versao"))["max_versao"]
                or 0
            )

            # Criar documento
            documento = DocumentoInquilino.objects.create(
                inquilino=inquilino,
                tipo_documento=tipo_documento,
                arquivo=arquivo,
                versao=ultima_versao + 1,
                uploaded_by=request.user if request.user.is_authenticated else None,
            )

            return JsonResponse(
                {
                    "success": True,
                    "documento_id": documento.id,
                    "versao": documento.versao,
                    "nome_original": documento.nome_original,
                    "tamanho": documento.get_tamanho_formatado(),
                }
            )

        except Inquilino.DoesNotExist:
            return JsonResponse({"success": False, "error": "Inquilino não encontrado"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse({"success": False, "error": "Método não permitido"})


def download_documento(request, documento_id):
    """Download de documento com controle de acesso"""
    if not request.user.is_authenticated or not (
        request.user.is_superuser or request.user.is_staff
    ):
        return HttpResponse("Sem permissão", status=403)

    try:
        documento = DocumentoInquilino.objects.get(id=documento_id, ativo=True)

        response = HttpResponse(
            documento.arquivo.read(),
            content_type=documento.mime_type or "application/octet-stream",
        )
        response["Content-Disposition"] = (
            f'attachment; filename="{documento.nome_original}"'
        )
        return response

    except DocumentoInquilino.DoesNotExist:
        return HttpResponse("Documento não encontrado", status=404)
    except Exception as e:
        return HttpResponse(f"Erro interno: {str(e)}", status=500)


def listar_documentos_inquilino(request, inquilino_id):
    """Lista todos os documentos de um inquilino"""
    if not request.user.is_authenticated or not (
        request.user.is_superuser or request.user.is_staff
    ):
        return JsonResponse(
            {"success": False, "error": "Acesso não autorizado"}, status=403
        )
    try:
        inquilino = Inquilino.objects.get(id=inquilino_id)
        documentos = DocumentoInquilino.objects.filter(
            inquilino=inquilino, ativo=True
        ).order_by("-uploaded_at")

        documentos_data = []
        for doc in documentos:
            documentos_data.append(
                {
                    "id": doc.id,
                    "tipo_documento": doc.tipo_documento,
                    "tipo_documento_display": doc.get_tipo_documento_display(),
                    "nome_original": doc.nome_original,
                    "versao": doc.versao,
                    "tamanho": doc.get_tamanho_formatado(),
                    "uploaded_at": doc.uploaded_at.isoformat(),
                    "created_at": doc.uploaded_at.isoformat(),
                    "uploaded_by": doc.uploaded_by.username
                    if doc.uploaded_by
                    else None,
                }
            )

        return JsonResponse(
            {
                "success": True,
                "inquilino": inquilino.nome_principal,
                "documentos": documentos_data,
            }
        )

    except Inquilino.DoesNotExist:
        return JsonResponse({"success": False, "error": "Inquilino não encontrado"})
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)})


class AssociacaoViewSet(viewsets.ModelViewSet):
    queryset = InquilinoApartamento.objects.select_related(
        "inquilino", "apartamento", "apartamento__building_name"
    ).all()
    permission_classes = [IsAdminUser]
    authentication_classes = [CsrfExemptSessionAuthentication]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["ativo", "inquilino", "apartamento"]
    ordering_fields = ["data_inicio", "data_fim", "created_at"]
    ordering = ["-data_inicio"]

    def get_serializer_class(self):
        if self.action == "list":
            return AssociacaoListSerializer
        return AssociacaoSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        try:
            associacao = serializer.save(created_by=user)
        except IntegrityError:
            raise DRFValidationError(
                "Apartamento indisponível. Já existe uma associação ativa para este imóvel."
            )

        HistoricoAssociacao.objects.create(
            associacao=associacao,
            acao="CRIADA",
            detalhes={
                "data_inicio": str(associacao.data_inicio),
                "data_fim": str(associacao.data_fim) if associacao.data_fim else None,
                "valor_aluguel": str(associacao.valor_aluguel)
                if associacao.valor_aluguel
                else None,
            },
            usuario=user,
        )

    def perform_update(self, serializer):
        associacao_anterior = self.get_object()
        dados_anteriores = {
            "data_inicio": str(associacao_anterior.data_inicio),
            "data_fim": str(associacao_anterior.data_fim)
            if associacao_anterior.data_fim
            else None,
            "valor_aluguel": str(associacao_anterior.valor_aluguel)
            if associacao_anterior.valor_aluguel
            else None,
            "ativo": associacao_anterior.ativo,
        }

        user = self.request.user if self.request.user.is_authenticated else None
        associacao = serializer.save(updated_by=user)

        # Registrar no histórico
        HistoricoAssociacao.objects.create(
            associacao=associacao,
            acao="ATUALIZADA",
            detalhes={
                "anterior": dados_anteriores,
                "novo": {
                    "data_inicio": str(associacao.data_inicio),
                    "data_fim": str(associacao.data_fim)
                    if associacao.data_fim
                    else None,
                    "valor_aluguel": str(associacao.valor_aluguel)
                    if associacao.valor_aluguel
                    else None,
                    "ativo": associacao.ativo,
                },
            },
            usuario=user,
        )

    @action(detail=True, methods=["post"])
    def finalizar(self, request, pk=None):
        """Finaliza uma associação"""
        associacao = self.get_object()
        data_fim = request.data.get("data_fim", date.today().isoformat())
        observacoes = request.data.get("observacoes", "")

        try:
            user = request.user if request.user.is_authenticated else None
            associacao.finalizar_associacao(
                data_fim=datetime.strptime(data_fim, "%Y-%m-%d").date(), user=user
            )

            # Registrar no histórico
            HistoricoAssociacao.objects.create(
                associacao=associacao,
                acao="FINALIZADA",
                detalhes={"data_fim": data_fim},
                observacoes=observacoes,
                usuario=user,
            )

            return Response(
                {"success": True, "message": "Associação finalizada com sucesso"}
            )

        except Exception as e:
            return Response(
                {"success": False, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["get"])
    def relatorio_ocupacao(self, request):
        """Relatório de ocupação de apartamentos"""
        from datetime import timedelta

        apartamentos_ocupados = (
            self.get_queryset()
            .filter(ativo=True, data_inicio__lte=date.today())
            .filter(Q(data_fim__isnull=True) | Q(data_fim__gte=date.today()))
            .values("apartamento")
            .distinct()
            .count()
        )

        total_apartamentos = Aptos.objects.count()

        ocupacao_por_mes = []
        for i in range(12):
            data_ref = date.today() - timedelta(days=30 * i)
            ocupadas = (
                self.get_queryset()
                .filter(data_inicio__lte=data_ref, ativo=True)
                .filter(Q(data_fim__isnull=True) | Q(data_fim__gte=data_ref))
                .count()
            )

            ocupacao_por_mes.append(
                {
                    "mes": data_ref.strftime("%Y-%m"),
                    "ocupadas": ocupadas,
                    "percentual": round((ocupadas / total_apartamentos) * 100, 1)
                    if total_apartamentos > 0
                    else 0,
                }
            )

        return Response(
            {
                "resumo": {
                    "apartamentos_ocupados": apartamentos_ocupados,
                    "total_apartamentos": total_apartamentos,
                    "taxa_ocupacao": round(
                        (apartamentos_ocupados / total_apartamentos) * 100, 1
                    )
                    if total_apartamentos > 0
                    else 0,
                },
                "historico_ocupacao": list(reversed(ocupacao_por_mes)),
            }
        )


# ========================================
# ViewSet de Relatórios e Analytics
# ========================================

from datetime import timedelta

from aptos.services.relatorio_service import relatorio_service


class RelatorioViewSet(viewsets.ViewSet):
    """ViewSet para geração de relatórios e analytics"""

    permission_classes = [IsAdminUser]

    @extend_schema(
        summary="Relatório de Inquilinos Ativos",
        description="Gera relatório completo de inquilinos ativos com opções de exportação",
        parameters=[
            OpenApiParameter(
                name="data_inicio", type=str, description="Data início (YYYY-MM-DD)"
            ),
            OpenApiParameter(
                name="data_fim", type=str, description="Data fim (YYYY-MM-DD)"
            ),
            OpenApiParameter(
                name="formato", type=str, description="Formato: json, pdf, excel"
            ),
        ],
    )
    @action(detail=False, methods=["get"])
    def inquilinos_ativos(self, request):
        """Relatório de inquilinos ativos"""
        data_inicio = request.query_params.get("data_inicio")
        data_fim = request.query_params.get("data_fim")
        formato = request.query_params.get("formato", "json").lower()

        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Formato de data_inicio inválido. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Formato de data_fim inválido. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        dados = relatorio_service.gerar_relatorio_inquilinos_ativos(
            data_inicio=data_inicio, data_fim=data_fim
        )

        if formato == "pdf":
            buffer = relatorio_service.exportar_para_pdf(dados, "INQUILINOS_ATIVOS")
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = (
                'attachment; filename="inquilinos_ativos.pdf"'
            )
            return response

        elif formato == "excel":
            buffer = relatorio_service.exportar_para_excel(dados, "INQUILINOS_ATIVOS")
            response = HttpResponse(
                buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = (
                'attachment; filename="inquilinos_ativos.xlsx"'
            )
            return response

        return Response(dados)

    @extend_schema(
        summary="Relatório de Ocupação",
        description="Gera relatório de ocupação de apartamentos por período",
        parameters=[
            OpenApiParameter(
                name="data_inicio", type=str, description="Data início (YYYY-MM-DD)"
            ),
            OpenApiParameter(
                name="data_fim", type=str, description="Data fim (YYYY-MM-DD)"
            ),
            OpenApiParameter(
                name="formato", type=str, description="Formato: json, pdf, excel"
            ),
        ],
    )
    @action(detail=False, methods=["get"])
    def ocupacao(self, request):
        """Relatório de ocupação"""
        data_inicio = request.query_params.get("data_inicio")
        data_fim = request.query_params.get("data_fim")
        formato = request.query_params.get("formato", "json").lower()

        if data_inicio:
            try:
                data_inicio = datetime.strptime(data_inicio, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Formato de data_inicio inválido. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if data_fim:
            try:
                data_fim = datetime.strptime(data_fim, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "Formato de data_fim inválido. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        dados = relatorio_service.gerar_relatorio_ocupacao(
            data_inicio=data_inicio, data_fim=data_fim
        )

        if formato == "pdf":
            buffer = relatorio_service.exportar_para_pdf(dados, "OCUPACAO")
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="ocupacao.pdf"'
            return response

        elif formato == "excel":
            buffer = relatorio_service.exportar_para_excel(dados, "OCUPACAO")
            response = HttpResponse(
                buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = 'attachment; filename="ocupacao.xlsx"'
            return response

        return Response(dados)

    @extend_schema(
        summary="Relatório de Inadimplentes",
        description="Gera relatório de inquilinos inadimplentes",
        parameters=[
            OpenApiParameter(
                name="formato", type=str, description="Formato: json, pdf, excel"
            ),
        ],
    )
    @action(detail=False, methods=["get"])
    def inadimplentes(self, request):
        """Relatório de inadimplentes"""
        formato = request.query_params.get("formato", "json").lower()

        dados = relatorio_service.gerar_relatorio_inadimplentes()

        if formato == "pdf":
            buffer = relatorio_service.exportar_para_pdf(dados, "INADIMPLENTES")
            response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="inadimplentes.pdf"'
            return response

        elif formato == "excel":
            buffer = relatorio_service.exportar_para_excel(dados, "INADIMPLENTES")
            response = HttpResponse(
                buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = (
                'attachment; filename="inadimplentes.xlsx"'
            )
            return response

        return Response(dados)

    @extend_schema(
        summary="Métricas para Dashboard",
        description="Retorna métricas consolidadas para dashboard",
    )
    @action(detail=False, methods=["get"])
    def metricas_dashboard(self, request):
        """Métricas para dashboard"""
        # Métricas básicas
        total_inquilinos = Inquilino.objects.count()
        inquilinos_ativos = Inquilino.objects.filter(status="ATIVO").count()
        inadimplentes = Inquilino.objects.filter(status="INADIMPLENTE").count()

        # Taxa de ocupação atual
        total_apartamentos = Aptos.objects.count()
        apartamentos_ocupados = (
            InquilinoApartamento.objects.filter(
                Q(data_fim__isnull=True) | Q(data_fim__gte=date.today()),
                ativo=True,
                data_inicio__lte=date.today(),
            )
            .values("apartamento")
            .distinct()
            .count()
        )

        taxa_ocupacao = (
            (apartamentos_ocupados / total_apartamentos * 100)
            if total_apartamentos > 0
            else 0
        )

        # Tendência mensal (últimos 6 meses)
        tendencia = []
        for i in range(6):
            data_ref = date.today() - timedelta(days=30 * i)
            ocupados_mes = (
                InquilinoApartamento.objects.filter(
                    Q(data_fim__isnull=True) | Q(data_fim__gte=data_ref),
                    ativo=True,
                    data_inicio__lte=data_ref,
                )
                .values("apartamento")
                .distinct()
                .count()
            )

            tendencia.append(
                {
                    "mes": data_ref.strftime("%m/%Y"),
                    "ocupados": ocupados_mes,
                    "taxa": (ocupados_mes / total_apartamentos * 100)
                    if total_apartamentos > 0
                    else 0,
                }
            )

        return Response(
            {
                "resumo": {
                    "total_inquilinos": total_inquilinos,
                    "inquilinos_ativos": inquilinos_ativos,
                    "inadimplentes": inadimplentes,
                    "apartamentos_ocupados": apartamentos_ocupados,
                    "taxa_ocupacao": round(taxa_ocupacao, 2),
                },
                "tendencia_ocupacao": list(reversed(tendencia)),
            }
        )
