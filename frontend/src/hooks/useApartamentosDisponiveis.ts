import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

interface Apartamento {
  id: number;
  unit_number: string;
  building_name: string;
  floor?: string;
  number_of_bedrooms: number;
  number_of_bathrooms: number;
  square_footage: number;
  is_available: boolean;
}

export function useApartamentosDisponiveis() {
  const [apartamentosDisponiveis, setApartamentosDisponiveis] = useState<Apartamento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApartamentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/aptos/', {
        params: {
          is_available: true,
          page_size: 1000 // Carregar todos os disponíveis
        }
      });

      setApartamentosDisponiveis(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar apartamentos');
      console.error('Erro ao carregar apartamentos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApartamentos();
  }, [loadApartamentos]);

  return {
    apartamentosDisponiveis,
    loading,
    error,
    refetch: loadApartamentos
  };
}
