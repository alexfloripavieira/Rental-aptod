"""Custom managers para otimização de queries."""
from django.db import models
from django.core.cache import cache
from django.db.models import Q, Count, Prefetch
from datetime import date


class InquilinoOptimizedManager(models.Manager):
    """Manager otimizado para consultas de inquilinos."""

    def get_list_optimized(self, **filters):
        """Lista otimizada com select_related e prefetch_related."""
        from .models import InquilinoApartamento

        # Prefetch das associações ativas
        active_associations = Prefetch(
            'associacoes_apartamento',
            queryset=InquilinoApartamento.objects.filter(ativo=True).select_related(
                'apartamento'
            ),
            to_attr='associacoes_ativas'
        )

        return self.filter(**filters).prefetch_related(
            active_associations,
            'associacoes_apartamento__apartamento',
        ).annotate(
            total_apartamentos=Count('associacoes_apartamento', filter=Q(associacoes_apartamento__ativo=True))
        )

    def get_dashboard_metrics(self, use_cache=True):
        """Métricas para dashboard com cache."""
        cache_key = 'dashboard_metrics_inquilinos'

        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data

        # Calcular métricas
        metrics = {
            'total_inquilinos': self.count(),
            'ativos': self.filter(status='ATIVO').count(),
            'inadimplentes': self.filter(status='INADIMPLENTE').count(),
            'inativos': self.filter(status='INATIVO').count(),
            'bloqueados': self.filter(status='BLOQUEADO').count(),
        }

        # Métricas de tipo
        metrics.update({
            'pessoa_fisica': self.filter(tipo='PF').count(),
            'pessoa_juridica': self.filter(tipo='PJ').count(),
        })

        # Cache por 5 minutos
        cache.set(cache_key, metrics, 300)
        return metrics

    def get_ocupacao_metrics(self, use_cache=True):
        """Métricas de ocupação com cache."""
        cache_key = 'ocupacao_metrics'

        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data

        from .models import Aptos, InquilinoApartamento

        total_apartamentos = Aptos.objects.count()
        ocupados = InquilinoApartamento.objects.filter(
            Q(data_fim__isnull=True) | Q(data_fim__gte=date.today()),
            ativo=True,
            data_inicio__lte=date.today()
        ).values('apartamento').distinct().count()

        metrics = {
            'total_apartamentos': total_apartamentos,
            'ocupados': ocupados,
            'vagos': total_apartamentos - ocupados,
            'taxa_ocupacao': (ocupados / total_apartamentos * 100) if total_apartamentos > 0 else 0
        }

        # Cache por 10 minutos
        cache.set(cache_key, metrics, 600)
        return metrics

    def search_optimized(self, query):
        """Busca otimizada com cache."""
        if not query or len(query) < 3:
            return self.none()

        cache_key = f'search_inquilinos:{query}'
        cached_results = cache.get(cache_key)

        if cached_results is not None:
            return self.filter(id__in=cached_results)

        # Busca em múltiplos campos
        queryset = self.filter(
            Q(nome_completo__icontains=query) |
            Q(razao_social__icontains=query) |
            Q(cpf__icontains=query) |
            Q(cnpj__icontains=query) |
            Q(email__icontains=query)
        )[:20]

        # Cache dos IDs por 2 minutos
        result_ids = list(queryset.values_list('id', flat=True))
        cache.set(cache_key, result_ids, 120)

        return queryset


class InquilinoApartamentoOptimizedManager(models.Manager):
    """Manager otimizado para associações inquilino-apartamento."""

    def get_active_associations(self):
        """Retorna associações ativas com dados relacionados."""
        return self.filter(
            Q(data_fim__isnull=True) | Q(data_fim__gte=date.today()),
            ativo=True,
            data_inicio__lte=date.today()
        ).select_related('inquilino', 'apartamento')

    def get_by_apartamento_optimized(self, apartamento_id, use_cache=True):
        """Histórico de ocupação de apartamento com cache."""
        cache_key = f'apartamento_history:{apartamento_id}'

        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data

        queryset = self.filter(
            apartamento_id=apartamento_id
        ).select_related('inquilino').order_by('-data_inicio')

        # Cache por 30 minutos
        cache.set(cache_key, queryset, 1800)
        return queryset
