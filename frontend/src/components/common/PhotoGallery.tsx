import React, { useState, useEffect, useRef } from 'react';
import type { Photo } from '../../types/api';
import { trapFocus } from '../../utils/accessibility';
import { apiClient } from '../../services/api';

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
  const dialogRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let cleanupFocus: (() => void) | undefined;
    if (dialogRef.current) {
      cleanupFocus = trapFocus(dialogRef.current);
    }
    return () => {
      document.body.style.overflow = 'unset';
      if (cleanupFocus) cleanupFocus();
    };
  }, []);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const previousPhoto = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const currentUrl = apiClient.getMediaUrl(photos[currentIndex].photos);

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
        ref={dialogRef}
      >
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

        <img
          src={currentUrl}
          alt={title + ' - Foto ' + (currentIndex + 1)}
          className="max-w-full max-h-screen object-contain"
        />

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

        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-50 p-2 rounded">
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                onClick={() => setCurrentIndex(index)}
                className={"w-12 h-12 rounded overflow-hidden border-2 " + (index === currentIndex ? 'border-white' : 'border-transparent')}
              >
                <img
                  src={apiClient.getMediaUrl(photo.photos)}
                  alt={'Miniatura ' + (index + 1)}
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

export default PhotoGallery;

