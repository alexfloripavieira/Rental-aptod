import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContratoSucessoModal } from '../ContratoSucessoModal';

describe('ContratoSucessoModal', () => {
  const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
  const mockNomeArquivo = 'contrato_123456789_2025-01-01.pdf';
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('deve renderizar mensagem de sucesso', () => {
    render(
      <ContratoSucessoModal
        pdfBlob={mockBlob}
        nomeArquivo={mockNomeArquivo}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Contrato Gerado com Sucesso!')).toBeInTheDocument();
    expect(screen.getByText(/Seu contrato está pronto/i)).toBeInTheDocument();
  });

  it('deve renderizar botões de ação', () => {
    render(
      <ContratoSucessoModal
        pdfBlob={mockBlob}
        nomeArquivo={mockNomeArquivo}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Baixar PDF')).toBeInTheDocument();
    expect(screen.getByText('Imprimir')).toBeInTheDocument();
    expect(screen.getByText('Fechar')).toBeInTheDocument();
  });

  it('deve criar download ao clicar em Baixar PDF', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');

    render(
      <ContratoSucessoModal
        pdfBlob={mockBlob}
        nomeArquivo={mockNomeArquivo}
        onClose={mockOnClose}
      />
    );

    const downloadButton = screen.getByText('Baixar PDF');
    fireEvent.click(downloadButton);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(createElementSpy).toHaveBeenCalledWith('a');
  });

  it('deve chamar onClose ao clicar em Fechar', () => {
    render(
      <ContratoSucessoModal
        pdfBlob={mockBlob}
        nomeArquivo={mockNomeArquivo}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText('Fechar');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
