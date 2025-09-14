import React from 'react';
import type { Builder } from '../../types/api';
import { apiClient } from '../../services/api';
import { LazyImage } from '../common/LazyImage';

interface BuilderCardProps {
  builder: Builder;
}

export const BuilderCard: React.FC<BuilderCardProps> = ({ builder }) => {
  const cover = builder.photos && builder.photos.length > 0 ? builder.photos[0].photos : undefined;
  const video = builder.video;

  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Media */}
      <div className="relative aspect-video bg-gray-100">
        {video ? (
          <video
            src={apiClient.getMediaUrl(video)}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        ) : cover ? (
          <LazyImage
            src={apiClient.getMediaUrl(cover)}
            alt={`${builder.name}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Sem mídia
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
          {builder.name}
        </h3>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
          <div>
            {builder.street}, {builder.neighborhood}
          </div>
          <div>
            {builder.city}, {builder.state}
          </div>
          {builder.zip_code && <div>CEP: {builder.zip_code}</div>}
        </div>
      </div>
    </article>
  );
};

export default BuilderCard;
