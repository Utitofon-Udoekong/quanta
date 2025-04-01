"use client";

import { useEffect, useState } from 'react';
import { ContentData } from '@/app/lib/supabase';
import { supabase } from '@/app/lib/supabase';
import { ContentGrid } from '@/app/components/content/ContentGrid';
import { useUserStore } from '@/app/store/use-user-store';

export default function ContentPage() {
  const { user } = useUserStore();
  const [content, setContent] = useState<ContentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('content')
          .select(`
            *,
            creator:creator_id (id, full_name, email)
          `)
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

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
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg aspect-video" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Content</h1>
        <a
          href="/dashboard/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Content
        </a>
      </div>

      {content.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">You haven't created any content yet.</p>
          <a
            href="/dashboard/create"
            className="text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            Create your first piece of content
          </a>
        </div>
      ) : (
        <ContentGrid creatorId={user?.id} />
      )}
    </div>
  );
} 