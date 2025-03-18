"use client";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { ContentGrid } from '@/app/components/content/ContentGrid';
import { prisma } from '@/app/lib/db/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { data: account } = useAbstraxionAccount();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/content');
        const data = await response.json();
        setContent(data.content);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    if (account?.bech32Address) {
      fetchContent();
    }
  }, [account?.bech32Address]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Available Content</h1>
      </div>
      <ContentGrid initialContent={content} />
    </div>
  );
} 