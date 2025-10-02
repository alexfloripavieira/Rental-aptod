import { useState, useCallback } from 'react';
import api from '../services/api';
import type { AssociacaoDetail } from '../types/inquilino';

interface CreateAssociacaoData {
  apartamento_id: number;
  data_inicio: string;
  data_fim?: string;
  valor_aluguel?: number;
  observacoes?: string;
}

interface UpdateAssociacaoData {
  data_fim?: string;
  valor_aluguel?: number;
  observacoes?: string;
}

export function useAssociacoes(inquilinoId: number) {
  const [associacoes, setAssociacoes] = useState<AssociacaoDetail[]>([]);
  const [associacaoAtiva, setAssociacaoAtiva] = useState<AssociacaoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssociacoes = useCallback(async () => {
    if (!inquilinoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/inquilinos/${inquilinoId}/associacoes/`);
      const data = response.data;

      setAssociacoes(data);

      // Encontrar associação ativa
      const ativa = data.find((assoc: AssociacaoDetail) => assoc.esta_ativo);
      setAssociacaoAtiva(ativa || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar associações');
      console.error('Erro ao carregar associações:', err);
    } finally {
      setLoading(false);
    }
  }, [inquilinoId]);

  const createAssociacao = useCallback(async (data: CreateAssociacaoData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/inquilinos/${inquilinoId}/associacoes/`, data);
      await loadAssociacoes();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          'Erro ao criar associação';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [inquilinoId, loadAssociacoes]);

  const updateAssociacao = useCallback(async (
    associacaoId: number,
    data: UpdateAssociacaoData
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.patch(`/associacoes/${associacaoId}/`, data);
      await loadAssociacoes();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao atualizar associação';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadAssociacoes]);

  const finalizarAssociacao = useCallback(async (
    associacaoId: number,
    dataFim?: string,
    motivo?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post(`/associacoes/${associacaoId}/finalizar/`, {
        data_fim: dataFim,
        observacoes: motivo
      });
      await loadAssociacoes();
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao finalizar associação';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadAssociacoes]);

  const verificarConflitos = useCallback(async (
    apartamentoId: number,
    dataInicio: string,
    dataFim?: string
  ) => {
    try {
      const response = await api.post('/associacoes/verificar-conflitos/', {
        apartamento_id: apartamentoId,
        data_inicio: dataInicio,
        data_fim: dataFim || null
      });
      return response.data;
    } catch (err: any) {
      console.error('Erro ao verificar conflitos:', err);
      return { conflitos: [] };
    }
  }, []);

  return {
    associacoes,
    associacaoAtiva,
    loading,
    error,
    loadAssociacoes,
    createAssociacao,
    updateAssociacao,
    finalizarAssociacao,
    verificarConflitos
  };
}
