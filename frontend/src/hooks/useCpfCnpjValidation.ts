import { useState } from 'react';
import { inquilinoService } from '../services/inquilinoService';
import type { DocumentValidation } from '../types/inquilino';

export function useCpfCnpjValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateDocument = async (documento: string, tipo: 'PF' | 'PJ'): Promise<DocumentValidation | null> => {
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
    } finally {
      setIsValidating(false);
    }
  };

  return { validateDocument, isValidating };
}