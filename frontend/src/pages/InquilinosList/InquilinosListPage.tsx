import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InquilinoProvider } from '../../contexts/InquilinoContext';
import { InquilinoList } from '../../components/inquilinos/InquilinoList';
import { InquilinoFilters } from '../../components/inquilinos/InquilinoFilters';
// Removido o botão/modal de contrato desta página (passou para a página de detalhes)
import { useInquilinos } from '../../hooks/useInquilinos';
import type { InquilinoSearchParams } from '../../types/inquilino';

function InquilinosListPageContent() {
  const {
    inquilinos,
    loading,
    error,
    totalCount,
    currentPage,
    stats,
    loadInquilinos,
    loadEstatisticas,
    alterarStatus,
    deleteInquilino,
    clearError,
    setPage
  } = useInquilinos();

  const navigate = useNavigate();

  const [filters, setFilters] = useState<InquilinoSearchParams>({
    page: 1,
    page_size: 12,
  });

  // const [modalOpen, setModalOpen] = useState(false); // movido para a página de detalhes

  useEffect(() => {
    loadInquilinos(filters);
    loadEstatisticas();
  }, [filters, loadInquilinos, loadEstatisticas]);

  const handleFiltersChange = (newFilters: InquilinoSearchParams) => {
    setFilters({ ...newFilters, page: 1 });
    setPage(1);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    setPage(page);
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await alterarStatus(id, { status });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este inquilino?')) {
      try {
        await deleteInquilino(id);
      } catch (error) {
        console.error('Erro ao excluir inquilino:', error);
      }
    }
  };

  const handleEdit = (inquilinoId: number) => {
    navigate(`/inquilinos/${inquilinoId}/editar`);
  };

  const handleRetry = () => {
    clearError();
    loadInquilinos(filters);
  };

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Inquilinos</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Gerencie todos os inquilinos cadastrados no sistema
          </p>
        </div>

        <div className="flex space-x-3">
          <Link
            to="/inquilinos/novo"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Inquilino
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Total de Inquilinos</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.total_inquilinos}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Inquilinos Ativos</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.inquilinos_ativos}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Inadimplentes</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.inquilinos_inadimplentes}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">Taxa de Ocupação</dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">{stats.taxa_ocupacao.toFixed(1)}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <InquilinoFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      {/* List */}
      <InquilinoList
        inquilinos={inquilinos}
        loading={loading}
        error={error}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onRetry={handleRetry}
        onEdit={(inquilino) => handleEdit(inquilino.id)}
      />

      {/* Modal de Geração de Contrato removido daqui */}
    </div>
  );
}

export default function InquilinosListPage() {
  return (
    <InquilinoProvider>
      <InquilinosListPageContent />
    </InquilinoProvider>
  );
}
