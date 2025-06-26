import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from "@headlessui/react"
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { checkContentAccess, getSubscriptionStatus } from '@/app/utils/subscription-api';
import Link from 'next/link';
import { Content, AccessInfo, SubscriptionStatus } from '@/app/types';

interface ContentCardProps {
  content: Content;
  badge?: string; // Optional badge for source pages to show differences
}

const contentTypeIcons = {
  video: 'material-symbols:video-library',
  audio: 'material-symbols:audio-file',
  article: 'material-symbols:article',
};

export default function ContentCard({ content, badge }: ContentCardProps) {
  const { user } = useUserStore();
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.id && content.author?.id) {
        const access = await checkContentAccess(
          user.id,
          content.id,
          content.kind,
          content.author.id
        );
        setAccessInfo(access);

        // Get subscription status
        const status = await getSubscriptionStatus(user.id, content.author.id);
        setSubscriptionStatus(status);
      } else if (!user) {
        // For non-authenticated users, only show non-premium content
        setAccessInfo({
          hasAccess: !content.is_premium,
          isPremium: content.is_premium,
          reason: content.is_premium ? 'Authentication required' : undefined
        });
      }
      setLoading(false);
    };

    checkAccess();
  }, [user?.id, content.id, content.author?.id, content.kind, content.is_premium]);

  const getContentLink = () => {
    // if (!user) return '/auth';
    // if (accessInfo?.isPremium && !accessInfo?.hasAccess) {
    //   return `/dashboard/subscriptions?creator=${content.author?.wallet_address}`;
    // }
    return `/content/${content.id}?kind=${content.kind}`;
  };

  const canAccessContent = accessInfo?.hasAccess ?? (!content.is_premium);

  const getActionButton = () => {
    // if (!canAccessContent) {
    //   return (
    //     <Button
    //       className="bg-[#8B25FF] hover:bg-[#350FDD] text-white px-4 py-2 rounded-lg font-semibold"
    //       onClick={(e) => {
    //         e.preventDefault();
    //         e.stopPropagation();
    //       }}
    //     >
    //       <Icon icon="material-symbols:star" className="w-4 h-4 mr-2" />
    //       Subscribe to Access
    //     </Button>
    //   );
    // }

    const actionLabels = {
      video: 'Watch Now',
      audio: 'Listen Now',
      article: 'Read Now',
    };

    return (
      <Button
        className="bg-[#8B25FF] hover:bg-[#350FDD] text-white px-4 py-2 rounded-lg font-semibold flex items-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon
          icon={
            content.kind === 'video' ? 'material-symbols:play-arrow' :
              content.kind === 'audio' ? 'material-symbols:play-arrow' :
                'material-symbols:read-more'
          }
          className="size-4 mr-2"
        />
        {actionLabels[content.kind]}
      </Button>
    );
  };

  const getDurationDisplay = () => {
    if (content.kind === 'article' || !('duration' in content) || !content.duration) return null;

    const minutes = Math.floor(content.duration / 60);
    const seconds = content.duration % 60;

    return (
      <div className="absolute bottom-3 right-3">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
          <Icon icon="material-symbols:access-time" className="w-3 h-3 mr-1" />
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
    );
  };

  const getReadingTime = () => {
    if (content.kind !== 'article' || !content.excerpt) return null;

    const wordCount = content.excerpt.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return (
      <div className="absolute bottom-3 right-3">
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/70 text-white">
          <Icon icon="material-symbols:access-time" className="w-3 h-3 mr-1" />
          {readingTime} min read
        </div>
      </div>
    );
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const contentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - contentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  return (
    <Link href={getContentLink()} className="block">
      <div className="w-full relative bg-gray-900/80 rounded-xl shadow-lg hover:shadow-2xl transition-shadow group overflow-hidden">
        {/* Card Image */}
        <div className="relative w-full h-72">
          <Image
            src={content.thumbnail_url || '/images/default-thumbnail.png'}
            alt={content.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Overlay for dark effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          {/* Content Type Indicator */}
          <div className="absolute top-4 left-4 bg-black/60 rounded-full p-1 flex items-center justify-center">
            <Icon icon={contentTypeIcons[content.kind]} className="w-4 h-4 text-white" />
          </div>

          {/* Premium Badge */}
          {content.is_premium && (
            <div className="absolute top-4 right-4">
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#8B25FF]/90 text-white">
                <Icon icon="material-symbols:star" className="w-3 h-3 mr-1" />
                Premium
              </div>
            </div>
          )}

          {/* Access Control Overlay */}
          {/* {!canAccessContent && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <Icon icon="material-symbols:lock" className="w-8 h-8 text-[#8B25FF] mx-auto mb-1" />
                <p className="text-white font-medium text-sm">Premium</p>
                <p className="text-gray-300 text-xs">Subscribe to unlock</p>
              </div>
            </div>
          )} */}

          {/* Duration/Reading Time */}
          {getDurationDisplay() || getReadingTime()}

          {/* Badge (e.g. Trending, Coming Soon, etc.) */}
          {badge && (
            <span className="absolute top-4 right-4 bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">{badge}</span>
          )}
        </div>

        {/* Card Content */}
        <div className="absolute left-0 right-0 bottom-0 p-4 z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center mb-1">
              <h4 className="text-lg font-semibold text-white flex items-center">
                {content.title}
              </h4>
            </div>

            {/* Subtitle with author and metadata */}
            <div className="text-gray-300 text-sm mb-2">
              {content.author?.username || content.author?.wallet_address?.slice(0, 8) || 'Unknown'}
              {content.views && ` • ${content.views} views`}
              {content.created_at && ` • ${formatTimeAgo(content.created_at)}`}
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-3 flex justify-end">
            {getActionButton()}
          </div>
        </div>
      </div>
    </Link>
  );
}
