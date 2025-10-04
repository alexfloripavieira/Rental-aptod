import { useState } from 'react';
import axios, { AxiosError } from 'axios';
import type { ContratoFormData, ContratoApiPayload } from '../types/contrato';

interface UseGerarContratoReturn {
  gerarContrato: (data: ContratoFormData) => Promise<Blob>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGerarContrato(): UseGerarContratoReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transformarParaPayload = (data: ContratoFormData): ContratoApiPayload => {
    return data;
  };

  const gerarContrato = async (data: ContratoFormData): Promise<Blob> => {
    setLoading(true);
    setError(null);

    try {
      console.debug('[useGerarContrato] payload enviado', data);
      const payload = transformarParaPayload(data);

      const response = await axios.post('/api/v1/contratos/gerar/', payload, {
        responseType: 'blob',
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': (() => {
            const match = document.cookie.match(/csrftoken=([^;]+)/);
            return match ? match[1] : '';
          })()
        },
      });

      if (response.status !== 200) {
        throw new Error('Erro ao gerar contrato');
      }

      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError;
      console.error('[useGerarContrato] erro na requisição', axiosError);
      if (axiosError.response) {
        console.error('[useGerarContrato] status', axiosError.response.status);
      }

      let responseText: string | undefined;
      if (axiosError.response?.data instanceof Blob) {
        try {
          responseText = await axiosError.response.data.text();
          console.error('[useGerarContrato] data (blob->text)', responseText);
        } catch (blobError) {
          console.error('[useGerarContrato] falha ao ler blob', blobError);
        }
      } else if (axiosError.response?.data) {
        console.error('[useGerarContrato] data', axiosError.response.data);
        responseText = JSON.stringify(axiosError.response.data);
      }

      let errorMessage = 'Erro ao gerar contrato. Tente novamente.';

      if (axiosError.response?.status === 403) {
        errorMessage = 'Você não tem permissão para gerar contratos.';
      } else if (axiosError.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
      }

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText);
          const root = (parsed && typeof parsed === 'object' && 'errors' in parsed)
            ? (parsed.errors as any)
            : parsed;

          const flattenErrors = (data: any, prefix = ''): string[] => {
            if (Array.isArray(data)) {
              return data.map((item) => `${prefix}${item}`);
            }
            if (data && typeof data === 'object') {
              return Object.entries(data).flatMap(([key, value]) =>
                flattenErrors(value, prefix ? `${prefix}.${key}: ` : `${key}: `)
              );
            }
            if (data) {
              return [`${prefix}${data}`];
            }
            return [];
          };

          const errors = flattenErrors(root);

          if (errors.length > 0) {
            errorMessage = errors.join(' ');
          } else if (typeof parsed === 'string') {
            errorMessage = parsed;
          } else if (parsed?.detail && typeof parsed.detail === 'string') {
            errorMessage = parsed.detail;
          } else if (parsed?.message && typeof parsed.message === 'string') {
            errorMessage = parsed.message;
          }
        } catch (parseError) {
          console.error('[useGerarContrato] não foi possível interpretar resposta JSON', parseError);
          if (responseText.trim()) {
            errorMessage = responseText;
          }
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { gerarContrato, loading, error, clearError };
}
