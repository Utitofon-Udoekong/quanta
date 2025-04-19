'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon,
  ChartBarIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useUserStore } from '@/app/stores/user';

type ContentStats = {
  articles: number;
  videos: number;
  audio: number;
  totalViews: number;
  totalEarnings: number;
  recentContent: {
    articles: any[];
    videos: any[];
    audio: any[];
  };
  categories: any[];
};

type ContentItem = {
  id: string;
  title: string;
  type: 'article' | 'video' | 'audio';
  created_at: string;
  published: boolean;
  views?: number;
  thumbnail_url?: string;
  duration?: number;
};

export default function ContentManagement() {
  const [stats, setStats] = useState<ContentStats>({
    articles: 0,
    videos: 0,
    audio: 0,
    totalViews: 0,
    totalEarnings: 0,
    recentContent: {
      articles: [],
      videos: [],
      audio: []
    },
    categories: []
  });
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const supabase = createClient();
  const { user, error: userError } = useUserStore();

  const fetchContentStats = async () => {
    if (!account?.bech32Address) return;
    
    try {
      setLoading(true);
      
      // Get current user from Supabase auth
      if (userError || !user) {
        setError('Authentication error. Please sign in again.');
        return;
      }
      
      // Fetch content counts and stats
      const [articlesRes, videosRes, audioRes, categoriesRes, viewsRes, earningsRes] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('videos').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('audio').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('categories').select('*'),
        supabase.from('content_views').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('earnings').select('amount').eq('user_id', user.id)
      ]);
      
      const totalEarnings = earningsRes.data?.reduce((sum: number, earning: any) => sum + earning.amount, 0) || 0;
      
      // Get all content
      const [articlesData, videosData, audioData] = await Promise.all([
        supabase
          .from('articles')
          .select('id, title, created_at, published')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('videos')
          .select('id, title, created_at, published, thumbnail_url, duration')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('audio')
          .select('id, title, created_at, published, duration')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);
      
      // Combine all content with type information
      const combinedContent: ContentItem[] = [
        ...(articlesData.data || []).map(article => ({
          ...article,
          type: 'article' as const
        })),
        ...(videosData.data || []).map(video => ({
          ...video,
          type: 'video' as const
        })),
        ...(audioData.data || []).map(audio => ({
          ...audio,
          type: 'audio' as const
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAllContent(combinedContent);
      
      setStats({
        articles: articlesRes.count || 0,
        videos: videosRes.count || 0,
        audio: audioRes.count || 0,
        totalViews: viewsRes.count || 0,
        totalEarnings,
        recentContent: {
          articles: articlesData.data || [],
          videos: videosData.data || [],
          audio: audioData.data || []
        },
        categories: categoriesRes.data || []
      });
    } catch (error) {
      console.error('Error fetching content stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentStats();
  }, [supabase, account?.bech32Address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!account?.bech32Address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to manage your content and view analytics.
        </p>
      </div>
    );
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <DocumentTextIcon className="w-5 h-5 text-blue-400" />;
      case 'video':
        return <VideoCameraIcon className="w-5 h-5 text-green-400" />;
      case 'audio':
        return <MusicalNoteIcon className="w-5 h-5 text-purple-400" />;
      default:
        return null;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'text-blue-400';
      case 'video':
        return 'text-green-400';
      case 'audio':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getContentTypeLink = (item: ContentItem) => {
    switch (item.type) {
      case 'article':
        return `/articles/${item.id}`;
      case 'video':
        return `/videos/${item.id}`;
      case 'audio':
        return `/audio/${item.id}`;
      default:
        return '#';
    }
  };

  const getContentEditLink = (item: ContentItem) => {
    switch (item.type) {
      case 'article':
        return `/dashboard/content/articles/${item.id}`;
      case 'video':
        return `/dashboard/content/videos/${item.id}/edit`;
      case 'audio':
        return `/dashboard/content/audio/${item.id}/edit`;
      default:
        return '#';
    }
  };

  return (
    <>
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Content</p>
              <h3 className="text-2xl font-bold">{stats.articles + stats.videos + stats.audio}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
              <ChartBarIcon className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Views</p>
              <h3 className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</h3>
            </div>
            <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
              <EyeIcon className="w-5 h-5 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Earnings</p>
              <h3 className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</h3>
            </div>
            <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
              <CurrencyDollarIcon className="w-5 h-5 text-purple-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Table */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden mb-8">
        <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-bold">Your Content</h2>
          <div className="flex space-x-3">
            <Link 
              href="/dashboard/content/articles/create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              New Article
            </Link>
            <Link 
              href="/dashboard/content/videos/create" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <VideoCameraIcon className="w-4 h-4 mr-2" />
              New Video
            </Link>
            <Link 
              href="/dashboard/content/audio/create" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <MusicalNoteIcon className="w-4 h-4 mr-2" />
              New Audio
            </Link>
          </div>
        </div>
        
        {allContent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Content Yet</h3>
            <p className="text-gray-400 mb-6">Create your first piece of content to get started.</p>
            <Link 
              href="/dashboard/content/articles/create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Content
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700/30 text-left">
                  <th className="py-3 px-4 font-medium text-gray-400">Type</th>
                  <th className="py-3 px-4 font-medium text-gray-400">Title</th>
                  <th className="py-3 px-4 font-medium text-gray-400">Date</th>
                  <th className="py-3 px-4 font-medium text-gray-400">Status</th>
                  <th className="py-3 px-4 font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allContent.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="border-t border-gray-700/30 hover:bg-gray-700/20">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        {getContentTypeIcon(item.type)}
                        <span className="ml-2 capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.title}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {item.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-3">
                        <Link 
                          href={getContentEditLink(item)}
                          className={`${getContentTypeColor(item.type)} hover:opacity-80 transition-opacity`}
                        >
                          Edit
                        </Link>
                        <Link 
                          href={getContentTypeLink(item)}
                          className="text-gray-400 hover:text-gray-300 transition-colors"
                          target="_blank"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
} 