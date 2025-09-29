import React from 'react';
import { InquilinoCard } from './InquilinoCard';
import { Loading } from '../common/Loading';
import { ErrorState } from '../common/ErrorState';
import { Pagination } from '../common/Pagination';
import type { Inquilino } from '../../types/inquilino';

interface InquilinoListProps {
  inquilinos: Inquilino[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onStatusChange?: (id: number, status: string) => void;
  onEdit?: (inquilino: Inquilino) => void;
  onDelete?: (id: number) => void;
  onRetry?: () => void;
}

export function InquilinoList({
  inquilinos,
  loading,
  error,
  totalCount,
  currentPage,
  pageSize = 12,
  onPageChange,
  onStatusChange,
  onEdit,
  onDelete,
  onRetry
}: InquilinoListProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  if (loading && inquilinos.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Erro ao carregar inquilinos"
        message={error}
        onRetry={onRetry}
      />
    );
  }

  if (inquilinos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Nenhum inquilino encontrado</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comece criando um novo inquilino ou ajuste os filtros de busca.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results info */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Exibindo {inquilinos.length} de {totalCount} inquilinos
        </p>
        {loading && inquilinos.length > 0 && (
          <div className="flex items-center space-x-2">
            <Loading size="sm" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Carregando...</span>
          </div>
        )}
      </div>

      {/* Grid of inquilino cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inquilinos.map((inquilino) => (
          <InquilinoCard
            key={inquilino.id}
            inquilino={inquilino}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
