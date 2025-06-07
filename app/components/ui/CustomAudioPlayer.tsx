'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface CustomAudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export default function CustomAudioPlayer({ src, title, className = '' }: CustomAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    <div className={`bg-gray-900 rounded-lg p-4 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {title && (
        <div className="mb-2 text-sm font-medium text-gray-300">
          {title}
        </div>
      )}
      
      <div className="flex items-center space-x-4">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? (
            <Icon icon="mdi:reload" className="h-5 w-5 text-gray-400 animate-spin" />
          ) : isPlaying ? (
            <Icon icon="mdi:pause" className="h-5 w-5 text-purple-400" />
          ) : (
            <Icon icon="mdi:play" className="h-5 w-5 text-purple-400" />
          )}
        </button>
        
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:mt-[-6px] 
              [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
              [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-lg 
              [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-purple-500 
              [&::-webkit-slider-runnable-track]:to-purple-500 [&::-webkit-slider-runnable-track]:bg-[length:var(--background-size,0%)_100%] 
              [&::-webkit-slider-runnable-track]:bg-no-repeat
              [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-4 
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border 
              [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow
              [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-lg [&::-moz-range-progress]:h-1 
              [&::-moz-range-progress]:bg-purple-500 [&::-moz-range-track]:bg-gray-700"
            style={{ '--background-size': `${(currentTime / (duration || 1)) * 100}%` } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            {isMuted ? (
              <Icon icon="mdi:volume-off" className="h-5 w-5 text-gray-400" />
            ) : (
              <Icon icon="mdi:volume-high" className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-400 [&::-webkit-slider-thumb]:mt-[-6px] 
              [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow
              [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-lg 
              [&::-webkit-slider-runnable-track]:bg-gradient-to-r [&::-webkit-slider-runnable-track]:from-purple-500 
              [&::-webkit-slider-runnable-track]:to-purple-500 [&::-webkit-slider-runnable-track]:bg-[length:var(--background-size,0%)_100%] 
              [&::-webkit-slider-runnable-track]:bg-no-repeat
              [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:size-4 
              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-purple-400 [&::-moz-range-thumb]:border 
              [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow
              [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-lg [&::-moz-range-progress]:h-1 
              [&::-moz-range-progress]:bg-purple-500 [&::-moz-range-track]:bg-gray-700"
            style={{ '--background-size': `${volume * 100}%` } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
} 