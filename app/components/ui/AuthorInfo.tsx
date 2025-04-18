'use client';

import { formatDistanceToNow } from 'date-fns';

type AuthorInfoProps = {
  author?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  createdAt: string;
  showDate?: boolean;
  className?: string;
};

export default function AuthorInfo({ author, createdAt, showDate = true, className = '' }: AuthorInfoProps) {
  if (!author) return null;

  const authorName = author.full_name;
  const authorAvatar = author.avatar_url;

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {authorAvatar && (
        <div className="relative h-10 w-10 rounded-full overflow-hidden">
          <img
            src={authorAvatar}
            alt={authorName}
            className="object-cover w-full h-full"
          />
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-200">
          {authorName}
        </span>
        {showDate && (
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}