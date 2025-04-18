'use client';

import { Article } from '@/app/types';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

type ArticleAuthorProps = {
  article: Article;
  showDate?: boolean;
};

export default function ArticleAuthor({ article, showDate = true }: ArticleAuthorProps) {
  if (!article.author) return null;

  const authorName = article.author.user_metadata?.full_name || article.author.email.split('@')[0] || article.author.user_metadata?.wallet_address;
  const authorAvatar = article.author.user_metadata?.avatar_url;

  return (
    <div className="flex items-center space-x-3">
      {authorAvatar && (
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <Image
            src={authorAvatar}
            alt={authorName || 'Author Avatar'}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-200">
          {authorName}
        </span>
        {showDate && (
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
} 