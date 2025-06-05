import Link from 'next/link';
import { PlayIcon, UserIcon } from '@heroicons/react/24/outline';
import { hasActivePremiumSubscription } from '@/app/utils/subscription';
import { useUserStore } from '@/app/stores/user';
import { useEffect, useState } from 'react';

interface AudioCardProps {
  audio: {
    id: string;
    title: string;
    description?: string;
    audio_url: string;
    thumbnail_url?: string;
    duration?: number;
    created_at: string;
    author?: {
      username?: string;
      wallet_address: string;
      avatar_url?: string;
    };
  };
  isPremium?: boolean;
  userLoggedIn?: boolean;
}

export default function AudioCard({ audio, isPremium = false, userLoggedIn = false }: AudioCardProps) {
  const { user } = useUserStore();
  const [hasPremium, setHasPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const authorName = audio.author?.username || audio.author?.wallet_address || 'Unknown Author';

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
    return `/content/audio/${audio.id}`;
  };

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5 group">
      <div className="flex items-center p-3">
        {/* Author avatar */}
        <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-gray-700/50 border border-gray-600/50">
          {audio.author?.avatar_url ? (
            <img 
              src={audio.author.avatar_url} 
              alt={authorName} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">
                {authorName.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Content info */}
        <div className="ml-4 flex-grow">
          <h3 className="font-semibold text-base text-white group-hover:text-blue-400 transition-colors truncate">
            <Link href={getContentLink()}>
              {audio.title}
            </Link>
          </h3>
          
          {audio.description && (
            <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{audio.description}</p>
          )}
          
          <div className="mt-1 flex items-center text-xs text-gray-400">
            <span>{authorName}</span>
            {audio.duration && (
              <>
                <span className="mx-2">•</span>
                <span>{formatDuration(audio.duration)}</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="ml-4 flex items-center space-x-2">
          {/* Play button */}
          <Link 
            href={getContentLink()}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center hover:bg-blue-500/30 transition-colors"
          >
            <PlayIcon className="h-4 w-4 text-blue-400" />
          </Link>

          {/* Premium badge or action button */}
          {isPremium ? (
            <div className="flex-shrink-0 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
              PREMIUM
            </div>
          ) : (
            <Link
              href={getContentLink()}
              className="flex-shrink-0 text-xs font-medium px-2 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
            >
              Listen
            </Link>
          )}
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