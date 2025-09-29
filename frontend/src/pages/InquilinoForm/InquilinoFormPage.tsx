import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { InquilinoForm } from '../../components/inquilinos/InquilinoForm';
import { Loading } from '../../components/common/Loading';
import { ErrorState } from '../../components/common/ErrorState';
import { inquilinoService } from '../../services/inquilinoService';
import type { InquilinoFormData, Inquilino } from '../../types/inquilino';

export function InquilinoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [inquilino, setInquilino] = useState<Inquilino | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      loadInquilino(parseInt(id, 10));
    }
  }, [id, isEditing]);

  const loadInquilino = async (inquilinoId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await inquilinoService.getById(inquilinoId);
      setInquilino(data);
    } catch (err) {
      setError('Erro ao carregar dados do inquilino');
      console.error('Erro ao carregar inquilino:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: InquilinoFormData) => {
    try {
      if (isEditing && id) {
        await inquilinoService.update(parseInt(id, 10), data);
      } else {
        await inquilinoService.create(data);
      }
      navigate('/inquilinos');
    } catch (error) {
      console.error('Erro ao salvar inquilino:', error);
      throw error; // Re-throw para o formulário tratar
    }
  };

  const handleCancel = () => {
    navigate('/inquilinos');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Erro ao carregar dados"
          message={error}
          action={{
            label: 'Voltar para lista',
            onClick: () => navigate('/inquilinos'),
          }}
        />
      </div>
    );
  }

  // Converter dados do inquilino para o formato do formulário
  const initialData: Partial<InquilinoFormData> = inquilino ? {
    tipo: inquilino.tipo,
    email: inquilino.email,
    telefone: inquilino.telefone,
    observacoes: inquilino.observacoes,

    // Campos PF
    nome_completo: inquilino.nome_completo,
    cpf: inquilino.cpf,
    rg: inquilino.rg,
    data_nascimento: inquilino.data_nascimento,
    estado_civil: inquilino.estado_civil,
    profissao: inquilino.profissao,
    renda: inquilino.renda,

    // Campos PJ
    razao_social: inquilino.razao_social,
    nome_fantasia: inquilino.nome_fantasia,
    cnpj: inquilino.cnpj,
    inscricao_estadual: inquilino.inscricao_estadual,
    responsavel_legal: inquilino.responsavel_legal,

    // Endereço
    endereco_completo: inquilino.endereco_completo,
  } : undefined;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={() => navigate('/inquilinos')}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  Inquilinos
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="flex-shrink-0 h-5 w-5 text-gray-300 dark:text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                    {isEditing ? 'Editar Inquilino' : 'Novo Inquilino'}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          <div className="mt-4">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 dark:text-gray-100 sm:text-3xl">
              {isEditing ? 'Editar Inquilino' : 'Cadastrar Novo Inquilino'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">
              {isEditing
                ? 'Atualize as informações do inquilino selecionado.'
                : 'Preencha os dados para cadastrar um novo inquilino no sistema.'
              }
            </p>
          </div>
        </div>

        {/* Formulário */}
        <InquilinoForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}
