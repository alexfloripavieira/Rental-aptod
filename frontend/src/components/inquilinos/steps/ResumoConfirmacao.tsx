import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { InquilinoFormData } from '../../../types/inquilino';

export function ResumoConfirmacao() {
  const { watch } = useFormContext<InquilinoFormData>();
  const formData = watch();

  const formatCurrency = (value: number | undefined): string => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string | undefined): string => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatPhone = (phone: string | undefined): string => {
    if (!phone) return 'Não informado';
    return phone;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Confirmação dos Dados
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Revise todas as informações antes de finalizar o cadastro.
        </p>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-6 border border-transparent dark:border-gray-700">
          {/* Tipo e Identificação */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Identificação
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {formData.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </p>
              </div>

              {formData.tipo === 'PF' ? (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.nome_completo || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CPF:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">RG:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.rg || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Nascimento:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(formData.data_nascimento)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado Civil:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.estado_civil || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Profissão:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.profissao || 'Não informada'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Renda Mensal:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(formData.renda)}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Razão Social:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.razao_social || 'Não informada'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nome Fantasia:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.nome_fantasia || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CNPJ:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Inscrição Estadual:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.inscricao_estadual || 'Não informada'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Responsável Legal:</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formData.responsavel_legal || 'Não informado'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contato */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
              Contato
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{formData.email || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Telefone:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{formatPhone(formData.telefone)}</p>
              </div>
            </div>
          </div>

          {/* Endereço */}
          {formData.endereco_completo && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Endereço
              </h4>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Endereço Completo:</span>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{formData.endereco_completo}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {formData.observacoes && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
                Observações
              </h4>
              <div>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-line">{formData.observacoes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Aviso importante */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Importante:</strong> Verifique se todos os dados estão corretos antes de finalizar.
                Após a criação, algumas informações poderão ser editadas através da página de detalhes do inquilino.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
