'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Content, Subscription, UserData } from '@/app/types';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Button } from '@burnt-labs/ui';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import ContentTable from '@/app/components/ui/dashboard/ContentTable';
import { useKeplr } from '@/app/providers/KeplrProvider';
import { getSupabase } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [contentStats, setContentStats] = useState({
    articles: 0,
    videos: 0,
    audio: 0,
    totalViews: 0,
    totalEarnings: 0
  });
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: account } = useAbstraxionAccount();
  const supabase = getSupabase(account.bech32Address);
  const { user, error: userError } = useUserStore();
  const { walletAddress, connectKeplr } = useKeplr();
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }

        setProfile({
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          wallet_address: user.wallet_address
        });
        
        if (walletAddress) {
          if (!user.wallet_address) {
            await supabase.auth.updateUser({
              data: { wallet_address: walletAddress }
            });
            setProfile(prev => prev ? { ...prev, wallet_address: walletAddress } : null);
          }
          
          // Fetch subscription data
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (!subscriptionError) {
            setSubscription(subscriptionData);
          }
          
          // Get content counts and IDs
          const [articlesRes, videosRes, audioRes] = await Promise.all([
            supabase.from('articles').select('id').eq('user_id', user.id),
            supabase.from('videos').select('id').eq('user_id', user.id),
            supabase.from('audio').select('id').eq('user_id', user.id),
          ]);

          const contentCounts = {
            articles: articlesRes.data?.length || 0,
            videos: videosRes.data?.length || 0,
            audio: audioRes.data?.length || 0,
          };

          const contentIds = [
            ...(articlesRes.data?.map(article => article.id) || []),
            ...(videosRes.data?.map(video => video.id) || []),
            ...(audioRes.data?.map(audio => audio.id) || [])
          ];

          // Get total views
          const { count: totalViews } = await supabase
            .from('content_views')
            .select('id', { count: 'exact' })
            .in('content_id', contentIds)
            .neq('viewer_id', user.id);

          setContentStats({
            articles: contentCounts.articles,
            videos: contentCounts.videos,
            audio: contentCounts.audio,
            totalViews: totalViews || 0,
            totalEarnings: 0
          });
          
          // Get all content
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
          
          const combinedContent: Content[] = [
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
      
      const combinedContent: Content[] = [
        ...(articlesData.data || []).map(article => ({
          ...article,
          type: 'article' as const,
          is_premium: article.is_premium || false,
          kind: 'article',
          updated_at: article.created_at,
          user_id: user?.id
        })),
        ...(videosData.data || []).map(video => ({
          ...video,
          type: 'video' as const,
          is_premium: video.is_premium || false,
          kind: 'video',
          updated_at: video.created_at,
          user_id: user?.id
        })),
        ...(audioData.data || []).map(audio => ({
          ...audio,
          type: 'audio' as const,
          is_premium: audio.is_premium || false,
          kind: 'audio',
          updated_at: audio.created_at,
          user_id: user?.id
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setAllContent(combinedContent);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}. Please try again.`);
    }
  };

  const handleCreateContent = (type: 'article' | 'video' | 'audio') => {
    router.push(`/dashboard/content/create?type=${type}`);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Icon icon="mdi:account-lock" className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Please sign in to view your dashboard</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Sign in to access your content, earnings, and analytics.
        </p>
      </div>
    );
  }

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <Icon icon="mdi:wallet" className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to create and manage content, track earnings, and access premium features.
        </p>
        <Button
          onClick={connectKeplr}
          className="px-6 py-3 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white rounded-lg hover:from-[#7A1FEF] hover:to-[#2A0BC7] transition-all duration-200"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Manage your content and track your performance</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          <span className="text-sm text-gray-400">Connected:</span>
          <span className="text-sm font-mono bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700/50">
            {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Content</p>
              <h3 className="text-2xl font-bold text-white">{contentStats.articles + contentStats.videos + contentStats.audio}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Icon icon="mdi:file-multiple" className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Views</p>
              <h3 className="text-2xl font-bold text-white">{contentStats.totalViews.toLocaleString()}</h3>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
              <Icon icon="mdi:eye" className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Total Earnings</p>
              <h3 className="text-2xl font-bold text-white">${contentStats.totalEarnings.toFixed(2)}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
              <Icon icon="mdi:currency-usd" className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Subscription</p>
              <h3 className="text-2xl font-bold">
                {subscription ? (
                  <span className="text-green-400">Active</span>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
              <Icon icon="mdi:crown" className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Management */}
      <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 border-b border-gray-700/50">
          <h2 className="text-xl font-bold text-white mb-4 sm:mb-0">Your Content</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => handleCreateContent('article')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon icon="mdi:file-document" className="w-4 h-4 mr-2" />
              New Article
            </button>
            <button 
              onClick={() => handleCreateContent('video')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon icon="mdi:video" className="w-4 h-4 mr-2" />
              New Video
            </button>
            <button 
              onClick={() => handleCreateContent('audio')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              <Icon icon="mdi:music" className="w-4 h-4 mr-2" />
              New Audio
            </button>
          </div>
        </div>
        
        {allContent.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:file-plus" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No Content Yet</h3>
            <p className="text-gray-400 mb-6">Create your first piece of content to get started.</p>
            <button 
              onClick={() => handleCreateContent('article')}
              className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] hover:from-[#7A1FEF] hover:to-[#2A0BC7] text-white px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center"
            >
              <Icon icon="mdi:plus" className="w-5 h-5 mr-2" />
              Create Content
            </button>
          </div>
        ) : (
          <ContentTable 
            content={allContent} 
            onDelete={handleDeleteContent}
          />
        )}
      </div>
    </>
  );
} 