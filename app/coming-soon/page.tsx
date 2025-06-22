'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Content } from '@/app/types';
import { Button } from '@headlessui/react';
import { useUserStore } from '@/app/stores/user';
import ContentCard from '@/app/components/ui/ContentCard';
import { Icon } from '@iconify/react';
import { supabase } from '@/app/utils/supabase/client';
import SearchInput from '@/app/components/ui/SearchInput';

export default function ComingSoonPage() {
  const router = useRouter();
  const [featuredVideo, setFeaturedVideo] = useState<Content | null>(null);
  const [freeVideos, setFreeVideos] = useState<Content[]>([]);
  const [premiumVideos, setPremiumVideos] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchComingSoonContent = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select(`
                        *,
            author:users (
                            id,
                            username,
              wallet_address,
                            avatar_url
            )
                    `)
          .eq('published', false)
          .gt('release_date', new Date().toISOString())
          .order('release_date', { ascending: true })
          .limit(9);

        if (error) throw error;

        if (data && data.length > 0) {
          const formattedData = data.map((item: any) => ({
            ...item,
            kind: 'video',
          }));
          
          setFeaturedVideo(formattedData[0]);
          const remainingVideos = formattedData.slice(1);
          
          setFreeVideos(remainingVideos.filter(v => !v.is_premium).slice(0, 4));
          setPremiumVideos(remainingVideos.filter(v => v.is_premium).slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching coming soon content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComingSoonContent();
  }, []);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'TBA';
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="flex-1 flex flex-col relative px-8">
      {/* Top Navigation Bar */}
      <nav className="flex items-center gap-x-4 justify-between bg-transparent py-4 mt-4 mb-8 shadow-lg sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          {['For You', 'TV Shows', 'Watched'].map((tab) => (
              <Link
                  key={tab}
                  href="#"
                  className={`py-2 text-sm transition-colors ${
                      tab === 'For You' ? 'text-white font-medium' : 'text-gray-300 hover:text-white font-light'
            }`}
          >
                  {tab}
              </Link>
          ))}
        </div>
        <div className="flex-1 flex justify-center">
          <SearchInput />
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
            <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
          </button>
          {user && (
            <Button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
          )}
        </div>
      </nav>
      
      {/* Featured Content */}
      <div className="pb-8">
        {loading ? (
          <div className="relative w-full h-80 bg-slate-800 rounded-2xl animate-pulse" />
        ) : featuredVideo ? (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-800/80 to-blue-800/80 shadow-lg flex items-end h-80">
            <Image 
              src={featuredVideo.thumbnail_url || '/images/default-thumbnail.png'} 
              alt={featuredVideo.title}
              fill
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
            <div className="relative z-10 p-8 flex flex-col max-w-lg text-white">
              <div className="flex items-center space-x-3 mb-3">
                <Image 
                  src={featuredVideo.author?.avatar_url || `https://robohash.org/${featuredVideo.author?.id}`} 
                  alt={featuredVideo.author?.username || 'author'}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full border-2 border-purple-500"
                />
                <div>
                  <h3 className="font-semibold text-lg">{featuredVideo.author?.username || 'Anonymous'}</h3>
                  <p className="text-sm text-gray-300">{featuredVideo.title}</p>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-200 mb-4">
                Available {formatDate(featuredVideo.release_date)}
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded-full font-semibold w-fit shadow-lg">
                <Icon icon="mdi:bell-plus-outline" className="w-5 h-5 mr-2 inline" />
                Reminder
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-80 bg-slate-800 rounded-2xl flex items-center justify-center">
            <p className="text-white">No upcoming content found.</p>
        </div>
        )}
      </div>

      {/* Free Video Section */}
      {freeVideos.length > 0 && (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Free Video</h3>
          <Link href="#" className="text-purple-400 hover:underline">See All</Link>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {freeVideos.map((video) => (
            <ContentCard
              key={video.id}
              image={video.thumbnail_url || '/images/default-thumbnail.png'}
              title={video.title}
                subtitle={`Available ${formatDate(video.release_date)}`}
              actionLabel="Reminder"
              author={video.author ? {
                name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                  avatar: video.author.avatar_url || `https://robohash.org/${video.author.id}`,
              } : undefined}
              contentType="video"
            />
          ))}
        </div>
      </section>
      )}

      {/* Premium Video Section */}
      {premiumVideos.length > 0 && (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Premium Video <span className="text-yellow-400">👑</span></h3>
          <Link href="#" className="text-purple-400 hover:underline">See All</Link>
        </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {premiumVideos.map((video) => (
            <ContentCard
                key={video.id}
                image={video.thumbnail_url || '/images/default-thumbnail.png'}
                title={`${video.title} 👑`}
                subtitle={`Available ${formatDate(video.release_date)}`}
              actionLabel="Reminder"
                author={video.author ? {
                  name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                  avatar: video.author.avatar_url || `https://robohash.org/${video.author.id}`,
              } : undefined}
                contentType="video"
            />
          ))}
        </div>
      </section>
      )}
    </div>
  );
}