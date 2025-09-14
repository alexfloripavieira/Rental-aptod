import React, { useEffect, useRef, useState } from 'react';

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & {
  src: string;
};

// Renders a <video> and, if no poster is provided, generates a poster
// from the first frame (0.1s) using a canvas. Works for same‑origin videos.
export const VideoWithPoster: React.FC<Props> = ({ src, poster, preload = 'metadata', ...rest }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | undefined>(undefined);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    setGeneratedPoster(undefined); // reset when src changes

    const tryCapture = () => {
      if (!v) return;
      // Only attempt capture when metadata is available
      if (v.readyState < 2 /* HAVE_CURRENT_DATA */ || v.videoWidth === 0 || v.videoHeight === 0) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth || 1280;
        canvas.height = v.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const doDraw = () => {
          try {
            ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
            const dataURL = canvas.toDataURL('image/jpeg', 0.72);
            setGeneratedPoster(dataURL);
          } catch {
            // ignore draw errors
          }
        };

        // Seek a tiny offset to avoid black frames in some codecs
        const seekAndDraw = () => {
          const onSeeked = () => {
            v.removeEventListener('seeked', onSeeked);
            doDraw();
          };
          v.addEventListener('seeked', onSeeked);
          try {
            v.currentTime = Math.min(0.1, (v.duration && isFinite(v.duration)) ? Math.max(0, v.duration * 0.01) : 0.1);
          } catch {
            // If seeking fails, draw current frame
            v.removeEventListener('seeked', onSeeked);
            doDraw();
          }
        };

        // If already past 0, try drawing; else perform a short seek
        if (v.currentTime > 0) doDraw();
        else seekAndDraw();
      } catch {
        // ignore capture errors
      }
    };

    const onLoadedMeta = () => tryCapture();
    const onLoadedData = () => tryCapture();

    v.addEventListener('loadedmetadata', onLoadedMeta);
    v.addEventListener('loadeddata', onLoadedData);

    return () => {
      v.removeEventListener('loadedmetadata', onLoadedMeta);
      v.removeEventListener('loadeddata', onLoadedData);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster || generatedPoster}
      preload={preload}
      playsInline
      {...rest}
    />
  );
};

export default VideoWithPoster;

