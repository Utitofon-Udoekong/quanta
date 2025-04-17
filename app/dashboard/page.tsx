// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Article, Video, type Audio, Subscription } from '@/app/types';
// import WalletConnect from '@/app/components/wallet/WalletConnect';
import { createClient } from '../utils/supabase/client';

type UserProfile = {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
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
    audio: 0
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
  
  const supabase = createClient()
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) return;
        
        // Fetch user profile
        setProfile({
          id: userData.user.id,
          email: userData.user.email || '',
          display_name: userData.user.user_metadata?.display_name,
          avatar_url: userData.user.user_metadata?.avatar_url
        });
        
        // Fetch subscription data
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', userData.user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        setSubscription(subscriptionData || null);
        
        // Get content counts
        const [articlesRes, videosRes, audioRes] = await Promise.all([
          supabase.from('articles').select('id', { count: 'exact' }).eq('user_id', userData.user.id),
          supabase.from('videos').select('id', { count: 'exact' }).eq('user_id', userData.user.id),
          supabase.from('audio').select('id', { count: 'exact' }).eq('user_id', userData.user.id)
        ]);
        
        setContentStats({
          articles: articlesRes.count || 0,
          videos: videosRes.count || 0,
          audio: audioRes.count || 0
        });
        
        // Get recent content
        const [recentArticlesRes, recentVideosRes, recentAudioRes] = await Promise.all([
          supabase
            .from('articles')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('videos')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(3),
          supabase
            .from('audio')
            .select('*')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(3)
        ]);
        
        setRecentContent({
          articles: recentArticlesRes.data || [],
          videos: recentVideosRes.data || [],
          audio: recentAudioRes.data || []
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [supabase]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Please sign in to view your dashboard</h1>
        <Link 
          href="/login" 
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Profile Section */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <div className="flex items-center mb-4">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.display_name || 'User'} 
                className="w-16 h-16 rounded-full mr-4 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                <span className="text-xl font-bold text-gray-500">
                  {profile.display_name ? profile.display_name[0].toUpperCase() : 'U'}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{profile.display_name || 'User'}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
          <Link 
            href="/profile" 
            className="block w-full text-center py-2 bg-gray-100 hover:bg-gray-200 transition rounded-md"
          >
            Edit Profile
          </Link>
        </div>
        
        {/* Subscription Info */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Subscription</h3>
          {subscription ? (
            <div>
              <p className="mb-2">
                <span className="font-medium">Plan:</span> {subscription.plan_type}
              </p>
              <p className="mb-2">
                <span className="font-medium">Status:</span> {subscription.status}
              </p>
              <p className="mb-4">
                <span className="font-medium">Renewal date:</span> {new Date(subscription.end_date).toLocaleDateString()}
              </p>
              <Link 
                href="/subscription" 
                className="block w-full text-center py-2 bg-gray-100 hover:bg-gray-200 transition rounded-md"
              >
                Manage Subscription
              </Link>
            </div>
          ) : (
            <div>
              <p className="mb-4">You don't have an active subscription.</p>
              <Link 
                href="/pricing" 
                className="block w-full text-center py-2 bg-primary text-white hover:bg-primary-dark transition rounded-md"
              >
                Upgrade Now
              </Link>
            </div>
          )}
        </div>
        
        {/* Wallet Connect */}
        <div className="bg-white rounded-lg shadow p-6 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Wallet</h3>
          {/* <WalletConnect /> */}
        </div>
      </div>
      
      {/* Content Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Your Articles</h3>
          <p className="text-3xl font-bold mb-4">{contentStats.articles}</p>
          <Link 
            href="/dashboard/articles" 
            className="text-primary hover:underline"
          >
            Manage Articles
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Your Videos</h3>
          <p className="text-3xl font-bold mb-4">{contentStats.videos}</p>
          <Link 
            href="/dashboard/videos" 
            className="text-primary hover:underline"
          >
            Manage Videos
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Your Audio</h3>
          <p className="text-3xl font-bold mb-4">{contentStats.audio}</p>
          <Link 
            href="/dashboard/audio" 
            className="text-primary hover:underline"
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
              className="text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          
          {recentContent.articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentContent.articles.map((article) => (
                <div key={article.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* {article. && (
                    <img 
                      src={article.thumbnail_url} 
                      alt={article.title} 
                      className="w-full h-40 object-cover"
                    />
                  )} */}
                  <div className="p-4">
                    <h4 className="font-bold mb-2">{article.title}</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {new Date(article.created_at).toLocaleDateString()}
                    </p>
                    <Link 
                      href={`/dashboard/articles/${article.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit Article
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No articles yet. Create your first one!</p>
          )}
        </div>
        
        {/* Recent Videos */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Videos</h3>
            <Link 
              href="/dashboard/videos" 
              className="text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          
          {recentContent.videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentContent.videos.map((video) => (
                <div key={video.id} className="bg-white rounded-lg shadow overflow-hidden">
                  {video.thumbnail_url && (
                    <img 
                      src={video.thumbnail_url} 
                      alt={video.title} 
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h4 className="font-bold mb-2">{video.title}</h4>
                    <p className="text-gray-600 text-sm mb-3">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                    <Link 
                      href={`/dashboard/videos/${video.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit Video
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No videos yet. Upload your first one!</p>
          )}
        </div>
        
        {/* Recent Audio */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Audio</h3>
            <Link 
              href="/dashboard/audio" 
              className="text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          
          {recentContent.audio.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentContent.audio.map((audioItem) => (
                <div key={audioItem.id} className="bg-white rounded-lg shadow p-4">
                  <h4 className="font-bold mb-2">{audioItem.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {new Date(audioItem.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex justify-between items-center">
                    <Link 
                      href={`/dashboard/audio/${audioItem.id}`}
                      className="text-primary hover:underline"
                    >
                      Edit Audio
                    </Link>
                    {audioItem.audio_url && (
                      <button 
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                        onClick={() => {
                          const audio = new Audio(audioItem.audio_url);
                          audio.play();
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No audio yet. Upload your first one!</p>
          )}
        </div>
      </div>
      
      {/* Create New Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Create New Content</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/dashboard/articles/new" 
            className="block p-4 bg-primary text-white text-center rounded-md hover:bg-primary-dark transition"
          >
            Create Article
          </Link>
          <Link 
            href="/dashboard/videos/new" 
            className="block p-4 bg-primary text-white text-center rounded-md hover:bg-primary-dark transition"
          >
            Upload Video
          </Link>
          <Link 
            href="/dashboard/audio/new" 
            className="block p-4 bg-primary text-white text-center rounded-md hover:bg-primary-dark transition"
          >
            Upload Audio
          </Link>
        </div>
      </div>
    </div>
  );
}


// 'use client';

// import { useEffect, useState } from 'react';
// import { createClient } from '@/app/utils/supabase/client';
// import Link from 'next/link';
// import { Article, Video, Audio } from '../types'; 

// export default function Dashboard() {
//   const [articles, setArticles] = useState<Article[]>([]);
//   const [videos, setVideos] = useState<Video[]>([]);
//   const [audio, setAudio] = useState<Audio[]>([]);
//   const [loading, setLoading] = useState(true);
  
//   const supabase = createClient();
  
//   useEffect(() => {
//     const fetchContent = async () => {
//       try {
//         // Fetch latest articles
//         const { data: articlesData, error: articlesError } = await supabase
//           .from('articles')
//           .select('*')
//           .order('created_at', { ascending: false })
//           .limit(5);
          
//         if (articlesError) throw articlesError;
//         setArticles(articlesData || []);
        
//         // Fetch latest videos
//         const { data: videosData, error: videosError } = await supabase
//           .from('videos')
//           .select('*')
//           .order('created_at', { ascending: false })
//           .limit(5);
          
//         if (videosError) throw videosError;
//         setVideos(videosData || []);
        
//         // Fetch latest audio
//         const { data: audioData, error: audioError } = await supabase
//           .from('audio')
//           .select('*')
//           .order('created_at', { ascending: false })
//           .limit(5);
          
//         if (audioError) throw audioError;
//         setAudio(audioData || []);
//       } catch (error) {
//         console.error('Error fetching content:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchContent();
//   }, [supabase]);
  
//   const ContentSection = ({ title, count, createLink, viewAllLink }: { 
//     title: string; 
//     count: number; 
//     createLink: string; 
//     viewAllLink: string;
//   }) => (
//     <div className="bg-white shadow rounded-lg p-6">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-lg font-medium">{title}</h3>
//         <span className="text-sm bg-indigo-100 text-indigo-800 rounded-full px-3 py-1">
//           {count} items
//         </span>
//       </div>
//       <div className="flex space-x-3 mt-4">
//         <Link
//           href={createLink}
//           className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
//         >
//           Create New
//         </Link>
//         <Link
//           href={viewAllLink}
//           className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
//         >
//           View All
//         </Link>
//       </div>
//     </div>
//   );
  
//   if (loading) {
//     return <div className="p-8 text-center">Loading dashboard data...</div>;
//   }
  
//   return (
//     <div>
//       <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <ContentSection 
//           title="Articles" 
//           count={articles.length} 
//           createLink="/dashboard/articles/create" 
//           viewAllLink="/dashboard/articles" 
//         />
        
//         <ContentSection 
//           title="Videos" 
//           count={videos.length} 
//           createLink="/dashboard/videos/create" 
//           viewAllLink="/dashboard/videos" 
//         />
        
//         <ContentSection 
//           title="Audio" 
//           count={audio.length} 
//           createLink="/dashboard/audio/create" 
//           viewAllLink="/dashboard/audio" 
//         />
//       </div>
      
//       <div className="mt-8">
//         <h2 className="text-xl font-semibold mb-4">Recent Content</h2>
        
//         {articles.length === 0 && videos.length === 0 && audio.length === 0 ? (
//           <div className="bg-white p-6 rounded-lg shadow text-center">
//             <p>You haven't created any content yet. Get started by creating an article, video, or audio file.</p>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             {articles.length > 0 && (
//               <div>
//                 <h3 className="text-lg font-medium mb-3">Recent Articles</h3>
//                 <div className="bg-white shadow overflow-hidden rounded-md">
//                   <ul className="divide-y divide-gray-200">
//                     {articles.map((article) => (
//                       <li key={article.id}>
//                         <Link href={`/dashboard/articles/${article.id}`} className="block hover:bg-gray-50">
//                           <div className="px-4 py-4 sm:px-6">
//                             <div className="flex items-center justify-between">
//                               <p className="text-sm font-medium text-indigo-600 truncate">{article.title}</p>
//                               <div className="ml-2 flex-shrink-0 flex">
//                                 <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                                   {article.published ? 'Published' : 'Draft'}
//                                 </p>
//                               </div>
//                             </div>
//                             <div className="mt-2 sm:flex sm:justify-between">
//                               <div className="sm:flex">
//                                 <p className="flex items-center text-sm text-gray-500">
//                                   {article.excerpt || 'No excerpt available'}
//                                 </p>
//                               </div>
//                               <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
//                                 <p>
//                                   Created: {new Date(article.created_at).toLocaleDateString()}
//                                 </p>
//                               </div>
//                             </div>
//                           </div>
//                         </Link>
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               </div>
//             )}
            
//             {/* Similar lists for videos and audio can be added here */}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }