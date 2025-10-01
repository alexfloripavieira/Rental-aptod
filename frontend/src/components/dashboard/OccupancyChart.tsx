import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TendenciaOcupacao } from '../../services/relatorioService';

interface OccupancyChartProps {
  data: TendenciaOcupacao[] | null;
  loading: boolean;
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  if (loading || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const getTaxaAtual = () => {
    return data.length > 0 ? data[data.length - 1].taxa.toFixed(1) : '0';
  };

  const getMedia = () => {
    if (data.length === 0) return '0';
    const soma = data.reduce((acc, item) => acc + item.taxa, 0);
    return (soma / data.length).toFixed(1);
  };

  const getMaxima = () => {
    if (data.length === 0) return '0';
    return Math.max(...data.map((item) => item.taxa)).toFixed(1);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Taxa de Ocupação</h3>
        <p className="text-sm text-gray-500 dark:text-gray-300">Evolução da ocupação dos apartamentos</p>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'} />
            <XAxis dataKey="mes" stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'} fontSize={12} />
            <YAxis
              stroke={document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'}
              fontSize={12}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#F9FAFB',
                border: `1px solid ${document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'}`,
                borderRadius: '6px',
                fontSize: '14px',
                }}
              formatter={(value: number, name: string) => [
                name === 'taxa' ? `${value.toFixed(1)}%` : value,
                name === 'taxa' ? 'Taxa de Ocupação' : 'Apartamentos Ocupados',
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
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTaxaAtual()}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Atual</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getMedia()}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Média</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getMaxima()}%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Máxima</p>
          </div>
        </div>
      </div>
    </div>
  );
}
