import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useGerarContrato } from '../useGerarContrato';
import type { ContratoFormData } from '../../types/contrato';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('useGerarContrato', () => {
  const mockFormData: ContratoFormData = {
    locador: {
      nomeCompleto: 'João Silva',
      nacionalidade: 'brasileiro',
      estadoCivil: 'casado',
      profissao: 'engenheiro',
      cpf: '123.456.789-00',
      endereco: {
        rua: 'Rua Teste',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Florianópolis',
        estado: 'SC',
        cep: '88000-000',
      },
    },
    locatario: {
      nomeCompleto: 'Maria Santos',
      nacionalidade: 'brasileira',
      profissao: 'professora',
      cpf: '987.654.321-00',
      rg: '1234567',
      rgOrgao: 'SSP/SC',
      enderecoCompleto: 'Rua Exemplo, 456, Centro, Florianópolis - SC',
      telefone: '(48) 99999-9999',
      email: 'maria@example.com',
    },
    contrato: {
      dataInicio: '2025-01-01',
      valorCaucao: 1000,
      clausulaSegunda: 'Cláusula de teste com mais de cinquenta caracteres para validação',
    },
    inventarioMoveis: 'Armário, cama, mesa e cadeiras',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar contrato com sucesso', async () => {
    const mockBlob = new Blob(['pdf content'], { type: 'application/pdf' });
    mockedAxios.post.mockResolvedValue({
      status: 200,
      data: mockBlob,
    });

    const { result } = renderHook(() => useGerarContrato());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);

    let pdfBlob: Blob | undefined;
    await act(async () => {
      pdfBlob = await result.current.gerarContrato(mockFormData);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(pdfBlob).toBe(mockBlob);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/v1/contratos/gerar/',
      expect.objectContaining({
        locador: expect.objectContaining({
          nome_completo: 'João Silva',
        }),
      }),
      expect.objectContaining({
        responseType: 'blob',
      })
    );
  });

  it('deve tratar erro 403 (sem permissão)', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    const { result } = renderHook(() => useGerarContrato());

    await act(async () => {
      try {
        await result.current.gerarContrato(mockFormData);
      } catch (error) {
        // Esperado
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Você não tem permissão para gerar contratos.');
    });
  });

  it('deve tratar erro 400 (dados inválidos)', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 400,
      },
    });

    const { result } = renderHook(() => useGerarContrato());

    await act(async () => {
      try {
        await result.current.gerarContrato(mockFormData);
      } catch (error) {
        // Esperado
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Dados inválidos. Verifique os campos e tente novamente.');
    });
  });

  it('deve limpar erro ao chamar clearError', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        status: 500,
      },
    });

    const { result } = renderHook(() => useGerarContrato());

    await act(async () => {
      try {
        await result.current.gerarContrato(mockFormData);
      } catch (error) {
        // Esperado
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });
});
