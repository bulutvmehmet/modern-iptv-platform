'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useSettingsStore } from '@/lib/store/useSettingsStore';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  controls?: boolean;
  onProgress?: (progress: number) => void;
  onEnded?: () => void;
  startTime?: number; // in seconds
  className?: string;
}

export default function VideoPlayer({
  src,
  poster,
  autoPlay = true,
  controls = true,
  onProgress,
  onEnded,
  startTime = 0,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const bufferSize = useSettingsStore((state) => state.bufferSize);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const setupHls = () => {
      if (Hls.isSupported()) {
        hls = new Hls({
          maxBufferLength: bufferSize || 30, // Default 30 seconds
          maxMaxBufferLength: bufferSize ? bufferSize * 2 : 60, // Double the buffer size
        });
        
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch((e) => {
              console.error('Error playing video:', e);
            });
          }
          
          // Set start time if provided
          if (startTime > 0) {
            video.currentTime = startTime;
          }
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error:', data);
                setError('Network error. Please check your connection.');
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error:', data);
                setError('Media error. Trying to recover...');
                hls?.recoverMediaError();
                break;
              default:
                console.error('Unrecoverable error:', data);
                setError('An error occurred while playing the video.');
                hls?.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
        video.addEventListener('loadedmetadata', () => {
          if (autoPlay) {
            video.play().catch((e) => {
              console.error('Error playing video:', e);
            });
          }
          
          // Set start time if provided
          if (startTime > 0) {
            video.currentTime = startTime;
          }
        });
      } else {
        setError('HLS is not supported in this browser.');
      }
    };

    setupHls();

    // Set up progress tracking
    const handleTimeUpdate = () => {
      if (video && onProgress) {
        const progress = (video.currentTime / video.duration) * 100;
        onProgress(progress);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    
    if (onEnded) {
      video.addEventListener('ended', onEnded);
    }

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      if (onEnded) {
        video.removeEventListener('ended', onEnded);
      }
      
      if (hls) {
        hls.destroy();
      }
    };
  }, [src, autoPlay, onProgress, onEnded, startTime, bufferSize]);

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className={`w-full h-full ${className}`}
        poster={poster}
        controls={controls}
        playsInline
      />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white p-4 text-center">
          <div>
            <p className="text-red-400 font-semibold mb-2">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}