import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import type { InquilinoFormData } from '../../types/inquilino';
import { getInquilinoSchema } from '../../utils/validation';
import { DadosBasicos } from './steps/DadosBasicos';
import { DadosEndereco } from './steps/DadosEndereco';
import { DocumentosUpload } from './steps/DocumentosUpload';
import { ResumoConfirmacao } from './steps/ResumoConfirmacao';

interface InquilinoFormProps {
  initialData?: Partial<InquilinoFormData>;
  onSubmit: (data: InquilinoFormData) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const STEPS = [
  { id: 'dados-basicos', title: 'Dados Básicos', component: DadosBasicos },
  { id: 'endereco', title: 'Endereço', component: DadosEndereco },
  { id: 'documentos', title: 'Documentos', component: DocumentosUpload },
  { id: 'confirmacao', title: 'Confirmação', component: ResumoConfirmacao },
];

export function InquilinoForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false
}: InquilinoFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<InquilinoFormData>({
    resolver: yupResolver(getInquilinoSchema()),
    defaultValues: {
      tipo: 'PF',
      email: '',
      telefone: '',
      ...initialData,
    },
    mode: 'onChange',
  });

  const { watch, trigger, handleSubmit } = methods;
  const tipoSelecionado = watch('tipo');

  // Salvar rascunho automaticamente
  useEffect(() => {
    const subscription = watch((value) => {
      if (!isEditing) {
        localStorage.setItem('inquilino-draft', JSON.stringify(value));
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isEditing]);

  const handleNext = async () => {
    const currentStepFields = getCurrentStepFields();
    const isValid = await trigger(currentStepFields);

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const getCurrentStepFields = (): (keyof InquilinoFormData)[] => {
    switch (currentStep) {
      case 0: // Dados Básicos
        return tipoSelecionado === 'PF'
          ? ['tipo', 'nome_completo', 'cpf', 'email', 'telefone', 'data_nascimento']
          : ['tipo', 'razao_social', 'nome_fantasia', 'cnpj', 'email', 'telefone'];
      case 1: // Endereço
        return ['endereco_completo'];
      case 2: // Documentos
        return []; // Upload é opcional
      default:
        return [];
    }
  };

  const onFormSubmit = async (data: InquilinoFormData) => {
    console.log('[InquilinoForm] onFormSubmit chamado');
    console.debug('[InquilinoForm] submit payload', data);
    setIsSubmitting(true);
    try {
      setSubmitError(null);
      console.log('[InquilinoForm] Chamando onSubmit...');
      await onSubmit(data);
      console.log('[InquilinoForm] onSubmit concluído com sucesso');
      localStorage.removeItem('inquilino-draft');
    } catch (error: any) {
      console.error('[InquilinoForm] Erro ao salvar inquilino:', error);
      setSubmitError(error?.message || 'Não foi possível salvar o inquilino.');
    } finally {
      console.log('[InquilinoForm] Finalizando submit, isSubmitting = false');
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white dark:bg-gray-800 dark:border dark:border-gray-700 shadow-lg rounded-lg p-6">
          {submitError && (
            <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{submitError}</p>
            </div>
          )}
          <div role="main" aria-label={`Etapa ${currentStep + 1} de ${STEPS.length}: ${STEPS[currentStep].title}`}>
            <CurrentStepComponent />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800"
              disabled={isSubmitting}
            >
              {currentStep === 0 ? 'Cancelar' : 'Anterior'}
            </button>

            <div className="flex space-x-3">
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  disabled={isSubmitting}
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async (e) => {
                    console.log('[InquilinoForm] Botão clicado');

                    // Primeira validação: garante que o campo 'tipo' está processado
                    await trigger('tipo');

                    // Segunda validação: valida todos os campos com base no tipo
                    const isFormValid = await trigger();
                    console.log('[InquilinoForm] Validação resultado:', isFormValid);

                    if (isFormValid) {
                      handleSubmit(onFormSubmit)(e);
                    } else {
                      const errors = methods.formState.errors;
                      console.error('[InquilinoForm] Formulário inválido. Erros:', errors);
                      setSubmitError('Por favor, corrija os erros no formulário antes de continuar.');
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar Inquilino'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
