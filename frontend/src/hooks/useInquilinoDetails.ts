import { useState, useEffect, useCallback } from 'react';
import { inquilinoService } from '../services/inquilinoService';
import type { Inquilino } from '../types/inquilino';

export function useInquilinoDetails(inquilinoId: number) {
  const [inquilino, setInquilino] = useState<Inquilino | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInquilino = useCallback(async () => {
    if (!inquilinoId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await inquilinoService.getById(inquilinoId);
      setInquilino(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar inquilino');
      console.error('Erro ao carregar inquilino:', err);
    } finally {
      setLoading(false);
    }
  }, [inquilinoId]);

  useEffect(() => {
    loadInquilino();
  }, [loadInquilino]);

  return {
    inquilino,
    loading,
    error,
    refetch: loadInquilino
  };
}
