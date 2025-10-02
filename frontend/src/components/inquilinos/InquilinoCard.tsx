import React from 'react';
import { Link } from 'react-router-dom';
import type { Inquilino } from '../../types/inquilino';

interface InquilinoCardProps {
  inquilino: Inquilino;
  onStatusChange?: (id: number, status: string) => void;
  onEdit?: (inquilino: Inquilino) => void;
  onDelete?: (id: number) => void;
}

export function InquilinoCard({ inquilino, onStatusChange, onEdit, onDelete }: InquilinoCardProps) {
  const statusColors = {
    ATIVO: 'bg-green-100 text-green-800',
    INATIVO: 'bg-gray-100 text-gray-800',
    INADIMPLENTE: 'bg-red-100 text-red-800',
    BLOQUEADO: 'bg-orange-100 text-orange-800',
  };

  const statusLabels = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    INADIMPLENTE: 'Inadimplente',
    BLOQUEADO: 'Bloqueado',
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(inquilino.id, newStatus);
    }
  };

  const displayName = (inquilino as any).nome_principal || (inquilino as any).nome_exibicao || inquilino.nome_completo || inquilino.razao_social || '—';
  const documento = inquilino.identificacao_formatada || inquilino.identificacao || (inquilino as any).documento || '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              <Link
                to={`/inquilinos/${inquilino.id}`}
                className="hover:text-blue-600 transition-colors"
              >
                {displayName}
              </Link>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {inquilino.tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </p>
          </div>

          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[inquilino.status]}`}>
            {statusLabels[inquilino.status]}
          </span>
        </div>

        {/* Document */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">
              {inquilino.tipo === 'PF' ? 'CPF:' : 'CNPJ:'}
            </span>
            <span className="ml-2">{documento || '—'}</span>
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {inquilino.email}
          </div>

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {inquilino.telefone}
          </div>
        </div>

        {/* Apartments */}
        {inquilino.apartamentos_ativos && inquilino.apartamentos_ativos.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Apartamentos Ativos:</h4>
            <div className="flex flex-wrap gap-1">
              {inquilino.apartamentos_ativos.map((apt) => (
                <span
                  key={apt.id}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                >
                  {apt.unit_number} - {apt.building_name__name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Info for PF */}
        {inquilino.tipo === 'PF' && (
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300 mb-4">
            {inquilino.profissao && (
              <div>
                <span className="font-medium">Profissão:</span> {inquilino.profissao}
              </div>
            )}
            {inquilino.renda && (
              <div>
                <span className="font-medium">Renda:</span> R$ {inquilino.renda.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        )}

        {/* Additional Info for PJ */}
        {inquilino.tipo === 'PJ' && (
          <div className="text-xs text-gray-600 dark:text-gray-300 mb-4">
            {inquilino.nome_fantasia && (
              <div>
                <span className="font-medium">Nome Fantasia:</span> {inquilino.nome_fantasia}
              </div>
            )}
            {inquilino.responsavel_legal && (
              <div className="mt-1">
                <span className="font-medium">Responsável:</span> {inquilino.responsavel_legal}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(inquilino)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Editar
              </button>
            )}

            <Link
              to={`/inquilinos/${inquilino.id}`}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Ver Detalhes
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {onStatusChange && (
              inquilino.status === 'BLOQUEADO' ? (
                <button
                  onClick={() => handleStatusChange('ATIVO')}
                  className="text-xs text-green-600 hover:text-green-800 font-medium"
                >
                  Desbloquear
                </button>
              ) : (
                <button
                  onClick={() => handleStatusChange('BLOQUEADO')}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Bloquear
                </button>
              )
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(inquilino.id)}
                className="text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
