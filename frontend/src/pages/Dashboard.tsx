import React, { useState, useEffect } from 'react';
import { MetricsCards } from '../components/dashboard/MetricsCards';
import { OccupancyChart } from '../components/dashboard/OccupancyChart';
import { QuickActions } from '../components/dashboard/QuickActions';
import { useDashboardData } from '../hooks/useDashboardData';

export function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { metricas, tendenciaOcupacao, loading, error, refreshData } = useDashboardData();

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">Erro ao carregar dados do dashboard.</p>
            <button
              onClick={refreshData}
              className="mt-2 text-red-600 dark:text-red-300 hover:text-red-500 underline"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Dashboard - Gestão de Inquilinos
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                Visão geral das métricas e atividades
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 text-sm rounded-md ${
                  autoRefresh
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={refreshData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Atualizando...' : 'Atualizar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Métricas Principais */}
          <MetricsCards metricas={metricas} loading={loading} />

          {/* Gráficos e Ações */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OccupancyChart data={tendenciaOcupacao} loading={loading} />
            </div>
            <div>
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
