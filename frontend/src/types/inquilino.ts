// Types for Inquilino management system

export interface Inquilino {
  id: number;
  tipo: 'PF' | 'PJ';
  email: string;
  telefone: string;
  status: 'ATIVO' | 'INATIVO' | 'INADIMPLENTE' | 'BLOQUEADO';
  observacoes?: string;

  // Campos Pessoa Física
  nome_completo?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  renda?: number;

  // Campos Pessoa Jurídica
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  responsavel_legal?: string;

  // Endereço opcional
  endereco_completo?: string;

  // Propriedades calculadas
  identificacao?: string;
  identificacao_formatada?: string;
  nome_principal?: string;
  cpf_formatado?: string;
  cnpj_formatado?: string;

  // Relacionamentos
  apartamentos_ativos?: ApartamentoAtivo[];

  // Auditoria
  created_at: string;
  updated_at: string;
}

export interface ApartamentoAtivo {
  id: number;
  unit_number: string;
  building_name__name: string;
  data_inicio?: string;
  data_fim?: string;
}

export interface InquilinoFormData {
  tipo: 'PF' | 'PJ';
  email: string;
  telefone: string;
  observacoes?: string;

  // Campos específicos PF
  nome_completo?: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  renda?: number;

  // Campos específicos PJ
  razao_social?: string;
  nome_fantasia?: string;
  cnpj?: string;
  inscricao_estadual?: string;
  responsavel_legal?: string;

  // Campos opcionais
  endereco_completo?: string;
}

export interface InquilinoSearchParams {
  search?: string;
  tipo?: 'PF' | 'PJ';
  status?: string;
  apartamento?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface InquilinoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Inquilino[];
}

export interface InquilinoStats {
  total_inquilinos: number;
  inquilinos_ativos: number;
  inquilinos_inativos?: number;
  inquilinos_inadimplentes: number;
  inquilinos_bloqueados?: number;
  inquilinos_pf?: number;
  inquilinos_pj?: number;
  apartamentos_ocupados?: number;
  taxa_ocupacao: number;
}

export interface StatusChangeData {
  status: string;
  motivo?: string;
}

// Estados do Context
export interface InquilinoState {
  inquilinos: Inquilino[];
  selectedInquilino: Inquilino | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  stats?: InquilinoStats;
}

// Actions do Context
export type InquilinoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INQUILINOS'; payload: { inquilinos: Inquilino[]; totalCount: number } }
  | { type: 'ADD_INQUILINO'; payload: Inquilino }
  | { type: 'UPDATE_INQUILINO'; payload: Inquilino }
  | { type: 'DELETE_INQUILINO'; payload: number }
  | { type: 'SET_SELECTED'; payload: Inquilino | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_STATS'; payload: InquilinoStats };

// Validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface DocumentValidation {
  valid: boolean;
  formatted?: string;
  errors?: string[];
  exists?: boolean;
  error?: string;
}

export interface DocumentoUpload {
  file: File;
  tipo: 'RG' | 'CNH' | 'COMPROVANTE_RENDA' | 'COMPROVANTE_RESIDENCIA' | 'OUTROS';
  preview?: string;
}

export interface FormStep {
  id: string;
  title: string;
  isValid?: boolean;
  isCompleted?: boolean;
}

export interface AssociacaoListItem {
  id: number;
  inquilino_nome: string;
  apartamento_numero: string;
  edificio_nome: string;
  data_inicio: string;
  data_fim: string | null;
  valor_aluguel: string | null;
  ativo: boolean;
  status_inquilino: string;
  esta_ativo: boolean;
}

export interface AssociacaoDetail extends AssociacaoListItem {
  inquilino: number;
  apartamento: number;
  apartamento_info: {
    unit_number: string;
    building_name: string;
    floor?: string | null;
  };
  observacoes?: string | null;
  duracao_meses: number;
  created_at: string;
  updated_at: string;
}

export interface AssociacaoFormData {
  apartamento: number;
  data_inicio: string;
  valor_aluguel?: string;
  observacoes?: string;
}

export interface FinalizarAssociacaoInput {
  data_fim?: string;
  observacoes?: string;
}

// Ensure this file is treated as a module
export {}
