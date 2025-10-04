import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Modal } from '../common/Modal';
import { FormField } from '../common/FormField';
import type { AssociacaoDetail } from '../../types/inquilino';

interface AssociacaoAtualProps {
  associacao: AssociacaoDetail | null;
  onFinalizar: (id: number, dataFim?: string, motivo?: string) => Promise<void>;
}

export function AssociacaoAtual({ associacao, onFinalizar }: AssociacaoAtualProps) {
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!associacao) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m-2 0h2m0 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhuma Associação Ativa
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Este inquilino não possui associação ativa com nenhum apartamento.
        </p>
      </div>
    );
  }

  const handleFinalizar = async () => {
    setIsSubmitting(true);
    try {
      await onFinalizar(associacao.id, dataFim, motivo);
      setShowFinalizarModal(false);
      setDataFim(new Date().toISOString().split('T')[0]);
      setMotivo('');
    } catch (error) {
      console.error('Erro ao finalizar associação:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const duracaoTexto = formatDistanceToNow(new Date(associacao.data_inicio), {
    addSuffix: false,
    locale: ptBR
  });

  return (
    <div className="space-y-6">
      {/* Informações da Associação */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              Associação Ativa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Apartamento</h4>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Número:</strong> {associacao.apartamento_info.unit_number}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Edifício:</strong> {associacao.apartamento_info.building_name}
                </p>
                {associacao.apartamento_info.floor && (
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Andar:</strong> {associacao.apartamento_info.floor}
                  </p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">Período</h4>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Início:</strong> {new Date(associacao.data_inicio).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-green-700 dark:text-green-300">
                  <strong>Duração:</strong> {duracaoTexto}
                </p>
                {associacao.valor_aluguel && (
                  <p className="text-green-700 dark:text-green-300">
                    <strong>Valor:</strong> R$ {parseFloat(associacao.valor_aluguel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {associacao.observacoes && (
              <div className="mt-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Observações</h4>
                <p className="text-green-700 dark:text-green-300">{associacao.observacoes}</p>
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
          <p className="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja finalizar esta associação? Esta ação não pode ser desfeita.
          </p>

          <FormField name="data_fim" label="Data de Fim">
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-400 sm:text-sm sm:leading-6"
            />
          </FormField>

          <FormField name="motivo" label="Motivo (Opcional)">
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Descreva o motivo da finalização..."
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowFinalizarModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleFinalizar}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Finalizando...' : 'Finalizar Associação'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
