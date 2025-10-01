import React from 'react';
import type { InquilinoSearchParams } from '../../types/inquilino';

interface ActiveFiltersProps {
  filters: InquilinoSearchParams;
  onRemoveFilter: (key: keyof InquilinoSearchParams) => void;
  onClearAll: () => void;
}

interface FilterChip {
  key: keyof InquilinoSearchParams;
  label: string;
  value: string;
}

const STATUS_LABELS: Record<string, string> = {
  'ATIVO': 'Ativo',
  'INATIVO': 'Inativo',
  'INADIMPLENTE': 'Inadimplente',
  'BLOQUEADO': 'Bloqueado',
};

const TIPO_LABELS: Record<string, string> = {
  'PF': 'Pessoa Física',
  'PJ': 'Pessoa Jurídica',
};

const ORDERING_LABELS: Record<string, string> = {
  'nome_completo': 'Nome A-Z',
  '-nome_completo': 'Nome Z-A',
  'created_at': 'Mais antigos',
  '-created_at': 'Mais recentes',
  'status': 'Status',
};

/**
 * Componente que exibe os filtros ativos como chips removíveis
 */
export function ActiveFilters({ filters, onRemoveFilter, onClearAll }: ActiveFiltersProps) {
  const activeFilters: FilterChip[] = [];

  // Adiciona filtros ativos ao array
  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: 'Busca',
      value: filters.search
    });
  }

  if (filters.status) {
    activeFilters.push({
      key: 'status',
      label: 'Status',
      value: STATUS_LABELS[filters.status] || filters.status
    });
  }

  if (filters.tipo) {
    activeFilters.push({
      key: 'tipo',
      label: 'Tipo',
      value: TIPO_LABELS[filters.tipo] || filters.tipo
    });
  }

  if (filters.apartamento) {
    activeFilters.push({
      key: 'apartamento',
      label: 'Apartamento',
      value: filters.apartamento
    });
  }

  if (filters.ordering) {
    activeFilters.push({
      key: 'ordering',
      label: 'Ordenação',
      value: ORDERING_LABELS[filters.ordering] || filters.ordering
    });
  }

  // Se não houver filtros ativos, não renderiza nada
  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Filtros ativos:
      </span>

      {activeFilters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemoveFilter(filter.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors group"
          aria-label={`Remover filtro ${filter.label}`}
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-300 group-hover:text-blue-800 dark:group-hover:text-blue-100"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}

      {activeFilters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
          aria-label="Limpar todos os filtros"
        >
          Limpar tudo
        </button>
      )}
    </div>
  );
}
