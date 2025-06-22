'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Content } from '@/app/types';
import { Button } from '@headlessui/react';
import { useUserStore } from '@/app/stores/user';
import ContentCard from '@/app/components/ui/ContentCard';
import HeroCarousel from '@/app/components/ui/HeroCarousel';
import { Icon } from '@iconify/react';
import { supabase } from '@/app/utils/supabase/client';
import SearchInput from '@/app/components/ui/SearchInput';
import { CarouselItem, getFeaturedCarouselItems } from '@/app/utils/carousel';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function DiscoverPage() {
    const router = useRouter();
    const [featuredContent, setFeaturedContent] = useState<{
        videos: Content[];
        audio: Content[];
        articles: Content[];
    }>({
        videos: [],
        audio: [],
        articles: [],
    });
    const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);

                // Fetch content for carousel and page sections in parallel
                const [carouselData, pageData] = await Promise.all([
                    getFeaturedCarouselItems(supabase),
                    supabase
                        .from('videos')
                        .select(`
                            *,
                            author:users(
                                id,
                                username,
                                wallet_address,
                                avatar_url
                            )
                        `)
                        .eq('published', true)
                        .order('created_at', { ascending: false })
                        .limit(8)
                ]);

                setCarouselItems(carouselData);

                const videos = pageData.data || [];
                setFeaturedContent({
                    videos: videos.map((video: any) => ({
                        ...video,
                        kind: 'video',
                        views: 0, // We'll handle views separately if needed
                    })),
                    audio: [],
                    articles: [],
                });

            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    const handleCarouselItemClick = (item: CarouselItem) => {
        router.push(`/content/${item.id}?kind=${item.contentType}`);
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
            
            {/* Hero Carousel */}
            <div className="pb-8">
                {loading ? (
                    <div className="relative w-full h-72 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden rounded-2xl flex items-center justify-center">
                        <div className="text-white text-lg">Loading featured content...</div>
                    </div>
                ) : (
                    <HeroCarousel 
                        items={carouselItems.length > 0 ? carouselItems : undefined} 
                        onItemClick={handleCarouselItemClick} 
                    />
                )}
            </div>

            {/* Trending Video Section */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Trending Video <span className="text-yellow-400">•</span></h3>
                    <Link href="#" className="text-purple-400 hover:underline">See All</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {featuredContent.videos.slice(0, 4).map((video) => (
                        <Link key={video.id} href={`/content/${video.id}?kind=video`} className="block transition-transform duration-300 hover:scale-105">
                            <ContentCard
                                image={video.thumbnail_url || '/images/default-thumbnail.png'}
                                title={video.title}
                                subtitle={`${(video.author?.username || video.author?.wallet_address?.slice(0, 8) || 'Unknown')} • ${video.views || 0} views`}
                                actionLabel="Watch"
                                author={video.author ? {
                                    name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                                    avatar: video.author.avatar_url || `https://robohash.org/${video.author.id}`,
                                } : undefined}
                                contentType="video"
                            />
                        </Link>
                    ))}
                </div>
            </section>

            {/* Top Rated Section */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Top Rated <span className="text-yellow-400">★</span></h3>
                    <Link href="#" className="text-purple-400 hover:underline">See All</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {featuredContent.videos.slice(4, 8).map((video) => (
                         <Link key={video.id} href={`/content/${video.id}?kind=video`} className="block transition-transform duration-300 hover:scale-105">
                            <ContentCard
                                image={video.thumbnail_url || '/images/default-thumbnail.png'}
                                title={video.title}
                                subtitle={`${(video.author?.username || video.author?.wallet_address?.slice(0, 8) || 'Unknown')} • ${video.views || 0} views`}
                                actionLabel="Watch"
                                author={video.author ? {
                                    name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                                    avatar: video.author.avatar_url || `https://robohash.org/${video.author.id}`,
                                } : undefined}
                                contentType="video"
                            />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}