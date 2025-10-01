---
status: pending
parallelizable: false
blocked_by: ["8.0", "6.0"]
---

<task_context>
<domain>frontend/associations</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server</dependencies>
<unblocks>16.0</unblocks>
</task_context>

# Tarefa 12.0: Implementar gestão de associações apartamento-inquilino

## Visão Geral
Desenvolver interface completa para gestão de associações entre inquilinos e apartamentos, incluindo criação, edição, visualização de histórico, controle de períodos, e validações de conflitos. Interface crítica para operação do sistema.

## Requisitos
- Formulário de criação de associações
- Validação de conflitos de período
- Visualização de histórico completo
- Edição de associações existentes
- Finalização de locações
- Interface de seleção de apartamentos
- Calendário de ocupação
- Alertas visuais de conflitos

## Subtarefas
- [ ] 12.1 Criar formulário de nova associação
- [ ] 12.2 Implementar validação de conflitos
- [ ] 12.3 Desenvolver visualização de histórico
- [ ] 12.4 Criar interface de edição
- [ ] 12.5 Implementar finalização de locações
- [ ] 12.6 Desenvolver calendário de ocupação
- [ ] 12.7 Adicionar seletor de apartamentos
- [ ] 12.8 Otimizar responsividade e UX

## Sequenciamento
- Bloqueado por: 8.0 (Formulários), 6.0 (API de associações)
- Desbloqueia: 16.0 (Integração final)
- Paralelizável: Não (depende de formulários e API)

## Detalhes de Implementação

### Componente Principal de Associações
```typescript
// components/associacoes/AssociacaoManager.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../common/Layout';
import { AssociacaoForm } from './AssociacaoForm';
import { AssociacaoHistory } from './AssociacaoHistory';
import { CalendarioOcupacao } from './CalendarioOcupacao';
import { useInquilinoDetails } from '../../hooks/useInquilinoDetails';
import { useAssociacoes } from '../../hooks/useAssociacoes';

export function AssociacaoManager() {
  const { inquilinoId } = useParams<{ inquilinoId: string }>();
  const [activeTab, setActiveTab] = useState<'atual' | 'nova' | 'historico' | 'calendario'>('atual');

  const { inquilino, loading: inquilinoLoading } = useInquilinoDetails(Number(inquilinoId));
  const {
    associacoes,
    associacaoAtiva,
    loading: associacoesLoading,
    loadAssociacoes,
    createAssociacao,
    updateAssociacao,
    finalizarAssociacao
  } = useAssociacoes(Number(inquilinoId));

  useEffect(() => {
    if (inquilinoId) {
      loadAssociacoes();
    }
  }, [inquilinoId, loadAssociacoes]);

  const handleNovaAssociacao = async (data: AssociacaoFormData) => {
    try {
      await createAssociacao(data);
      setActiveTab('atual');
    } catch (error) {
      console.error('Erro ao criar associação:', error);
    }
  };

  const handleFinalizarAssociacao = async (associacaoId: number, dataFim?: string, motivo?: string) => {
    try {
      await finalizarAssociacao(associacaoId, dataFim, motivo);
      loadAssociacoes();
    } catch (error) {
      console.error('Erro ao finalizar associação:', error);
    }
  };

  if (inquilinoLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!inquilino) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Inquilino não encontrado</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'atual', label: 'Associação Atual', count: associacaoAtiva ? 1 : 0 },
    { id: 'nova', label: 'Nova Associação', count: null },
    { id: 'historico', label: 'Histórico', count: associacoes.length },
    { id: 'calendario', label: 'Calendário', count: null }
  ];

  return (
    <Layout
      title={`Associações - ${inquilino.nome_completo || inquilino.razao_social}`}
      subtitle="Gestão de associações com apartamentos"
    >
      <div className="space-y-6">
        {/* Informações do Inquilino */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {inquilino.nome_completo || inquilino.razao_social}
              </h3>
              <p className="text-sm text-gray-500">
                {inquilino.cpf || inquilino.cnpj} • {inquilino.email}
              </p>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  inquilino.status === 'ATIVO'
                    ? 'bg-green-100 text-green-800'
                    : inquilino.status === 'INADIMPLENTE'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {inquilino.status}
                </span>
              </div>
            </div>
            {associacaoAtiva && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Apartamento Atual</p>
                <p className="font-medium">
                  {associacaoAtiva.apartamento_info.unit_number} - {associacaoAtiva.apartamento_info.building_name}
                </p>
                <p className="text-sm text-gray-500">
                  Desde {new Date(associacaoAtiva.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'atual' && (
              <AssociacaoAtual
                associacao={associacaoAtiva}
                onFinalizar={handleFinalizarAssociacao}
              />
            )}

            {activeTab === 'nova' && (
              <AssociacaoForm
                inquilinoId={Number(inquilinoId)}
                onSubmit={handleNovaAssociacao}
                onCancel={() => setActiveTab('atual')}
              />
            )}

            {activeTab === 'historico' && (
              <AssociacaoHistory
                associacoes={associacoes}
                loading={associacoesLoading}
              />
            )}

            {activeTab === 'calendario' && (
              <CalendarioOcupacao
                inquilinoId={Number(inquilinoId)}
                associacoes={associacoes}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
```

### Formulário de Nova Associação
```typescript
// components/associacoes/AssociacaoForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { FormField } from '../common/FormField';
import { ApartmentSelector } from './ApartmentSelector';
import { useApartamentos } from '../../hooks/useApartamentos';
import { useNotifications } from '../../contexts/NotificationContext';

interface AssociacaoFormData {
  apartamento_id: number;
  data_inicio: string;
  data_fim?: string;
  valor_aluguel?: number;
  observacoes?: string;
}

const schema = yup.object({
  apartamento_id: yup.number().required('Apartamento é obrigatório'),
  data_inicio: yup.date().required('Data de início é obrigatória'),
  data_fim: yup.date().min(yup.ref('data_inicio'), 'Data fim deve ser posterior ao início'),
  valor_aluguel: yup.number().positive('Valor deve ser positivo'),
  observacoes: yup.string()
});

interface AssociacaoFormProps {
  inquilinoId: number;
  onSubmit: (data: AssociacaoFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<AssociacaoFormData>;
}

export function AssociacaoForm({ inquilinoId, onSubmit, onCancel, initialData }: AssociacaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [conflitos, setConflitos] = useState<any[]>([]);

  const { addNotification } = useNotifications();
  const { apartamentosDisponiveis, loading: apartamentosLoading } = useApartamentos();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger
  } = useForm<AssociacaoFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      data_inicio: new Date().toISOString().split('T')[0],
      ...initialData
    }
  });

  const apartamentoId = watch('apartamento_id');
  const dataInicio = watch('data_inicio');
  const dataFim = watch('data_fim');

  // Verificar conflitos quando apartamento ou datas mudam
  useEffect(() => {
    if (apartamentoId && dataInicio) {
      verificarConflitos();
    }
  }, [apartamentoId, dataInicio, dataFim]);

  const verificarConflitos = async () => {
    try {
      const response = await fetch(`/api/v1/associacoes/verificar-conflitos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apartamento_id: apartamentoId,
          data_inicio: dataInicio,
          data_fim: dataFim || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConflitos(data.conflitos || []);
      }
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
    }
  };

  const onFormSubmit = async (data: AssociacaoFormData) => {
    if (conflitos.length > 0) {
      addNotification({
        type: 'error',
        title: 'Conflito de Período',
        message: 'Existe conflito com outras associações no período selecionado.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
      addNotification({
        type: 'success',
        title: 'Associação Criada',
        message: 'Associação criada com sucesso!'
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Criar Associação',
        message: error.message || 'Erro inesperado'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seleção de Apartamento */}
        <div className="md:col-span-2">
          <FormField
            name="apartamento_id"
            label="Apartamento"
            required
            error={errors.apartamento_id?.message}
          >
            <ApartmentSelector
              apartamentos={apartamentosDisponiveis}
              loading={apartamentosLoading}
              value={apartamentoId}
              onChange={(id) => setValue('apartamento_id', id)}
              onApartmentSelect={setSelectedApartment}
            />
          </FormField>
        </div>

        {/* Período da Locação */}
        <FormField
          name="data_inicio"
          label="Data de Início"
          required
          error={errors.data_inicio?.message}
        >
          <Input
            type="date"
            {...register('data_inicio')}
          />
        </FormField>

        <FormField
          name="data_fim"
          label="Data de Fim (Opcional)"
          error={errors.data_fim?.message}
        >
          <Input
            type="date"
            {...register('data_fim')}
          />
        </FormField>

        {/* Valor do Aluguel */}
        <FormField
          name="valor_aluguel"
          label="Valor do Aluguel"
          error={errors.valor_aluguel?.message}
        >
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('valor_aluguel')}
          />
        </FormField>

        {/* Observações */}
        <FormField
          name="observacoes"
          label="Observações"
          error={errors.observacoes?.message}
        >
          <textarea
            {...register('observacoes')}
            rows={3}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Observações adicionais sobre a locação..."
          />
        </FormField>
      </div>

      {/* Alertas de Conflito */}
      {conflitos.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Conflitos Detectados
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {conflitos.map((conflito, index) => (
                    <li key={index}>
                      {conflito.inquilino_nome} - {conflito.periodo}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informações do Apartamento Selecionado */}
      {selectedApartment && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Apartamento Selecionado
          </h4>
          <div className="text-sm text-blue-700">
            <p><strong>Número:</strong> {selectedApartment.unit_number}</p>
            <p><strong>Edifício:</strong> {selectedApartment.building_name}</p>
            <p><strong>Quartos:</strong> {selectedApartment.number_of_bedrooms}</p>
            <p><strong>Banheiros:</strong> {selectedApartment.number_of_bathrooms}</p>
            <p><strong>Área:</strong> {selectedApartment.square_footage}m²</p>
          </div>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || conflitos.length > 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Criando...' : 'Criar Associação'}
        </button>
      </div>
    </form>
  );
}
```

### Seletor de Apartamentos
```typescript
// components/associacoes/ApartmentSelector.tsx
import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Apartamento {
  id: number;
  unit_number: string;
  building_name: string;
  floor?: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  square_footage: number;
  is_available: boolean;
}

interface ApartmentSelectorProps {
  apartamentos: Apartamento[];
  loading: boolean;
  value?: number;
  onChange: (apartamentoId: number) => void;
  onApartmentSelect: (apartamento: Apartamento) => void;
}

export function ApartmentSelector({
  apartamentos,
  loading,
  value,
  onChange,
  onApartmentSelect
}: ApartmentSelectorProps) {
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredApartamentos = apartamentos.filter(apt =>
    apt.unit_number.toLowerCase().includes(search.toLowerCase()) ||
    apt.building_name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedApartment = apartamentos.find(apt => apt.id === value);

  const handleSelect = (apartamento: Apartamento) => {
    onChange(apartamento.id);
    onApartmentSelect(apartamento);
    setShowDropdown(false);
    setSearch('');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        className="relative border border-gray-300 rounded-md shadow-sm cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <div className="flex items-center px-3 py-2">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
          <div className="flex-1">
            {selectedApartment ? (
              <span className="text-gray-900">
                {selectedApartment.unit_number} - {selectedApartment.building_name}
              </span>
            ) : (
              <span className="text-gray-500">
                Selecione um apartamento...
              </span>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar apartamento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredApartamentos.length === 0 ? (
              <div className="px-3 py-2 text-gray-500 text-center">
                Nenhum apartamento encontrado
              </div>
            ) : (
              filteredApartamentos.map((apartamento) => (
                <div
                  key={apartamento.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    !apartamento.is_available ? 'opacity-50' : ''
                  }`}
                  onClick={() => apartamento.is_available && handleSelect(apartamento)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {apartamento.unit_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {apartamento.building_name}
                        {apartamento.floor && ` • Andar ${apartamento.floor}`}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{apartamento.number_of_bedrooms}Q • {apartamento.number_of_bathrooms}B</p>
                      <p>{apartamento.square_footage}m²</p>
                    </div>
                  </div>
                  {!apartamento.is_available && (
                    <p className="text-xs text-red-500 mt-1">Indisponível</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Visualização de Associação Atual
```typescript
// components/associacoes/AssociacaoAtual.tsx
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';

interface AssociacaoAtualProps {
  associacao: any;
  onFinalizar: (id: number, dataFim?: string, motivo?: string) => Promise<void>;
}

export function AssociacaoAtual({ associacao, onFinalizar }: AssociacaoAtualProps) {
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');

  if (!associacao) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m-2 0h2m0 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma Associação Ativa
        </h3>
        <p className="text-gray-500 mb-4">
          Este inquilino não possui associação ativa com nenhum apartamento.
        </p>
      </div>
    );
  }

  const handleFinalizar = async () => {
    try {
      await onFinalizar(associacao.id, dataFim, motivo);
      setShowFinalizarModal(false);
      setDataFim(new Date().toISOString().split('T')[0]);
      setMotivo('');
    } catch (error) {
      console.error('Erro ao finalizar associação:', error);
    }
  };

  const duracaoTexto = formatDistanceToNow(new Date(associacao.data_inicio), {
    addSuffix: false,
    locale: ptBR
  });

  return (
    <div className="space-y-6">
      {/* Informações da Associação */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Associação Ativa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 mb-3">Apartamento</h4>
                <p className="text-green-700">
                  <strong>Número:</strong> {associacao.apartamento_info.unit_number}
                </p>
                <p className="text-green-700">
                  <strong>Edifício:</strong> {associacao.apartamento_info.building_name}
                </p>
                {associacao.apartamento_info.floor && (
                  <p className="text-green-700">
                    <strong>Andar:</strong> {associacao.apartamento_info.floor}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-green-800 mb-3">Período</h4>
                <p className="text-green-700">
                  <strong>Início:</strong> {new Date(associacao.data_inicio).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-green-700">
                  <strong>Duração:</strong> {duracaoTexto}
                </p>
                {associacao.valor_aluguel && (
                  <p className="text-green-700">
                    <strong>Valor:</strong> R$ {parseFloat(associacao.valor_aluguel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {associacao.observacoes && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800 mb-2">Observações</h4>
                <p className="text-green-700">{associacao.observacoes}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFinalizarModal(true)}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
          >
            Finalizar Locação
          </button>
        </div>
      </div>

      {/* Modal de Finalização */}
      <Modal
        isOpen={showFinalizarModal}
        onClose={() => setShowFinalizarModal(false)}
        title="Finalizar Associação"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja finalizar esta associação? Esta ação não pode ser desfeita.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Fim
            </label>
            <Input
              type="date"
              value={dataFim}
              onChange={setDataFim}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo (Opcional)
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descreva o motivo da finalização..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowFinalizarModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalizar}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              Finalizar Associação
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
```

## Critérios de Sucesso
- [ ] Formulário de associação funcionando corretamente
- [ ] Validação de conflitos implementada
- [ ] Seletor de apartamentos responsivo
- [ ] Histórico de associações completo
- [ ] Finalização de locações funcionando
- [ ] Interface responsiva em todos os dispositivos
- [ ] Validações de período implementadas
- [ ] Notificações adequadas para usuário
- [ ] Integração com API funcionando
- [ ] UX otimizada para fluxo principal