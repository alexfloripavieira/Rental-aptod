---
status: pending
parallelizable: false
blocked_by: ["7.0", "4.0"]
---

<task_context>
<domain>frontend/search</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>medium</complexity>
<dependencies>http_server</dependencies>
<unblocks>11.0</unblocks>
</task_context>

# Tarefa 9.0: Desenvolver interface de busca e filtros avançados

## Visão Geral
Implementar interface completa de busca e filtros para inquilinos, incluindo busca em tempo real, filtros combináveis, ordenação, paginação e resultados otimizados. Interface deve ser intuitiva e responsiva.

## Requisitos
- Busca em tempo real com debounce
- Filtros por status, tipo (PF/PJ), apartamento
- Busca textual em múltiplos campos
- Ordenação por diferentes critérios
- Paginação eficiente
- Interface responsiva
- Indicadores visuais de filtros ativos
- Salvamento de preferências de busca

## Subtarefas
- [ ] 9.1 Criar componente de busca principal
- [ ] 9.2 Implementar filtros laterais
- [ ] 9.3 Desenvolver resultados com paginação
- [ ] 9.4 Adicionar ordenação dinâmica
- [ ] 9.5 Implementar busca em tempo real
- [ ] 9.6 Criar indicadores de filtros ativos
- [ ] 9.7 Adicionar salvamento de preferências
- [ ] 9.8 Otimizar responsividade mobile

## Sequenciamento
- Bloqueado por: 7.0 (Frontend base), 4.0 (API)
- Desbloqueia: 11.0 (Dashboard)
- Paralelizável: Não (depende da API)

## Detalhes de Implementação

### Componente Principal de Busca
```typescript
// components/inquilinos/InquilinoSearch.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useInquilinos } from '../../hooks/useInquilinos';
import { SearchInput } from '../common/SearchInput';
import { FilterPanel } from './FilterPanel';
import { SearchResults } from './SearchResults';
import { SortSelector } from './SortSelector';

interface SearchFilters {
  search: string;
  status: string[];
  tipo: string[];
  apartamento: string;
  dataInicio: string;
  dataFim: string;
}

const initialFilters: SearchFilters = {
  search: '',
  status: [],
  tipo: [],
  apartamento: '',
  dataInicio: '',
  dataFim: '',
};

export function InquilinoSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // Carregar filtros da URL
    return {
      search: searchParams.get('search') || '',
      status: searchParams.getAll('status'),
      tipo: searchParams.getAll('tipo'),
      apartamento: searchParams.get('apartamento') || '',
      dataInicio: searchParams.get('dataInicio') || '',
      dataFim: searchParams.get('dataFim') || '',
    };
  });

  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'created_at');
  const [sortOrder, setSortOrder] = useState(searchParams.get('order') || 'desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce da busca para evitar muitas requisições
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  const { inquilinos, loading, totalCount, loadInquilinos } = useInquilinos();

  // Construir parâmetros de busca
  const searchParameters = useMemo(() => {
    const params: any = {
      page: currentPage,
      ordering: sortOrder === 'desc' ? `-${sortBy}` : sortBy,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (filters.status.length > 0) {
      params.status = filters.status.join(',');
    }

    if (filters.tipo.length > 0) {
      params.tipo = filters.tipo.join(',');
    }

    if (filters.apartamento) {
      params.apartamento = filters.apartamento;
    }

    if (filters.dataInicio) {
      params.data_inicio_after = filters.dataInicio;
    }

    if (filters.dataFim) {
      params.data_fim_before = filters.dataFim;
    }

    return params;
  }, [debouncedSearch, filters, currentPage, sortBy, sortOrder]);

  // Atualizar URL quando filtros mudam
  useEffect(() => {
    const newSearchParams = new URLSearchParams();

    if (filters.search) newSearchParams.set('search', filters.search);
    filters.status.forEach(s => newSearchParams.append('status', s));
    filters.tipo.forEach(t => newSearchParams.append('tipo', t));
    if (filters.apartamento) newSearchParams.set('apartamento', filters.apartamento);
    if (filters.dataInicio) newSearchParams.set('dataInicio', filters.dataInicio);
    if (filters.dataFim) newSearchParams.set('dataFim', filters.dataFim);
    if (sortBy !== 'created_at') newSearchParams.set('sort', sortBy);
    if (sortOrder !== 'desc') newSearchParams.set('order', sortOrder);

    setSearchParams(newSearchParams);
  }, [filters, sortBy, sortOrder, setSearchParams]);

  // Carregar dados quando parâmetros mudam
  useEffect(() => {
    loadInquilinos(searchParameters);
  }, [searchParameters]);

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset para primeira página
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setSortBy('created_at');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status.length > 0) count++;
    if (filters.tipo.length > 0) count++;
    if (filters.apartamento) count++;
    if (filters.dataInicio || filters.dataFim) count++;
    return count;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Busca */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-2xl">
            <SearchInput
              value={filters.search}
              onChange={(value) => handleFilterChange({ search: value })}
              placeholder="Buscar por nome, CPF, CNPJ, email..."
              loading={loading}
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative px-4 py-2 text-sm font-medium rounded-md border ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Filtros
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <SortSelector
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t">
            <FilterPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          </div>
        )}

        {/* Indicadores de Filtros Ativos */}
        {activeFiltersCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <ActiveFilters
              filters={filters}
              onRemoveFilter={handleFilterChange}
              onClearAll={clearFilters}
            />
          </div>
        )}
      </div>

      {/* Resultados */}
      <SearchResults
        inquilinos={inquilinos}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />
    </div>
  );
}
```

### Painel de Filtros
```typescript
// components/inquilinos/FilterPanel.tsx
import React from 'react';
import { Select } from '../common/Select';
import { Input } from '../common/Input';
import { CheckboxGroup } from '../common/CheckboxGroup';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filters, onFilterChange, onClearFilters }: FilterPanelProps) {
  const statusOptions = [
    { value: 'ATIVO', label: 'Ativo' },
    { value: 'INATIVO', label: 'Inativo' },
    { value: 'INADIMPLENTE', label: 'Inadimplente' },
    { value: 'BLOQUEADO', label: 'Bloqueado' },
  ];

  const tipoOptions = [
    { value: 'PF', label: 'Pessoa Física' },
    { value: 'PJ', label: 'Pessoa Jurídica' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Filtro de Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <CheckboxGroup
          options={statusOptions}
          value={filters.status}
          onChange={(status) => onFilterChange({ status })}
        />
      </div>

      {/* Filtro de Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo
        </label>
        <CheckboxGroup
          options={tipoOptions}
          value={filters.tipo}
          onChange={(tipo) => onFilterChange({ tipo })}
        />
      </div>

      {/* Filtro por Apartamento */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Apartamento
        </label>
        <Input
          value={filters.apartamento}
          onChange={(apartamento) => onFilterChange({ apartamento })}
          placeholder="Número do apartamento"
        />
      </div>

      {/* Filtro de Data */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Período de Cadastro
        </label>
        <div className="space-y-2">
          <Input
            type="date"
            value={filters.dataInicio}
            onChange={(dataInicio) => onFilterChange({ dataInicio })}
            placeholder="Data início"
          />
          <Input
            type="date"
            value={filters.dataFim}
            onChange={(dataFim) => onFilterChange({ dataFim })}
            placeholder="Data fim"
          />
        </div>
      </div>

      {/* Botão de Limpar */}
      <div className="md:col-span-2 lg:col-span-4 flex justify-end">
        <button
          onClick={onClearFilters}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
```

### Componente de Resultados
```typescript
// components/inquilinos/SearchResults.tsx
import React from 'react';
import { InquilinoCard } from './InquilinoCard';
import { Pagination } from '../common/Pagination';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

interface SearchResultsProps {
  inquilinos: Inquilino[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: string) => void;
}

export function SearchResults({
  inquilinos,
  loading,
  totalCount,
  currentPage,
  onPageChange,
  sortBy,
  sortOrder,
  onSortChange,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <LoadingSpinner size="large" />
        <p className="text-center text-gray-500 mt-4">
          Buscando inquilinos...
        </p>
      </div>
    );
  }

  if (inquilinos.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <EmptyState
          title="Nenhum inquilino encontrado"
          description="Tente ajustar os filtros ou termos de busca"
          icon="👥"
        />
      </div>
    );
  }

  const pageSize = 20;
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Cabeçalho dos Resultados */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Resultados da Busca
            </h3>
            <p className="text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? 'inquilino encontrado' : 'inquilinos encontrados'}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Seletor de Visualização */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Visualizar como:</span>
              <ViewToggle view="grid" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Inquilinos */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inquilinos.map((inquilino) => (
            <InquilinoCard key={inquilino.id} inquilino={inquilino} />
          ))}
        </div>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            showPageNumbers={true}
            showPageSizeSelector={false}
          />
        </div>
      )}
    </div>
  );
}
```

### Hook de Busca Debounced
```typescript
// hooks/useDebouncedValue.ts
import { useState, useEffect } from 'react';

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Componente de Input de Busca
```typescript
// components/common/SearchInput.tsx
import React from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
}

export function SearchInput({ value, onChange, placeholder, loading }: SearchInputProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />

      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        ) : value ? (
          <button
            onClick={() => onChange('')}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
```

## Critérios de Sucesso
- [ ] Busca em tempo real funcionando com debounce
- [ ] Todos os filtros funcionando corretamente
- [ ] Paginação eficiente implementada
- [ ] Ordenação por múltiplos critérios
- [ ] Interface responsiva em mobile
- [ ] Indicadores visuais de filtros ativos
- [ ] URL reflete estado da busca (shareable)
- [ ] Performance otimizada (< 500ms por busca)
- [ ] Empty states adequados
- [ ] Loading states implementados