import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../layout/Layout';
import { AssociacaoForm } from './AssociacaoForm';
import { AssociacaoHistory } from './AssociacaoHistory';
import { CalendarioOcupacao } from './CalendarioOcupacao';
import { AssociacaoAtual } from './AssociacaoAtual';
import { useInquilinoDetails } from '../../hooks/useInquilinoDetails';
import { useAssociacoes } from '../../hooks/useAssociacoes';

type TabType = 'atual' | 'nova' | 'historico' | 'calendario';

export function AssociacaoManager() {
  const { inquilinoId } = useParams<{ inquilinoId: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('atual');

  const { inquilino, loading: inquilinoLoading } = useInquilinoDetails(Number(inquilinoId));
  const {
    associacoes,
    associacaoAtiva,
    loading: associacoesLoading,
    loadAssociacoes,
    createAssociacao,
    finalizarAssociacao
  } = useAssociacoes(Number(inquilinoId));

  useEffect(() => {
    if (inquilinoId) {
      loadAssociacoes();
    }
  }, [inquilinoId, loadAssociacoes]);

  const handleNovaAssociacao = async (data: any) => {
    try {
      await createAssociacao(data);
      setActiveTab('atual');
    } catch (error) {
      console.error('Erro ao criar associação:', error);
      throw error;
    }
  };

  const handleFinalizarAssociacao = async (associacaoId: number, dataFim?: string, motivo?: string) => {
    try {
      await finalizarAssociacao(associacaoId, dataFim, motivo);
      loadAssociacoes();
    } catch (error) {
      console.error('Erro ao finalizar associação:', error);
      throw error;
    }
  };

  if (inquilinoLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </Layout>
    );
  }

  if (!inquilino) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Inquilino não encontrado</p>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'atual' as TabType, label: 'Associação Atual', count: associacaoAtiva ? 1 : 0 },
    { id: 'nova' as TabType, label: 'Nova Associação', count: null },
    { id: 'historico' as TabType, label: 'Histórico', count: associacoes.length },
    { id: 'calendario' as TabType, label: 'Calendário', count: null }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Informações do Inquilino */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {inquilino.nome_completo || inquilino.razao_social}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {inquilino.cpf || inquilino.cnpj} • {inquilino.email}
              </p>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  inquilino.status === 'ATIVO'
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : inquilino.status === 'INADIMPLENTE'
                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {inquilino.status}
                </span>
              </div>
            </div>
            {associacaoAtiva && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Apartamento Atual</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {associacaoAtiva.apartamento_info.unit_number} - {associacaoAtiva.apartamento_info.building_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Desde {new Date(associacaoAtiva.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== null && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-300'
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
