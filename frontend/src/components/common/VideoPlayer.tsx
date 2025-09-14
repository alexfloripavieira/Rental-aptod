import React, { useState } from 'react';
import { apiClient } from '../../services/api';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [expanded, setExpanded] = useState(false);
  const src = apiClient.getMediaUrl(videoUrl);

  if (!src) return null;

  return (
    <div className="flex-1">
      {expanded ? (
        <div className="w-full">
          <video
            src={src}
            className="w-full rounded-md border border-gray-200"
            controls
            preload="metadata"
            aria-label={title || 'Vídeo'}
          />
          <button
            onClick={() => setExpanded(false)}
            className="mt-2 w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
          >
            Fechar vídeo
          </button>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
          aria-label={title || 'Abrir vídeo'}
        >
          Ver vídeo
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;

