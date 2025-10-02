import React, { useState, useEffect } from 'react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { SearchInput } from '../common/SearchInput';
import { SortSelector } from './SortSelector';
import { ActiveFilters } from './ActiveFilters';
import type { InquilinoSearchParams } from '../../types/inquilino';

interface InquilinoFiltersProps {
  filters: InquilinoSearchParams;
  onFiltersChange: (filters: InquilinoSearchParams) => void;
  loading?: boolean;
}

export function InquilinoFilters({ filters, onFiltersChange, loading }: InquilinoFiltersProps) {
  const [localFilters, setLocalFilters] = useState<InquilinoSearchParams>(filters);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [isOpen, setIsOpen] = useState(false);

  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    setLocalFilters(filters);
    setSearchTerm(filters.search || '');
  }, [filters]);

  // Aplica busca automaticamente quando o debounced value muda
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({
        ...localFilters,
        search: debouncedSearch || undefined,
        page: 1, // Reset para primeira página ao buscar
      });
    }
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setLocalFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: keyof InquilinoSearchParams, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 });
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters: InquilinoSearchParams = {
      page: 1,
      page_size: filters.page_size,
    };
    setSearchTerm('');
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleRemoveFilter = (key: keyof InquilinoSearchParams) => {
    const newFilters = { ...localFilters };
    delete newFilters[key];

    if (key === 'search') {
      setSearchTerm('');
    }

    setLocalFilters(newFilters);
    onFiltersChange({ ...newFilters, page: 1 });
  };

  const hasActiveFilters = Object.keys(filters).some(
    key => key !== 'page' && key !== 'page_size' && filters[key as keyof InquilinoSearchParams]
  );

  const activeFiltersCount = Object.keys(filters).filter(
    key => key !== 'page' && key !== 'page_size' && filters[key as keyof InquilinoSearchParams]
  ).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 text-gray-900 dark:text-gray-100">
      {/* Search bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Buscar inquilinos
          </label>
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nome, email, CPF ou CNPJ..."
            loading={loading}
            disabled={loading}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900 transition-colors ${
              hasActiveFilters ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <SortSelector
            value={localFilters.ordering || ''}
            onChange={(value) => {
              handleFilterChange('ordering', value || undefined);
              handleApplyFilters();
            }}
          />
        </div>
      </div>

      {/* Active filters indicators */}
      {hasActiveFilters && (
        <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <ActiveFilters
            filters={filters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />
        </div>
      )}

      {/* Advanced filters */}
      {isOpen && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tipo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tipo
              </label>
              <select
                id="tipo"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={localFilters.tipo || ''}
                onChange={(e) => handleFilterChange('tipo', e.target.value || undefined)}
              >
                <option value="">Todos</option>
                <option value="PF">Pessoa Física</option>
                <option value="PJ">Pessoa Jurídica</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={localFilters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">Todos</option>
                <option value="ATIVO">Ativo</option>
                <option value="INATIVO">Inativo</option>
                <option value="INADIMPLENTE">Inadimplente</option>
                <option value="BLOQUEADO">Bloqueado</option>
              </select>
            </div>

            {/* Apartamento */}
            <div>
              <label htmlFor="apartamento" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Apartamento
              </label>
              <input
                type="text"
                id="apartamento"
                placeholder="Número do apartamento"
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={localFilters.apartamento || ''}
                onChange={(e) => handleFilterChange('apartamento', e.target.value || undefined)}
              />
            </div>

          </div>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
            >
              Limpar filtros
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
