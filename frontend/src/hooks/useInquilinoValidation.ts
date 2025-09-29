import { useState, useCallback } from 'react';
import type { InquilinoFormData } from '../types/inquilino';
import { inquilinoService } from '../services/inquilinoService';

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function useInquilinoValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;

    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cleanCPF)) return false;

    // Validate check digits
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

  const validateCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) return false;

    // Check for known invalid patterns
    if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

    // Validate check digits
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const validateRequired = (value: any): boolean => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  };

  const validateForm = useCallback(async (data: InquilinoFormData): Promise<ValidationResult> => {
    const errors: Record<string, string> = {};

    // Common validations
    if (!validateRequired(data.tipo)) {
      errors.tipo = 'Tipo é obrigatório';
    }

    if (!validateRequired(data.email)) {
      errors.email = 'Email é obrigatório';
    } else if (!validateEmail(data.email)) {
      errors.email = 'Email inválido';
    }

    if (!validateRequired(data.telefone)) {
      errors.telefone = 'Telefone é obrigatório';
    } else if (!validatePhone(data.telefone)) {
      errors.telefone = 'Telefone inválido';
    }

    // Type-specific validations
    if (data.tipo === 'PF') {
      if (!validateRequired(data.nome_completo)) {
        errors.nome_completo = 'Nome completo é obrigatório para Pessoa Física';
      }

      if (!validateRequired(data.cpf)) {
        errors.cpf = 'CPF é obrigatório para Pessoa Física';
      } else if (!validateCPF(data.cpf)) {
        errors.cpf = 'CPF inválido';
      }

      if (data.data_nascimento) {
        const birthDate = new Date(data.data_nascimento);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 18) {
          errors.data_nascimento = 'Inquilino deve ser maior de idade';
        }
      }

      if (data.renda && data.renda < 0) {
        errors.renda = 'Renda não pode ser negativa';
      }
    } else if (data.tipo === 'PJ') {
      if (!validateRequired(data.razao_social)) {
        errors.razao_social = 'Razão social é obrigatória para Pessoa Jurídica';
      }

      if (!validateRequired(data.cnpj)) {
        errors.cnpj = 'CNPJ é obrigatório para Pessoa Jurídica';
      } else if (!validateCNPJ(data.cnpj)) {
        errors.cnpj = 'CNPJ inválido';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, []);

  const validateDocument = useCallback(async (documento: string, tipo: 'CPF' | 'CNPJ') => {
    setIsValidating(true);
    try {
      const result = await inquilinoService.validarDocumento(documento, tipo);
      return result;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const formatCPF = (cpf: string): string => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatCNPJ = (cnpj: string): string => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatPhone = (phone: string): string => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return {
    validateForm,
    validateDocument,
    validateCPF,
    validateCNPJ,
    validateEmail,
    validatePhone,
    formatCPF,
    formatCNPJ,
    formatPhone,
    isValidating,
  };
}