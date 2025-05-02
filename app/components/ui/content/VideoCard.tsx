import Link from 'next/link';
import { Video } from '@/app/types';
import { PlayIcon } from '@heroicons/react/24/outline';
import { hasActivePremiumSubscription } from '@/app/utils/subscription';
import { useUserStore } from '@/app/stores/user';
import { useEffect, useState } from 'react';

interface VideoCardProps {
  video: Video;
  isPremium?: boolean;
  userLoggedIn?: boolean;
}

export default function VideoCard({ video, isPremium = false, userLoggedIn = false }: VideoCardProps) {
  const { user } = useUserStore();
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasThumbnail = video.thumbnail_url && video.thumbnail_url.length > 0;

  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.id) {
        const hasPremium = await hasActivePremiumSubscription(user.id);
        setHasPremium(hasPremium);
      }
      setLoading(false);
    };

    checkSubscription();
  }, [user?.id]);

  const getContentLink = () => {
    if (!user) return '/auth';
    if (isPremium && !hasPremium) return '/dashboard/subscriptions';
    return `/content/videos/${video.id}`;
  };
  
  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 group">
      {/* Thumbnail or placeholder with play button overlay */}
      <div className="relative aspect-video bg-gray-700/50 overflow-hidden">
        {hasThumbnail ? (
          <img 
            src={video.thumbnail_url as string} 
            alt={video.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <PlayIcon className="h-16 w-16 text-blue-400/70" />
          </div>
        )}
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="bg-blue-500 rounded-full p-4 shadow-lg">
            <PlayIcon className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-2 right-2 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-blue-400">
            PREMIUM
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
            {formatDuration(video.duration)}
          </div>
        )}
      </div>

      {/* Content info */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          <Link href={getContentLink()}>
            {video.title}
          </Link>
        </h3>
        
        {video.description && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{video.description}</p>
        )}
        
        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {new Date(video.created_at).toLocaleDateString()}
          </span>
          
          <Link
            href={getContentLink()}
            className={`text-xs font-medium px-3 py-1 rounded ${
              isPremium && !hasPremium
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            {!user ? 'Sign in' : isPremium && !hasPremium ? 'Unlock' : 'Watch'}
          </Link>
        </div>
      </div>
    </div>
  );
}

// Helper function to format duration in seconds to MM:SS format
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
} 