'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/app/utils/supabase/client';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { Content } from '@/app/types';
import Cookies from 'js-cookie';
import { cookieName } from '@/app/utils/supabase';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/components/helpers/toast';
import ContentCard from '@/app/components/ui/ContentCard';
import ContentTable from '@/app/components/ui/dashboard/ContentTable';

const categories = [
  { id: 'all', name: 'All Content' },
  { id: 'video', name: 'Videos' },
  { id: 'audio', name: 'Audio' },
  { id: 'article', name: 'Articles' },
];

export default function ContentManagement() {
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { data: account } = useAbstraxionAccount();
  const { user } = useUserStore();
  const supabase = getSupabase(Cookies.get(cookieName) || '');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchContent = async () => {
      if (!account?.bech32Address || !user) return;
      setLoading(true);
      try {
        // Fetch all content for the user
        const [videosData, audioData, articlesData] = await Promise.all([
          supabase.from('videos').select('*').eq('user_id', user.id),
          supabase.from('audio').select('*').eq('user_id', user.id),
          supabase.from('articles').select('*').eq('user_id', user.id),
        ]);

        const combined = [
          ...(videosData.data || []).map(v => ({ ...v, kind: 'video', published: v.published ?? false, is_premium: v.is_premium ?? false })),
          ...(audioData.data || []).map(a => ({ ...a, kind: 'audio', published: a.published ?? false, is_premium: a.is_premium ?? false })),
          ...(articlesData.data || []).map(article => ({ ...article, kind: 'article', published: article.published ?? false, is_premium: article.is_premium ?? false })),
        ];

        // Fetch views for all content
        const contentIds = combined.map(item => item.id);
        const { data: viewsData } = await supabase
          .from('content_views')
          .select('content_id, content_type, count')
          .in('content_id', contentIds);

        // Map content_id to view count
        const viewsMap: Record<string, number> = {};
        (viewsData || []).forEach(row => {
          if (row.content_id) {
            viewsMap[row.content_id] = row.count || 0;
          }
        });

        // Attach views to content
        const withViews = combined.map(item => ({
          ...item,
          views: viewsMap[item.id] || 0,
        }));
        setAllContent(withViews);
      } catch (e) {
        toast.error('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [account?.bech32Address, user]);

  const handleDelete = async (id: string, kind: string) => {
    if (!user) {
      toast.error('Please sign in to delete content');
      return;
    }

    try {
      const response = await fetch(`/api/content/${kind}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${kind}`);
      }

      setAllContent(allContent.filter(content => content.id !== id));
      toast.success(`${kind.charAt(0).toUpperCase() + kind.slice(1)} deleted successfully`, { className: 'bg-green-500' });
    } catch (err: any) {
      toast.error(err.message || `Failed to delete ${kind}`);
      console.error(err);
    }
  };

  // Filter content by search and category
  const filteredContent = allContent.filter(item => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      getDescription(item).toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === 'all' ? true : item.kind === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper to get description/excerpt/content for cards
  function getDescription(item: any) {
    if ('description' in item && item.description) return item.description;
    if ('excerpt' in item && item.excerpt) return item.excerpt;
    if ('content' in item && item.content) return item.content;
    return 'No description';
  }

  const getContentTypeColor = (kind: string) => {
    switch (kind) {
      case 'video':
        return 'green';
      case 'audio':
        return 'purple';
      case 'article':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getContentTypeIcon = (kind: string) => {
    switch (kind) {
      case 'video':
        return 'material-symbols:video-library';
      case 'audio':
        return 'material-symbols:audio-file';
      case 'article':
        return 'material-symbols:article';
      default:
        return 'material-symbols:description';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!account?.bech32Address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Icon icon="mdi:wallet" className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to manage your content and view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex space-x-2 w-full overflow-x-auto mb-6 border-b border-gray-800 scrollbar-thin scrollbar-thumb-gray-700">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 font-medium rounded-t-lg transition-colors whitespace-nowrap
              ${activeCategory === cat.id
                  ? 'text-white bg-[#8B25FF] shadow font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-[#181A20]'}
            `}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <Link href="/dashboard/content/create" className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-colors w-full sm:w-auto">
            Create
        </Link>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex rounded-lg bg-gray-900/40 p-1 space-x-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center py-1.5 px-3 text-sm font-medium rounded-md transition-colors
              ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
          >
            <Icon icon="material-symbols:grid-view" className="h-4 w-4 mr-1" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center py-1.5 px-3 text-sm font-medium rounded-md transition-colors
              ${viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}
          >
            <Icon icon="material-symbols:table-chart" className="h-4 w-4 mr-1" />
            Table
          </button>
        </div>
      </div>

      {/* Content Display */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center text-white">
            Your Content
          </h3>
        </div>
        {filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
              <Icon icon="mdi:file-plus" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Content Yet</h3>
            <p className="text-gray-400 mb-6">Create your first piece of content to get started.</p>
            <Link href="/dashboard/content/create">
              <button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] hover:from-[#7A1FEF] hover:to-[#2A0BC7] text-white px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center font-semibold shadow-lg">
                <Icon icon="mdi:plus" className="w-5 h-5 mr-2" />
                Create Content
              </button>
            </Link>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {filteredContent.map((content) => (
              <Link key={content.id} href={`/dashboard/content/${content.id}?kind=${content.kind}`} className="block group">
                  <ContentCard
                    image={content.thumbnail_url || '/images/default-thumbnail.png'}
                    title={content.title}
                    subtitle={content.views ? `${content.views} views` : ''}
                    actionLabel={content.kind === 'video' ? 'Watch' : content.kind === 'audio' ? 'Listen' : 'Read'}
                    author={content.author ? {
                      name: content.author.username || content.author.wallet_address?.slice(0, 8) || 'Unknown',
                      avatar: content.author.avatar_url || 'https://robohash.org/206',
                    } : undefined}
                    contentType={content.kind}
                  />
              </Link>
            ))}
          </div>
        ) : (
          <ContentTable 
            content={filteredContent} 
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
} 