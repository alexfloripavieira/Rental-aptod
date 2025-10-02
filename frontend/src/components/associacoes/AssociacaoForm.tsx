import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Input } from '../common/Input';
import { FormField } from '../common/FormField';
import { ApartmentSelector } from './ApartmentSelector';
import { useApartamentosDisponiveis } from '../../hooks/useApartamentosDisponiveis';

interface AssociacaoFormData {
  apartamento_id: number;
  data_inicio: string;
  data_fim?: string;
  valor_aluguel?: number;
  observacoes?: string;
}

const schema = yup.object({
  apartamento_id: yup.number().required('Apartamento é obrigatório'),
  data_inicio: yup.string().required('Data de início é obrigatória'),
  data_fim: yup.string().test(
    'data-fim-maior',
    'Data fim deve ser posterior ao início',
    function(value) {
      const { data_inicio } = this.parent;
      if (!value || !data_inicio) return true;
      return new Date(value) > new Date(data_inicio);
    }
  ),
  valor_aluguel: yup.number().positive('Valor deve ser positivo').nullable(),
  observacoes: yup.string()
});

interface AssociacaoFormProps {
  inquilinoId: number;
  onSubmit: (data: AssociacaoFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<AssociacaoFormData>;
}

export function AssociacaoForm({ inquilinoId, onSubmit, onCancel, initialData }: AssociacaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState<any>(null);
  const [conflitos, setConflitos] = useState<any[]>([]);

  const { apartamentosDisponiveis, loading: apartamentosLoading } = useApartamentosDisponiveis();

  const methods = useForm<AssociacaoFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      data_inicio: new Date().toISOString().split('T')[0],
      ...initialData
    }
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const apartamentoId = watch('apartamento_id');
  const dataInicio = watch('data_inicio');
  const dataFim = watch('data_fim');

  // Verificar conflitos quando apartamento ou datas mudam
  useEffect(() => {
    if (apartamentoId && dataInicio) {
      verificarConflitos();
    }
  }, [apartamentoId, dataInicio, dataFim]);

  const verificarConflitos = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/associacoes/verificar-conflitos/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apartamento_id: apartamentoId,
          data_inicio: dataInicio,
          data_fim: dataFim || null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setConflitos(data.conflitos || []);
      }
    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
    }
  };

  const onFormSubmit = async (data: AssociacaoFormData) => {
    if (conflitos.length > 0) {
      alert('Existe conflito com outras associações no período selecionado.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error: any) {
      alert(error.message || 'Erro ao criar associação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seleção de Apartamento */}
          <div className="md:col-span-2">
            <FormField
              name="apartamento_id"
              label="Apartamento"
              required
            >
              <ApartmentSelector
                apartamentos={apartamentosDisponiveis}
                loading={apartamentosLoading}
                value={apartamentoId}
                onChange={(id) => setValue('apartamento_id', id)}
                onApartmentSelect={setSelectedApartment}
              />
              {errors.apartamento_id && (
                <p className="mt-1 text-sm text-red-600">{errors.apartamento_id.message}</p>
              )}
            </FormField>
          </div>

          {/* Período da Locação */}
          <FormField
            name="data_inicio"
            label="Data de Início"
            required
          >
            <Input
              type="date"
              name="data_inicio"
            />
          </FormField>

          <FormField
            name="data_fim"
            label="Data de Fim (Opcional)"
          >
            <Input
              type="date"
              name="data_fim"
            />
          </FormField>

          {/* Valor do Aluguel */}
          <FormField
            name="valor_aluguel"
            label="Valor do Aluguel"
          >
            <Input
              type="number"
              name="valor_aluguel"
              step="0.01"
              placeholder="0.00"
            />
          </FormField>

          {/* Observações */}
          <div className="md:col-span-2">
            <FormField
              name="observacoes"
              label="Observações"
            >
              <textarea
                {...register('observacoes')}
                rows={3}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Observações adicionais sobre a locação..."
              />
            </FormField>
          </div>
        </div>

        {/* Alertas de Conflito */}
        {conflitos.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Conflitos Detectados
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    {conflitos.map((conflito, index) => (
                      <li key={index}>
                        {conflito.inquilino_nome} - {conflito.periodo}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Informações do Apartamento Selecionado */}
        {selectedApartment && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Apartamento Selecionado
            </h4>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p><strong>Número:</strong> {selectedApartment.unit_number}</p>
              <p><strong>Edifício:</strong> {selectedApartment.building_name}</p>
              <p><strong>Quartos:</strong> {selectedApartment.number_of_bedrooms}</p>
              <p><strong>Banheiros:</strong> {selectedApartment.number_of_bathrooms}</p>
              <p><strong>Área:</strong> {selectedApartment.square_footage}m²</p>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || conflitos.length > 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Criando...' : 'Criar Associação'}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
