import Link from 'next/link';
import { Article } from '@/app/types';
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ArticleCardProps {
  article: Article;
  isPremium?: boolean;
  userLoggedIn?: boolean;
}

export default function ArticleCard({ article, isPremium = false, userLoggedIn = false }: ArticleCardProps) {
  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = article.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  
  return (
    <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/5">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail or placeholder */}
        <div className="relative md:w-1/3 h-48 md:h-auto bg-gray-700/50">
          {article.thumbnail_url ? (
            <img 
              src={article.thumbnail_url} 
              alt={article.title} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/10 to-teal-500/10">
              <DocumentTextIcon className="h-12 w-12 text-blue-400/70" />
            </div>
          )}

          {/* Premium badge */}
          {isPremium && (
            <div className="absolute top-2 right-2 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-blue-400">
              PREMIUM
            </div>
          )}
        </div>

        {/* Content info */}
        <div className="p-4 md:p-5 flex flex-col justify-between w-full">
          <div>
            <h3 className="font-semibold text-lg text-white hover:text-blue-400 transition-colors">
              <Link href={userLoggedIn ? `/content/article/${article.id}` : '/auth'}>
                {article.title}
              </Link>
            </h3>
            {article.excerpt && (
              <p className="mt-2 text-sm text-gray-400 line-clamp-2">{article.excerpt}</p>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{readingTime} min read</span>
              <span className="mx-2">•</span>
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
            
            {!userLoggedIn && isPremium ? (
              <Link
                href="/auth"
                className="text-xs font-medium px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
              >
                Sign in
              </Link>
            ) : (
              <Link
                href={`/content/article/${article.id}`}
                className={`text-xs font-medium px-3 py-1 rounded ${
                  isPremium
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {isPremium ? 'Unlock' : 'Read'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 