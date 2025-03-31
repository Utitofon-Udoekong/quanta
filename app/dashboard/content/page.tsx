"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, VideoCameraIcon, NewspaperIcon, AcademicCapIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { useContent } from '@/app/hooks/use-content';
import { Button } from '@/app/components/ui/button';
import { ContentData } from '@/app/lib/firebase';

export default function ContentPage() {
  const { data: account } = useAbstraxionAccount();
  const [content, setContent] = useState<ContentData[]>([]);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'VIDEO' | 'AUDIO' | 'COURSE'>('all');

  const { 
    isLoading, 
    error, 
    fetchCreatorContent,
    deleteContent: deleteContentById
  } = useContent(account?.bech32Address || '', {
    onError: (error: any) => console.error('Content error:', error)
  });

  useEffect(() => {
    const loadContent = async () => {
      if (!account?.bech32Address) return;
      
      try {
        const data = await fetchCreatorContent(account.bech32Address);
        setContent(data || []);
      } catch (error) {
        // Error is already handled by the hook
      }
    };

    loadContent();
  }, [account?.bech32Address, fetchCreatorContent]);

  const handleDeleteContent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContentById(id);
        // Refresh content list
        if (account?.bech32Address) {
          const data = await fetchCreatorContent(account.bech32Address);
          setContent(data || []);
        }
      } catch (error) {
        // Error is already handled by the hook
      }
    }
  };

  // Filter content based on status and type
  const filteredContent = content.filter(item => {
    const matchesStatus = filter === 'all' || item.status === filter.toUpperCase();
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesStatus && matchesType;
  });

  if (!account?.bech32Address) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to access the content management.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Content Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-gray-400">Create and manage your content</p>
          </div>
          <Link href="/dashboard/create">
            <Button
              className="flex items-center px-4 py-2 rounded-md space-x-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Content</span>
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 mb-8">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Status:</span>
              <div className="flex space-x-2">
                {(['all', 'published', 'draft', 'archived'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      filter === status
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Type:</span>
              <div className="flex space-x-2">
                {(['all', 'VIDEO', 'AUDIO', 'COURSE'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      typeFilter === type
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }`}
                  >
                    {type === 'all' ? 'All Types' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-12 text-center">
            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-200 mb-2">No Content Found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {filter === 'all' && typeFilter === 'all'
                ? "You haven't created any content yet. Start by creating your first piece of content."
                : "No content matches your current filters. Try adjusting your filters to see more content."}
            </p>
            <Link href="/dashboard/create">
              <Button
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-lg shadow-blue-500/20"
              >
                Create New Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-200"
              >
                <div className="relative">
                  <img
                    src={item.thumbnailUrl || 'https://picsum.photos/320/180'}
                    alt={item.title}
                    className="w-full aspect-video object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-black/80 backdrop-blur-sm">
                    {item.type}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${item.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400' :
                        item.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-gray-500/10 text-gray-400'}`}>
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{item.viewCount} views</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-400">{item.purchaseCount} purchases</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/dashboard/content/${item.id}/edit`}>
                        <Button
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-sm"
                        >
                          Edit
                        </Button>
                      </Link>
                      <Button
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm"
                        onClick={() => handleDeleteContent(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 