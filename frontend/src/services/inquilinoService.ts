import { apiClient } from './api';
import type {
  Inquilino,
  InquilinoFormData,
  InquilinoListResponse,
  InquilinoSearchParams,
  InquilinoStats,
  StatusChangeData,
  DocumentValidation
} from '../types/inquilino';

class InquilinoService {
  private readonly basePath = '/inquilinos';

  async list(params: InquilinoSearchParams = {}): Promise<InquilinoListResponse> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const response = await apiClient['client'].get<InquilinoListResponse>(
      `${this.basePath}/?${searchParams.toString()}`
    );
    return response.data;
  }

  async get(id: number): Promise<Inquilino> {
    const response = await apiClient['client'].get<Inquilino>(`${this.basePath}/${id}/`);
    return response.data;
  }

  async getById(id: number): Promise<Inquilino> {
    return this.get(id);
  }

  async create(data: InquilinoFormData): Promise<Inquilino> {
    const response = await apiClient['client'].post<Inquilino>(`${this.basePath}/`, data);
    return response.data;
  }

  async update(id: number, data: Partial<InquilinoFormData>): Promise<Inquilino> {
    const response = await apiClient['client'].patch<Inquilino>(`${this.basePath}/${id}/`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient['client'].delete(`${this.basePath}/${id}/`);
  }

  async alterarStatus(id: number, statusData: StatusChangeData): Promise<void> {
    await apiClient['client'].post(`${this.basePath}/${id}/alterar_status/`, statusData);
  }

  async getEstatisticas(): Promise<InquilinoStats> {
    const response = await apiClient['client'].get<InquilinoStats>(`${this.basePath}/estatisticas/`);
    return response.data;
  }

  async validarDocumento(documento: string, tipo: 'CPF' | 'CNPJ'): Promise<DocumentValidation> {
    const response = await apiClient['client'].post<DocumentValidation>('/validar-documento/', {
      documento,
      tipo
    });
    return response.data;
  }

  async getHistoricoStatus(id: number): Promise<any[]> {
    const response = await apiClient['client'].get(`${this.basePath}/${id}/historico_status/`);
    return response.data;
  }

  async buscarAvancada(filtros: InquilinoSearchParams): Promise<InquilinoListResponse> {
    return this.list(filtros);
  }

  async exportarRelatorio(formato: 'pdf' | 'excel', filtros?: InquilinoSearchParams): Promise<Blob> {
    const searchParams = new URLSearchParams();

    if (filtros) {
      Object.entries(filtros).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    searchParams.append('formato', formato);

    const response = await apiClient['client'].get(
      `${this.basePath}/exportar/?${searchParams.toString()}`,
      { responseType: 'blob' }
    );

    return response.data;
  }

  async uploadDocumento(inquilinoId: number, arquivo: File, tipoDocumento: string): Promise<any> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);
    formData.append('tipo_documento', tipoDocumento);

    const response = await apiClient['client'].post(
      `${this.basePath}/${inquilinoId}/upload_documento/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async getDocumentos(inquilinoId: number): Promise<any[]> {
    const response = await apiClient['client'].get(`${this.basePath}/${inquilinoId}/documentos/`);
    return response.data;
  }

  async deleteDocumento(inquilinoId: number, documentoId: number): Promise<void> {
    await apiClient['client'].delete(`${this.basePath}/${inquilinoId}/documentos/${documentoId}/`);
  }
}

export const inquilinoService = new InquilinoService();
