import React from 'react';
import type { ApartmentFilters } from '../../types/api';

interface SearchFiltersProps {
  filters: ApartmentFilters;
  onFiltersChange: (filters: ApartmentFilters) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof ApartmentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filtros de Busca
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar
          </label>
          <input
            type="text"
            id="search"
            placeholder="Número, descrição..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quartos
          </label>
          <select
            id="bedrooms"
            value={filters.number_of_bedrooms || ''}
            onChange={(e) => handleFilterChange('number_of_bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            data-testid="bedrooms-filter"
          >
            <option value="">Qualquer</option>
            <option value="1">1 quarto</option>
            <option value="2">2 quartos</option>
            <option value="3">3 quartos</option>
            <option value="4">4+ quartos</option>
          </select>
        </div>

        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Banheiros
          </label>
          <select
            id="bathrooms"
            value={filters.number_of_bathrooms || ''}
            onChange={(e) => handleFilterChange('number_of_bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Qualquer</option>
            <option value="1">1 banheiro</option>
            <option value="2">2 banheiros</option>
            <option value="3">3+ banheiros</option>
          </select>
        </div>

        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Disponibilidade
          </label>
          <select
            id="availability"
            value={filters.is_available === undefined ? '' : String(filters.is_available)}
            onChange={(e) => handleFilterChange('is_available', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="true">Disponível</option>
            <option value="false">Ocupado</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Facilidades
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.has_parking || false}
              onChange={(e) => handleFilterChange('has_parking', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Garagem</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.has_air_conditioning || false}
              onChange={(e) => handleFilterChange('has_air_conditioning', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ar condicionado</span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onFiltersChange({})}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};

export default SearchFilters;
