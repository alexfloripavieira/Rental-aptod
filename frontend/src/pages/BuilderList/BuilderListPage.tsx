import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import type { Builder, PaginatedResponse, BuilderFilters } from '../../types/api';
import { CardSkeleton } from '../../components/common/Loading';

const BuilderListPage: React.FC = () => {
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<BuilderFilters>({});
  const navigate = useNavigate();

  const fetchBuilders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PaginatedResponse<Builder> = await apiClient.getBuilders(filters);
      setBuilders(response.results);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar Empreendimentos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBuilders();
  }, [fetchBuilders]);

  const handleFilterChange = (newFilters: Partial<BuilderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-error-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar Empreendimentos</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchBuilders}
          className="btn-primary"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Empreendimentos</h1>
        <p className="mt-2 text-gray-600">
          Conheça os empreendimentos e seus apartamentos disponíveis para locação.
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade
              </label>
              <select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange({ city: e.target.value })}
                className="input-field"
              >
                <option value="">Todas as cidades</option>
                <option value="São Paulo">São Paulo</option>
                <option value="Rio de Janeiro">Rio de Janeiro</option>
                <option value="Belo Horizonte">Belo Horizonte</option>
                <option value="Brasília">Brasília</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.state || ''}
                onChange={(e) => handleFilterChange({ state: e.target.value })}
                className="input-field"
              >
                <option value="">Todos os estados</option>
                <option value="SP">São Paulo</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="MG">Minas Gerais</option>
                <option value="DF">Distrito Federal</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nome da construtora..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      {builders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma construtora encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Mostrando {builders.length} construtora{builders.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builders.map((builder) => (
              <div
                key={builder.id}
                className="card hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => navigate('/builders/' + builder.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/builders/' + builder.id); } }}
              >
                <div className="card-body">
                  {/* Video/Photo preview */}
                  {builder.video ? (
                    <div className="relative mb-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <video
                        src={apiClient.getMediaUrl(builder.video)}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      />
                    </div>
                  ) : builder.builder_fotos && builder.builder_fotos.length > 0 ? (
                    <div className="relative mb-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={apiClient.getMediaUrl(builder.builder_fotos[0].photos)}
                        alt={`${builder.name} - Foto 1`}
                        className="w-full h-full object-cover"
                      />
                      {builder.builder_fotos.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          +{builder.builder_fotos.length - 1} fotos
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {builder.name}
                    </h3>
                  </div>

                  {/* Address */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {builder.street}, {builder.neighborhood}
                    </div>

                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {builder.city}, {builder.state}
                    </div>

                    {builder.zip_code && (
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        CEP: {builder.zip_code}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <Link
                        to={'/aptos?builder=' + builder.id}
                        className="btn-outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver apartamentos
                      </Link>
                      <Link
                        to={'/builders/' + builder.id}
                        className="btn-outline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BuilderListPage;
