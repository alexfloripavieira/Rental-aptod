---
status: pending
parallelizable: false
blocked_by: ["7.0", "10.0"]
---

<task_context>
<domain>frontend/dashboard</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
<unblocks>16.0</unblocks>
</task_context>

# Tarefa 11.0: Desenvolver dashboard de métricas de inquilinos

## Visão Geral
Criar dashboard interativo e responsivo com métricas chave sobre inquilinos, gráficos de ocupação, indicadores de performance, e widgets informativos. Dashboard deve ser a página inicial do sistema de inquilinos.

## Requisitos
- Cards de métricas principais
- Gráficos interativos de ocupação
- Lista de inquilinos recentes
- Alertas e notificações
- Filtros por período
- Responsividade completa
- Atualização em tempo real
- Integração com sistema de relatórios

## Subtarefas
- [ ] 11.1 Criar layout base do dashboard
- [ ] 11.2 Implementar cards de métricas
- [ ] 11.3 Desenvolver gráficos de ocupação
- [ ] 11.4 Criar widgets de atividade recente
- [ ] 11.5 Implementar sistema de alertas
- [ ] 11.6 Adicionar filtros e período
- [ ] 11.7 Otimizar responsividade
- [ ] 11.8 Implementar atualização automática

## Sequenciamento
- Bloqueado por: 7.0 (Frontend base), 10.0 (Relatórios/API)
- Desbloqueia: 16.0 (Integração final)
- Paralelizável: Não (depende dos relatórios)

## Detalhes de Implementação

### Componente Principal do Dashboard
```typescript
// components/dashboard/InquilinosDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Layout } from '../common/Layout';
import { MetricsCards } from './MetricsCards';
import { OccupancyChart } from './OccupancyChart';
import { RecentActivity } from './RecentActivity';
import { AlertsPanel } from './AlertsPanel';
import { QuickActions } from './QuickActions';
import { PeriodFilter } from './PeriodFilter';
import { useDashboardData } from '../../hooks/useDashboardData';

export function InquilinosDashboard() {
  const [periodo, setPeriodo] = useState('30d'); // 30 dias, 3m, 6m, 1y
  const [autoRefresh, setAutoRefresh] = useState(true);

  const {
    metricas,
    tendenciaOcupacao,
    atividadeRecente,
    alertas,
    loading,
    error,
    refreshData
  } = useDashboardData(periodo);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  const handlePeriodChange = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo);
  };

  if (error) {
    return (
      <Layout title="Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Erro ao carregar dados do dashboard.</p>
          <button
            onClick={refreshData}
            className="mt-2 text-red-600 hover:text-red-500 underline"
          >
            Tentar novamente
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard - Gestão de Inquilinos"
      subtitle="Visão geral das métricas e atividades"
      actions={
        <div className="flex items-center space-x-4">
          <PeriodFilter
            value={periodo}
            onChange={handlePeriodChange}
          />
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 text-sm rounded-md ${
              autoRefresh
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Métricas Principais */}
        <MetricsCards metricas={metricas} loading={loading} />

        {/* Alertas */}
        {alertas && alertas.length > 0 && (
          <AlertsPanel alertas={alertas} />
        )}

        {/* Gráficos e Atividade */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <OccupancyChart
              data={tendenciaOcupacao}
              loading={loading}
              periodo={periodo}
            />
          </div>
          <div>
            <QuickActions />
          </div>
        </div>

        {/* Atividade Recente */}
        <RecentActivity
          atividades={atividadeRecente}
          loading={loading}
        />
      </div>
    </Layout>
  );
}
```

### Cards de Métricas
```typescript
// components/dashboard/MetricsCards.tsx
import React from 'react';
import { HomeIcon, UserGroupIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface MetricasData {
  total_inquilinos: number;
  inquilinos_ativos: number;
  inadimplentes: number;
  apartamentos_ocupados: number;
  taxa_ocupacao: number;
}

interface MetricsCardsProps {
  metricas: MetricasData | null;
  loading: boolean;
}

export function MetricsCards({ metricas, loading }: MetricsCardsProps) {
  if (loading || !metricas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Inquilinos',
      value: metricas.total_inquilinos,
      icon: UserGroupIcon,
      color: 'blue',
      trend: null
    },
    {
      title: 'Inquilinos Ativos',
      value: metricas.inquilinos_ativos,
      icon: CheckCircleIcon,
      color: 'green',
      percentage: metricas.total_inquilinos > 0
        ? (metricas.inquilinos_ativos / metricas.total_inquilinos * 100).toFixed(1)
        : '0'
    },
    {
      title: 'Inadimplentes',
      value: metricas.inadimplentes,
      icon: ExclamationTriangleIcon,
      color: metricas.inadimplentes > 0 ? 'red' : 'gray',
      percentage: metricas.total_inquilinos > 0
        ? (metricas.inadimplentes / metricas.total_inquilinos * 100).toFixed(1)
        : '0'
    },
    {
      title: 'Taxa de Ocupação',
      value: `${metricas.taxa_ocupacao}%`,
      icon: HomeIcon,
      color: metricas.taxa_ocupacao >= 80 ? 'green' : metricas.taxa_ocupacao >= 60 ? 'yellow' : 'red',
      subtitle: `${metricas.apartamentos_ocupados} apartamentos ocupados`
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      gray: 'bg-gray-50 text-gray-600 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              {card.percentage && (
                <p className="text-sm text-gray-500">
                  {card.percentage}% do total
                </p>
              )}
              {card.subtitle && (
                <p className="text-sm text-gray-500">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${getColorClasses(card.color)}`}>
              <card.icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Gráfico de Ocupação
```typescript
// components/dashboard/OccupancyChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface TendenciaData {
  mes: string;
  ocupados: number;
  taxa: number;
}

interface OccupancyChartProps {
  data: TendenciaData[] | null;
  loading: boolean;
  periodo: string;
}

export function OccupancyChart({ data, loading, periodo }: OccupancyChartProps) {
  if (loading || !data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const titulo = {
    '30d': 'Últimos 30 dias',
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '1y': 'Último ano'
  }[periodo] || 'Tendência';

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Taxa de Ocupação - {titulo}
        </h3>
        <p className="text-sm text-gray-500">
          Evolução da ocupação dos apartamentos
        </p>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="mes"
              stroke="#6B7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '6px',
                fontSize: '14px'
              }}
              formatter={(value: number, name: string) => [
                name === 'taxa' ? `${value.toFixed(1)}%` : value,
                name === 'taxa' ? 'Taxa de Ocupação' : 'Apartamentos Ocupados'
              ]}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="taxa"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorOcupacao)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Estatísticas adicionais */}
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data.length > 0 ? data[data.length - 1].taxa.toFixed(1) : '0'}%
            </p>
            <p className="text-sm text-gray-500">Atual</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data.length > 0 ? (data.reduce((sum, item) => sum + item.taxa, 0) / data.length).toFixed(1) : '0'}%
            </p>
            <p className="text-sm text-gray-500">Média</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {data.length > 0 ? Math.max(...data.map(item => item.taxa)).toFixed(1) : '0'}%
            </p>
            <p className="text-sm text-gray-500">Máxima</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Ações Rápidas
```typescript
// components/dashboard/QuickActions.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export function QuickActions() {
  const actions = [
    {
      title: 'Novo Inquilino',
      description: 'Cadastrar novo inquilino',
      icon: PlusIcon,
      href: '/inquilinos/novo',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Buscar Inquilinos',
      description: 'Encontrar inquilinos existentes',
      icon: MagnifyingGlassIcon,
      href: '/inquilinos',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios detalhados',
      icon: DocumentTextIcon,
      href: '/relatorios',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Analytics',
      description: 'Ver métricas avançadas',
      icon: ChartBarIcon,
      href: '/analytics',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Ações Rápidas
        </h3>
        <p className="text-sm text-gray-500">
          Acesso rápido às funcionalidades principais
        </p>
      </div>

      <div className="p-6 space-y-3">
        {actions.map((action, index) => (
          <Link
            key={index}
            to={action.href}
            className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className={`p-2 rounded-md ${action.color} text-white group-hover:scale-105 transition-transform`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {action.title}
              </p>
              <p className="text-xs text-gray-500">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

### Hook de Dados do Dashboard
```typescript
// hooks/useDashboardData.ts
import { useState, useEffect, useCallback } from 'react';
import { relatorioService } from '../services/relatorioService';

interface DashboardData {
  metricas: any;
  tendenciaOcupacao: any[];
  atividadeRecente: any[];
  alertas: any[];
}

export function useDashboardData(periodo: string) {
  const [data, setData] = useState<DashboardData>({
    metricas: null,
    tendenciaOcupacao: [],
    atividadeRecente: [],
    alertas: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados em paralelo
      const [metricasResponse, atividadeResponse] = await Promise.all([
        relatorioService.getMetricasDashboard(),
        relatorioService.getAtividadeRecente(periodo)
      ]);

      setData({
        metricas: metricasResponse.resumo,
        tendenciaOcupacao: metricasResponse.tendencia_ocupacao,
        atividadeRecente: atividadeResponse.atividades,
        alertas: atividadeResponse.alertas || []
      });

    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro no dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    loading,
    error,
    refreshData: loadData
  };
}
```

### Componente de Atividade Recente
```typescript
// components/dashboard/RecentActivity.tsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AtividadeItem {
  id: string;
  tipo: 'cadastro' | 'status' | 'associacao' | 'documento';
  titulo: string;
  descricao: string;
  timestamp: string;
  usuario: string;
  inquilino?: {
    id: number;
    nome: string;
  };
}

interface RecentActivityProps {
  atividades: AtividadeItem[];
  loading: boolean;
}

export function RecentActivity({ atividades, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getIconColor = (tipo: string) => {
    const colors = {
      cadastro: 'bg-green-100 text-green-600',
      status: 'bg-yellow-100 text-yellow-600',
      associacao: 'bg-blue-100 text-blue-600',
      documento: 'bg-purple-100 text-purple-600'
    };
    return colors[tipo as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getIcon = (tipo: string) => {
    const icons = {
      cadastro: '👤',
      status: '📊',
      associacao: '🏠',
      documento: '📄'
    };
    return icons[tipo as keyof typeof icons] || '📋';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Atividade Recente
        </h3>
        <p className="text-sm text-gray-500">
          Últimas ações realizadas no sistema
        </p>
      </div>

      <div className="p-6">
        {atividades.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhuma atividade recente
          </p>
        ) : (
          <div className="space-y-4">
            {atividades.map((atividade) => (
              <div key={atividade.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getIconColor(atividade.tipo)}`}>
                  <span className="text-sm">{getIcon(atividade.tipo)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {atividade.titulo}
                  </p>
                  <p className="text-sm text-gray-500">
                    {atividade.descricao}
                  </p>
                  <div className="flex items-center mt-1 text-xs text-gray-400">
                    <span>{atividade.usuario}</span>
                    <span className="mx-1">•</span>
                    <span>
                      {formatDistanceToNow(new Date(atividade.timestamp), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>

                {atividade.inquilino && (
                  <Link
                    to={`/inquilinos/${atividade.inquilino.id}`}
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    Ver
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Critérios de Sucesso
- [ ] Dashboard carregando em menos de 2 segundos
- [ ] Métricas principais exibidas corretamente
- [ ] Gráficos interativos funcionando
- [ ] Responsividade em todos os dispositivos
- [ ] Auto-refresh funcionando
- [ ] Ações rápidas navegando corretamente
- [ ] Atividade recente atualizada
- [ ] Sistema de alertas funcionando
- [ ] Filtros de período aplicados
- [ ] Integração com APIs de relatórios completa