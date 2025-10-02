"""Decoradores customizados para cache e otimizações."""
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework.response import Response
import hashlib
import json


def cache_api_response(timeout=300, key_prefix='api', vary_on=None):
    """
    Decorator para cache de respostas de API.

    Args:
        timeout: Tempo de cache em segundos (default: 300 = 5 minutos)
        key_prefix: Prefixo da chave de cache
        vary_on: Lista de parâmetros da request para variar o cache
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Construir chave de cache baseada na requisição
            cache_key_data = {
                'view': view_func.__name__,
                'args': args,
                'kwargs': kwargs,
                'user_id': request.user.id if hasattr(request, 'user') and request.user.is_authenticated else None,
            }

            # Adicionar query params ao cache
            if hasattr(request, 'GET'):
                cache_key_data['query_params'] = dict(request.GET)

            # Adicionar parâmetros personalizados de variação
            if vary_on:
                for param in vary_on:
                    if hasattr(request, param):
                        cache_key_data[param] = getattr(request, param)

            # Gerar hash da chave
            cache_key_str = json.dumps(cache_key_data, sort_keys=True)
            cache_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
            cache_key = f"{key_prefix}:{cache_hash}"

            # Tentar buscar no cache
            cached_response = cache.get(cache_key)
            if cached_response is not None:
                # Retornar resposta em cache
                if isinstance(cached_response, dict):
                    return Response(cached_response)
                return cached_response

            # Executar view
            response = view_func(request, *args, **kwargs)

            # Cache apenas respostas de sucesso
            if hasattr(response, 'status_code') and response.status_code == 200:
                if hasattr(response, 'data'):
                    cache.set(cache_key, response.data, timeout)
                elif hasattr(response, 'content'):
                    cache.set(cache_key, response, timeout)

            return response
        return wrapper
    return decorator


def invalidate_cache_on_save(cache_patterns):
    """
    Decorator para invalidar cache quando modelo é salvo.

    Args:
        cache_patterns: Lista de padrões de chave de cache para invalidar
    """
    def decorator(model_class):
        original_save = model_class.save
        original_delete = model_class.delete if hasattr(model_class, 'delete') else None

        def new_save(self, *args, **kwargs):
            result = original_save(self, *args, **kwargs)
            # Invalidar caches
            for pattern in cache_patterns:
                try:
                    # django-redis suporta delete_pattern
                    cache.delete_pattern(pattern)
                except AttributeError:
                    # Fallback para backends que não suportam
                    pass
            return result

        def new_delete(self, *args, **kwargs):
            result = original_delete(self, *args, **kwargs)
            # Invalidar caches
            for pattern in cache_patterns:
                try:
                    cache.delete_pattern(pattern)
                except AttributeError:
                    pass
            return result

        model_class.save = new_save
        if original_delete:
            model_class.delete = new_delete

        return model_class
    return decorator


def cache_method(timeout=300, key_func=None):
    """
    Decorator para cachear métodos de instância.

    Args:
        timeout: Tempo de cache em segundos
        key_func: Função customizada para gerar chave de cache
    """
    def decorator(method):
        @wraps(method)
        def wrapper(self, *args, **kwargs):
            # Gerar chave de cache
            if key_func:
                cache_key = key_func(self, *args, **kwargs)
            else:
                model_name = self.__class__.__name__
                method_name = method.__name__
                pk = getattr(self, 'pk', None) or getattr(self, 'id', None)

                args_hash = hashlib.md5(
                    str((args, kwargs)).encode()
                ).hexdigest()[:8]

                cache_key = f"{model_name}:{pk}:{method_name}:{args_hash}"

            # Tentar buscar do cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result

            # Executar método
            result = method(self, *args, **kwargs)

            # Salvar no cache
            cache.set(cache_key, result, timeout)

            return result
        return wrapper
    return decorator


def rate_limit(key_prefix, max_requests=100, window=60):
    """
    Decorator para rate limiting de endpoints.

    Args:
        key_prefix: Prefixo da chave de rate limit
        max_requests: Número máximo de requisições
        window: Janela de tempo em segundos
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Identificador do usuário
            user_id = None
            if hasattr(request, 'user') and request.user.is_authenticated:
                user_id = request.user.id
            else:
                # Usar IP como fallback
                user_id = request.META.get('REMOTE_ADDR', 'unknown')

            # Chave de rate limit
            rate_key = f"rate_limit:{key_prefix}:{user_id}"

            # Verificar contador
            current_count = cache.get(rate_key, 0)

            if current_count >= max_requests:
                from rest_framework.exceptions import Throttled
                raise Throttled(detail=f"Rate limit exceeded. Max {max_requests} requests per {window}s")

            # Incrementar contador
            cache.set(rate_key, current_count + 1, window)

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
