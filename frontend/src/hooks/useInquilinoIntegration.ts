import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInquilinos } from './useInquilinos';
import { useNotifications } from '../contexts/NotificationContext';
import type { InquilinoFormData, StatusChangeData } from '../types/inquilino';

/**
 * Hook integrado que combina operações de inquilinos com notificações e navegação.
 * Fornece handlers completos para todas as operações CRUD com feedback ao usuário.
 */
export function useInquilinoIntegration() {
  const {
    inquilinos,
    loading,
    error,
    totalCount,
    currentPage,
    stats,
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
  } = useInquilinos();

  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handleCreateInquilino = useCallback(async (data: InquilinoFormData) => {
    try {
      const novoInquilino = await createInquilino(data);

      const nomeExibicao = data.tipo_pessoa === 'PF'
        ? data.nome_completo
        : data.razao_social;

      addNotification({
        type: 'success',
        title: 'Inquilino Criado',
        message: `${nomeExibicao} foi cadastrado com sucesso.`,
        action: {
          label: 'Ver Detalhes',
          onClick: () => navigate(`/inquilinos/${novoInquilino.id}`),
        },
      });

      navigate('/inquilinos');
      return novoInquilino;

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Criar Inquilino',
        message: error.message || 'Ocorreu um erro ao cadastrar o inquilino.',
      });
      throw error;
    }
  }, [createInquilino, addNotification, navigate]);

  const handleUpdateInquilino = useCallback(async (id: number, data: Partial<InquilinoFormData>) => {
    try {
      const inquilinoAtualizado = await updateInquilino(id, data);

      addNotification({
        type: 'success',
        title: 'Inquilino Atualizado',
        message: 'As informações foram atualizadas com sucesso.',
      });

      return inquilinoAtualizado;

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Atualizar',
        message: error.message || 'Ocorreu um erro ao atualizar o inquilino.',
      });
      throw error;
    }
  }, [updateInquilino, addNotification]);

  const handleDeleteInquilino = useCallback(async (id: number, nome: string) => {
    try {
      await deleteInquilino(id);

      addNotification({
        type: 'success',
        title: 'Inquilino Removido',
        message: `${nome} foi removido com sucesso.`,
      });

      // Recarregar lista
      await loadInquilinos({ page: currentPage });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Remover',
        message: error.message || 'Ocorreu um erro ao remover o inquilino.',
      });
      throw error;
    }
  }, [deleteInquilino, addNotification, loadInquilinos, currentPage]);

  const handleAlterarStatus = useCallback(async (id: number, statusData: StatusChangeData, nome: string) => {
    try {
      await alterarStatus(id, statusData);

      const statusLabels = {
        ATIVO: 'ativado',
        INATIVO: 'inativado',
        INADIMPLENTE: 'marcado como inadimplente',
        BLOQUEADO: 'bloqueado',
      };

      addNotification({
        type: 'success',
        title: 'Status Alterado',
        message: `${nome} foi ${statusLabels[statusData.status] || 'atualizado'}.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Alterar Status',
        message: error.message || 'Ocorreu um erro ao alterar o status.',
      });
      throw error;
    }
  }, [alterarStatus, addNotification]);

  const handleDesbloquearInquilino = useCallback(async (id: number, nome: string) => {
    try {
      await desbloquearInquilino(id);

      addNotification({
        type: 'success',
        title: 'Inquilino Desbloqueado',
        message: `${nome} foi desbloqueado com sucesso.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Desbloquear',
        message: error.message || 'Ocorreu um erro ao desbloquear o inquilino.',
      });
      throw error;
    }
  }, [desbloquearInquilino, addNotification]);

  const handleAssociarApartamento = useCallback(async (
    inquilinoId: number,
    apartamentoId: number,
    dataInicio: string,
    nomeInquilino: string,
    enderecoApto: string
  ) => {
    try {
      await associarApartamento(inquilinoId, apartamentoId, dataInicio);

      addNotification({
        type: 'success',
        title: 'Apartamento Associado',
        message: `${nomeInquilino} foi associado ao apartamento ${enderecoApto}.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Associar',
        message: error.message || 'Ocorreu um erro ao associar o apartamento.',
      });
      throw error;
    }
  }, [associarApartamento, addNotification]);

  const handleDesassociarApartamento = useCallback(async (
    inquilinoId: number,
    apartamentoId: number,
    dataFim: string,
    nomeInquilino: string,
    enderecoApto: string
  ) => {
    try {
      await desassociarApartamento(inquilinoId, apartamentoId, dataFim);

      addNotification({
        type: 'success',
        title: 'Apartamento Desassociado',
        message: `${nomeInquilino} foi desassociado do apartamento ${enderecoApto}.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Desassociar',
        message: error.message || 'Ocorreu um erro ao desassociar o apartamento.',
      });
      throw error;
    }
  }, [desassociarApartamento, addNotification]);

  const handleExportarRelatorio = useCallback(async (formato: 'pdf' | 'excel', filtros?: any) => {
    try {
      await exportarRelatorio(formato, filtros);

      addNotification({
        type: 'success',
        title: 'Relatório Exportado',
        message: `O relatório foi exportado com sucesso em formato ${formato.toUpperCase()}.`,
      });

    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro ao Exportar',
        message: error.message || 'Ocorreu um erro ao exportar o relatório.',
      });
      throw error;
    }
  }, [exportarRelatorio, addNotification]);

  const handleSearchInquilinos = useCallback(async (searchParams: any) => {
    try {
      await loadInquilinos(searchParams);
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Erro na Busca',
        message: 'Ocorreu um erro ao buscar inquilinos.',
      });
    }
  }, [loadInquilinos, addNotification]);

  return {
    // Estado
    inquilinos,
    loading,
    error,
    totalCount,
    currentPage,
    stats,

    // Operações básicas
    loadInquilinos,
    getInquilino,
    loadEstatisticas,
    validarDocumento,
    clearError,
    setPage,
    selectInquilino,

    // Handlers integrados com notificações
    handleCreateInquilino,
    handleUpdateInquilino,
    handleDeleteInquilino,
    handleAlterarStatus,
    handleDesbloquearInquilino,
    handleAssociarApartamento,
    handleDesassociarApartamento,
    handleExportarRelatorio,
    handleSearchInquilinos,
  };
}
