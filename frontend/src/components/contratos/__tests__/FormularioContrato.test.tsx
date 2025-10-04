import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormularioContrato } from '../FormularioContrato';

describe('FormularioContrato', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar todos os campos obrigatórios', () => {
    render(
      <FormularioContrato
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByText('Dados do Locador')).toBeInTheDocument();
    expect(screen.getByText('Dados do Locatário')).toBeInTheDocument();
    expect(screen.getByText('Detalhes do Contrato')).toBeInTheDocument();
    expect(screen.getByText('Inventário de Móveis')).toBeInTheDocument();

    const asterisks = screen.getAllByText('*');
    expect(asterisks.length).toBeGreaterThan(0);
  });

  it('deve renderizar botões de ação', () => {
    render(
      <FormularioContrato
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Gerar Contrato')).toBeInTheDocument();
  });

  it('deve chamar onCancel ao clicar em Cancelar', () => {
    render(
      <FormularioContrato
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar botão submit quando loading', () => {
    render(
      <FormularioContrato
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    const submitButton = screen.getByText('Gerando...');
    expect(submitButton).toBeDisabled();
  });

  it('deve exibir placeholders informativos', () => {
    render(
      <FormularioContrato
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByPlaceholderText('Nome completo do locador')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('000.000.000-00')).toHaveLength(2);
    expect(screen.getByPlaceholderText('(XX) XXXXX-XXXX')).toBeInTheDocument();
  });
});
