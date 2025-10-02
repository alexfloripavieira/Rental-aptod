import React from 'react';
import type { AssociacaoDetail } from '../../types/inquilino';

interface AssociacaoHistoryProps {
  associacoes: AssociacaoDetail[];
  loading: boolean;
}

export function AssociacaoHistory({ associacoes, loading }: AssociacaoHistoryProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    );
  }

  if (associacoes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhum Histórico
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Este inquilino ainda não possui histórico de associações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Histórico de Associações ({associacoes.length})
      </h3>

      <div className="space-y-4">
        {associacoes.map((associacao) => (
          <div
            key={associacao.id}
            className={`border rounded-lg p-4 ${
              associacao.esta_ativo
                ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {associacao.apartamento_info.unit_number} - {associacao.apartamento_info.building_name}
                </h4>
                {associacao.apartamento_info.floor && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Andar {associacao.apartamento_info.floor}
                  </p>
                )}
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  associacao.esta_ativo
                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {associacao.esta_ativo ? 'Ativo' : 'Finalizado'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Início</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(associacao.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Fim</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {associacao.data_fim
                    ? new Date(associacao.data_fim).toLocaleDateString('pt-BR')
                    : 'Em andamento'}
                </p>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">Duração</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {associacao.duracao_meses} {associacao.duracao_meses === 1 ? 'mês' : 'meses'}
                </p>
              </div>
            </div>

            {associacao.valor_aluguel && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">Valor do Aluguel</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  R$ {parseFloat(associacao.valor_aluguel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}

            {associacao.observacoes && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Observações</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{associacao.observacoes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
