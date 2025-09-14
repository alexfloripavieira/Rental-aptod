import React, { useState } from 'react';
import { apiClient } from '../../services/api';

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  inline?: boolean; // when true, show the player expanded inline
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title, inline = false }) => {
  const [expanded, setExpanded] = useState(inline);
  const src = apiClient.getMediaUrl(videoUrl);

  if (!src) return null;

  return (
    <div className="flex-1">
      {expanded ? (
        <div className="w-full">
          <video
            src={src}
            className="w-full rounded-md border border-gray-200 dark:border-gray-700"
            controls
            preload="metadata"
            aria-label={title || 'Vídeo'}
          />
          {!inline && (
            <button
              onClick={() => setExpanded(false)}
              className="mt-2 w-full btn-secondary"
            >
              Fechar vídeo
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="w-full btn-secondary"
          aria-label={title || 'Abrir vídeo'}
        >
          Ver vídeo
        </button>
      )}
    </div>
  );
};

export default VideoPlayer;
