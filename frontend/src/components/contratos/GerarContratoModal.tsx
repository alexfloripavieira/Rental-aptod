import React, { useState } from 'react';
import { FormularioContrato } from './FormularioContrato';
import { ContratoSucessoModal } from './ContratoSucessoModal';
import { useGerarContrato } from '../../hooks/useGerarContrato';
import type { ContratoFormData } from '../../types/contrato';

interface GerarContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Valores iniciais opcionais para pré-preenchimento do formulário
  defaultValues?: Partial<ContratoFormData>;
}

type ModalStep = 'form' | 'loading' | 'success' | 'error';

export function GerarContratoModal({ isOpen, onClose, defaultValues }: GerarContratoModalProps) {
  const [step, setStep] = useState<ModalStep>('form');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');

  const { gerarContrato, loading, error, clearError } = useGerarContrato();

  const handleSubmit = async (data: ContratoFormData) => {
    try {
      setStep('loading');
      const blob = await gerarContrato(data);

      const cpfSanitizado = data.locatario.cpf.replace(/\D/g, '');
      const nomeArq = `contrato_locacao_${cpfSanitizado}_${data.contrato.dataInicio}.pdf`;

      setPdfBlob(blob);
      setNomeArquivo(nomeArq);
      setStep('success');
    } catch {
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Gerar Contrato de Locação</h2>
            <button onClick={handleClose} className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-200">
              ✕
            </button>
          </div>

          {step === 'form' && (
            <FormularioContrato
              onSubmit={handleSubmit}
              onCancel={handleClose}
              loading={loading}
              defaultValues={defaultValues}
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
