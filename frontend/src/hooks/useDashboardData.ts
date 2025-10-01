import { useState, useEffect, useCallback } from 'react';
import { relatorioService } from '../services/relatorioService';
import type { MetricasDashboard, TendenciaOcupacao } from '../services/relatorioService';

interface DashboardData {
  metricas: MetricasDashboard | null;
  tendenciaOcupacao: TendenciaOcupacao[];
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    metricas: null,
    tendenciaOcupacao: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await relatorioService.getMetricasDashboard();

      setData({
        metricas: response.resumo,
        tendenciaOcupacao: response.tendencia_ocupacao,
      });
    } catch (err) {
      setError('Erro ao carregar dados do dashboard');
      console.error('Erro no dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    ...data,
    loading,
    error,
    refreshData: loadData,
  };
}
