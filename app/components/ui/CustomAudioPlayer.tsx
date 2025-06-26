'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import LikeButton from '@/app/components/ui/content/LikeButton';

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
  contentId: string;
  contentType: string;
}

export default function CustomAudioPlayer({ src, title, className = '', contentId, contentType }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Improved controls visibility logic
  const [showControls, setShowControls] = useState(true);
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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isLoading) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-[#18122B] rounded-b-2xl overflow-hidden ${className}`}>
      {/* Progress Bar */}
      <div className="w-full px-2 md:px-6 pt-2 md:pt-6">
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
      <div className="flex items-center justify-center gap-2 py-2 md:py-6">
        {/* Like Button */}
        <div className="drop-shadow-[0_0_8px_#8B25FF]">
          <LikeButton contentId={contentId} contentType={contentType} />
        </div>
        {/* Volume */}
        <button onClick={toggleMute} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
          <Icon icon={isMuted ? 'mdi:volume-off' : 'mdi:volume-high'} className="size-4 md:size-6" />
        </button>
        {/* Skip Back */}
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10); }} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
          <Icon icon="mdi:rewind-10" className="size-4 md:size-6" />
        </button>
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          className="p-4 rounded-full bg-[#8B25FF] shadow-lg drop-shadow-[0_0_16px_#8B25FF] flex items-center justify-center"
          style={{ boxShadow: '0 0 32px #8B25FF80' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <Icon icon="mdi:reload" className="size-4 md:size-8 text-white animate-spin" />
          ) : isPlaying ? (
            <Icon icon="mdi:pause" className="size-4 md:size-8 text-white" />
          ) : (
            <Icon icon="mdi:play" className="size-4 md:size-8 text-white" />
          )}
        </button>
        {/* Skip Forward */}
        <button onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10); }} className="p-2 rounded-full text-[#8B25FF] drop-shadow-[0_0_8px_#8B25FF]">
          <Icon icon="mdi:fast-forward-10" className="size-4 md:size-6" />
          </button>
      </div>
    </div>
  );
} 