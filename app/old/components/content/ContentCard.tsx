import { useState } from 'react';
import { ContentData } from '@/app/old/lib/supabase';
import { Button } from '@/app/old/components/ui/button';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

interface ContentCardProps {
  content: ContentData;
  onPlay?: (content: ContentData) => void;
  onPause?: () => void;
}

export function ContentCard({ content, onPlay, onPause }: ContentCardProps) {
  const { data: account } = useAbstraxionAccount();
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      onPause?.();
    } else {
      setIsPlaying(true);
      onPlay?.(content);
    }
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200">
      <div className="relative aspect-video">
        {content.type === 'VIDEO' ? (
          <video
            src={content.content_url}
            poster={content.thumbnail_url}
            className="w-full h-full object-cover"
            controls={false}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
              </div>
              <p className="text-gray-400">Audio Content</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center"
          >
            {isPlaying ? (
              <PauseIcon className="w-6 h-6 text-white" />
            ) : (
              <PlayIcon className="w-6 h-6 text-white" />
            )}
          </Button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium">
          {formatDuration(content.duration || 0)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1 line-clamp-2 text-lg">
          {content.title}
        </h3>
        <p className="text-sm text-gray-400 mb-2">Creator ID: {content.creator_id}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{content.view_count} views</span>
          {content.price > 0 && (
            <span className="text-blue-400 font-medium">${content.price}</span>
          )}
        </div>
        {!account?.bech32Address && content.price > 0 && (
          <Button
            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          >
            Sign in to access
          </Button>
        )}
      </div>
    </div>
  );
} 