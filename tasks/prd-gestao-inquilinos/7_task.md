---
status: pending
parallelizable: true
blocked_by: ["1.0"]
---

<task_context>
<domain>frontend/structure</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
<unblocks>8.0,9.0,11.0</unblocks>
</task_context>

# Tarefa 7.0: Criar estrutura base de componentes React

## Visão Geral
Desenvolver a estrutura base de componentes React para o sistema de gestão de inquilinos, incluindo layouts, roteamento, integração com API, gerenciamento de estado e componentes reutilizáveis. Base para todas as interfaces do sistema.

## Requisitos
- Estrutura de componentes organizada e escalável
- Roteamento React Router integrado ao sistema existente
- Gerenciamento de estado (Context API ou Redux)
- Integração com API backend
- Componentes base reutilizáveis
- Tipagem TypeScript completa
- Responsividade mobile-first
- Integração com Tailwind CSS

## Subtarefas
- [ ] 7.1 Configurar estrutura de diretórios e routing
- [ ] 7.2 Criar context providers para inquilinos
- [ ] 7.3 Implementar serviços de API
- [ ] 7.4 Desenvolver componentes base (Layout, Card, Button, etc.)
- [ ] 7.5 Criar hooks customizados para inquilinos
- [ ] 7.6 Implementar tipagem TypeScript
- [ ] 7.7 Configurar interceptors e tratamento de erros
- [ ] 7.8 Integrar com sistema de navegação existente

## Sequenciamento
- Bloqueado por: 1.0 (Modelo Inquilino definido)
- Desbloqueia: 8.0 (Formulários), 9.0 (Busca), 11.0 (Dashboard)
- Paralelizável: Sim (pode iniciar após definição dos modelos, não precisa esperar API)

## Detalhes de Implementação

### Estrutura de Diretórios
```
frontend/src/
├── components/
│   ├── inquilinos/
│   │   ├── InquilinoCard.tsx
│   │   ├── InquilinoList.tsx
│   │   ├── InquilinoForm.tsx
│   │   └── InquilinoDetails.tsx
│   ├── common/
│   │   ├── Layout.tsx
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   └── ui/
├── contexts/
│   ├── InquilinoContext.tsx
│   └── AuthContext.tsx
├── hooks/
│   ├── useInquilinos.ts
│   ├── useApi.ts
│   └── useLocalStorage.ts
├── services/
│   ├── api.ts
│   ├── inquilinoService.ts
│   └── validationService.ts
├── types/
│   ├── inquilino.ts
│   └── api.ts
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
└── pages/
    ├── InquilinosListPage.tsx
    ├── InquilinoFormPage.tsx
    └── InquilinoDetailsPage.tsx
```

### Tipos TypeScript
```typescript
// types/inquilino.ts
export interface Inquilino {
  id: number;
  tipo: 'PF' | 'PJ';
  nome_completo?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cpf?: string;
  cnpj?: string;
  rg?: string;
  email: string;
  telefone: string;
  status: 'ATIVO' | 'INATIVO' | 'INADIMPLENTE' | 'BLOQUEADO';
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  renda?: number;
  inscricao_estadual?: string;
  responsavel_legal?: string;
  endereco_completo?: string;
  observacoes?: string;
  apartamentos_ativos?: ApartamentoAtivo[];
  documento_principal?: string;
  tempo_como_inquilino?: number;
  created_at: string;
  updated_at: string;
}

export interface ApartamentoAtivo {
  id: number;
  unit_number: string;
  building_name__name: string;
}

export interface InquilinoFormData {
  tipo: 'PF' | 'PJ';
  email: string;
  telefone: string;
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
  observacoes?: string;
}
```

### Context Provider
```typescript
// contexts/InquilinoContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Inquilino } from '../types/inquilino';

interface InquilinoState {
  inquilinos: Inquilino[];
  selectedInquilino: Inquilino | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
}

type InquilinoAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INQUILINOS'; payload: { inquilinos: Inquilino[]; totalCount: number } }
  | { type: 'ADD_INQUILINO'; payload: Inquilino }
  | { type: 'UPDATE_INQUILINO'; payload: Inquilino }
  | { type: 'DELETE_INQUILINO'; payload: number }
  | { type: 'SET_SELECTED'; payload: Inquilino | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PAGE'; payload: number };

const initialState: InquilinoState = {
  inquilinos: [],
  selectedInquilino: null,
  loading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
};

function inquilinoReducer(state: InquilinoState, action: InquilinoAction): InquilinoState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_INQUILINOS':
      return {
        ...state,
        inquilinos: action.payload.inquilinos,
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
      };
    case 'ADD_INQUILINO':
      return {
        ...state,
        inquilinos: [action.payload, ...state.inquilinos],
        totalCount: state.totalCount + 1,
      };
    case 'UPDATE_INQUILINO':
      return {
        ...state,
        inquilinos: state.inquilinos.map(i =>
          i.id === action.payload.id ? action.payload : i
        ),
        selectedInquilino: state.selectedInquilino?.id === action.payload.id
          ? action.payload
          : state.selectedInquilino,
      };
    case 'DELETE_INQUILINO':
      return {
        ...state,
        inquilinos: state.inquilinos.filter(i => i.id !== action.payload),
        totalCount: state.totalCount - 1,
        selectedInquilino: state.selectedInquilino?.id === action.payload
          ? null
          : state.selectedInquilino,
      };
    case 'SET_SELECTED':
      return { ...state, selectedInquilino: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    default:
      return state;
  }
}

const InquilinoContext = createContext<{
  state: InquilinoState;
  dispatch: React.Dispatch<InquilinoAction>;
} | null>(null);

export function InquilinoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inquilinoReducer, initialState);

  return (
    <InquilinoContext.Provider value={{ state, dispatch }}>
      {children}
    </InquilinoContext.Provider>
  );
}

export function useInquilinoContext() {
  const context = useContext(InquilinoContext);
  if (!context) {
    throw new Error('useInquilinoContext must be used within InquilinoProvider');
  }
  return context;
}
```

### Serviço de API
```typescript
// services/inquilinoService.ts
import { api } from './api';
import { Inquilino, InquilinoFormData } from '../types/inquilino';

export interface InquilinoListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Inquilino[];
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

class InquilinoService {
  async list(params: InquilinoSearchParams = {}): Promise<InquilinoListResponse> {
    const response = await api.get('/inquilinos/', { params });
    return response.data;
  }

  async get(id: number): Promise<Inquilino> {
    const response = await api.get(`/inquilinos/${id}/`);
    return response.data;
  }

  async create(data: InquilinoFormData): Promise<Inquilino> {
    const response = await api.post('/inquilinos/', data);
    return response.data;
  }

  async update(id: number, data: Partial<InquilinoFormData>): Promise<Inquilino> {
    const response = await api.patch(`/inquilinos/${id}/`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await api.delete(`/inquilinos/${id}/`);
  }

  async alterarStatus(id: number, status: string, motivo?: string): Promise<void> {
    await api.post(`/inquilinos/${id}/alterar_status/`, { status, motivo });
  }

  async getEstatisticas() {
    const response = await api.get('/inquilinos/estatisticas/');
    return response.data;
  }

  async validarDocumento(documento: string, tipo: 'CPF' | 'CNPJ') {
    const response = await api.post('/validar-documento/', {
      documento,
      tipo
    });
    return response.data;
  }
}

export const inquilinoService = new InquilinoService();
```

### Hook Customizado
```typescript
// hooks/useInquilinos.ts
import { useEffect } from 'react';
import { useInquilinoContext } from '../contexts/InquilinoContext';
import { inquilinoService, InquilinoSearchParams } from '../services/inquilinoService';
import { InquilinoFormData } from '../types/inquilino';

export function useInquilinos() {
  const { state, dispatch } = useInquilinoContext();

  const loadInquilinos = async (params: InquilinoSearchParams = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await inquilinoService.list(params);
      dispatch({
        type: 'SET_INQUILINOS',
        payload: {
          inquilinos: response.results,
          totalCount: response.count
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar inquilinos' });
    }
  };

  const createInquilino = async (data: InquilinoFormData) => {
    try {
      const novoInquilino = await inquilinoService.create(data);
      dispatch({ type: 'ADD_INQUILINO', payload: novoInquilino });
      return novoInquilino;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar inquilino' });
      throw error;
    }
  };

  const updateInquilino = async (id: number, data: Partial<InquilinoFormData>) => {
    try {
      const inquilinoAtualizado = await inquilinoService.update(id, data);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
      return inquilinoAtualizado;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar inquilino' });
      throw error;
    }
  };

  const deleteInquilino = async (id: number) => {
    try {
      await inquilinoService.delete(id);
      dispatch({ type: 'DELETE_INQUILINO', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir inquilino' });
      throw error;
    }
  };

  return {
    ...state,
    loadInquilinos,
    createInquilino,
    updateInquilino,
    deleteInquilino,
  };
}
```

### Componente Base Layout
```typescript
// components/common/Layout.tsx
import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Layout({ children, title, subtitle, actions }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(title || actions) && (
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                {title && (
                  <h1 className="text-2xl font-bold text-gray-900">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="mt-1 text-sm text-gray-600">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex space-x-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        )}
        <div className="bg-white shadow rounded-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
```

## Critérios de Sucesso
- [ ] Estrutura de diretórios organizada e escalável
- [ ] Context providers funcionando corretamente
- [ ] Serviços de API integrados
- [ ] Tipagem TypeScript completa
- [ ] Hooks customizados funcionais
- [ ] Componentes base responsivos
- [ ] Roteamento integrado ao sistema existente
- [ ] Tratamento de erros implementado
- [ ] Testes unitários para componentes base
- [ ] Performance otimizada (lazy loading, memoização)