---
status: pending
parallelizable: false
blocked_by: ["1.0", "7.0"]
---

<task_context>
<domain>frontend/forms</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>http_server</dependencies>
<unblocks>12.0,16.0</unblocks>
</task_context>

# Tarefa 8.0: Implementar formulário de cadastro de inquilinos

## Visão Geral
Desenvolver formulário completo de cadastro/edição de inquilinos com validação em tempo real, upload de documentos, campos dinâmicos baseados no tipo (PF/PJ), e experiência de usuário otimizada. Formulário deve ser responsivo e acessível.

## Requisitos
- Formulário multi-step com validação progressiva
- Campos dinâmicos baseados no tipo PF/PJ
- Validação em tempo real de CPF/CNPJ
- Upload de documentos por drag-and-drop
- Formatação automática de campos
- Validação de email e telefone
- Experiência responsiva mobile-first
- Acessibilidade WCAG 2.1 AA

## Subtarefas
- [ ] 8.1 Criar componente base do formulário
- [ ] 8.2 Implementar campos específicos PF/PJ
- [ ] 8.3 Adicionar validação em tempo real
- [ ] 8.4 Implementar upload de documentos
- [ ] 8.5 Criar formatação automática de campos
- [ ] 8.6 Adicionar navegação multi-step
- [ ] 8.7 Implementar salvamento de rascunho
- [ ] 8.8 Otimizar responsividade e acessibilidade

## Sequenciamento
- Bloqueado por: 1.0 (Modelo), 7.0 (Estrutura React)
- Desbloqueia: 12.0 (Associações), 16.0 (Integração)
- Paralelizável: Não (depende da estrutura base)

## Detalhes de Implementação

### Formulário Principal
```typescript
// components/inquilinos/InquilinoForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { InquilinoFormData } from '../../types/inquilino';
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

  const { watch, trigger, handleSubmit, getValues } = methods;
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
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      // Limpar rascunho após sucesso
      localStorage.removeItem('inquilino-draft');
    } catch (error) {
      console.error('Erro ao salvar inquilino:', error);
    } finally {
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
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <CurrentStepComponent />

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={currentStep === 0 ? onCancel : handlePrevious}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
              disabled={isSubmitting}
            >
              {currentStep === 0 ? 'Cancelar' : 'Anterior'}
            </button>

            <div className="flex space-x-3">
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onFormSubmit)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 disabled:opacity-50"
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
```

### Step 1 - Dados Básicos
```typescript
// components/inquilinos/steps/DadosBasicos.tsx
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '../../common/Input';
import { Select } from '../../common/Select';
import { FormField } from '../../common/FormField';
import { useCpfCnpjValidation } from '../../../hooks/useCpfCnpjValidation';

export function DadosBasicos() {
  const { watch, setValue } = useFormContext();
  const tipo = watch('tipo');
  const { validateDocument, isValidating } = useCpfCnpjValidation();

  const handleDocumentChange = async (documento: string) => {
    const field = tipo === 'PF' ? 'cpf' : 'cnpj';
    const result = await validateDocument(documento, tipo);

    if (result?.formatted) {
      setValue(field, result.formatted);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Dados Básicos do Inquilino
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            name="tipo"
            label="Tipo"
            required
          >
            <Select
              name="tipo"
              options={[
                { value: 'PF', label: 'Pessoa Física' },
                { value: 'PJ', label: 'Pessoa Jurídica' },
              ]}
            />
          </FormField>

          {tipo === 'PF' ? (
            <>
              <FormField
                name="nome_completo"
                label="Nome Completo"
                required
              >
                <Input
                  name="nome_completo"
                  placeholder="Digite o nome completo"
                />
              </FormField>

              <FormField
                name="cpf"
                label="CPF"
                required
              >
                <Input
                  name="cpf"
                  placeholder="000.000.000-00"
                  mask="000.000.000-00"
                  onChange={handleDocumentChange}
                  loading={isValidating}
                />
              </FormField>

              <FormField
                name="rg"
                label="RG"
              >
                <Input
                  name="rg"
                  placeholder="00.000.000-0"
                />
              </FormField>

              <FormField
                name="data_nascimento"
                label="Data de Nascimento"
              >
                <Input
                  name="data_nascimento"
                  type="date"
                />
              </FormField>

              <FormField
                name="estado_civil"
                label="Estado Civil"
              >
                <Select
                  name="estado_civil"
                  options={[
                    { value: '', label: 'Selecione...' },
                    { value: 'SOLTEIRO', label: 'Solteiro(a)' },
                    { value: 'CASADO', label: 'Casado(a)' },
                    { value: 'DIVORCIADO', label: 'Divorciado(a)' },
                    { value: 'VIUVO', label: 'Viúvo(a)' },
                  ]}
                />
              </FormField>

              <FormField
                name="profissao"
                label="Profissão"
              >
                <Input
                  name="profissao"
                  placeholder="Digite a profissão"
                />
              </FormField>

              <FormField
                name="renda"
                label="Renda Mensal"
              >
                <Input
                  name="renda"
                  type="number"
                  placeholder="0,00"
                  step="0.01"
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField
                name="razao_social"
                label="Razão Social"
                required
              >
                <Input
                  name="razao_social"
                  placeholder="Digite a razão social"
                />
              </FormField>

              <FormField
                name="nome_fantasia"
                label="Nome Fantasia"
              >
                <Input
                  name="nome_fantasia"
                  placeholder="Digite o nome fantasia"
                />
              </FormField>

              <FormField
                name="cnpj"
                label="CNPJ"
                required
              >
                <Input
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  mask="00.000.000/0000-00"
                  onChange={handleDocumentChange}
                  loading={isValidating}
                />
              </FormField>

              <FormField
                name="inscricao_estadual"
                label="Inscrição Estadual"
              >
                <Input
                  name="inscricao_estadual"
                  placeholder="Digite a IE"
                />
              </FormField>

              <FormField
                name="responsavel_legal"
                label="Responsável Legal"
              >
                <Input
                  name="responsavel_legal"
                  placeholder="Nome do responsável"
                />
              </FormField>
            </>
          )}

          {/* Campos comuns */}
          <FormField
            name="email"
            label="Email"
            required
          >
            <Input
              name="email"
              type="email"
              placeholder="email@exemplo.com"
            />
          </FormField>

          <FormField
            name="telefone"
            label="Telefone"
            required
          >
            <Input
              name="telefone"
              placeholder="(11) 99999-9999"
              mask="(00) 00000-0000"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
```

### Hook de Validação CPF/CNPJ
```typescript
// hooks/useCpfCnpjValidation.ts
import { useState } from 'react';
import { inquilinoService } from '../services/inquilinoService';

export function useCpfCnpjValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateDocument = async (documento: string, tipo: 'PF' | 'PJ') => {
    if (!documento || documento.length < 11) return null;

    setIsValidating(true);
    try {
      const tipoDoc = tipo === 'PF' ? 'CPF' : 'CNPJ';
      const result = await inquilinoService.validarDocumento(documento, tipoDoc);

      if (!result.valid) {
        throw new Error(result.error);
      }

      if (result.exists) {
        throw new Error(`${tipoDoc} já cadastrado no sistema`);
      }

      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsValidating(false);
    }
  };

  return { validateDocument, isValidating };
}
```

### Componente de Upload
```typescript
// components/inquilinos/steps/DocumentosUpload.tsx
import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DocumentoUpload {
  file: File;
  tipo: string;
  preview?: string;
}

export function DocumentosUpload() {
  const [documentos, setDocumentos] = useState<DocumentoUpload[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    onDrop: (files) => {
      const novosDocumentos = files.map(file => ({
        file,
        tipo: 'OUTROS',
        preview: file.type.startsWith('image/')
          ? URL.createObjectURL(file)
          : undefined,
      }));
      setDocumentos(prev => [...prev, ...novosDocumentos]);
    },
  });

  const removerDocumento = (index: number) => {
    setDocumentos(prev => {
      const documento = prev[index];
      if (documento.preview) {
        URL.revokeObjectURL(documento.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Documentos (Opcional)
        </h3>

        {/* Área de Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Solte os arquivos aqui...'
              : 'Arraste arquivos aqui ou clique para selecionar'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF, JPG, PNG (máx. 5MB cada)
          </p>
        </div>

        {/* Lista de Documentos */}
        {documentos.length > 0 && (
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-gray-900">
              Documentos Selecionados
            </h4>
            {documentos.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {doc.preview ? (
                    <img
                      src={doc.preview}
                      alt="Preview"
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <DocumentIcon className="h-10 w-10 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {doc.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(doc.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removerDocumento(index)}
                  className="text-red-400 hover:text-red-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

## Critérios de Sucesso
- [ ] Formulário multi-step funcionando corretamente
- [ ] Campos dinâmicos PF/PJ alternando conforme seleção
- [ ] Validação em tempo real de CPF/CNPJ
- [ ] Upload de documentos com drag-and-drop
- [ ] Formatação automática aplicada
- [ ] Salvamento de rascunho funcionando
- [ ] Interface responsiva em todas as telas
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Testes unitários cobrindo cenários principais
- [ ] Performance otimizada (validação debounced)