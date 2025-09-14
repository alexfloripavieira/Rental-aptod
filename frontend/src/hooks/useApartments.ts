import { useState, useEffect } from 'react';
import type { Apartment, PaginatedResponse, ApartmentFilters } from '../types/api';
import { apiClient } from '../services/api';

interface UseApartmentsReturn {
  apartments: Apartment[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  currentPage: number;
  refetch: () => void;
}

export const useApartments = (filters: ApartmentFilters): UseApartmentsReturn => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginationData, setPaginationData] = useState<{
    count: number;
    next: string | null;
    previous: string | null;
  }>({
    count: 0,
    next: null,
    previous: null,
  });

  const fetchApartments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: PaginatedResponse<Apartment> = await apiClient.getApartments(filters);

      setApartments(response.results);
      setPaginationData({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err) {
      setError('Erro ao carregar apartamentos. Tente novamente.');
      // eslint-disable-next-line no-console
      console.error('Error fetching apartments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const currentPage = filters.page || 1;

  return {
    apartments,
    loading,
    error,
    totalCount: paginationData.count,
    hasNext: !!paginationData.next,
    hasPrevious: !!paginationData.previous,
    currentPage,
    refetch: fetchApartments,
  };
};

export default useApartments;
