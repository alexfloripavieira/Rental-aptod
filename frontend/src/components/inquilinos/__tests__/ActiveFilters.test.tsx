import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActiveFilters } from '../ActiveFilters';
import type { InquilinoSearchParams } from '../../../types/inquilino';

describe('ActiveFilters', () => {
  it('não deve renderizar quando não há filtros ativos', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
    };

    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar filtro de busca', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'João Silva',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Busca:')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
  });

  it('deve renderizar filtro de status', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      status: 'ATIVO',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('deve renderizar filtro de tipo', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      tipo: 'PF',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Tipo:')).toBeInTheDocument();
    expect(screen.getByText('Pessoa Física')).toBeInTheDocument();
  });

  it('deve renderizar múltiplos filtros', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'teste',
      status: 'ATIVO',
      tipo: 'PJ',
      apartamento: '101',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Busca:')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Tipo:')).toBeInTheDocument();
    expect(screen.getByText('Apartamento:')).toBeInTheDocument();
  });

  it('deve chamar onRemoveFilter ao clicar em um chip', () => {
    const handleRemoveFilter = vi.fn();
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'teste',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={vi.fn()}
      />
    );

    const removeButton = screen.getByLabelText('Remover filtro Busca');
    fireEvent.click(removeButton);

    expect(handleRemoveFilter).toHaveBeenCalledWith('search');
  });

  it('deve exibir botão "Limpar tudo" quando há mais de um filtro', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'teste',
      status: 'ATIVO',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.getByText('Limpar tudo')).toBeInTheDocument();
  });

  it('não deve exibir botão "Limpar tudo" quando há apenas um filtro', () => {
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'teste',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={vi.fn()}
      />
    );

    expect(screen.queryByText('Limpar tudo')).not.toBeInTheDocument();
  });

  it('deve chamar onClearAll ao clicar em "Limpar tudo"', () => {
    const handleClearAll = vi.fn();
    const filters: InquilinoSearchParams = {
      page: 1,
      page_size: 12,
      search: 'teste',
      status: 'ATIVO',
    };

    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={vi.fn()}
        onClearAll={handleClearAll}
      />
    );

    const clearAllButton = screen.getByText('Limpar tudo');
    fireEvent.click(clearAllButton);

    expect(handleClearAll).toHaveBeenCalled();
  });
});
