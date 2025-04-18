// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article, Video, type Audio, Subscription } from '@/app/types';
// import WalletConnect from '@/app/components/wallet/WalletConnect';
import { createClient } from '../utils/supabase/client';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { ChartBarIcon, VideoCameraIcon, NewspaperIcon, AcademicCapIcon, MusicalNoteIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline';
import { Abstraxion } from "@burnt-labs/abstraxion";

type UserProfile = {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  wallet_address?: string;
};

// type Subscription = {
//   id: string;
//   plan_type: string;
//   status: string;
//   start_date: string;
//   end_date: string;
// };

export default function Dashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [contentStats, setContentStats] = useState({
    articles: 0,
    videos: 0,
    audio: 0,
    totalViews: 0,
    totalEarnings: 0
  });
  const [recentContent, setRecentContent] = useState<{
    articles: Article[];
    videos: Video[];
    audio: Audio[];
  }>({
    articles: [],
    videos: [],
    audio: []
  });
  const [loading, setLoading] = useState(true);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  
  const supabase = createClient()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current user from Supabase auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }
        
        // Set profile from auth user data
        setProfile({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.display_name,
          avatar_url: user.user_metadata?.avatar_url,
          wallet_address: user.user_metadata?.wallet_address
        });
        
        // Only fetch content if wallet is connected
        if (account?.bech32Address) {
          // Update user's wallet address if not set
          if (!user.user_metadata?.wallet_address) {
            await supabase.auth.updateUser({
              data: { wallet_address: account.bech32Address, }
            });
            setProfile(prev => prev ? { ...prev, wallet_address: account.bech32Address } : null);
          }
          
          // Fetch subscription data using user ID
          const { data: subscriptionData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          setSubscription(subscriptionData || null);
          
          // Get content counts and stats using user ID
          const [articlesRes, videosRes, audioRes, viewsRes, earningsRes] = await Promise.all([
            supabase.from('articles').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('videos').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('audio').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('content_usage').select('*', { count: 'exact', head: true }).eq('content.user_id', user.id),
            supabase.from('payments').select('amount').eq('to_user_id', user.id).eq('status', 'COMPLETED')
          ]);
          
          const totalEarnings = earningsRes.data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
          
          setContentStats({
            articles: articlesRes.count || 0,
            videos: videosRes.count || 0,
            audio: audioRes.count || 0,
            totalViews: viewsRes.count || 0,
            totalEarnings
          });
          
          // Get recent content using user ID
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
          
          setRecentContent({
            articles: recentArticlesRes.data || [],
            videos: recentVideosRes.data || [],
            audio: recentAudioRes.data || []
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, account?.bech32Address]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Please sign in to view your dashboard</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Sign in to access your content, earnings, and analytics.
        </p>
      </div>
    );
  }

  // Show wallet connection prompt if not connected
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
          Connect your wallet to create and manage content, track earnings, and access premium features.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
        <Abstraxion onClose={() => setShowModal(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
    <div className="py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">Connected Wallet:</span>
            <span className="text-sm font-mono bg-gray-800/50 px-3 py-1 rounded">
              {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
            </span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Content</p>
                <h3 className="text-2xl font-bold">{contentStats.articles + contentStats.videos + contentStats.audio}</h3>
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
                <h3 className="text-2xl font-bold">{contentStats.totalViews.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <h3 className="text-2xl font-bold">${contentStats.totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Subscription</p>
                <h3 className="text-2xl font-bold">{subscription ? subscription.plan_type : 'None'}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Articles</h3>
              <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                <NewspaperIcon className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-4">{contentStats.articles}</p>
            <Link 
              href="/dashboard/content/articles" 
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Manage Articles
            </Link>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Videos</h3>
              <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                <VideoCameraIcon className="w-4 h-4 text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-4">{contentStats.videos}</p>
            <Link 
              href="/dashboard/content/videos" 
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Manage Videos
            </Link>
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Audio</h3>
              <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-4">{contentStats.audio}</p>
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
                href="/dashboard/articles" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                View All
              </Link>
            </div>
            
            {recentContent.articles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentContent.articles.map((article) => (
                  <div key={article.id} className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200">
                    <div className="p-4">
                      <h4 className="font-bold mb-2 text-white">{article.title}</h4>
                      <p className="text-gray-400 text-sm mb-3">
                        {new Date(article.created_at).toLocaleDateString()}
                      </p>
                      <Link 
                        href={`/dashboard/articles/${article.id}`}
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
                href="/dashboard/videos" 
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                View All
              </Link>
            </div>
            
            {recentContent.videos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentContent.videos.map((video) => (
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
                        href={`/dashboard/videos/${video.id}`}
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
                href="/dashboard/audio" 
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All
              </Link>
            </div>
            
            {recentContent.audio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentContent.audio.map((audioItem) => (
                  <div key={audioItem.id} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200">
                    <h4 className="font-bold mb-2 text-white">{audioItem.title}</h4>
                    <p className="text-gray-400 text-sm mb-3">
                      {new Date(audioItem.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex justify-between items-center">
                      <Link 
                        href={`/dashboard/audio/${audioItem.id}`}
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
                        {new Audio(audioItem.audio_url).paused ? <PlayIcon className="h-5 w-5 text-purple-400" /> : <PauseIcon className="h-5 w-5 text-purple-400" />}
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
        
        {/* Create New Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">Create New Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard/articles/new" 
              className="block p-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Article
            </Link>
            <Link 
              href="/dashboard/videos/new" 
              className="block p-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Video
            </Link>
            <Link 
              href="/dashboard/audio/new" 
              className="block p-4 bg-purple-600 text-white text-center rounded-lg hover:bg-purple-700 transition-colors"
            >
              Upload Audio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 