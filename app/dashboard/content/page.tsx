'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SearchInput from '@/app/components/ui/SearchInput';
import { getSupabase } from '@/app/utils/supabase';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { Content } from '@/app/types';

const categories = [
  { id: 'movie', name: 'Movie' },
  { id: 'course', name: 'Course' },
  { id: 'podcast', name: 'Podcast' },
  { id: 'audio', name: 'Audio' },
  { id: 'music', name: 'Music' },
  { id: 'comedy', name: 'Comedy' },
];

export default function ContentManagement() {
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const supabase = getSupabase();
  const { user, error: userError } = useUserStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('course');

  useEffect(() => {
    const fetchContent = async () => {
      if (!account?.bech32Address || !user) return;
      setLoading(true);
      try {
        // Fetch all content for the user
        const [videosData, audioData] = await Promise.all([
          supabase.from('videos').select('*').eq('user_id', user.id),
          supabase.from('audio').select('*').eq('user_id', user.id),
        ]);
        const combined = [
          ...(videosData.data || []).map(v => ({ ...v, kind: 'video' })),
          ...(audioData.data || []).map(a => ({ ...a, kind: 'audio' })),
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

  // Filter content by search and category
  const filteredContent = allContent.filter(item => {
    const matchesSearch =
      !search ||
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      getDescription(item).toLowerCase().includes(search.toLowerCase());
    // For demo, just filter by kind for category
    const matchesCategory =
      activeCategory === 'course' ? true : item.kind === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Helper to get description/excerpt/content for cards
  function getDescription(item: any) {
    if ('description' in item && item.description) return item.description;
    if ('excerpt' in item && item.excerpt) return item.excerpt;
    if ('content' in item && item.content) return item.content;
    return 'No description';
  }

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
          <h1 className="text-2xl font-bold">Welcome back, {user?.username || 'User'}</h1>
          <p className="text-gray-400 text-sm">Manage your post and view all post activities</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search music, artist, albums..."
            className="flex-1 md:w-72"
          />
          <Link href="/dashboard/content/create">
            <button className="bg-[#8B25FF] hover:bg-[#350FDD] text-white px-6 py-2 rounded-full font-semibold shadow-lg transition-colors">
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
      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center flex-1 min-h-[300px]">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] text-gray-400">
          <Icon icon="mdi:folder-open" className="w-16 h-16 mb-4" />
          <p>No content found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((item, idx) => (
            <div
              key={item.id}
              className="bg-[#181A20] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow group cursor-pointer"
            >
              <div className="relative h-48 w-full overflow-hidden">
                <img
                  src={item.thumbnail_url || '/images/default-thumbnail.png'}
                  alt={item.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-4">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 