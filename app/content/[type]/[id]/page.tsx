"use client";
import { notFound } from 'next/navigation';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { ContentPlayer } from '@/app/components/content/ContentPlayer';
import { ContentType, Content, Metadata, User } from '@prisma/client';
import { useEffect, useState } from 'react';
import { useUserStore } from '@/app/store/use-user-store';

type ContentWithMetadata = Content & {
  metadata: Metadata;
  creator: User;
};

interface ContentPageProps {
  params: {
    type: string;
    id: string;
  };
}

export default function ContentPage({ params }: ContentPageProps) {
  const { data: account } = useAbstraxionAccount();
  const { user } = useUserStore();
  const [content, setContent] = useState<ContentWithMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isContentLoading, setIsContentLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        if (!user?.walletAddress) {
          setError('Please connect your wallet to view content');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/content/${params.id}?walletAddress=${user.walletAddress}`);
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
  }, [params.id, user?.walletAddress]);

  // Validate content type
  if (!Object.values(ContentType).includes(params.type.toUpperCase() as ContentType)) {
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
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
          {/* Content Header */}
          <div className="relative h-96">
            {isLoading ? (
              <div className="w-full h-full bg-gray-900/50 animate-pulse"></div>
            ) : (
              <img
                src={content?.thumbnail || 'https://picsum.photos/1920/1080'}
                alt={content?.title}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-8 bg-gray-700/50 rounded w-3/4 animate-pulse"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-gray-700/50 rounded-full animate-pulse"></div>
                    <div className="h-4 bg-gray-700/50 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold mb-4">{content?.title}</h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <img
                        src={content?.creator.image || 'https://picsum.photos/32/32'}
                        alt={content?.creator.name || 'Creator'}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-gray-300">{content?.creator.name}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{content?.viewCount} views</span>
                    {content?.price > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-blue-400 font-medium">${content.price}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Content Body */}
          <div className="p-8">
            {isLoading ? (
              <div className="space-y-4">
                <div className="h-4 bg-gray-700/50 rounded w-full animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded w-5/6 animate-pulse"></div>
                <div className="h-4 bg-gray-700/50 rounded w-4/6 animate-pulse"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300">{content?.description}</p>
              </div>
            )}

            {/* Content Player/Viewer */}
            <div className="mt-8">
              <ContentPlayer
                content={content}
                isLoading={isContentLoading}
                onLoad={() => setIsContentLoading(false)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 