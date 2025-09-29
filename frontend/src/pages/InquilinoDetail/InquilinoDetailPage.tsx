import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loading } from '../../components/common/Loading';
import { ErrorState } from '../../components/common/ErrorState';
import { inquilinoService } from '../../services/inquilinoService';
import { associacaoService } from '../../services/associacaoService';
import { apiClient } from '../../services/api';
import type {
  Inquilino,
  AssociacaoListItem,
  AssociacaoFormData,
} from '../../types/inquilino';
import type { Apartment } from '../../types/api';

interface RouteParams {
  id: string;
}

const formatCurrency = (value?: string | number | null) => {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  const numericValue = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numericValue)) {
    return '-';
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(numericValue);
};

const formatDate = (date?: string | null) => {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  } catch {
    return date;
  }
};

const normalizePhone = (phone?: string | null) => {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

const DEFAULT_FORM_STATE: AssociacaoFormData & { apartamento: number | '' } = {
  apartamento: '',
  data_inicio: '',
  valor_aluguel: '',
  observacoes: '',
};

export function InquilinoDetailPage() {
  const params = useParams<RouteParams>();
  const navigate = useNavigate();
  const inquilinoId = Number(params.id);

  const [inquilino, setInquilino] = useState<Inquilino | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [associacoes, setAssociacoes] = useState<AssociacaoListItem[]>([]);
  const [associacoesLoading, setAssociacoesLoading] = useState(false);
  const [associacaoError, setAssociacaoError] = useState<string | null>(null);

  const [apartamentosDisponiveis, setApartamentosDisponiveis] = useState<Apartment[]>([]);
  const [formState, setFormState] = useState<AssociacaoFormData & { apartamento: number | '' }>(() => ({
    ...DEFAULT_FORM_STATE,
  }));
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!inquilinoId) {
      setError('Inquilino inválido.');
      setLoading(false);
      return;
    }

    loadInquilino(inquilinoId);
    loadAssociacoes(inquilinoId);
    loadApartamentosDisponiveis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquilinoId]);

  const loadInquilino = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await inquilinoService.getById(id);
      setInquilino(data);
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados do inquilino.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssociacoes = useCallback(async (id: number) => {
    try {
      setAssociacoesLoading(true);
      setAssociacaoError(null);
      const response = await associacaoService.list({ inquilino: id, ordering: '-data_inicio' });
      setAssociacoes(response.results);
    } catch (err) {
      console.error(err);
      setAssociacaoError('Não foi possível carregar as associações do inquilino.');
    } finally {
      setAssociacoesLoading(false);
    }
  }, []);

  const loadApartamentosDisponiveis = useCallback(async () => {
    try {
      const response = await apiClient.getApartments({ is_available: true, page_size: 100 });
      setApartamentosDisponiveis(response.results);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateAssociacao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!inquilino) return;
    if (!formState.apartamento) {
      setFormError('Selecione um apartamento.');
      return;
    }
    if (!formState.data_inicio) {
      setFormError('Informe a data de início.');
      return;
    }

    try {
      setFormSubmitting(true);
      setFormError(null);
      setFormSuccess(null);

      await associacaoService.create(inquilino.id, {
        apartamento: Number(formState.apartamento),
        data_inicio: formState.data_inicio,
        valor_aluguel: formState.valor_aluguel,
        observacoes: formState.observacoes,
      });

      setFormSuccess('Associação criada com sucesso.');
      setFormState({ ...DEFAULT_FORM_STATE });
      await Promise.all([
        loadAssociacoes(inquilino.id),
        loadInquilino(inquilino.id),
      ]);
      await loadApartamentosDisponiveis();
    } catch (err) {
      console.error(err);
      if (err && typeof err === 'object' && 'message' in err) {
        setFormError(String((err as { message: string }).message));
      } else {
        setFormError('Não foi possível criar a associação. Verifique os dados e tente novamente.');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFinalizarAssociacao = async (associacaoId: number) => {
    const confirmar = window.confirm('Deseja finalizar esta associação?');
    if (!confirmar || !inquilino) return;

    const dataFim = window.prompt('Informe a data de término (AAAA-MM-DD)', new Date().toISOString().slice(0, 10));
    if (dataFim === null) {
      return;
    }

    try {
      await associacaoService.finalize(associacaoId, { data_fim: dataFim || undefined });
      await Promise.all([
        loadAssociacoes(inquilino.id),
        loadInquilino(inquilino.id),
      ]);
      await loadApartamentosDisponiveis();
    } catch (err) {
      console.error(err);
      window.alert('Erro ao finalizar associação.');
    }
  };

  const activeAssociacoes = useMemo(
    () => associacoes.filter((assoc) => assoc.ativo),
    [associacoes]
  );

  const historicoAssociacoes = useMemo(
    () => associacoes.filter((assoc) => !assoc.ativo),
    [associacoes]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (error || !inquilino) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Erro ao carregar inquilino"
          message={error ?? 'Inquilino não encontrado.'}
          action={{ label: 'Voltar', onClick: () => navigate('/inquilinos') }}
        />
      </div>
    );
  }

  const isPessoaFisica = inquilino.tipo === 'PF';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-gray-900 dark:text-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-4">
                <li>
                  <Link to="/inquilinos" className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300">
                    Inquilinos
                  </Link>
                </li>
                <li>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 h-4 w-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                    </svg>
                    <span className="ml-2 dark:text-gray-300">Detalhes do Inquilino</span>
                  </div>
                </li>
              </ol>
            </nav>

            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              {inquilino.nome_principal}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {isPessoaFisica ? 'Pessoa Física' : 'Pessoa Jurídica'} | Status: {inquilino.status}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/inquilinos/${inquilino.id}/editar`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Editar
            </button>
            <button
              onClick={() => navigate('/inquilinos')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Voltar
            </button>
          </div>
        </div>

        {/* Informações básicas */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-transparent dark:border-gray-700">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Informações Gerais</h2>
          </div>
          <div className="px-6 py-6 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Contato</h3>
              <dl className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex">
                  <dt className="w-32 font-medium">Email:</dt>
                  <dd>{inquilino.email}</dd>
                </div>
                <div className="flex">
                  <dt className="w-32 font-medium">Telefone:</dt>
                  <dd>{normalizePhone(inquilino.telefone)}</dd>
                </div>
                {inquilino.endereco_completo && (
                  <div className="flex">
                    <dt className="w-32 font-medium">Endereço:</dt>
                    <dd className="flex-1">{inquilino.endereco_completo}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Documento</h3>
              <dl className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex">
                  <dt className="w-32 font-medium">{isPessoaFisica ? 'CPF' : 'CNPJ'}:</dt>
                  <dd>{inquilino.identificacao_formatada || inquilino.identificacao}</dd>
                </div>
                {isPessoaFisica ? (
                  <>
                    {inquilino.data_nascimento && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Nascimento:</dt>
                        <dd>{formatDate(inquilino.data_nascimento)}</dd>
                      </div>
                    )}
                    {inquilino.profissao && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Profissão:</dt>
                        <dd>{inquilino.profissao}</dd>
                      </div>
                    )}
                    {inquilino.renda && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Renda:</dt>
                        <dd>{formatCurrency(inquilino.renda)}</dd>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {inquilino.razao_social && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Razão social:</dt>
                        <dd>{inquilino.razao_social}</dd>
                      </div>
                    )}
                    {inquilino.nome_fantasia && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Nome fantasia:</dt>
                        <dd>{inquilino.nome_fantasia}</dd>
                      </div>
                    )}
                    {inquilino.responsavel_legal && (
                      <div className="flex">
                        <dt className="w-32 font-medium">Responsável:</dt>
                        <dd>{inquilino.responsavel_legal}</dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Associações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-gray-800 shadow rounded-lg border border-transparent dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Associações Ativas</h2>
                {associacoesLoading && <Loading size="sm" />}
              </div>
              <div className="px-6 py-6">
                {associacaoError && (
                  <p className="text-sm text-red-600 mb-4">{associacaoError}</p>
                )}

                {activeAssociacoes.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhuma associação ativa no momento.</p>
                ) : (
                  <div className="space-y-4">
                    {activeAssociacoes.map((assoc) => (
                      <div key={assoc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            Apartamento {assoc.apartamento_numero} · {assoc.edificio_nome}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Início: {formatDate(assoc.data_inicio)}
                            {assoc.valor_aluguel && (
                              <span className="ml-2">Valor: {formatCurrency(assoc.valor_aluguel)}</span>
                            )}
                          </p>
                        </div>

                        <button
                          onClick={() => handleFinalizarAssociacao(assoc.id)}
                          className="mt-3 md:mt-0 inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Finalizar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-gray-800 shadow rounded-lg border border-transparent dark:border-gray-700">
              <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Histórico de Associações</h2>
              </div>
              <div className="px-6 py-6">
                {historicoAssociacoes.length === 0 ? (
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nenhuma associação finalizada registrada.</p>
                ) : (
                  <ul className="space-y-4">
                    {historicoAssociacoes.map((assoc) => (
                      <li key={assoc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          Apartamento {assoc.apartamento_numero} · {assoc.edificio_nome}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Período: {formatDate(assoc.data_inicio)} — {formatDate(assoc.data_fim)}
                        </p>
                        {assoc.valor_aluguel && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Valor: {formatCurrency(assoc.valor_aluguel)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          <section className="bg-white dark:bg-gray-800 shadow rounded-lg border border-transparent dark:border-gray-700">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Nova Associação</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
                Vincule o inquilino a um imóvel disponível.
              </p>
            </div>
            <form className="px-6 py-6 space-y-4" onSubmit={handleCreateAssociacao}>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              {formSuccess && <p className="text-sm text-green-600">{formSuccess}</p>}

              <div>
                <label htmlFor="apartamento" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Apartamento
                </label>
                <select
                  id="apartamento"
                  name="apartamento"
                  value={formState.apartamento}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-500 text-sm"
                >
                  <option value="">Selecione um apartamento disponível</option>
                  {apartamentosDisponiveis.map((apto) => (
                    <option key={apto.id} value={apto.id}>
                      {apto.unit_number} · {apto.building_name.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Data de início
                </label>
                <input
                  type="date"
                  id="data_inicio"
                  name="data_inicio"
                  value={formState.data_inicio}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="valor_aluguel" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Valor do aluguel (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  id="valor_aluguel"
                  name="valor_aluguel"
                  value={formState.valor_aluguel ?? ''}
                  onChange={handleFormChange}
                  placeholder="0,00"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Observações (opcional)
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={4}
                  value={formState.observacoes ?? ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={formSubmitting}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {formSubmitting ? 'Salvando...' : 'Criar associação'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

export default InquilinoDetailPage;
