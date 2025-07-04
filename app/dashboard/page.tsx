'use client';
import { useEffect, useState, useMemo } from 'react';
import { Content, Subscription, UserData } from '@/app/types';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';
import { supabase } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { 
  getSubscriptionAnalytics, 
  getCreatorSubscribers, 
} from '@/app/utils/subscription-api';
import { SubscriptionStats, SubscriberWithUserInfo } from '@/app/types';

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
  const [subscriptionStats, setSubscriptionStats] = useState<SubscriptionStats | null>(null);
  const [recentSubscribers, setRecentSubscribers] = useState<SubscriberWithUserInfo[]>([]);
  const [viewsData, setViewsData] = useState<Array<{day: string, views: number}>>([]);
  const { user, error: userError } = useUserStore();
  const router = useRouter();

  // Generate stats from real subscription data
  const stats = useMemo(() => [
    {
      label: 'Total Subscribers',
      value: subscriptionStats?.paidSubscribers.toString() || '0',
      change: '+7.4%',
      icon: 'mdi:account-group',
    },
    {
      label: 'Active Subscriptions',
      value: subscriptionStats?.paidSubscriptions.toString() || '0',
      change: '+3.2%',
      icon: 'mdi:account-check',
    },
    {
      label: 'Total Content Published',
      value: (contentStats.articles + contentStats.videos + contentStats.audio).toString(),
      change: '+2.1%',
      icon: 'mdi:file-document-multiple',
    },
  ], [subscriptionStats, contentStats]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        if (userError || !user) {
          if (userError) {
          // console.error('Error fetching user:', userError);
          }
          return;
        }

        setProfile({
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          wallet_address: user.wallet_address
        });
        
        if (user.wallet_address) {
          if (!user.wallet_address) {
            await supabase.auth.updateUser({
              data: { wallet_address: user.wallet_address }
            });
            setProfile(prev => prev ? { ...prev, wallet_address: user.wallet_address } : null);
          }
          
          // Fetch subscription analytics
          // console.log('Fetching analytics for wallet:', user.wallet_address);
          const analytics = await getSubscriptionAnalytics(user.wallet_address);
          // console.log('Analytics response:', analytics);
          setSubscriptionStats(analytics);
          
          // Fetch recent subscribers
          // console.log('Fetching subscribers for wallet:', user.wallet_address);
          const subscribers = await getCreatorSubscribers(user.wallet_address);
          // console.log('Subscribers response:', subscribers);
          setRecentSubscribers(subscribers.slice(0, 5)); // Show only 5 most recent
          
          // Fetch subscription data (old schema - keeping for compatibility)
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

          // Check for errors in content queries
          if (articlesRes.error) {
            // console.error('Error fetching articles:', articlesRes.error);
          }
          if (videosRes.error) {
            // console.error('Error fetching videos:', videosRes.error);
          }
          if (audioRes.error) {
            // console.error('Error fetching audio:', audioRes.error);
          }

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
          let totalViews = 0;
          if (contentIds.length > 0) {
            const { count } = await supabase
            .from('content_views')
            .select('id', { count: 'exact' })
              .in('content_id', contentIds);
            totalViews = count || 0;
          }

          // Get views data for the last 30 days
          let viewsData: Array<{day: string, views: number}> = [];
          if (contentIds.length > 0) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: viewsDataRaw, error: viewsError } = await supabase
              .from('content_views')
              .select('viewed_at')
              .in('content_id', contentIds)
              .gte('viewed_at', thirtyDaysAgo.toISOString())
              .order('viewed_at', { ascending: true });

            if (!viewsError && viewsDataRaw) {
              // Group views by day
              const viewsByDay = new Map<string, number>();
              
              // Initialize all 30 days with 0 views
              for (let i = 29; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dayKey = date.toISOString().split('T')[0];
                viewsByDay.set(dayKey, 0);
              }
              
              // Count views for each day
              viewsDataRaw.forEach(view => {
                const dayKey = new Date(view.viewed_at).toISOString().split('T')[0];
                viewsByDay.set(dayKey, (viewsByDay.get(dayKey) || 0) + 1);
              });
              
              // Convert to chart format
              viewsData = Array.from(viewsByDay.entries()).map(([day, views]) => ({
                day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views
              }));
            }
          }

          // If no real data, use empty array
          if (viewsData.length === 0) {
            viewsData = Array.from({ length: 30 }, (_, i) => ({
              day: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              views: 0
            }));
          }

          setViewsData(viewsData);

          setContentStats({
            articles: contentCounts.articles,
            videos: contentCounts.videos,
            audio: contentCounts.audio,
            totalViews: totalViews || 0,
            totalEarnings: analytics?.totalRevenue || 0
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
              is_premium: article.is_premium || false,
              kind: 'article' as const,
              updated_at: article.created_at,
              user_id: user!.id
            })),
            ...(videosData.data || []).map(video => ({
              ...video,
              is_premium: video.is_premium || false,
              kind: 'video' as const,
              updated_at: video.created_at,
              user_id: user!.id
            })),
            ...(audioData.data || []).map(audio => ({
              ...audio,
              is_premium: audio.is_premium || false,
              kind: 'audio' as const,
              updated_at: audio.created_at,
              user_id: user!.id
            }))
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setAllContent(combinedContent);
        }
      } catch (error) {
        // console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.wallet_address]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalViews = viewsData.reduce((sum, day) => sum + day.views, 0);

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-[#121418] rounded-xl p-6 flex flex-col gap-3 shadow-lg relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon icon={stat.icon} className="w-6 h-6 text-purple-400" />
                  <span className="font-semibold text-sm text-white">{stat.label}</span>
          </div>
                {/* <button className="text-gray-400 hover:text-white"><Icon  showicon="mdi:dots-vertical" className="w-5 h-5" /></button> */}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-white">{stat.value}</span>
                {/* <span className="text-green-400 text-xs font-semibold bg-green-900/30 rounded-full px-2 py-0.5">{stat.change}</span> */}
              </div>
            </div>
          ))}
          </div>
          
        {/* Overview Card */}
        <div className="bg-[#121418] rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-purple-400">Views This Month</h2>
            <button className="bg-[#181A20] text-gray-300 px-3 py-1 rounded-lg text-sm flex items-center gap-2">
              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} <Icon icon="mdi:chevron-down" className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-bold text-white">{totalViews}</span>
            {/* <span className="text-green-400 text-xs font-semibold bg-green-900/30 rounded-full px-2 py-0.5">{percentChange}</span> */}
          </div>
          {/* Recharts LineChart for daily views */}
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={viewsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B25FF" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#8B25FF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} interval={6} />
                <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
                <CartesianGrid strokeDasharray="3 3" stroke="#23263a" vertical={false} />
                <Tooltip contentStyle={{ background: '#181A20', border: 'none', color: '#fff' }} labelStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="views" stroke="#8B25FF" fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Recent Subscriber Table */}
        <div className="bg-[#121418] rounded-xl shadow-lg overflow-x-auto">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h3 className="text-lg font-bold text-white">Recent Subscribers</h3>
            <button className="text-sm text-gray-400 hover:text-purple-400">See all</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="py-3 px-6 font-semibold">NAME</th>
                  <th className="py-3 px-6 font-semibold">ADDRESS</th>
                  <th className="py-3 px-6 font-semibold">SUBSCRIPTION</th>
                  <th className="py-3 px-6 font-semibold">PAYMENT METHOD</th>
                  <th className="py-3 px-6 font-semibold">AMOUNT</th>
                  <th className="py-3 px-6 font-semibold">DATE</th>
                  <th className="py-3 px-6 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {recentSubscribers.map((sub, i) => (
                  <tr key={i} className="border-b border-gray-800 last:border-b-0 hover:bg-[#181A20] transition-colors">
                    <td className="py-3 px-6 flex items-center gap-3">
                      <img 
                        src={sub.avatar_url || `https://robohash.org/${sub.wallet_address.slice(0, 8)}?set=set4&size=200x200`} 
                        alt={sub.username || 'User'} 
                        className="w-8 h-8 rounded-full border border-gray-700" 
                      />
                      <div>
                        <div className="font-semibold text-white">{sub.username || 'Anonymous'}</div>
                        <div className="text-xs text-gray-400">{sub.wallet_address.slice(0, 8)}...{sub.wallet_address.slice(-6)}</div>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-xs font-mono">{sub.wallet_address.slice(0, 8)}...{sub.wallet_address.slice(-6)}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-900/40 text-purple-400">
                        {sub.subscription_type}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      XION
                    </td>
                    <td className="py-3 px-6">
                      ${sub.subscription_amount || 0}
                    </td>
                    <td className="py-3 px-6">
                      {new Date(sub.subscribed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-6">
                      <span className="bg-green-900/40 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
                {recentSubscribers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 px-6 text-center text-gray-400">
                      No subscribers yet. Start creating content to attract followers!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
              </div>
        </div>
      </div>
    </div>
  );
} 