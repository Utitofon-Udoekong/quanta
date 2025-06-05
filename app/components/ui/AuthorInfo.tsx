'use client';

import { UserData } from '@/app/types';
import { formatDistanceToNow } from 'date-fns';

interface AuthorInfoProps {
  author: UserData;
  size?: 'sm' | 'md' | 'lg';
  showAddress?: boolean;
}

export default function AuthorInfo({ author, size = 'md', showAddress = false }: AuthorInfoProps) {
  const authorName = author.username || (author.wallet_address ? author.wallet_address.slice(0, 8) + '...' + author.wallet_address.slice(-4) : 'Anonymous');
  const avatarSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }[size];

  return (
    <div className="flex items-center space-x-2">
      <div className={`${avatarSize} rounded-full overflow-hidden bg-gray-700`}>
        {author.avatar_url ? (
          <img
            src={author.avatar_url}
            alt={authorName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 text-white">
            {authorName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{authorName}</div>
        {showAddress && author.wallet_address && (
          <div className="text-xs text-gray-400">
            {author.wallet_address.slice(0, 8)}...{author.wallet_address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}