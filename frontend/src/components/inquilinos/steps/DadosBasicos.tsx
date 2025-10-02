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
    try {
      const result = await validateDocument(documento, tipo);
      if (result?.formatted) {
        setValue(field, result.formatted);
      }
    } catch (error) {
      // Error handling será feito pelo formulário
      console.error('Erro na validação do documento:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
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
                  onChange={(e: any) => handleDocumentChange(typeof e === 'string' ? e : e?.target?.value)}
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
                  mask="00.000.000-0"
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
                  onChange={(e: any) => handleDocumentChange(typeof e === 'string' ? e : e?.target?.value)}
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
