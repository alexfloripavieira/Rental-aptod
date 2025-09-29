import { useCallback } from 'react';
import { useInquilinoContext } from '../contexts/InquilinoContext';
import { inquilinoService } from '../services/inquilinoService';
import { associacaoService } from '../services/associacaoService';
import type {
  InquilinoSearchParams,
  InquilinoFormData,
  StatusChangeData,
  DocumentValidation
} from '../types/inquilino';

export function useInquilinos() {
  const { state, dispatch } = useInquilinoContext();

  const loadInquilinos = useCallback(async (params: InquilinoSearchParams = {}) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await inquilinoService.list(params);
      dispatch({
        type: 'SET_INQUILINOS',
        payload: {
          inquilinos: response.results,
          totalCount: response.count
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar inquilinos' });
    }
  }, [dispatch]);

  const getInquilino = useCallback(async (id: number) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const inquilino = await inquilinoService.get(id);
      dispatch({ type: 'SET_SELECTED', payload: inquilino });
      return inquilino;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar inquilino' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const createInquilino = useCallback(async (data: InquilinoFormData) => {
    try {
      const novoInquilino = await inquilinoService.create(data);
      dispatch({ type: 'ADD_INQUILINO', payload: novoInquilino });
      return novoInquilino;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao criar inquilino' });
      throw error;
    }
  }, [dispatch]);

  const updateInquilino = useCallback(async (id: number, data: Partial<InquilinoFormData>) => {
    try {
      const inquilinoAtualizado = await inquilinoService.update(id, data);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
      return inquilinoAtualizado;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar inquilino' });
      throw error;
    }
  }, [dispatch]);

  const deleteInquilino = useCallback(async (id: number) => {
    try {
      await inquilinoService.delete(id);
      dispatch({ type: 'DELETE_INQUILINO', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao excluir inquilino' });
      throw error;
    }
  }, [dispatch]);

  const alterarStatus = useCallback(async (id: number, statusData: StatusChangeData) => {
    try {
      await inquilinoService.alterarStatus(id, statusData);
      // Reload the specific inquilino to get updated status
      const inquilinoAtualizado = await inquilinoService.get(id);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao alterar status do inquilino' });
      throw error;
    }
  }, [dispatch]);

  const desbloquearInquilino = useCallback(async (id: number) => {
    try {
      await inquilinoService.alterarStatus(id, { status: 'ATIVO' });
      const inquilinoAtualizado = await inquilinoService.get(id);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao desbloquear inquilino' });
      throw error;
    }
  }, [dispatch]);

  const loadEstatisticas = useCallback(async () => {
    try {
      const stats = await inquilinoService.getEstatisticas();
      dispatch({ type: 'SET_STATS', payload: stats });
      return stats;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar estatísticas' });
      throw error;
    }
  }, [dispatch]);

  const validarDocumento = useCallback(async (documento: string, tipo: 'CPF' | 'CNPJ'): Promise<DocumentValidation> => {
    try {
      return await inquilinoService.validarDocumento(documento, tipo);
    } catch (error) {
      throw error;
    }
  }, []);

  const associarApartamento = useCallback(async (inquilinoId: number, apartamentoId: number, dataInicio: string) => {
    try {
      await associacaoService.create(inquilinoId, {
        apartamento: apartamentoId,
        data_inicio: dataInicio,
      });

      const inquilinoAtualizado = await inquilinoService.get(inquilinoId);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao associar apartamento' });
      throw error;
    }
  }, [dispatch]);

  const desassociarApartamento = useCallback(async (inquilinoId: number, apartamentoId: number, dataFim: string) => {
    try {
      const { results } = await associacaoService.list({ inquilino: inquilinoId, ativo: true });

      let associacaoId: number | null = null;
      for (const item of results) {
        const detail = await associacaoService.retrieve(item.id);
        if (detail.apartamento === apartamentoId && detail.esta_ativo) {
          associacaoId = detail.id;
          break;
        }
      }

      if (!associacaoId) {
        throw new Error('Associação ativa não encontrada para este apartamento');
      }

      await associacaoService.finalize(associacaoId, { data_fim: dataFim });

      const inquilinoAtualizado = await inquilinoService.get(inquilinoId);
      dispatch({ type: 'UPDATE_INQUILINO', payload: inquilinoAtualizado });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao desassociar apartamento' });
      throw error;
    }
  }, [dispatch]);

  const exportarRelatorio = useCallback(async (formato: 'pdf' | 'excel', filtros?: InquilinoSearchParams) => {
    try {
      const blob = await inquilinoService.exportarRelatorio(formato, filtros);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_inquilinos.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao exportar relatório' });
      throw error;
    }
  }, [dispatch]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, [dispatch]);

  const selectInquilino = useCallback((inquilino: any) => {
    dispatch({ type: 'SET_SELECTED', payload: inquilino });
  }, [dispatch]);

  return {
    // State
    ...state,

    // Actions
    loadInquilinos,
    getInquilino,
    createInquilino,
    updateInquilino,
    deleteInquilino,
    alterarStatus,
    desbloquearInquilino,
    loadEstatisticas,
    validarDocumento,
    associarApartamento,
    desassociarApartamento,
    exportarRelatorio,
    clearError,
    setPage,
    selectInquilino,
  };
}
