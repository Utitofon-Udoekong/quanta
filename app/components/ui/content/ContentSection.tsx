import { Article, Video, Audio } from '@/app/types';
import ArticleCard from './ArticleCard';
import VideoCard from './VideoCard';
import AudioCard from './AudioCard';
import Link from 'next/link';

interface ContentSectionProps {
  title: string;
  items: (Video | Audio | Article)[];
  type: 'video' | 'audio' | 'article';
  showMoreLink: string;
  userLoggedIn?: boolean;
}

export default function ContentSection({ 
  title, 
  items, 
  type, 
  showMoreLink,
  userLoggedIn = false
}: ContentSectionProps) {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <Link href={showMoreLink} className="text-blue-400 hover:text-blue-300">
          View All
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center p-8 bg-gray-800/50 rounded-lg text-gray-400">
          No content available
        </div>
      ) : (
        <div className={`
          ${type === 'video' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : ''}
          ${type === 'audio' ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : ''}
          ${type === 'article' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : ''}
        `}>
          {items.map((item) => {
            if (type === 'video') {
              return (
                <VideoCard 
                  key={item.id} 
                  video={item as Video} 
                  isPremium={item.is_premium}
                  userLoggedIn={userLoggedIn}
                />
              );
            } else if (type === 'audio') {
              return (
                <AudioCard 
                  key={item.id} 
                  audio={item as Audio} 
                  isPremium={item.is_premium}
                  userLoggedIn={userLoggedIn}
                />
              );
            } else {
              return (
                <ArticleCard 
                  key={item.id} 
                  article={item as Article} 
                  isPremium={item.is_premium}
                  userLoggedIn={userLoggedIn}
                />
              );
            }
          })}
        </div>
      )}
    </section>
  );
} 