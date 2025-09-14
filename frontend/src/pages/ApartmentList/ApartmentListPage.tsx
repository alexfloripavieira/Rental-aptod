import React, { useState } from 'react';
import type { ApartmentFilters } from '../../types/api';
import { CardSkeleton } from '../../components/common/Loading';
import { SearchFilters } from '../../components/common/SearchFilters';
import { ApartmentList } from '../../components/apartments/ApartmentList';
import { Pagination } from '../../components/common/Pagination';
import { ErrorState } from '../../components/common/ErrorState';
import useApartments from '../../hooks/useApartments';

const ApartmentListPage: React.FC = () => {
  const [filters, setFilters] = useState<ApartmentFilters>({ is_available: true, page: 1 });
  const { apartments, loading, error, totalCount, hasNext, hasPrevious, currentPage, refetch } = useApartments(filters);

  const handleFiltersChange = (updated: ApartmentFilters) => {
    setFilters({ ...updated, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Erro ao carregar apartamentos" message={error} onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Apartamentos Disponíveis</h1>
        <p className="mt-2 text-gray-600">Encontre o apartamento perfeito para você</p>
      </div>

      <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <div className="flex justify-between items-center">
        <p className="text-gray-600">{totalCount > 0 ? `Resultados: ${totalCount}` : 'Nenhum resultado'}</p>
      </div>

      <ApartmentList apartments={apartments} />

      <Pagination currentPage={currentPage} hasNext={hasNext} hasPrevious={hasPrevious} onPageChange={handlePageChange} />
    </div>
  );
};

export default ApartmentListPage;

