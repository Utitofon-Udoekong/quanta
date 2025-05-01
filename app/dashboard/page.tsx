'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Subscription } from '@/app/types';
import { createClient } from '../utils/supabase/client';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Button } from '@burnt-labs/ui';
import { ChartBarIcon, VideoCameraIcon, NewspaperIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useUserStore } from '@/app/stores/user';
import ContentTable, { ContentItem } from '@/app/components/ui/dashboard/ContentTable';
import { useKeplr } from '@/app/providers/KeplrProvider';

type UserProfile = {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  wallet_address?: string;
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
  // const { data: account } = useAbstraxionAccount();
  // const [, setShowModal] = useModal();
  const supabase = createClient()
  const { user, error: userError } = useUserStore();
  const { walletAddress, connectKeplr } = useKeplr();

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
        if (walletAddress) {
          // Update user's wallet address if not set
          if (!user.wallet_address) {
            await supabase.auth.updateUser({
              data: { wallet_address: walletAddress, }
            });
            setProfile(prev => prev ? { ...prev, wallet_address: walletAddress } : null);
          }
          
          // Fetch subscription data using user ID
          // const { data: subscriptionData } = await supabase
          //   .from('subscriptions')
          //   .select('*')
          //   .eq('user_id', user.id)
          //   .eq('status', 'active')
          //   .order('created_at', { ascending: false })
          //   .limit(1)
          //   .single();
            
          // setSubscription(subscriptionData || null);
          
          // Get content counts and stats using user ID
          const [articlesRes, videosRes, audioRes, viewsRes] = await Promise.all([
            supabase.from('articles').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('videos').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('audio').select('id', { count: 'exact' }).eq('user_id', user.id),
            supabase.from('content_views').select('id', { count: 'exact' }).eq('user_id', user.id),
            // supabase.from('payments').select('amount').eq('to_user_id', user.id).eq('status', 'COMPLETED')
          ]);
          
          // const totalEarnings = earningsRes.data?.reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;
          
          setContentStats({
            articles: articlesRes.count || 0,
            videos: videosRes.count || 0,
            audio: audioRes.count || 0,
            totalViews: viewsRes.count || 0,
            totalEarnings: 0
          });
          
          // Get all content using user ID
          const [articlesData, videosData, audioData] = await Promise.all([
            supabase
              .from('articles')
              .select('id, title, created_at, published, is_premium')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('videos')
              .select('id, title, created_at, published, thumbnail_url, duration, is_premium')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            supabase
              .from('audio')
              .select('id, title, created_at, published, duration, is_premium')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
          ]);
          
          // Combine all content with type information
          const combinedContent: ContentItem[] = [
            ...(articlesData.data || []).map(article => ({
              ...article,
              type: 'article' as const,
              is_premium: article.is_premium || false
            })),
            ...(videosData.data || []).map(video => ({
              ...video,
              type: 'video' as const,
              is_premium: video.is_premium || false
            })),
            ...(audioData.data || []).map(audio => ({
              ...audio,
              type: 'audio' as const,
              is_premium: audio.is_premium || false
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
  }, [supabase, walletAddress, user]);
  
  const handleDeleteContent = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      let table = '';
      switch (type) {
        case 'article':
          table = 'articles';
          break;
        case 'video':
          table = 'videos';
          break;
        case 'audio':
          table = 'audio';
          break;
        default:
          return;
      }
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh content after deletion
      const fetchDashboardData = async () => {
        // Re-fetch content data
        const [articlesData, videosData, audioData] = await Promise.all([
          supabase
            .from('articles')
            .select('id, title, created_at, published, is_premium')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('videos')
            .select('id, title, created_at, published, thumbnail_url, duration, is_premium')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('audio')
            .select('id, title, created_at, published, duration, is_premium')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
        ]);
        
        // Combine all content with type information
        const combinedContent: ContentItem[] = [
          ...(articlesData.data || []).map(article => ({
            ...article,
            type: 'article' as const,
            is_premium: article.is_premium || false
          })),
          ...(videosData.data || []).map(video => ({
            ...video,
            type: 'video' as const,
            is_premium: video.is_premium || false
          })),
          ...(audioData.data || []).map(audio => ({
            ...audio,
            type: 'audio' as const,
            is_premium: audio.is_premium || false
          }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setAllContent(combinedContent);
      };
      
      fetchDashboardData();
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };
  
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
  if (!walletAddress) {
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
        <Button
          onClick={connectKeplr}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </Button>
        {/* <Abstraxion onClose={() => setShowModal(false)} /> */}
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
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
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
                <h3 className="text-2xl font-bold">{subscription ? subscription.plan?.name : 'None'}</h3>
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
          <div className="flex justify-between items-center p-6 border-gray-700/50">
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Content
              </Link>
              </div>
            ) : (
            <ContentTable 
              content={allContent} 
              onDelete={handleDeleteContent}
            />
          )}
        </div>
        
        
      </div>
    </div>
  );
} 