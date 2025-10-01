---
status: pending
parallelizable: true
blocked_by: ["4.0", "7.0"]
---

<task_context>
<domain>performance/optimization</domain>
<type>implementation</type>
<scope>performance</scope>
<complexity>medium</complexity>
<dependencies>database,http_server</dependencies>
<unblocks>16.0</unblocks>
</task_context>

# Tarefa 15.0: Implementar otimizações de performance e cache

## Visão Geral
Otimizar performance do sistema de gestão de inquilinos através de implementação de cache, otimização de queries, compressão de assets, lazy loading, e monitoramento de performance. Garantir que o sistema seja escalável e responsivo.

## Requisitos
- Sistema de cache Redis/Memcached
- Otimização de queries Django
- Cache de queries pesadas
- Compressão e minificação de assets
- Lazy loading no frontend
- Debounce em buscas
- Paginação otimizada
- Monitoramento de performance

## Subtarefas
- [ ] 15.1 Configurar sistema de cache Redis
- [ ] 15.2 Otimizar queries Django com select_related/prefetch_related
- [ ] 15.3 Implementar cache de API endpoints
- [ ] 15.4 Otimizar assets frontend (compressão, minificação)
- [ ] 15.5 Implementar lazy loading e code splitting
- [ ] 15.6 Adicionar debounce em buscas e validações
- [ ] 15.7 Configurar monitoramento de performance
- [ ] 15.8 Implementar otimizações de banco de dados

## Sequenciamento
- Bloqueado por: 4.0 (API), 7.0 (Frontend base)
- Desbloqueia: 16.0 (Integração final)
- Paralelizável: Sim (pode ser desenvolvido em paralelo)

## Detalhes de Implementação

### Configuração de Cache Redis
```python
# app/settings.py (adição)
import os

# Configuração do Redis
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/1')

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'inquilinos',
        'TIMEOUT': 300,  # 5 minutos padrão
        'VERSION': 1,
    }
}

# Cache de sessões no Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Cache de templates
TEMPLATE_LOADERS = [
    ('django.template.loaders.cached.Loader', [
        'django.template.loaders.filesystem.Loader',
        'django.template.loaders.app_directories.Loader',
    ]),
]

# Cache de static files
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.CachedStaticFilesStorage'
```

### Otimizações de Queries
```python
# aptos/managers.py
from django.db import models
from django.core.cache import cache

class InquilinoOptimizedManager(models.Manager):
    """Manager otimizado para consultas de inquilinos"""

    def get_list_optimized(self, **filters):
        """Lista otimizada com select_related e prefetch_related"""
        return self.filter(**filters).select_related().prefetch_related(
            'associacoes_apartamento__apartamento__building_name',
            'historico_status',
            'documentos'
        )

    def get_dashboard_metrics(self, use_cache=True):
        """Métricas para dashboard com cache"""
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
        """Métricas de ocupação com cache"""
        cache_key = 'ocupacao_metrics'

        if use_cache:
            cached_data = cache.get(cache_key)
            if cached_data:
                return cached_data

        from .models import Aptos, InquilinoApartamento
        from django.db.models import Q
        from datetime import date

        total_apartamentos = Aptos.objects.count()
        ocupados = InquilinoApartamento.objects.filter(
            ativo=True,
            data_inicio__lte=date.today(),
            Q(data_fim__isnull=True) | Q(data_fim__gte=date.today())
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

# Adicionar ao modelo Inquilino
class Inquilino(models.Model):
    # ... campos existentes ...

    objects = InquilinoOptimizedManager()
```

### Decoradores de Cache
```python
# aptos/decorators.py
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse
import hashlib
import json

def cache_api_response(timeout=300, key_prefix='api'):
    """Decorator para cache de respostas de API"""
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # Gerar chave de cache baseada na requisição
            cache_key_data = {
                'view': view_func.__name__,
                'args': args,
                'kwargs': kwargs,
                'user_id': request.user.id if request.user.is_authenticated else None,
                'query_params': dict(request.GET),
            }

            cache_key = f"{key_prefix}:{hashlib.md5(json.dumps(cache_key_data, sort_keys=True).encode()).hexdigest()}"

            # Tentar buscar no cache
            cached_response = cache.get(cache_key)
            if cached_response:
                return JsonResponse(cached_response)

            # Executar view
            response = view_func(request, *args, **kwargs)

            # Cache apenas respostas de sucesso
            if hasattr(response, 'data') and response.status_code == 200:
                cache.set(cache_key, response.data, timeout)

            return response
        return wrapper
    return decorator

def invalidate_cache_on_save(cache_patterns):
    """Decorator para invalidar cache quando modelo é salvo"""
    def decorator(model_class):
        original_save = model_class.save
        original_delete = model_class.delete

        def new_save(self, *args, **kwargs):
            result = original_save(self, *args, **kwargs)
            for pattern in cache_patterns:
                cache.delete_pattern(pattern)
            return result

        def new_delete(self, *args, **kwargs):
            result = original_delete(self, *args, **kwargs)
            for pattern in cache_patterns:
                cache.delete_pattern(pattern)
            return result

        model_class.save = new_save
        model_class.delete = new_delete
        return model_class
    return decorator
```

### Views Otimizadas
```python
# aptos/views.py (otimizações)
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from .decorators import cache_api_response

class InquilinoViewSet(viewsets.ModelViewSet):
    """ViewSet otimizado para inquilinos"""

    def get_queryset(self):
        """Queryset otimizado com select_related"""
        return Inquilino.objects.get_list_optimized()

    @cache_api_response(timeout=300, key_prefix='inquilinos_list')
    def list(self, request, *args, **kwargs):
        """Lista com cache de 5 minutos"""
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    @cache_api_response(timeout=600, key_prefix='dashboard_metrics')
    def dashboard_metrics(self, request):
        """Métricas com cache de 10 minutos"""
        metrics = Inquilino.objects.get_dashboard_metrics()
        ocupacao = Inquilino.objects.get_ocupacao_metrics()

        return Response({
            'inquilinos': metrics,
            'ocupacao': ocupacao,
            'timestamp': timezone.now().isoformat()
        })

    @action(detail=False, methods=['get'])
    @vary_on_headers('Accept-Language', 'User-Agent')
    def search(self, request):
        """Busca otimizada com debounce"""
        search_term = request.query_params.get('q', '').strip()

        if len(search_term) < 3:
            return Response({'results': [], 'message': 'Digite pelo menos 3 caracteres'})

        # Cache de busca por 2 minutos
        cache_key = f"search_inquilinos:{hashlib.md5(search_term.encode()).hexdigest()}"
        cached_results = cache.get(cache_key)

        if cached_results:
            return Response(cached_results)

        # Busca otimizada
        queryset = self.get_queryset().filter(
            Q(nome_completo__icontains=search_term) |
            Q(razao_social__icontains=search_term) |
            Q(cpf__icontains=search_term) |
            Q(cnpj__icontains=search_term) |
            Q(email__icontains=search_term)
        )[:20]  # Limitar a 20 resultados

        serializer = self.get_serializer(queryset, many=True)
        results = {
            'results': serializer.data,
            'count': len(serializer.data)
        }

        cache.set(cache_key, results, 120)  # 2 minutos
        return Response(results)

# Cache para relatórios pesados
@cache_page(60 * 15)  # 15 minutos
def relatorio_ocupacao_view(request):
    """Relatório de ocupação com cache"""
    # Implementação do relatório
    pass
```

### Otimizações Frontend
```typescript
// webpack.config.js (otimizações)
const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  // ... configuração existente ...

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
    usedExports: true,
    sideEffects: false,
  },

  plugins: [
    // Compressão gzip
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),

    // Análise de bundle (apenas em desenvolvimento)
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
};
```

### Lazy Loading de Componentes
```typescript
// components/LazyComponents.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './common/LoadingSpinner';

// Lazy loading dos componentes principais
export const InquilinosList = lazy(() =>
  import('./inquilinos/InquilinosList').then(module => ({ default: module.InquilinosList }))
);

export const InquilinoForm = lazy(() =>
  import('./inquilinos/InquilinoForm').then(module => ({ default: module.InquilinoForm }))
);

export const Dashboard = lazy(() =>
  import('./dashboard/Dashboard').then(module => ({ default: module.Dashboard }))
);

export const RelatoriosPage = lazy(() =>
  import('./relatorios/RelatoriosPage').then(module => ({ default: module.RelatoriosPage }))
);

// Wrapper com Suspense
export function LazyComponent({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    }>
      {children}
    </Suspense>
  );
}
```

### Hook de Debounce Otimizado
```typescript
// hooks/useOptimizedSearch.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from 'react-query';

interface SearchOptions {
  debounceMs?: number;
  minLength?: number;
  cacheTime?: number;
}

export function useOptimizedSearch<T>(
  searchFn: (query: string) => Promise<T>,
  options: SearchOptions = {}
) {
  const {
    debounceMs = 300,
    minLength = 3,
    cacheTime = 5 * 60 * 1000, // 5 minutos
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const abortController = useRef<AbortController | null>(null);

  // Debounce da query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Cancelar requisições anteriores
  const cancelPreviousRequest = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
  }, []);

  // React Query para cache e estado
  const {
    data,
    isLoading,
    error,
    isFetching
  } = useQuery(
    ['search', debouncedQuery],
    () => {
      cancelPreviousRequest();
      return searchFn(debouncedQuery);
    },
    {
      enabled: debouncedQuery.length >= minLength,
      staleTime: cacheTime,
      cacheTime: cacheTime,
      retry: 1,
      refetchOnWindowFocus: false,
    }
  );

  return {
    query,
    setQuery,
    results: data,
    isLoading: isLoading || isFetching,
    error,
  };
}
```

### Otimizações de Imagem
```typescript
// components/common/OptimizedImage.tsx
import React, { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  lazy?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  lazy = true
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Placeholder enquanto carrega
  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">Erro ao carregar</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
}
```

### Monitoramento de Performance
```python
# aptos/middleware.py
import time
import logging
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('performance')

class PerformanceMonitoringMiddleware(MiddlewareMixin):
    """Middleware para monitoramento de performance"""

    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time

            # Log de requisições lentas (> 1 segundo)
            if duration > 1.0:
                logger.warning(
                    f"Slow request: {request.method} {request.path} - {duration:.2f}s",
                    extra={
                        'method': request.method,
                        'path': request.path,
                        'duration': duration,
                        'user': request.user.id if request.user.is_authenticated else None,
                    }
                )

            # Adicionar header de performance
            response['X-Response-Time'] = f"{duration:.3f}s"

        return response
```

### Configuração de Índices do Banco
```python
# aptos/migrations/0002_add_performance_indexes.py
from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('aptos', '0001_initial'),
    ]

    operations = [
        # Índices para inquilinos
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_inquilino_status ON aptos_inquilino(status);",
            reverse_sql="DROP INDEX idx_inquilino_status;"
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_inquilino_email ON aptos_inquilino(email);",
            reverse_sql="DROP INDEX idx_inquilino_email;"
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_inquilino_cpf ON aptos_inquilino(cpf) WHERE cpf IS NOT NULL;",
            reverse_sql="DROP INDEX idx_inquilino_cpf;"
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_inquilino_cnpj ON aptos_inquilino(cnpj) WHERE cnpj IS NOT NULL;",
            reverse_sql="DROP INDEX idx_inquilino_cnpj;"
        ),

        # Índices para associações
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_associacao_ativo ON aptos_inquilinoapartamento(ativo, data_inicio, data_fim);",
            reverse_sql="DROP INDEX idx_associacao_ativo;"
        ),
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_associacao_apartamento ON aptos_inquilinoapartamento(apartamento_id, ativo);",
            reverse_sql="DROP INDEX idx_associacao_apartamento;"
        ),

        # Índices compostos para buscas
        migrations.RunSQL(
            "CREATE INDEX CONCURRENTLY idx_inquilino_search ON aptos_inquilino USING gin(to_tsvector('portuguese', coalesce(nome_completo, '') || ' ' || coalesce(razao_social, '') || ' ' || coalesce(email, '')));",
            reverse_sql="DROP INDEX idx_inquilino_search;"
        ),
    ]
```

## Critérios de Sucesso
- [ ] Cache Redis configurado e funcionando
- [ ] Queries otimizadas com select_related/prefetch_related
- [ ] Endpoints de API com cache implementado
- [ ] Frontend com lazy loading funcionando
- [ ] Assets comprimidos e minificados
- [ ] Debounce em buscas implementado
- [ ] Índices de banco de dados criados
- [ ] Monitoramento de performance ativo
- [ ] Tempo de carregamento < 2s
- [ ] Busca responsiva < 500ms