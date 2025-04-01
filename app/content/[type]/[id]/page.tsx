"use client";
import { notFound } from 'next/navigation';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { ContentPlayer } from '@/app/components/content/ContentPlayer';
import { useEffect, useState } from 'react';
import { ContentData } from '@/app/lib/supabase';

interface ContentPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function ContentPage({ params }: ContentPageProps) {
  const { data: account } = useAbstraxionAccount();
  const [content, setContent] = useState<ContentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (!account?.bech32Address) {
          setError('Please connect your wallet to view content');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/content/${params.id}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch content');
        }

        setContent(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [params.id, account?.bech32Address]);

  // Validate content type
  if (!['VIDEO', 'AUDIO'].includes(params.type.toUpperCase())) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Content</h2>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{content.title}</h1>
        <p className="text-gray-600 mb-8">{content.description}</p>
        
        <div className="mb-8">
          <ContentPlayer content={content} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Content Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Type</p>
              <p className="font-medium">{content.type}</p>
            </div>
            <div>
              <p className="text-gray-600">Price</p>
              <p className="font-medium">${content.price}</p>
            </div>
            <div>
              <p className="text-gray-600">Duration</p>
              <p className="font-medium">{content.duration} minutes</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium">{content.status}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 