'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import LikeButton from '@/app/components/ui/content/LikeButton';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  contentId: string;
  contentType: string;
}

export default function CustomVideoPlayer({ src, poster, title, className = '', contentId, contentType }: CustomVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || isLoading) {
      setShowControls(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      return;
    }
    if (showControls) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying, isLoading, showControls]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLoading) {
    controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
      }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-transparent rounded-b-2xl overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
      />
      
      {title && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-sm font-medium text-white">
            {title}
          </div>
        </div>
      )}
      
      <div className='absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm'>
        {/* Progress Bar */}
        <div className="w-full px-6 pt-6">
          <div className="flex items-center justify-between text-xs text-white/80 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(duration - currentTime)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white rounded-full appearance-none cursor-pointer accent-[#8B25FF]"
            style={{ accentColor: '#8B25FF' }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-center gap-6 py-6">
          {/* Like Button */}
          <div className="drop-shadow-[0_0_8px_#8B25FF]">
            <LikeButton contentId={contentId} contentType={contentType} />
          </div>
          {/* Volume */}
          <button onClick={toggleMute} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
            <Icon icon={isMuted ? 'mdi:volume-off' : 'mdi:volume-high'} className="w-6 h-6" />
          </button>
          {/* Skip Back */}
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
            <Icon icon="mdi:rewind-10" className="w-6 h-6" />
          </button>
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-4 rounded-full bg-[#8B25FF] shadow-lg drop-shadow-[0_0_16px_#8B25FF] flex items-center justify-center"
            style={{ boxShadow: '0 0 32px #8B25FF80' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <Icon icon="mdi:reload" className="h-8 w-8 text-white animate-spin" />
            ) : isPlaying ? (
              <Icon icon="mdi:pause" className="h-8 w-8 text-white" />
            ) : (
              <Icon icon="mdi:play" className="h-8 w-8 text-white" />
            )}
          </button>
          {/* Skip Forward */}
          <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
            <Icon icon="mdi:fast-forward-10" className="w-6 h-6" />
          </button>
          {/* PiP */}
          <button onClick={() => videoRef.current?.requestPictureInPicture()} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
            <Icon icon="mdi:picture-in-picture-bottom-right" className="w-6 h-6" />
            </button>
          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
            <Icon icon={isFullscreen ? 'mdi:fullscreen-exit' : 'mdi:fullscreen'} className="w-6 h-6" />
            </button>
        </div>
      </div>
    </div>
  );
} 