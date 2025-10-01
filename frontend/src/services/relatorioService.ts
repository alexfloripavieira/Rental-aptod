import { apiClient } from './api';
const http = apiClient['client'];

export interface MetricasDashboard {
  total_inquilinos: number;
  inquilinos_ativos: number;
  inadimplentes: number;
  apartamentos_ocupados: number;
  taxa_ocupacao: number;
}

export interface TendenciaOcupacao {
  mes: string;
  ocupados: number;
  taxa: number;
}

export interface DashboardResponse {
  resumo: MetricasDashboard;
  tendencia_ocupacao: TendenciaOcupacao[];
}

export interface RelatorioParams {
  data_inicio?: string;
  data_fim?: string;
  formato?: 'json' | 'pdf' | 'excel';
}

export const relatorioService = {
  /**
   * Busca métricas consolidadas para o dashboard
   */
  async getMetricasDashboard(): Promise<DashboardResponse> {
    const response = await http.get<DashboardResponse>('/relatorios/metricas_dashboard/');
    return response.data;
  },

  /**
   * Gera relatório de inquilinos ativos
   */
  async getInquilinosAtivos(params?: RelatorioParams) {
    const response = await http.get('/relatorios/inquilinos_ativos/', { params });

    // Se formato é PDF ou Excel, retorna blob
    if (params?.formato === 'pdf' || params?.formato === 'excel') {
      return response.data;
    }

    return response.data;
  },

  /**
   * Gera relatório de ocupação
   */
  async getOcupacao(params?: RelatorioParams) {
    const response = await http.get('/relatorios/ocupacao/', { params });

    if (params?.formato === 'pdf' || params?.formato === 'excel') {
      return response.data;
    }

    return response.data;
  },

  /**
   * Gera relatório de inadimplentes
   */
  async getInadimplentes(params?: RelatorioParams) {
    const response = await http.get('/relatorios/inadimplentes/', { params });

    if (params?.formato === 'pdf' || params?.formato === 'excel') {
      return response.data;
    }

    return response.data;
  },

  /**
   * Download de relatório em PDF
   */
  async downloadPDF(tipo: 'inquilinos_ativos' | 'ocupacao' | 'inadimplentes', params?: Omit<RelatorioParams, 'formato'>) {
    const endpoints = {
      inquilinos_ativos: '/relatorios/inquilinos_ativos/',
      ocupacao: '/relatorios/ocupacao/',
      inadimplentes: '/relatorios/inadimplentes/',
    };

    const response = await http.get(endpoints[tipo], {
      params: { ...params, formato: 'pdf' },
      responseType: 'blob',
    });

    // Criar URL do blob e fazer download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download de relatório em Excel
   */
  async downloadExcel(tipo: 'inquilinos_ativos' | 'ocupacao' | 'inadimplentes', params?: Omit<RelatorioParams, 'formato'>) {
    const endpoints = {
      inquilinos_ativos: '/relatorios/inquilinos_ativos/',
      ocupacao: '/relatorios/ocupacao/',
      inadimplentes: '/relatorios/inadimplentes/',
    };

    const response = await http.get(endpoints[tipo], {
      params: { ...params, formato: 'excel' },
      responseType: 'blob',
    });

    // Criar URL do blob e fazer download
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
