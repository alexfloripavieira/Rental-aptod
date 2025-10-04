import { useState, useCallback } from 'react';
import { associacaoService } from '../services/associacaoService';
import type { AssociacaoDetail, AssociacaoListItem, AssociacaoFormData } from '../types/inquilino';

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
  const [associacoes, setAssociacoes] = useState<AssociacaoListItem[]>([]);
  const [associacaoAtiva, setAssociacaoAtiva] = useState<AssociacaoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssociacoes = useCallback(async () => {
    if (!inquilinoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await associacaoService.list({ inquilino: inquilinoId });
      const data = response.results;

      setAssociacoes(data);

      // Encontrar associação ativa e buscar detalhes completos
      const ativa = data.find((assoc: AssociacaoListItem) => assoc.ativo);
      if (ativa) {
        const ativaDetalhes = await associacaoService.retrieve(ativa.id);
        setAssociacaoAtiva(ativaDetalhes);
      } else {
        setAssociacaoAtiva(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar associações');
      console.error('Erro ao carregar associações:', err);
    } finally {
      setLoading(false);
    }
  }, [inquilinoId]);

  const createAssociacao = useCallback(async (data: CreateAssociacaoData) => {
    setLoading(true);
    setError(null);

    try {
      const formData: AssociacaoFormData = {
        apartamento: data.apartamento_id,
        data_inicio: data.data_inicio,
        valor_aluguel: data.valor_aluguel?.toString() || '',
        observacoes: data.observacoes || '',
      };
      const result = await associacaoService.create(inquilinoId, formData);
      await loadAssociacoes();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar associação';
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
      const updateData: Partial<AssociacaoFormData> = {
        valor_aluguel: data.valor_aluguel?.toString(),
        observacoes: data.observacoes,
      };
      const result = await associacaoService.update(associacaoId, updateData);
      await loadAssociacoes();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar associação';
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
      const result = await associacaoService.finalize(associacaoId, { data_fim: dataFim });
      await loadAssociacoes();
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao finalizar associação';
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
      // TODO: Implementar verificação de conflitos no associacaoService
      return { conflitos: [] };
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
