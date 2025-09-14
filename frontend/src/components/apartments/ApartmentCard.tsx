import React, { useState } from 'react';
import type { Apartment } from '../../types/api';
import { PhotoGallery } from '../common/PhotoGallery';
import { VideoPlayer } from '../common/VideoPlayer';
import { LazyImage } from '../common/LazyImage';

interface ApartmentCardProps {
  apartment: Apartment;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment }) => {
  const [showGallery, setShowGallery] = useState(false);
  const photos = Array.isArray(apartment.fotos) ? apartment.fotos : [];

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
        <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
          {photos.length > 0 ? (
            <div onClick={() => setShowGallery(true)} className="cursor-pointer w-full h-full">
              <LazyImage
                src={photos[0].photos}
                alt={`Foto do apartamento ${apartment.unit_number}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400">Sem foto</span>
            </div>
          )}
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

        <div className="p-4">
          <header>
            <h2
              id={`apartment-${apartment.id}`}
              className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
            >
              Apartamento {apartment.unit_number}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {apartment.building_name?.name || '---'}{apartment.building_name?.neighborhood ? ` - ${apartment.building_name.neighborhood}` : ''}
            </p>
          </header>

          <p className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-3">
            {formatPrice(apartment.rental_price)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
              /mês
            </span>
          </p>

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

          <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {apartment.description}
          </p>

          <div className="flex gap-2">
            {photos.length > 0 && (
              <button
                onClick={() => setShowGallery(true)}
                className="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors"
                aria-describedby={`apartment-${apartment.id}`}
              >
                Ver Fotos ({photos.length})
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

      {showGallery && photos.length > 0 && (
        <PhotoGallery
          photos={photos}
          title={`Apartamento ${apartment.unit_number}`}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
};

export default ApartmentCard;
