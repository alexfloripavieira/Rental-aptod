import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import type { Apartment } from '../../types/api';
import { apiClient } from '../../services/api';
import { LazyImage } from '../../components/common/LazyImage';
import { PhotoGallery } from '../../components/common/PhotoGallery';
import { VideoWithPoster } from '../../components/common/VideoWithPoster';

const ApartmentDetailPage: React.FC = () => {
  const { id } = useParams();
  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchApartment = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await apiClient.getApartment(Number(id));
        setApartment(data);
      } catch (err: any) {
        setError(err?.message || 'Erro ao carregar detalhes do apartamento.');
      } finally {
        setLoading(false);
      }
    };
    fetchApartment();
  }, [id]);

  useEffect(() => {
    const wantsGallery = searchParams.get('gallery') === '1';
    if (wantsGallery && apartment && Array.isArray(apartment.fotos) && apartment.fotos.length > 0) {
      setShowGallery(true);
    }
  }, [searchParams, apartment]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Carregando informações do apartamento...</p>
      </div>
    );
  }

  if (error || !apartment) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">{error || 'Apartamento não encontrado.'}</p>
        <Link to="/aptos" className="text-primary-600 hover:underline">Voltar para listagem</Link>
      </div>
    );
  }

  const coverUrl = apartment.main_photo || ((apartment.fotos && apartment.fotos[0]) ? apiClient.getMediaUrl(apartment.fotos[0].photos) : undefined);
  const photoCount = Array.isArray(apartment.fotos) ? apartment.fotos.length : 0;
  const builder = apartment.building_name;
  const mapsHref = builder
    ? (
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent([
        builder.street,
        builder.neighborhood,
        (builder.city ? builder.city : "") + (builder.state ? " - " + builder.state : ""),
        builder.zip_code,
      ].filter(Boolean).join(", "))
    )
    : '#';

  return (
    <div className="p-6">
      <Link to="/aptos" className="text-primary-600 hover:underline">← Voltar</Link>
      <div className="mt-4 card overflow-hidden">
        {/* Hero (vídeo ou capa) */}
        {apartment.video ? (
          <div className="media-hero m-4">
            <VideoWithPoster
              src={apiClient.getMediaUrl(apartment.video)}
              className="w-full h-full object-cover rounded-lg"
              controls
              preload="metadata"
              poster={coverUrl}
              playsInline
            />
          </div>
        ) : coverUrl ? (
          <div className="media-hero">
            <div className="w-full h-full cursor-pointer" onClick={() => setShowGallery(true)}>
              <LazyImage src={coverUrl} alt={'Foto do apartamento ' + apartment.unit_number} className="w-full h-full object-cover" />
            </div>
          </div>
        ) : null}
        <div className="p-6">
          <h1 className="page-title">Apartamento {apartment.unit_number}</h1>
          <p className="page-subtitle">{apartment.building_name?.name}</p>
          <p className="text-xl font-semibold text-primary-600 dark:text-primary-400 mt-4">R$ {apartment.rental_price}</p>

          {apartment.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">{apartment.description}</p>
          )}

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><strong>Quartos:</strong> {apartment.number_of_bedrooms}</div>
            <div><strong>Banheiros:</strong> {apartment.number_of_bathrooms}</div>
            <div><strong>Tamanho:</strong> {apartment.square_footage}m²</div>
            <div><strong>Garagem:</strong> {apartment.has_parking ? 'Sim' : 'Não'}</div>
            <div><strong>Mobiliado:</strong> {apartment.is_furnished ? 'Sim' : 'Não'}</div>
            <div><strong>Ar condicionado:</strong> {apartment.has_air_conditioning ? 'Sim' : 'Não'}</div>
          </div>

          {/* Ações: abrir no mapa e ver fotos */}
          <div className="page-actions">
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Abrir no mapa
            </a>
            {photoCount > 0 && (
              <button
                onClick={() => setShowGallery(true)}
                className="btn-outline"
              >
                Ver fotos ({photoCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {showGallery && apartment.fotos && apartment.fotos.length > 0 && (
        <PhotoGallery
          photos={apartment.fotos}
          title={'Apartamento ' + apartment.unit_number}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default ApartmentDetailPage;
