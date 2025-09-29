import * as yup from 'yup';
import type { InquilinoFormData } from '../types/inquilino';

// Custom validation functions
const validateCPF = (cpf: string | undefined): boolean => {
  if (!cpf) return false;
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;

  return true;
};

const validateCNPJ = (cnpj: string | undefined): boolean => {
  if (!cnpj) return false;
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleanCNPJ[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleanCNPJ[13])) return false;

  return true;
};

const validateAge = (birthDate: string | undefined): boolean => {
  if (!birthDate) return true; // Optional field
  const birth = new Date(birthDate);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

const validatePhone = (phone: string | undefined): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

// Main validation schema
export const getInquilinoSchema = () => {
  return yup.object<InquilinoFormData>({
    tipo: yup
      .string()
      .oneOf(['PF', 'PJ'], 'Tipo deve ser PF ou PJ')
      .required('Tipo é obrigatório'),

    email: yup
      .string()
      .email('Email inválido')
      .required('Email é obrigatório'),

    telefone: yup
      .string()
      .test('phone-valid', 'Telefone inválido', validatePhone)
      .required('Telefone é obrigatório'),

    observacoes: yup.string().optional(),

    // Campos específicos para Pessoa Física
    nome_completo: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema
          .min(2, 'Nome deve ter pelo menos 2 caracteres')
          .required('Nome completo é obrigatório para Pessoa Física'),
        otherwise: (schema) => schema.optional(),
      }),

    cpf: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema
          .test('cpf-valid', 'CPF inválido', validateCPF)
          .required('CPF é obrigatório para Pessoa Física'),
        otherwise: (schema) => schema.optional(),
      }),

    rg: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.optional(),
      }),

    data_nascimento: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema
          .test('age-valid', 'Inquilino deve ser maior de idade', validateAge)
          .optional(),
        otherwise: (schema) => schema.optional(),
      }),

    estado_civil: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema
          .oneOf(['SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', ''], 'Estado civil inválido')
          .optional(),
        otherwise: (schema) => schema.optional(),
      }),

    profissao: yup
      .string()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.optional(),
      }),

    renda: yup
      .number()
      .when('tipo', {
        is: 'PF',
        then: (schema) => schema
          .min(0, 'Renda não pode ser negativa')
          .optional(),
        otherwise: (schema) => schema.optional(),
      }),

    // Campos específicos para Pessoa Jurídica
    razao_social: yup
      .string()
      .when('tipo', {
        is: 'PJ',
        then: (schema) => schema
          .min(2, 'Razão social deve ter pelo menos 2 caracteres')
          .required('Razão social é obrigatória para Pessoa Jurídica'),
        otherwise: (schema) => schema.optional(),
      }),

    nome_fantasia: yup
      .string()
      .when('tipo', {
        is: 'PJ',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.optional(),
      }),

    cnpj: yup
      .string()
      .when('tipo', {
        is: 'PJ',
        then: (schema) => schema
          .test('cnpj-valid', 'CNPJ inválido', validateCNPJ)
          .required('CNPJ é obrigatório para Pessoa Jurídica'),
        otherwise: (schema) => schema.optional(),
      }),

    inscricao_estadual: yup
      .string()
      .when('tipo', {
        is: 'PJ',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.optional(),
      }),

    responsavel_legal: yup
      .string()
      .when('tipo', {
        is: 'PJ',
        then: (schema) => schema.optional(),
        otherwise: (schema) => schema.optional(),
      }),

    // Campo opcional comum
    endereco_completo: yup.string().optional(),
  });
};

// Schema for step validation
export const getStepSchema = (step: number, tipo: 'PF' | 'PJ') => {
  const baseSchema = getInquilinoSchema();

  switch (step) {
    case 0: // Dados Básicos
      return yup.object().shape({
        tipo: baseSchema.fields.tipo,
        email: baseSchema.fields.email,
        telefone: baseSchema.fields.telefone,
        ...(tipo === 'PF' ? {
          nome_completo: baseSchema.fields.nome_completo,
          cpf: baseSchema.fields.cpf,
          data_nascimento: baseSchema.fields.data_nascimento,
        } : {
          razao_social: baseSchema.fields.razao_social,
          nome_fantasia: baseSchema.fields.nome_fantasia,
          cnpj: baseSchema.fields.cnpj,
        }),
      });

    case 1: // Endereço
      return yup.object().shape({
        endereco_completo: baseSchema.fields.endereco_completo,
      });

    case 2: // Documentos (opcional)
      return yup.object().shape({});

    default:
      return baseSchema;
  }
};