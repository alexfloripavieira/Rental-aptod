"""Middlewares customizados para performance e monitoramento."""
import time
import logging
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache

logger = logging.getLogger('performance')


class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Middleware para monitoramento de performance de requisições."""

    def process_request(self, request):
        """Registra tempo de início da requisição."""
        request._start_time = time.time()
        request._start_queries = self._get_db_queries_count()

    def process_response(self, request, response):
        """Processa resposta e registra métricas de performance."""
        if not hasattr(request, '_start_time'):
            return response

        # Calcular duração
        duration = time.time() - request._start_time

        # Calcular queries executadas
        queries_count = self._get_db_queries_count() - request._start_queries

        # Log de requisições lentas (> 1 segundo)
        if duration > 1.0:
            logger.warning(
                f"Slow request: {request.method} {request.path} - {duration:.2f}s - {queries_count} queries",
                extra={
                    'method': request.method,
                    'path': request.path,
                    'duration': duration,
                    'queries_count': queries_count,
                    'user': request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None,
                    'status_code': response.status_code,
                }
            )

        # Adicionar headers de performance
        response['X-Response-Time'] = f"{duration:.3f}s"
        response['X-DB-Queries'] = str(queries_count)

        # Armazenar métricas para análise (opcional)
        self._store_metrics(request, duration, queries_count, response.status_code)

        return response

    def _get_db_queries_count(self):
        """Retorna número atual de queries executadas."""
        try:
            from django.db import connection
            return len(connection.queries)
        except Exception:
            return 0

    def _store_metrics(self, request, duration, queries_count, status_code):
        """Armazena métricas de performance no cache."""
        try:
            # Chave de métricas
            metrics_key = 'performance_metrics'

            # Buscar métricas existentes
            metrics = cache.get(metrics_key, {
                'total_requests': 0,
                'slow_requests': 0,
                'total_duration': 0,
                'total_queries': 0,
                'endpoints': {}
            })

            # Atualizar métricas globais
            metrics['total_requests'] += 1
            metrics['total_duration'] += duration
            metrics['total_queries'] += queries_count

            if duration > 1.0:
                metrics['slow_requests'] += 1

            # Atualizar métricas por endpoint
            endpoint = f"{request.method} {request.path}"
            if endpoint not in metrics['endpoints']:
                metrics['endpoints'][endpoint] = {
                    'count': 0,
                    'avg_duration': 0,
                    'max_duration': 0,
                    'total_queries': 0,
                }

            endpoint_metrics = metrics['endpoints'][endpoint]
            endpoint_metrics['count'] += 1
            endpoint_metrics['total_queries'] += queries_count
            endpoint_metrics['max_duration'] = max(endpoint_metrics['max_duration'], duration)

            # Calcular média incremental
            count = endpoint_metrics['count']
            old_avg = endpoint_metrics['avg_duration']
            endpoint_metrics['avg_duration'] = old_avg + (duration - old_avg) / count

            # Salvar no cache por 1 hora
            cache.set(metrics_key, metrics, 3600)

        except Exception as e:
            logger.debug(f"Failed to store metrics: {e}")


class CacheInvalidationMiddleware(MiddlewareMixin):
    """Middleware para invalidação automática de cache em operações de escrita."""

    WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

    def process_response(self, request, response):
        """Invalida cache relevante após operações de escrita."""
        # Apenas para requisições de escrita bem-sucedidas
        if request.method not in self.WRITE_METHODS:
            return response

        if not (200 <= response.status_code < 300):
            return response

        # Invalidar caches relacionados
        self._invalidate_related_caches(request)

        return response

    def _invalidate_related_caches(self, request):
        """Invalida caches relacionados ao recurso modificado."""
        try:
            path = request.path

            # Invalidar cache de inquilinos
            if '/inquilinos' in path:
                cache.delete('dashboard_metrics_inquilinos')
                cache.delete('ocupacao_metrics')

                # Tentar invalidar padrões de cache (django-redis)
                try:
                    cache.delete_pattern('api:*inquilinos*')
                    cache.delete_pattern('search_inquilinos:*')
                except AttributeError:
                    pass

            # Invalidar cache de apartamentos
            if '/apartamentos' in path or '/aptos' in path:
                cache.delete('ocupacao_metrics')

                try:
                    cache.delete_pattern('apartamento_history:*')
                except AttributeError:
                    pass

        except Exception as e:
            logger.debug(f"Failed to invalidate cache: {e}")
