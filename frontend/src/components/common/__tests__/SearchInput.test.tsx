import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchInput } from '../SearchInput';

describe('SearchInput', () => {
  it('deve renderizar corretamente', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        placeholder="Buscar..."
      />
    );

    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('deve exibir o valor fornecido', () => {
    render(
      <SearchInput
        value="teste de busca"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('teste de busca');
  });

  it('deve chamar onChange quando o valor mudar', () => {
    const handleChange = vi.fn();
    render(
      <SearchInput
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'novo valor' } });

    expect(handleChange).toHaveBeenCalledWith('novo valor');
  });

  it('deve exibir botão de limpar quando há valor', () => {
    render(
      <SearchInput
        value="busca"
        onChange={vi.fn()}
      />
    );

    const clearButton = screen.getByLabelText('Limpar busca');
    expect(clearButton).toBeInTheDocument();
  });

  it('não deve exibir botão de limpar quando vazio', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
      />
    );

    const clearButton = screen.queryByLabelText('Limpar busca');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('deve limpar o valor ao clicar no botão de limpar', () => {
    const handleChange = vi.fn();
    render(
      <SearchInput
        value="busca"
        onChange={handleChange}
      />
    );

    const clearButton = screen.getByLabelText('Limpar busca');
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('deve exibir loading spinner quando loading é true', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        loading={true}
      />
    );

    expect(screen.getByLabelText('Carregando')).toBeInTheDocument();
  });

  it('não deve exibir botão de limpar quando em loading', () => {
    render(
      <SearchInput
        value="busca"
        onChange={vi.fn()}
        loading={true}
      />
    );

    const clearButton = screen.queryByLabelText('Limpar busca');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('deve estar desabilitado quando disabled é true', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        disabled={true}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('deve aplicar className customizada', () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        className="custom-class"
      />
    );

    const container = screen.getByRole('textbox').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});
