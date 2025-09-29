import { apiClient } from './api';
import type {
  AssociacaoDetail,
  AssociacaoFormData,
  AssociacaoListItem,
  FinalizarAssociacaoInput,
} from '../types/inquilino';
import type { PaginatedResponse } from '../types/api';

class AssociacaoService {
  private readonly basePath = '/associacoes';

  async list(params: { inquilino?: number; ativo?: boolean; ordering?: string } = {}): Promise<PaginatedResponse<AssociacaoListItem>> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      searchParams.append(key, String(value));
    });

    const query = searchParams.toString();
    const url = query ? `${this.basePath}/?${query}` : `${this.basePath}/`;
    const response = await apiClient['client'].get<PaginatedResponse<AssociacaoListItem>>(url);
    return response.data;
  }

  async retrieve(id: number): Promise<AssociacaoDetail> {
    const response = await apiClient['client'].get<AssociacaoDetail>(`${this.basePath}/${id}/`);
    return response.data;
  }

  async create(inquilinoId: number, data: AssociacaoFormData): Promise<AssociacaoDetail> {
    const payload = {
      inquilino: inquilinoId,
      apartamento: data.apartamento,
      data_inicio: data.data_inicio,
      valor_aluguel: data.valor_aluguel ? String(data.valor_aluguel) : null,
      observacoes: data.observacoes || null,
    };

    const response = await apiClient['client'].post<AssociacaoDetail>(`${this.basePath}/`, payload);
    return response.data;
  }

  async finalize(associacaoId: number, data: FinalizarAssociacaoInput = {}): Promise<{ success: boolean; message?: string }> {
    const payload: FinalizarAssociacaoInput = {};
    if (data.data_fim) {
      payload.data_fim = data.data_fim;
    }
    if (data.observacoes) {
      payload.observacoes = data.observacoes;
    }

    const response = await apiClient['client'].post<{ success: boolean; message?: string }>(
      `${this.basePath}/${associacaoId}/finalizar/`,
      payload
    );

    return response.data;
  }
}

export const associacaoService = new AssociacaoService();
