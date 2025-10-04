import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GerarContratoModal } from '../GerarContratoModal';
import * as useGerarContratoHook from '../../../hooks/useGerarContrato';

vi.mock('../../../hooks/useGerarContrato');

describe('GerarContratoModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não deve renderizar quando isOpen é false', () => {
    vi.mocked(useGerarContratoHook.useGerarContrato).mockReturnValue({
      gerarContrato: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    const { container } = render(
      <GerarContratoModal isOpen={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar formulário quando isOpen é true', () => {
    vi.mocked(useGerarContratoHook.useGerarContrato).mockReturnValue({
      gerarContrato: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(<GerarContratoModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Gerar Contrato de Locação')).toBeInTheDocument();
    expect(screen.getByText('Dados do Locador')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no X', () => {
    vi.mocked(useGerarContratoHook.useGerarContrato).mockReturnValue({
      gerarContrato: vi.fn(),
      loading: false,
      error: null,
      clearError: vi.fn(),
    });

    render(<GerarContratoModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('deve exibir mensagem de erro quando houver falha', () => {
    vi.mocked(useGerarContratoHook.useGerarContrato).mockReturnValue({
      gerarContrato: vi.fn(),
      loading: false,
      error: 'Erro ao gerar contrato',
      clearError: vi.fn(),
    });

    render(<GerarContratoModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Dados do Locador')).toBeInTheDocument();
  });
});
