---
status: pending
parallelizable: false
blocked_by: ["5.0"]
unblocks: ["7.0", "10.0"]
---

<task_context>
<domain>frontend/components</domain>
<type>implementation</type>
<scope>core_feature</scope>
<complexity>high</complexity>
<dependencies>external_apis</dependencies>
</task_context>

# Tarefa 6.0: Desenvolvimento Componentes React Core

## Visão Geral

Implementar todos os componentes React principais para listagem de apartamentos e construtoras, galeria de fotos/vídeos, filtros de busca e detalhes, garantindo paridade funcional 100% com o sistema atual.

<requirements>
- Componente de listagem de apartamentos com grid responsivo
- Componente de listagem de construtoras
- Modal de galeria de fotos com navegação
- Player de vídeo integrado
- Filtros de busca em tempo real
- Paginação funcional
- Loading states para todas as operações assíncronas
- Error handling robusto
- Componentes reutilizáveis e bem estruturados
</requirements>

## Subtarefas

- [ ] 6.1 Implementar ApartmentCard e ApartmentList components
- [ ] 6.2 Implementar BuilderCard e BuilderList components
- [ ] 6.3 Criar PhotoGallery modal com navegação
- [ ] 6.4 Implementar VideoPlayer component
- [ ] 6.5 Desenvolver SearchFilters component
- [ ] 6.6 Implementar Pagination component
- [ ] 6.7 Criar Loading e Error state components
- [ ] 6.8 Implementar custom hooks para data fetching

## Detalhes de Implementação

### ApartmentCard Component:

```typescript
// src/components/apartments/ApartmentCard.tsx
import React, { useState } from 'react';
import { Apartment } from '../../types/api';
import { PhotoGallery } from '../common/PhotoGallery';
import { VideoPlayer } from '../common/VideoPlayer';

interface ApartmentCardProps {
  apartment: Apartment;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment }) => {
  const [showGallery, setShowGallery] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <>
      <article 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        role="article"
        tabIndex={0}
      >
        {/* Image Section */}
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          {apartment.fotos.length > 0 ? (
            <img
              src={apartment.fotos[0].photos}
              alt={`Foto do apartamento ${apartment.unit_number}`}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setShowGallery(true)}
              role="img"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Sem foto</span>
            </div>
          )}
          
          {/* Availability Badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded ${
                apartment.is_available
                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                  : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
              }`}
            >
              {apartment.is_available ? 'Disponível' : 'Ocupado'}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <header>
            <h2 
              id={`apartment-${apartment.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              Apartamento {apartment.unit_number}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {apartment.building_name.name} - {apartment.building_name.neighborhood}
            </p>
          </header>

          {/* Price */}
          <p className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-3">
            {formatPrice(apartment.rental_price)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
              /mês
            </span>
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium" data-testid="bedrooms-count">
                {apartment.number_of_bedrooms} quartos
              </span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium">
                {apartment.number_of_bathrooms} banheiros
              </span>
            </div>
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <span className="font-medium">
                {apartment.square_footage}m²
              </span>
            </div>
            {apartment.has_parking && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <span className="font-medium">Garagem</span>
              </div>
            )}
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1 mb-4">
            {apartment.is_furnished && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 text-xs rounded">
                Mobiliado
              </span>
            )}
            {apartment.is_pets_allowed && (
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs rounded">
                Pets OK
              </span>
            )}
            {apartment.has_air_conditioning && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100 text-xs rounded">
                Ar condicionado
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {apartment.description}
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            {apartment.fotos.length > 0 && (
              <button
                onClick={() => setShowGallery(true)}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                aria-describedby={`apartment-${apartment.id}`}
              >
                Ver Fotos ({apartment.fotos.length})
              </button>
            )}
            {apartment.video && (
              <VideoPlayer
                videoUrl={apartment.video}
                title={`Vídeo do apartamento ${apartment.unit_number}`}
              />
            )}
          </div>
        </div>
      </article>

      {/* Photo Gallery Modal */}
      {showGallery && apartment.fotos.length > 0 && (
        <PhotoGallery
          photos={apartment.fotos}
          title={`Apartamento ${apartment.unit_number}`}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
};
```

### SearchFilters Component:

```typescript
// src/components/common/SearchFilters.tsx
import React from 'react';
import { ApartmentFilters } from '../../types/api';

interface SearchFiltersProps {
  filters: ApartmentFilters;
  onFiltersChange: (filters: ApartmentFilters) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const handleFilterChange = (key: keyof ApartmentFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filtros de Busca
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Buscar
          </label>
          <input
            type="text"
            id="search"
            placeholder="Número, descrição..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Bedrooms Filter */}
        <div>
          <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Quartos
          </label>
          <select
            id="bedrooms"
            value={filters.number_of_bedrooms || ''}
            onChange={(e) => handleFilterChange('number_of_bedrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            data-testid="bedrooms-filter"
          >
            <option value="">Qualquer</option>
            <option value="1">1 quarto</option>
            <option value="2">2 quartos</option>
            <option value="3">3 quartos</option>
            <option value="4">4+ quartos</option>
          </select>
        </div>

        {/* Bathrooms Filter */}
        <div>
          <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Banheiros
          </label>
          <select
            id="bathrooms"
            value={filters.number_of_bathrooms || ''}
            onChange={(e) => handleFilterChange('number_of_bathrooms', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Qualquer</option>
            <option value="1">1 banheiro</option>
            <option value="2">2 banheiros</option>
            <option value="3">3+ banheiros</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Disponibilidade
          </label>
          <select
            id="availability"
            value={filters.is_available === undefined ? '' : String(filters.is_available)}
            onChange={(e) => handleFilterChange('is_available', e.target.value === '' ? undefined : e.target.value === 'true')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="true">Disponível</option>
            <option value="false">Ocupado</option>
          </select>
        </div>
      </div>

      {/* Amenities Checkboxes */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Facilidades
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.has_parking || false}
              onChange={(e) => handleFilterChange('has_parking', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Garagem</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.has_air_conditioning || false}
              onChange={(e) => handleFilterChange('has_air_conditioning', e.target.checked || undefined)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Ar condicionado</span>
          </label>
        </div>
      </div>

      {/* Clear Filters */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onFiltersChange({})}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
};
```

### Custom Hook para Data Fetching:

```typescript
// src/hooks/useApartments.ts
import { useState, useEffect } from 'react';
import { Apartment, PaginatedResponse, ApartmentFilters } from '../types/api';
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
      
      const response = await apiClient.getApartments(filters);
      
      setApartments(response.results);
      setPaginationData({
        count: response.count,
        next: response.next,
        previous: response.previous,
      });
    } catch (err) {
      setError('Erro ao carregar apartamentos. Tente novamente.');
      console.error('Error fetching apartments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
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
```

### PhotoGallery Modal Component:

```typescript
// src/components/common/PhotoGallery.tsx
import React, { useState, useEffect } from 'react';
import { Photo } from '../../types/api';

interface PhotoGalleryProps {
  photos: Photo[];
  title: string;
  onClose: () => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  title,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
          break;
        case 'ArrowRight':
          setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [photos.length, onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const previousPhoto = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
      data-testid="photo-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
    >
      <div 
        className="relative max-w-4xl max-h-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 z-10">
          <div className="flex justify-between items-center">
            <h2 id="gallery-title" className="text-lg font-semibold">
              {title}
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm" data-testid="photo-counter">
                {currentIndex + 1} de {photos.length}
              </span>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-300 text-2xl"
                aria-label="Fechar galeria"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Main Image */}
        <img
          src={photos[currentIndex].photos}
          alt={`${title} - Foto ${currentIndex + 1}`}
          className="max-w-full max-h-screen object-contain"
        />

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={previousPhoto}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              aria-label="Foto anterior"
              data-testid="previous-photo"
            >
              ←
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              aria-label="Próxima foto"
              data-testid="next-photo"
            >
              →
            </button>
          </>
        )}

        {/* Thumbnails */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-12 h-12 rounded overflow-hidden border-2 ${
                  index === currentIndex ? 'border-white' : 'border-transparent'
                }`}
              >
                <img
                  src={photo.photos}
                  alt={`Miniatura ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

## Critérios de Sucesso

- Listagem de apartamentos funcionando com grid responsivo
- Filtros de busca funcionando em tempo real
- Modal de galeria de fotos com navegação (teclado + mouse)
- Player de vídeo integrado funcionando
- Paginação funcionando corretamente
- Loading states implementados em todas operações
- Error handling robusto em todos componentes
- Componentes acessíveis (ARIA labels, keyboard navigation)
- Performance otimizada (lazy loading, memoização)
- Dark mode funcionando em todos componentes
- Responsividade em mobile/tablet/desktop
- Testes unitários para componentes principais (>70% coverage)