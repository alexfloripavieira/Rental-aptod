import React from 'react';
import type { MetricasDashboard } from '../../services/relatorioService';

interface MetricsCardsProps {
  metricas: MetricasDashboard | null;
  loading: boolean;
}

export function MetricsCards({ metricas, loading }: MetricsCardsProps) {
  if (loading || !metricas) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total de Inquilinos',
      value: metricas.total_inquilinos,
      icon: '👥',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      trend: null,
    },
    {
      title: 'Inquilinos Ativos',
      value: metricas.inquilinos_ativos,
      icon: '✅',
      color: 'bg-green-50 text-green-600 border-green-200',
      percentage:
        metricas.total_inquilinos > 0
          ? ((metricas.inquilinos_ativos / metricas.total_inquilinos) * 100).toFixed(1)
          : '0',
    },
    {
      title: 'Inadimplentes',
      value: metricas.inadimplentes,
      icon: '⚠️',
      color:
        metricas.inadimplentes > 0
          ? 'bg-red-50 text-red-600 border-red-200'
          : 'bg-gray-50 text-gray-600 border-gray-200',
      percentage:
        metricas.total_inquilinos > 0
          ? ((metricas.inadimplentes / metricas.total_inquilinos) * 100).toFixed(1)
          : '0',
    },
    {
      title: 'Taxa de Ocupação',
      value: `${metricas.taxa_ocupacao}%`,
      icon: '🏠',
      color:
        metricas.taxa_ocupacao >= 80
          ? 'bg-green-50 text-green-600 border-green-200'
          : metricas.taxa_ocupacao >= 60
          ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
          : 'bg-red-50 text-red-600 border-red-200',
      subtitle: `${metricas.apartamentos_ocupados} apartamentos ocupados`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{card.value}</p>
              {card.percentage && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.percentage}% do total</p>
              )}
              {card.subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{card.subtitle}</p>}
            </div>
            <div className={`p-3 rounded-full border ${card.color}`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
