import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Apartment, Builder, Photo } from "../../types/api";
import { apiClient } from "../../services/api";
import { LazyImage } from "../../components/common/LazyImage";
import { VideoWithPoster } from "../../components/common/VideoWithPoster";
import { PhotoGallery } from "../../components/common/PhotoGallery";
import { ApartmentCard } from "../../components/apartments/ApartmentCard";

const BuilderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [builder, setBuilder] = useState<Builder | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [builderData, apartmentsData] = await Promise.all([
          apiClient.getBuilder(Number(id)),
          apiClient.getBuilderApartments(Number(id)),
        ]);
        setBuilder(builderData);
        setApartments(apartmentsData);
      } catch (err: any) {
        setError(err?.message || "Erro ao carregar empreendimento");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const galleryPhotos: Photo[] = useMemo(() => {
    return (builder?.builder_fotos || []).map((f) => ({ id: f.id, photos: f.photos }));
  }, [builder]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-600">Carregando empreendimento...</p>
      </div>
    );
  }

  if (error || !builder) {
    return (
      <div className="p-6">
        <p className="text-red-600 mb-4">{error || "Empreendimento não encontrado."}</p>
        <Link to="/builders" className="text-primary-600 hover:underline">Voltar</Link>
      </div>
    );
  }

  const coverPhoto = builder.builder_fotos && builder.builder_fotos[0]
    ? apiClient.getMediaUrl(builder.builder_fotos[0].photos)
    : undefined;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/builders" className="text-primary-600 hover:underline">← Voltar</Link>
      </div>

      <div className="card overflow-hidden">
        {builder.video ? (
          <div className="media-hero">
            <VideoWithPoster
              src={apiClient.getMediaUrl(builder.video)}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
              poster={coverPhoto}
            />
          </div>
        ) : coverPhoto ? (
          <div className="media-hero">
            <div className="w-full h-full cursor-pointer" onClick={() => setShowGallery(true)}>
              <LazyImage src={coverPhoto} alt={builder.name + " - capa"} className="w-full h-full object-cover" />
            </div>
            {galleryPhotos.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                +{galleryPhotos.length - 1} fotos
              </div>
            )}
          </div>
        ) : null}

        <div className="card-body">
          <h1 className="page-title">{builder.name}</h1>
          <div className="mt-2 text-gray-700 dark:text-gray-300 space-y-1">
            <p>{builder.street}{builder.neighborhood ? ", " + builder.neighborhood : ""}</p>
            <p>{builder.city}{builder.state ? ", " + builder.state : ""}</p>
            {builder.zip_code && <p>CEP: {builder.zip_code}</p>}
          </div>

          <div className="page-actions">
            <a
              href={
                "https://www.google.com/maps/search/?api=1&query=" +
                encodeURIComponent([
                  builder.street,
                  builder.neighborhood,
                  (builder.city ? builder.city : "") + (builder.state ? " - " + builder.state : ""),
                  builder.zip_code,
                ].filter(Boolean).join(", "))
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              Abrir no mapa
            </a>
            {/* Removido: botão de ver apartamentos deste empreendimento (cards abaixo já listam) */}
            {galleryPhotos.length > 0 && (
              <button
                onClick={() => setShowGallery(true)}
                className="btn-outline"
              >
                Ver fotos ({galleryPhotos.length})
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Apartamentos disponíveis</h2>
        {apartments.length === 0 ? (
          <p className="text-gray-600">Nenhum apartamento encontrado para este empreendimento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apt) => (
              <ApartmentCard key={apt.id} apartment={apt} />
            ))}
          </div>
        )}
      </div>

      {showGallery && galleryPhotos.length > 0 && (
        <PhotoGallery
          photos={galleryPhotos}
          title={builder.name}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};

export default BuilderDetailPage;
