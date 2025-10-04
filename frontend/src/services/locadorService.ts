import { apiClient } from './api';

export interface LocadorEntity {
  id: number;
  nome_completo: string;
  nacionalidade: string;
  estado_civil: string;
  profissao: string;
  cpf: string;
  email?: string | null;
  telefone?: string | null;
  endereco_rua: string;
  endereco_numero: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado: string;
  endereco_cep: string;
}

class LocadorService {
  private readonly basePath = '/locadores';

  async list(search?: string): Promise<LocadorEntity[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const res = await apiClient['client'].get<LocadorEntity[]>(`${this.basePath}/?${params.toString()}`);
    // DRF ModelViewSet list returns {count, results...} when pagination enabled; handle both
    const data = res.data as any;
    if (Array.isArray(data)) return data as LocadorEntity[];
    if (data && Array.isArray(data.results)) return data.results as LocadorEntity[];
    return [];
  }

  async get(id: number): Promise<LocadorEntity> {
    const res = await apiClient['client'].get<LocadorEntity>(`${this.basePath}/${id}/`);
    return res.data;
  }
}

export const locadorService = new LocadorService();
export default locadorService;

