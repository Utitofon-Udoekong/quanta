"use client";
import { notFound } from 'next/navigation';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { ContentPlayer } from '@/app/components/content/ContentPlayer';
import { ContentType, Content, Metadata, User } from '@prisma/client';
import { useEffect, useState } from 'react';

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
  const { type, id } = params;
  const { data: account } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const [content, setContent] = useState<ContentWithMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/content/${id}`);
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch content');
        }
        
        setContent(result.data);
      } catch (error) {
        console.error('Error fetching content:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch content');
      } finally {
        setLoading(false);
      }
    };

    if (account?.bech32Address) {
      fetchContent();
    }
  }, [account?.bech32Address, id]);

  // Validate content type
  if (!Object.values(ContentType).includes(type.toUpperCase() as ContentType)) {
    notFound();
  }

  if (!account?.bech32Address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Please connect your wallet to view content
          </h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Content not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>
        <p className="text-gray-600 mb-8">{content.description}</p>
        <div className="mb-8">
          <span className="text-sm text-gray-500">
            Created by {content.creator.name}
          </span>
        </div>
        <ContentPlayer
          contentId={content.id}
          type={content.type}
          price={content.price}
          creatorId={content.creatorId}
          contentUrl={content.contentUrl || ''}
          previewUrl={content.previewUrl || ''}
        />
      </div>
    </div>
  );
} 