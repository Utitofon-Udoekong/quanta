'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon,
  ChartBarIcon,
  EyeIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TagIcon
} from '@heroicons/react/24/outline';

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

export default function ContentManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'articles' | 'videos' | 'audio'>('overview');
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
  const [loading, setLoading] = useState(true);
  const { data: account } = useAbstraxionAccount();
  const supabase = createClient();

  useEffect(() => {
    const fetchContentStats = async () => {
      if (!account?.bech32Address) return;
      
      try {
        setLoading(true);
        
        // Get current user from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
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
        
        // Get recent content
        const [recentArticlesRes, recentVideosRes, recentAudioRes] = await Promise.all([
          supabase
            .from('articles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('videos')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('audio')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)
        ]);
        
        setStats({
          articles: articlesRes.count || 0,
          videos: videosRes.count || 0,
          audio: audioRes.count || 0,
          totalViews: viewsRes.count || 0,
          totalEarnings,
          recentContent: {
            articles: recentArticlesRes.data || [],
            videos: recentVideosRes.data || [],
            audio: recentAudioRes.data || []
          },
          categories: categoriesRes.data || []
        });
      } catch (error) {
        console.error('Error fetching content stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContentStats();
  }, [supabase, account?.bech32Address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!account?.bech32Address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to manage your content and view analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Content Management</h1>
          {/* <div className="flex space-x-4">
            <Link 
              href="/dashboard/content/articles/create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              New Article
            </Link>
            <Link 
              href="/dashboard/content/videos/create" 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              New Video
            </Link>
            <Link 
              href="/dashboard/content/audio/create" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              New Audio
            </Link>
          </div> */}
        </div>
        
        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-gray-700/50">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('articles')}
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'articles'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Articles
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'videos'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Videos
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`pb-4 px-1 font-medium text-sm ${
                activeTab === 'audio'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Audio
            </button>
          </div>
        </div>
        
        {/* Content Stats - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Categories</p>
                <h3 className="text-2xl font-bold">{stats.categories.length}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <TagIcon className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Content Type Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Articles</h3>
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <DocumentTextIcon className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-4">{stats.articles}</p>
                <Link 
                  href="/dashboard/content/articles" 
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Manage Articles
                </Link>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Videos</h3>
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <VideoCameraIcon className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-4">{stats.videos}</p>
                <Link 
                  href="/dashboard/content/videos" 
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  Manage Videos
                </Link>
              </div>
              
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Audio</h3>
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <MusicalNoteIcon className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-4">{stats.audio}</p>
                <Link 
                  href="/dashboard/content/audio" 
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Manage Audio
                </Link>
              </div>
            </div>
            
            {/* Recent Content */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6">Recent Content</h2>
              
              {/* Recent Articles */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Articles</h3>
                  <Link 
                    href="/dashboard/content/articles" 
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                
                {stats.recentContent.articles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.recentContent.articles.map((article) => (
                      <div key={article.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200">
                        <div className="p-4">
                          <h4 className="font-bold mb-2 text-white">{article.title}</h4>
                          <p className="text-gray-400 text-sm mb-3">
                            {new Date(article.created_at).toLocaleDateString()}
                          </p>
                          <Link 
                            href={`/dashboard/content/articles/${article.id}/edit`}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Edit Article
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                    <p className="text-gray-400">No articles yet. Create your first one!</p>
                  </div>
                )}
              </div>
              
              {/* Recent Videos */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Videos</h3>
                  <Link 
                    href="/dashboard/content/videos" 
                    className="text-green-400 hover:text-green-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                
                {stats.recentContent.videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.recentContent.videos.map((video) => (
                      <div key={video.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-green-500/50 transition-all duration-200">
                        {video.thumbnail_url && (
                          <div className="h-40 overflow-hidden">
                            <img 
                              src={video.thumbnail_url} 
                              alt={video.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="font-bold mb-2 text-white">{video.title}</h4>
                          <p className="text-gray-400 text-sm mb-3">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <Link 
                            href={`/dashboard/content/videos/${video.id}/edit`}
                            className="text-green-400 hover:text-green-300 transition-colors"
                          >
                            Edit Video
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                    <p className="text-gray-400">No videos yet. Upload your first one!</p>
                  </div>
                )}
              </div>
              
              {/* Recent Audio */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Audio</h3>
                  <Link 
                    href="/dashboard/content/audio" 
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View All
                  </Link>
                </div>
                
                {stats.recentContent.audio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.recentContent.audio.map((audioItem) => (
                      <div key={audioItem.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200">
                        <h4 className="font-bold mb-2 text-white">{audioItem.title}</h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {new Date(audioItem.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex justify-between items-center">
                          <Link 
                            href={`/dashboard/content/audio/${audioItem.id}/edit`}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Edit Audio
                          </Link>
                          {audioItem.audio_url && (
                            <button 
                              className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
                              onClick={() => {
                                const audio = new Audio(audioItem.audio_url);
                                console.log('Audio:', audio.paused);
                                if (audio.paused) {
                                  audio.play();
                                } else {
                                  audio.pause();
                                }
                              }}
                            >
                              <MusicalNoteIcon className="size-5 text-purple-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                    <p className="text-gray-400">No audio yet. Upload your first one!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'articles' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Articles</h2>
              <Link 
                href="/dashboard/content/articles/create" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Article
              </Link>
            </div>
            
            {stats.recentContent.articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.recentContent.articles.map((article) => (
                  <div key={article.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200">
                    <div className="p-4">
                      <h4 className="font-bold mb-2 text-white">{article.title}</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between items-center">
                        <Link 
                          href={`/dashboard/content/articles/${article.id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          View Article
                        </Link>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          article.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {article.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                <p className="text-gray-400">No articles yet. Create your first one!</p>
                <Link 
                  href="/dashboard/content/articles/create" 
                  className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create New Article
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'videos' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Videos</h2>
              <Link 
                href="/dashboard/content/videos/create" 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Video
              </Link>
            </div>
            
            {stats.recentContent.videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.recentContent.videos.map((video) => (
                  <div key={video.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-green-500/50 transition-all duration-200">
                    {video.thumbnail_url && (
                      <div className="h-40 overflow-hidden">
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-bold mb-2 text-white">{video.title}</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex justify-between items-center">
                        <Link 
                          href={`/dashboard/content/videos/${video.id}`}
                          className="text-green-400 hover:text-green-300 transition-colors"
                        >
                          View Video
                        </Link>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          video.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {video.published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                <p className="text-gray-400">No videos yet. Upload your first one!</p>
                <Link 
                  href="/dashboard/content/videos/create" 
                  className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create New Video
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'audio' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Audio</h2>
              <Link 
                href="/dashboard/content/audio/create" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Create New Audio
              </Link>
            </div>
            
            {stats.recentContent.audio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.recentContent.audio.map((audioItem) => (
                  <div key={audioItem.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200">
                    <h4 className="font-bold mb-2 text-white">{audioItem.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">
                      {new Date(audioItem.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/dashboard/content/audio/${audioItem.id}`}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View Audio
                      </Link>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          audioItem.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {audioItem.published ? 'Published' : 'Draft'}
                        </span>
                        {audioItem.audio_url && (
                          <button 
                            className="p-2 rounded-full bg-gray-700/50 hover:bg-gray-700 transition-colors"
                            onClick={() => {
                              const audio = new Audio(audioItem.audio_url);
                              console.log('Audio:', audio.paused);
                              if (audio.paused) {
                                audio.play();
                              } else {
                                audio.pause();
                              }
                            }}
                          >
                            <MusicalNoteIcon className="size-5 text-purple-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 text-center">
                <p className="text-gray-400">No audio yet. Upload your first one!</p>
                <Link 
                  href="/dashboard/content/audio/create" 
                  className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create New Audio
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 