import React from 'react';
import Image from 'next/image';
import { Button } from '@burnt-labs/ui';

interface Author {
  avatar: string;
  name: string;
}

interface ContentCardProps {
  image: string;
  title: string;
  subtitle?: string;
  actionLabel?: 'Watch' | 'Subscribe' | 'Reminder' | 'Read' | 'Listen';
  onAction?: () => void;
  isPremium?: boolean;
  isComingSoon?: boolean;
  isContinueWatching?: boolean;
  progress?: number; // 0-100
  showPlayIcon?: boolean;
  badge?: string; // e.g. Trending, 4K, etc.
  type?: 'featured' | 'trending' | 'continue';
  author?: Author;
  views?: string;
  timeAgo?: string;
  contentType?: 'video' | 'audio' | 'article';
}

const contentTypeIcons = {
  video: (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
  ),
  audio: (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-2v13" /><circle cx="6" cy="18" r="3" fill="currentColor" /></svg>
  ),
  article: (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} /><line x1="8" y1="8" x2="16" y2="8" strokeWidth={2} /><line x1="8" y1="12" x2="16" y2="12" strokeWidth={2} /><line x1="8" y1="16" x2="12" y2="16" strokeWidth={2} /></svg>
  ),
};

export default function ContentCard({
  image,
  title,
  subtitle,
  actionLabel,
  onAction,
  isPremium = false,
  isComingSoon = false,
  isContinueWatching = false,
  progress,
  showPlayIcon = false,
  badge,
  type = 'trending',
  author,
  views,
  timeAgo,
  contentType = 'video',
}: ContentCardProps) {
  // Featured Banner
  if (type === 'featured') {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-800/80 to-blue-800/80 shadow-lg flex items-end h-72 w-full">
        <Image src={image} alt={title} fill className="object-cover opacity-60" />
        <div className="relative z-10 p-8 flex flex-col max-w-lg">
          <h2 className="text-3xl font-bold mb-2">{title}</h2>
          {author && (
            <div className="flex items-center space-x-2 mb-4">
              <Image src={author.avatar} alt={author.name} width={32} height={32} className="w-8 h-8 rounded-full border-2 border-purple-500" />
              <span className="text-sm text-gray-200">{author.name}{views && ` • ${views}`}{timeAgo && ` • ${timeAgo}`}</span>
            </div>
          )}
          {actionLabel && (
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold w-32" onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      </div>
    );
  }

  // Trending Card
  if (type === 'trending') {
    return (
      <div className="min-w-[320px] bg-gray-900/80 rounded-xl shadow-lg overflow-hidden relative">
        <Image src={image} alt={title} width={320} height={160} className="w-full h-40 object-cover" />
        <div className="p-4">
          <h4 className="text-lg font-semibold mb-1">{title}</h4>
          {author && (
            <div className="flex items-center space-x-2 mb-2">
              <Image src={author.avatar} alt={author.name} width={24} height={24} className="w-6 h-6 rounded-full border-2 border-purple-500" />
              <span className="text-xs text-gray-400">{author.name}</span>
            </div>
          )}
          {actionLabel && (
            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg text-sm" onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
        {badge && (
          <span className="absolute top-4 right-4 bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">{badge}</span>
        )}
      </div>
    );
  }

  // Continue Watching Card
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg min-w-[320px] max-w-xs bg-gray-900/80">
      {/* Card Image */}
      <div className="relative w-full h-40">
        <Image src={image} alt={title} fill className="object-cover" />
        {/* Overlay for dark effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        {/* Content Type Indicator */}
        <div className="absolute top-4 left-4 bg-black/60 rounded-full p-1 flex items-center justify-center">
          {contentType && contentTypeIcons[contentType]}
        </div>
        {/* Play Icon for continue watching */}
        {isContinueWatching && showPlayIcon && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 rounded-full p-2">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}
        {/* Badge (e.g. Trending, 4K) */}
        {badge && (
          <span className="absolute top-4 right-4 bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">{badge}</span>
        )}
      </div>
      {/* Card Content */}
      <div className="absolute left-0 right-0 bottom-0 p-4 z-10">
        <div className="flex items-center mb-1">
          <h4 className="text-lg font-semibold text-white flex items-center">
            {title}
            {isPremium && (
              <span className="ml-2 text-yellow-400" title="Premium">
                <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 3.64L16.18 20 12 16.9 7.82 20 9 12.91l-5-3.64 5.91-.01z" /></svg>
              </span>
            )}
          </h4>
        </div>
        {/* Subtitle or progress/continue watching info */}
        {!isContinueWatching && subtitle && (
          <div className="text-gray-300 text-sm whitespace-pre-line">{subtitle}</div>
        )}
        {/* Progress bar for continue watching */}
        {isContinueWatching && (
          <div className="mt-2">
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div className="h-2 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] rounded-full" style={{ width: `${progress ?? 0}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{/* Current time (optional) */}</span>
              <span>{/* Duration (optional) */}</span>
            </div>
          </div>
        )}
        {/* Action Button */}
        {actionLabel && !isContinueWatching && (
          <div className="mt-3 flex justify-end">
            <Button
              className={`px-5 py-1.5 rounded-full font-semibold text-sm shadow-md ${
                actionLabel === 'Subscribe' ? 'bg-[#8B25FF] hover:bg-[#350FDD]' :
                actionLabel === 'Reminder' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-purple-600 hover:bg-purple-700'
              }`}
              onClick={onAction}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
