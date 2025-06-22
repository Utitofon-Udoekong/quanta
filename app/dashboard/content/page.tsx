'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchInput from '@/app/components/ui/SearchInput';
import { getSupabase } from '@/app/utils/supabase/client';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { Content } from '@/app/types';
import Cookies from 'js-cookie';
import { cookieName } from '@/app/utils/supabase';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/components/helpers/toast';

const categories = [
  { id: 'all', name: 'All Content' },
  { id: 'video', name: 'Videos' },
  { id: 'audio', name: 'Audio' },
  { id: 'article', name: 'Articles' },
];

export default function ContentManagement() {
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const { data: account } = useAbstraxionAccount();
  const { user } = useUserStore();
  const supabase = getSupabase(Cookies.get(cookieName) || '');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const router = useRouter();

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
          ...(videosData.data || []).map(v => ({ ...v, kind: 'video' })),
          ...(audioData.data || []).map(a => ({ ...a, kind: 'audio' })),
          ...(articlesData.data || []).map(article => ({ ...article, kind: 'article' })),
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
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [account?.bech32Address, user]);

  const handleDelete = async (id: string, kind: string) => {
    if (!user) {
      toast('Please sign in to delete content', { className: 'bg-red-500' });
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
      toast(`${kind.charAt(0).toUpperCase() + kind.slice(1)} deleted successfully`, { className: 'bg-green-500' });
    } catch (err: any) {
      toast(err.message || `Failed to delete ${kind}`, { className: 'bg-red-500' });
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

  return (
    <div className="flex flex-col min-h-screen px-8 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.wallet_address?.slice(0, 8) || 'User'}</h1>
          <p className="text-gray-400 text-sm">Manage your content and view all content activities</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search content, titles, descriptions..."
            className="flex-1 md:w-72"
          />
          <Link href="/dashboard/content/create">
            <button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-colors">
              Create
            </button>
          </Link>
        </div>
      </div>
      
      {/* Category Tabs */}
      <div className="flex space-x-4 overflow-x-auto pb-4 mb-6 border-b border-gray-800">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
              activeCategory === cat.id
                ? 'text-white bg-[#8B25FF] shadow'
                : 'text-gray-400 hover:text-white hover:bg-[#181A20]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex rounded-lg bg-gray-900/40 p-1 space-x-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Icon icon="material-symbols:grid-view" className="h-4 w-4 mr-1" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            <Icon icon="material-symbols:table-chart" className="h-4 w-4 mr-1" />
            Table
          </button>
        </div>
      </div>
      
      {/* Content Display */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[300px]">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] text-gray-400">
          <Icon icon="mdi:folder-open" className="w-16 h-16 mb-4" />
          <p>No content found.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item, idx) => {
            const color = getContentTypeColor(item.kind);
            const icon = getContentTypeIcon(item.kind);
            
            return (
              <Link
                key={item.id}
                href={`/dashboard/content/${item.id}?kind=${item.kind}`}
                className="bg-[#181A20] w-full h-52 relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
              >
                <div className="h-full w-full object-cover overflow-hidden">
                  <img
                    src={item.thumbnail_url || '/images/default-thumbnail.png'}
                    alt={item.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                {/* Content Type Badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 bg-${color}-500/80 backdrop-blur-sm rounded-full flex items-center`}>
                  <Icon icon={icon} className="h-3 w-3 text-white mr-1" />
                  <span className="text-white text-xs font-medium capitalize">
                    {item.kind}
                  </span>
                </div>
                
                <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm">
                  <h3 className="text-lg font-bold mb-1 truncate">{item.title}</h3>
                  <p className="text-gray-400 text-sm mb-2 truncate">
                    {getDescription(item)}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <span>{item.views?.toLocaleString() || 0} views</span>
                    <span>2345K likes</span>
                    <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredContent.map((item) => {
                  const color = getContentTypeColor(item.kind);
                  const icon = getContentTypeIcon(item.kind);
                  
                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={item.thumbnail_url || '/images/default-thumbnail.png'}
                            alt={item.title}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-white">{item.title}</div>
                            <div className="text-sm text-gray-400 truncate max-w-xs">
                              {getDescription(item)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-${color}-400`}>
                          <Icon icon={icon} className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium capitalize">{item.kind}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          item.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {item.views?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/dashboard/content/${item.id}?kind=${item.kind}`)}
                          className="text-purple-400 hover:text-purple-300 mr-4"
                        >
                          <Icon icon="heroicons:eye" className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/content/${item.kind}/${item.id}/edit`)}
                          className="text-purple-400 hover:text-purple-300 mr-4"
                        >
                          <Icon icon="heroicons:pencil" className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.kind)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Icon icon="heroicons:trash" className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 