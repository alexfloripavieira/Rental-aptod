import React, { useState } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%227%22 viewBox=%220 0 10 7%22%3E%3Crect width=%2210%22 height=%227%22 fill=%22%23e5e7eb%22/%3E%3C/svg%3E'
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { targetRef, isIntersecting } = useIntersectionObserver();

  return (
    <div ref={targetRef} className={`relative ${className}`}>
      {isIntersecting && (
        <>
          <img
            src={src}
            alt={alt}
            className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className} rounded-lg`}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            loading="lazy"
          />
          {!loaded && !error && (
            <img
              src={placeholder}
              alt=""
              className={`absolute inset-0 ${className}`}
              aria-hidden="true"
            />
          )}
          {error && (
            <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                Erro ao carregar imagem
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LazyImage;

