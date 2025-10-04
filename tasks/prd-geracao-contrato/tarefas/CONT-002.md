# CONT-002: Frontend Completo (Modal + Formulário + Integração)

## Metadata
- **Status**: Pendente
- **Prioridade**: Alta
- **Estimativa**: ~12 dias úteis
- **Complexidade**: Média-Alta
- **Dependências**: CONT-001 (API backend pronta)
- **Desbloqueia**: CONT-003

## Visão Geral

Implementar toda a camada frontend da funcionalidade de geração de contratos, incluindo componentes React (botão, modal, formulário, modal de sucesso), validações client-side com Yup, hook customizado para API calls, integração com a listagem de inquilinos e funcionalidades de download/impressão de PDF.

## Objetivos

1. Criar componentes React reutilizáveis e tipados (TypeScript)
2. Implementar formulário completo com validações Yup
3. Desenvolver hook customizado `useGerarContrato` para comunicação com API
4. Integrar botão "Gerar Contrato" em `InquilinosListPage`
5. Implementar modal de sucesso com opções de download e impressão
6. Garantir acessibilidade (WCAG AA) e responsividade
7. Atingir cobertura de testes ≥85% nos novos componentes

## Subtarefas Detalhadas

### 1. Setup de Estrutura de Componentes (1 dia)

**Atividades**:
- [ ] Criar diretório `frontend/src/components/contratos/`
- [ ] Criar arquivos de componentes:
  - `GerarContratoButton.tsx`
  - `GerarContratoModal.tsx`
  - `FormularioContrato.tsx`
  - `ContratoSucessoModal.tsx`
- [ ] Criar hook customizado `frontend/src/hooks/useGerarContrato.ts`
- [ ] Criar tipos TypeScript `frontend/src/types/contrato.ts`
- [ ] Configurar barrel exports (`index.ts`)

**Estrutura de Arquivos**:
```
frontend/src/
├── components/
│   └── contratos/
│       ├── index.ts
│       ├── GerarContratoButton.tsx
│       ├── GerarContratoModal.tsx
│       ├── FormularioContrato.tsx
│       └── ContratoSucessoModal.tsx
├── hooks/
│   └── useGerarContrato.ts
└── types/
    └── contrato.ts
```

---

### 2. Tipos TypeScript (1 dia)

**Arquivo**: `frontend/src/types/contrato.ts`

**Implementação**:

```typescript
export interface EnderecoLocador {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Locador {
  nomeCompleto: string;
  nacionalidade: string;
  estadoCivil: string;
  profissao: string;
  cpf: string;
  endereco: EnderecoLocador;
}

export interface Locatario {
  nomeCompleto: string;
  nacionalidade: string;
  profissao: string;
  cpf: string;
  rg: string;
  rgOrgao: string;
  enderecoCompleto: string;
  telefone: string;
  email: string;
}

export interface ContratoDetalhes {
  dataInicio: string; // YYYY-MM-DD
  valorCaucao: number;
  clausulaSegunda: string;
}

export interface ContratoFormData {
  locador: Locador;
  locatario: Locatario;
  contrato: ContratoDetalhes;
  inventarioMoveis: string;
}

// Payload para API (snake_case)
export interface ContratoApiPayload {
  locador: {
    nome_completo: string;
    nacionalidade: string;
    estado_civil: string;
    profissao: string;
    cpf: string;
    endereco: {
      rua: string;
      numero: string;
      bairro: string;
      cidade: string;
      estado: string;
      cep: string;
    };
  };
  locatario: {
    nome_completo: string;
    nacionalidade: string;
    profissao: string;
    cpf: string;
    rg: string;
    rg_orgao: string;
    endereco_completo: string;
    telefone: string;
    email: string;
  };
  contrato: {
    data_inicio: string;
    valor_caucao: number;
    clausula_segunda: string;
  };
  inventario_moveis: string;
}
```

---

### 3. Hook useGerarContrato (1 dia)

**Arquivo**: `frontend/src/hooks/useGerarContrato.ts`

**Implementação**:

```typescript
import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import type { ContratoFormData, ContratoApiPayload } from '../types/contrato';

interface UseGerarContratoReturn {
  gerarContrato: (data: ContratoFormData) => Promise<Blob>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGerarContrato(): UseGerarContratoReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformarParaPayload = (data: ContratoFormData): ContratoApiPayload => {
    return {
      locador: {
        nome_completo: data.locador.nomeCompleto,
        nacionalidade: data.locador.nacionalidade,
        estado_civil: data.locador.estadoCivil,
        profissao: data.locador.profissao,
        cpf: data.locador.cpf,
        endereco: {
          rua: data.locador.endereco.rua,
          numero: data.locador.endereco.numero,
          bairro: data.locador.endereco.bairro,
          cidade: data.locador.endereco.cidade,
          estado: data.locador.endereco.estado,
          cep: data.locador.endereco.cep,
        },
      },
      locatario: {
        nome_completo: data.locatario.nomeCompleto,
        nacionalidade: data.locatario.nacionalidade,
        profissao: data.locatario.profissao,
        cpf: data.locatario.cpf,
        rg: data.locatario.rg,
        rg_orgao: data.locatario.rgOrgao,
        endereco_completo: data.locatario.enderecoCompleto,
        telefone: data.locatario.telefone,
        email: data.locatario.email,
      },
      contrato: {
        data_inicio: data.contrato.dataInicio,
        valor_caucao: data.contrato.valorCaucao,
        clausula_segunda: data.contrato.clausulaSegunda,
      },
      inventario_moveis: data.inventarioMoveis,
    };
  };

  const gerarContrato = async (data: ContratoFormData): Promise<Blob> => {
    setLoading(true);
    setError(null);

    try {
      const payload = transformarParaPayload(data);

      const response = await axios.post('/api/v1/contratos/gerar/', payload, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        throw new Error('Erro ao gerar contrato');
      }

      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError;

      let errorMessage = 'Erro ao gerar contrato. Tente novamente.';

      if (axiosError.response?.status === 403) {
        errorMessage = 'Você não tem permissão para gerar contratos.';
      } else if (axiosError.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
      }

      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { gerarContrato, loading, error, clearError };
}
```

**Testes** (`useGerarContrato.test.ts`):
- [ ] Teste de chamada bem-sucedida (mock de axios retornando Blob)
- [ ] Teste de erro 403 (permissão negada)
- [ ] Teste de erro 400 (validação)
- [ ] Teste de loading states
- [ ] Teste de clearError

---

### 4. Componente GerarContratoButton (1 dia)

**Arquivo**: `frontend/src/components/contratos/GerarContratoButton.tsx`

**Implementação**:

```typescript
import React from 'react';
import { useAuth } from '../../hooks/useAuth'; // Hook de autenticação existente

interface GerarContratoButtonProps {
  onOpenModal: () => void;
}

export function GerarContratoButton({ onOpenModal }: GerarContratoButtonProps) {
  const { user } = useAuth();

  // Renderiza apenas para super admins
  if (!user?.is_superuser) {
    return null;
  }

  return (
    <button
      onClick={onOpenModal}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      title="Gerar Contrato de Locação"
      aria-label="Gerar contrato de locação"
    >
      Gerar Contrato
    </button>
  );
}
```

**Testes** (`GerarContratoButton.test.tsx`):
- [ ] Renderiza botão para super admin
- [ ] Não renderiza para usuário comum
- [ ] Chama onOpenModal ao clicar
- [ ] Exibe tooltip correto
- [ ] Acessibilidade (aria-label presente)

---

### 5. Validações Yup (1 dia)

**Arquivo**: `frontend/src/schemas/contratoValidation.ts`

**Implementação**:

```typescript
import * as yup from 'yup';

// Função auxiliar de validação de CPF
function validarCpf(cpf: string | undefined): boolean {
  if (!cpf) return false;

  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return false;

  // Implementar algoritmo de validação de CPF
  // ... (lógica completa)

  return true;
}

export const contratoSchema = yup.object({
  locador: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200, 'Máximo 200 caracteres'),
    nacionalidade: yup.string().required('Campo obrigatório').max(50, 'Máximo 50 caracteres'),
    estadoCivil: yup.string().required('Campo obrigatório').max(30, 'Máximo 30 caracteres'),
    profissao: yup.string().required('Campo obrigatório').max(100, 'Máximo 100 caracteres'),
    cpf: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido: XXX.XXX.XXX-XX')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    endereco: yup.object({
      rua: yup.string().required('Campo obrigatório').max(200),
      numero: yup.string().required('Campo obrigatório').max(20),
      bairro: yup.string().required('Campo obrigatório').max(100),
      cidade: yup.string().required('Campo obrigatório').max(100),
      estado: yup
        .string()
        .required('Campo obrigatório')
        .length(2, 'UF deve ter 2 letras'),
      cep: yup
        .string()
        .required('Campo obrigatório')
        .matches(/^\d{5}-\d{3}$/, 'Formato inválido: XXXXX-XXX'),
    }),
  }),
  locatario: yup.object({
    nomeCompleto: yup.string().required('Campo obrigatório').max(200),
    nacionalidade: yup.string().required('Campo obrigatório').max(50),
    profissao: yup.string().required('Campo obrigatório').max(100),
    cpf: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'Formato inválido')
      .test('cpf-valido', 'CPF inválido', validarCpf),
    rg: yup.string().required('Campo obrigatório').max(20),
    rgOrgao: yup.string().required('Campo obrigatório').max(20),
    enderecoCompleto: yup.string().required('Campo obrigatório').max(300),
    telefone: yup
      .string()
      .required('Campo obrigatório')
      .matches(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato inválido: (XX) XXXXX-XXXX'),
    email: yup.string().required('Campo obrigatório').email('Email inválido'),
  }),
  contrato: yup.object({
    dataInicio: yup
      .date()
      .required('Campo obrigatório')
      .min(new Date(), 'Data deve ser futura'),
    valorCaucao: yup
      .number()
      .required('Campo obrigatório')
      .positive('Valor deve ser positivo')
      .max(999999.99, 'Valor máximo excedido'),
    clausulaSegunda: yup
      .string()
      .required('Campo obrigatório')
      .min(50, 'Mínimo 50 caracteres')
      .max(5000, 'Máximo 5000 caracteres'),
  }),
  inventarioMoveis: yup
    .string()
    .required('Campo obrigatório')
    .min(20, 'Mínimo 20 caracteres')
    .max(2000, 'Máximo 2000 caracteres'),
});
```

---

### 6. Componente FormularioContrato (3 dias)

**Arquivo**: `frontend/src/components/contratos/FormularioContrato.tsx`

**Implementação**:

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { contratoSchema } from '../../schemas/contratoValidation';
import type { ContratoFormData } from '../../types/contrato';

interface FormularioContratoProps {
  onSubmit: (data: ContratoFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function FormularioContrato({ onSubmit, onCancel, loading }: FormularioContratoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ContratoFormData>({
    resolver: yupResolver(contratoSchema),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Seção 1: Dados do Locador */}
      <section className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">Dados do Locador</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locador.nomeCompleto')}
              className="w-full border rounded px-3 py-2"
              placeholder="Nome completo do locador"
            />
            {errors.locador?.nomeCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locador.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Nacionalidade <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.nacionalidade')}
                className="w-full border rounded px-3 py-2"
                placeholder="brasileiro, argentino, etc."
              />
              {errors.locador?.nacionalidade && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.nacionalidade.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Estado Civil <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.estadoCivil')}
                className="w-full border rounded px-3 py-2"
                placeholder="solteiro, casado, etc."
              />
              {errors.locador?.estadoCivil && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.estadoCivil.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Profissão <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.profissao')}
                className="w-full border rounded px-3 py-2"
              />
              {errors.locador?.profissao && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.profissao.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.cpf')}
                className="w-full border rounded px-3 py-2"
                placeholder="XXX.XXX.XXX-XX"
              />
              {errors.locador?.cpf && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.cpf.message}
                </p>
              )}
            </div>
          </div>

          {/* Endereço do Locador */}
          <h4 className="font-semibold mt-4">Endereço do Locador</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block font-medium mb-1">
                Rua <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.rua')}
                className="w-full border rounded px-3 py-2"
              />
              {errors.locador?.endereco?.rua && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.rua.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Número <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.numero')}
                className="w-full border rounded px-3 py-2"
              />
              {errors.locador?.endereco?.numero && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.numero.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block font-medium mb-1">
                Bairro <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.bairro')}
                className="w-full border rounded px-3 py-2"
              />
              {errors.locador?.endereco?.bairro && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.bairro.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.cidade')}
                className="w-full border rounded px-3 py-2"
              />
              {errors.locador?.endereco?.cidade && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.cidade.message}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">
                UF <span className="text-red-500">*</span>
              </label>
              <input
                {...register('locador.endereco.estado')}
                className="w-full border rounded px-3 py-2"
                maxLength={2}
                placeholder="SC"
              />
              {errors.locador?.endereco?.estado && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.locador.endereco.estado.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block font-medium mb-1">
              CEP <span className="text-red-500">*</span>
            </label>
            <input
              {...register('locador.endereco.cep')}
              className="w-full border rounded px-3 py-2"
              placeholder="XXXXX-XXX"
            />
            {errors.locador?.endereco?.cep && (
              <p className="text-red-500 text-sm mt-1">
                {errors.locador.endereco.cep.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Seção 2: Dados do Locatário */}
      <section className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">Dados do Locatário</h3>

        {/* Similar ao locador, implementar todos os campos */}
        {/* ... (campos do locatário) */}
      </section>

      {/* Seção 3: Detalhes do Contrato */}
      <section className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">Detalhes do Contrato</h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Data de Início <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('contrato.dataInicio')}
              className="w-full border rounded px-3 py-2"
            />
            {errors.contrato?.dataInicio && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.dataInicio.message}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">
              Valor da Caução (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('contrato.valorCaucao')}
              className="w-full border rounded px-3 py-2"
              placeholder="1700.00"
            />
            {errors.contrato?.valorCaucao && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.valorCaucao.message}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">
              Cláusula Segunda (Acordo de Pagamento){' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('contrato.clausulaSegunda')}
              className="w-full border rounded px-3 py-2"
              rows={5}
              placeholder="O aluguel convencionado é de R$ 1.700,00 mensais..."
            />
            {errors.contrato?.clausulaSegunda && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contrato.clausulaSegunda.message}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Mínimo 50 caracteres, máximo 5000
            </p>
          </div>
        </div>
      </section>

      {/* Seção 4: Inventário de Móveis */}
      <section className="border p-4 rounded">
        <h3 className="text-lg font-semibold mb-4">Inventário de Móveis</h3>

        <div>
          <label className="block font-medium mb-1">
            Descrição dos Móveis <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('inventarioMoveis')}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="armário de pia com tampo em granito, guarda-roupa, fogão elétrico..."
          />
          {errors.inventarioMoveis && (
            <p className="text-red-500 text-sm mt-1">
              {errors.inventarioMoveis.message}
            </p>
          )}
          <p className="text-gray-500 text-sm mt-1">
            Mínimo 20 caracteres, máximo 2000
          </p>
        </div>
      </section>

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border rounded hover:bg-gray-100 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !isValid}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Gerando...' : 'Gerar Contrato'}
        </button>
      </div>
    </form>
  );
}
```

**Testes** (`FormularioContrato.test.tsx`):
- [ ] Renderiza todos os campos corretamente
- [ ] Exibe mensagens de erro ao submeter com campos vazios
- [ ] Valida CPF inválido
- [ ] Valida email inválido
- [ ] Valida telefone inválido
- [ ] Desabilita botão submit quando formulário inválido
- [ ] Chama onSubmit com dados corretos ao submeter
- [ ] Chama onCancel ao clicar em Cancelar

---

### 7. Componente GerarContratoModal (1 dia)

**Arquivo**: `frontend/src/components/contratos/GerarContratoModal.tsx`

**Implementação**:

```typescript
import React, { useState } from 'react';
import { FormularioContrato } from './FormularioContrato';
import { ContratoSucessoModal } from './ContratoSucessoModal';
import { useGerarContrato } from '../../hooks/useGerarContrato';
import type { ContratoFormData } from '../../types/contrato';

interface GerarContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'form' | 'loading' | 'success' | 'error';

export function GerarContratoModal({ isOpen, onClose }: GerarContratoModalProps) {
  const [step, setStep] = useState<ModalStep>('form');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');

  const { gerarContrato, loading, error, clearError } = useGerarContrato();

  const handleSubmit = async (data: ContratoFormData) => {
    try {
      setStep('loading');
      const blob = await gerarContrato(data);

      // Gerar nome do arquivo
      const cpfSanitizado = data.locatario.cpf.replace(/\D/g, '');
      const nomeArq = `contrato_locacao_${cpfSanitizado}_${data.contrato.dataInicio}.pdf`;

      setPdfBlob(blob);
      setNomeArquivo(nomeArq);
      setStep('success');
    } catch (err) {
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    setPdfBlob(null);
    setNomeArquivo('');
    clearError();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Gerar Contrato de Locação</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {step === 'form' && (
            <FormularioContrato
              onSubmit={handleSubmit}
              onCancel={handleClose}
              loading={loading}
            />
          )}

          {step === 'loading' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Gerando contrato...</p>
            </div>
          )}

          {step === 'success' && pdfBlob && (
            <ContratoSucessoModal
              pdfBlob={pdfBlob}
              nomeArquivo={nomeArquivo}
              onClose={handleClose}
            />
          )}

          {step === 'error' && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error || 'Erro ao gerar contrato'}</p>
              <button
                onClick={() => setStep('form')}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### 8. Componente ContratoSucessoModal (1 dia)

**Arquivo**: `frontend/src/components/contratos/ContratoSucessoModal.tsx`

**Implementação**:

```typescript
import React from 'react';

interface ContratoSucessoModalProps {
  pdfBlob: Blob;
  nomeArquivo: string;
  onClose: () => void;
}

export function ContratoSucessoModal({
  pdfBlob,
  nomeArquivo,
  onClose,
}: ContratoSucessoModalProps) {
  const baixarPdf = () => {
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
  };

  const imprimirPdf = () => {
    const url = URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }, 1000);
    };
  };

  return (
    <div className="text-center py-12">
      <div className="text-green-500 text-6xl mb-4">✓</div>
      <h3 className="text-2xl font-bold mb-4">Contrato Gerado com Sucesso!</h3>
      <p className="text-gray-600 mb-6">
        Seu contrato está pronto. Escolha uma opção abaixo:
      </p>

      <div className="flex justify-center space-x-4">
        <button
          onClick={baixarPdf}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Baixar PDF
        </button>
        <button
          onClick={imprimirPdf}
          className="px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
        >
          Imprimir
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 border rounded hover:bg-gray-100 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
```

**Testes** (`ContratoSucessoModal.test.tsx`):
- [ ] Renderiza mensagem de sucesso
- [ ] Botão "Baixar PDF" cria download
- [ ] Botão "Imprimir" abre diálogo de impressão
- [ ] Botão "Fechar" chama onClose

---

### 9. Integração em InquilinosListPage (1 dia)

**Arquivo**: `frontend/src/pages/InquilinosListPage.tsx` (modificar)

**Implementação**:

```typescript
import React, { useState } from 'react';
import { GerarContratoButton, GerarContratoModal } from '../components/contratos';

export function InquilinosListPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inquilinos</h1>
        <GerarContratoButton onOpenModal={() => setModalOpen(true)} />
      </div>

      {/* Tabela de inquilinos existente */}
      {/* ... */}

      {/* Modal de Geração de Contrato */}
      <GerarContratoModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
```

---

### 10. Testes Frontend (1 dia)

**Testes de Integração** (`frontend/src/__tests__/integracao/gerarContrato.test.tsx`):
- [ ] Fluxo completo: abrir modal → preencher → gerar → baixar
- [ ] Validação de permissões (super admin vs. comum)
- [ ] Tratamento de erros de API

**Cobertura Mínima**:
- [ ] useGerarContrato: 100%
- [ ] GerarContratoButton: 100%
- [ ] FormularioContrato: ≥85%
- [ ] GerarContratoModal: ≥85%
- [ ] ContratoSucessoModal: 100%

---

## Arquivos Afetados

### Novos Arquivos
- `frontend/src/components/contratos/index.ts`
- `frontend/src/components/contratos/GerarContratoButton.tsx`
- `frontend/src/components/contratos/GerarContratoModal.tsx`
- `frontend/src/components/contratos/FormularioContrato.tsx`
- `frontend/src/components/contratos/ContratoSucessoModal.tsx`
- `frontend/src/hooks/useGerarContrato.ts`
- `frontend/src/types/contrato.ts`
- `frontend/src/schemas/contratoValidation.ts`
- Testes correspondentes

### Arquivos Modificados
- `frontend/src/pages/InquilinosListPage.tsx` (adicionar botão + modal)

---

## Critérios de Aceitação

### Funcionalidade
- [ ] Botão "Gerar Contrato" visível apenas para super admins
- [ ] Modal abre ao clicar no botão
- [ ] Formulário completo com todos os campos
- [ ] Validações client-side funcionando (Yup)
- [ ] Mensagens de erro específicas exibidas
- [ ] Loading spinner durante geração
- [ ] Modal de sucesso exibe após geração
- [ ] Download de PDF funcionando
- [ ] Impressão de PDF funcionando
- [ ] Modal fecha corretamente ao clicar "X" ou "Fechar"

### UX/UI
- [ ] Modal responsivo (desktop, tablet, mobile)
- [ ] Campos com placeholders informativos
- [ ] Asteriscos vermelhos em campos obrigatórios
- [ ] Botão submit desabilitado quando formulário inválido
- [ ] Feedback visual de loading
- [ ] Transições suaves

### Acessibilidade
- [ ] ARIA labels em todos os campos
- [ ] Navegação por teclado (Tab order lógico)
- [ ] Screen readers anunciam erros
- [ ] Contraste WCAG AA (mínimo 4.5:1)
- [ ] Focus visible em campos

### Testes
- [ ] Cobertura ≥ 85% nos novos componentes
- [ ] Testes unitários passando
- [ ] Testes de integração passando

---

## Riscos e Mitigações

### Risco 1: Formulário Muito Extenso
- **Mitigação**: Agrupar campos em seções, usar scroll interno no modal

### Risco 2: Validação de CPF Client-Side Complexa
- **Mitigação**: Reutilizar lógica de validação testada, testes abrangentes

### Risco 3: Performance de Renderização
- **Mitigação**: Otimizar re-renders com React.memo se necessário

---

## Definição de Pronto (DoD)

- [ ] Todos os subtasks concluídos
- [ ] Código revisado (code review aprovado)
- [ ] Testes com cobertura ≥ 85%
- [ ] Lint/ESLint sem erros
- [ ] Formulário testado manualmente em diferentes resoluções
- [ ] Acessibilidade validada (lighthouse/axe)
- [ ] Integração com backend testada (API CONT-001)
- [ ] Aprovação de UX/PO

---

**Próxima Tarefa**: CONT-003 - Qualidade e Deploy (depende desta tarefa)
