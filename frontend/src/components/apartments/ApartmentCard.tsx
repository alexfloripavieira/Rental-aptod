import React, { useState } from 'react';
import type { Apartment } from '../../types/api';
import { PhotoGallery } from '../common/PhotoGallery';
import { VideoPlayer } from '../common/VideoPlayer';
import { LazyImage } from '../common/LazyImage';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api';
import type { Photo } from '../../types/api';

interface ApartmentCardProps {
  apartment: Apartment;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment }) => {
  const [showGallery, setShowGallery] = useState(false);
  const initialPhotos = Array.isArray(apartment.fotos) ? apartment.fotos : [];
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>(initialPhotos as Photo[]);
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const coverUrl = apartment.main_photo || (galleryPhotos[0] && galleryPhotos[0].photos ? apiClient.getMediaUrl(galleryPhotos[0].photos) : undefined);
  const photoCount = (apartment as any).photo_count !== undefined ? (apartment as any).photo_count as number : galleryPhotos.length;
  const statusClass = apartment.is_available
    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
    : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';

  return (
    <>
      <div
        role="link"
        tabIndex={0}
        onClick={() => navigate('/aptos/' + apartment.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate('/aptos/' + apartment.id);
          }
        }}
        className="block focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
      > 
        <article
          className="card hover:shadow-lg transition-shadow duration-200"
          role="article"
          tabIndex={0}
        >
          <div className="relative m-4 mb-0 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
            {apartment.video ? (
              <video
                src={apiClient.getMediaUrl(apartment.video)}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              />
            ) : coverUrl ? (
              <div
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (galleryPhotos.length === 0) {
                    try {
                      const full = await apiClient.getApartment(apartment.id);
                      setGalleryPhotos(full.fotos || []);
                    } catch {}
                  }
                  setShowGallery(true);
                }}
                className="cursor-pointer w-full h-full"
              >
                <LazyImage
                  src={coverUrl}
                  alt={'Foto do apartamento ' + apartment.unit_number}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400">Sem mídia</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <span
                className={ 'px-2 py-1 text-xs font-semibold rounded ' + statusClass }
              >
                {apartment.is_available ? 'Disponível' : 'Ocupado'}
              </span>
            </div>
          </div>

          <div className="p-4">
            <header>
              <h2
                id={'apartment-' + apartment.id}
                className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
              >
                Apartamento {apartment.unit_number}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {(apartment.building_name && apartment.building_name.name) ? apartment.building_name.name : '---'}
                {(apartment.building_name && apartment.building_name.neighborhood) ? (' - ' + apartment.building_name.neighborhood) : ''}
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

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
              {photoCount > 0 && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (galleryPhotos.length === 0) {
                      try {
                        const full = await apiClient.getApartment(apartment.id);
                        setGalleryPhotos(full.fotos || []);
                      } catch {}
                    }
                    setShowGallery(true);
                  }}
                  className="btn-outline"
                  aria-describedby={'apartment-' + apartment.id}
                >
                  Ver fotos ({photoCount})
                </button>
              )}
              <Link
                to={'/aptos/' + apartment.id}
                className="btn-outline"
                onClick={(e) => { e.stopPropagation(); }}
              >
                Ver detalhes
              </Link>
            {/* Video aparece no header acima; não repetimos aqui */}
            </div>
          </div>
        </article>
      </div>

      {showGallery && galleryPhotos.length > 0 && (
        <PhotoGallery
          photos={galleryPhotos}
          title={'Apartamento ' + apartment.unit_number}
          onClose={() => setShowGallery(false)}
        />
      )}
    </>
  );
};

export default ApartmentCard;
