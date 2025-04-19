// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article, Video, type Audio, Subscription } from '@/app/types';
// import WalletConnect from '@/app/components/wallet/WalletConnect';
import { createClient } from '../utils/supabase/client';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { ChartBarIcon, VideoCameraIcon, NewspaperIcon, AcademicCapIcon, MusicalNoteIcon, PlayIcon, PauseIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Abstraxion } from "@burnt-labs/abstraxion";
import { useUserStore } from '@/app/stores/user';

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
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const supabase = createClient()
  const { user, error: userError } = useUserStore();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current user from Supabase auth
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }
        
        // Set profile from auth user data
        setProfile({
          id: user.id,
          email: user.email || '',
          display_name: user.full_name,
          avatar_url: user.avatar_url,
          wallet_address: user.wallet_address
        });
        
        // Only fetch content if wallet is connected
        if (account?.bech32Address) {
          // Update user's wallet address if not set
          if (!user.wallet_address) {
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
          
          // Get all content using user ID
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <NewspaperIcon className="w-5 h-5 text-blue-400" />;
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
        
        {/* Content Table */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden mb-8">
          <div className="flex justify-between items-center p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-bold">Your Content</h2>
            <div className="flex space-x-3">
              <Link 
                href="/dashboard/content/articles/create" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <NewspaperIcon className="w-4 h-4 mr-2" />
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
                <NewspaperIcon className="w-5 h-5 mr-2" />
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
        
        {/* Create New Content */}
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-xl font-bold mb-4">Create New Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard/content/articles/create" 
              className="block p-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Article
            </Link>
            <Link 
              href="/dashboard/content/videos/create" 
              className="block p-4 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors"
            >
              Upload Video
            </Link>
            <Link 
              href="/dashboard/content/audio/create" 
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