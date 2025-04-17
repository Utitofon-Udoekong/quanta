import { useEffect, useState } from 'react';
import { ContentData } from '@/app/old/lib/supabase';
import { supabase } from '@/app/old/lib/supabase';
import { ContentCard } from './ContentCard';

interface ContentGridProps {
  type?: string;
  creatorId?: string;
  limit?: number;
}

export function ContentGrid({ type, creatorId, limit = 12 }: ContentGridProps) {
  const [content, setContent] = useState<ContentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let query = supabase
          .from('content')
          .select(`
            *,
            creator:creator_id (id, full_name, email)
          `)
          .eq('status', 'PUBLISHED');

        if (type) {
          query = query.eq('type', type);
        }

        if (creatorId) {
          query = query.eq('creator_id', creatorId);
        }

        const { data, error } = await query
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          throw error;
        }

        setContent(data || []);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError('Failed to fetch content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [type, creatorId, limit]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg aspect-video" />
            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No content found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {content.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
} 