'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Content } from '@/app/types';
import { Button } from '@headlessui/react';
import { useUserStore } from '@/app/stores/user';
import ContentCard from '@/app/components/ui/ContentCard';
import HeroCarousel from '@/app/components/ui/HeroCarousel';
import { Icon } from '@iconify/react';
import { CarouselItem, getFeaturedCarouselItems } from '@/app/utils/carousel';

import { supabase } from './utils/supabase/client';
import SearchInput from './components/ui/SearchInput';
import { useRouter } from 'next/navigation';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function Home() {
    const [searchTerm, setSearchTerm] = useState('');
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
    const router = useRouter();
    // Fetch featured content for carousel
    useEffect(() => {
        const fetchFeaturedContent = async () => {
            try {
                setLoading(true);
                const items = await getFeaturedCarouselItems(supabase);
                setCarouselItems(items);
            } catch (error) {
                console.error('Error fetching featured content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedContent();
    }, []);

    // Handle carousel item click
    const handleCarouselItemClick = (item: CarouselItem) => {
        console.log('Carousel item clicked:', item);
        // Navigate to the content page based on content type
        const contentType = item.contentType;
        const contentId = item.id;
        
        // You can implement navigation here
        // For example: router.push(`/content/${contentType}/${contentId}`);
    };

    return (
        <div className="flex-1 flex flex-col relative px-8">
            {/* Top Navigation Bar */}
            <nav className="flex items-center gap-x-4 justify-between bg-transparent py-4 mt-4 mb-8 shadow-lg sticky top-0 z-10">
                {/* <div className="flex items-center space-x-4">
                    {['For You', 'Tv Shows', 'Watched'].map((tab) => (
                        <Link
                            href={`/dashboard/${tab.toLowerCase().replace(' ', '-')}`}
                            className={`py-2 text-sm transition-colors ${tab === 'For You' ? 'text-white font-medium' : 'text-gray-300 hover:text-white font-light'}`}
                        >
                            {tab}
                        </Link>
                    ))}
                </div> */}
                <div className="flex-1 flex justify-center">
                    <SearchInput />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
                        <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
                    </button>
                    {user && (
                      <Button onClick={() => router.push('/dashboard/content')} className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
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
                <div className="flex space-x-6 overflow-x-auto pb-2">
                    {featuredContent.videos.slice(0, 3).map((video, idx) => (
                        <ContentCard
                            key={video.id}
                            image={video.thumbnail_url || '/images/default-thumbnail.png'}
                            title={video.title}
                            subtitle={
                                (video.author?.username || video.author?.wallet_address?.slice(0, 8) || 'Unknown') +
                                (video.views ? ` - ${video.views} views` : '')
                            }
                            actionLabel="Watch"
                            author={video.author ? {
                                name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                                avatar: video.author.avatar_url || 'https://robohash.org/206',
                            } : undefined}
                            type="trending"
                            contentType="video"
                            badge="Trending"
                        />
                    ))}
                </div>
            </section>

            {/* Continue Watching Section */}
            <section className="mb-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold">Continue Watching</h3>
                    <Link href="#" className="text-purple-400 hover:underline">See All</Link>
                </div>
                <div className="flex space-x-6 overflow-x-auto pb-2">
                    {featuredContent.videos.slice(3, 6).map((video, idx) => (
                        <ContentCard
                            key={video.id}
                            image={video.thumbnail_url || '/images/default-thumbnail.png'}
                            title={video.title}
                            subtitle={
                                (video.author?.username || video.author?.wallet_address?.slice(0, 8) || 'Unknown') +
                                (video.views ? ` - ${video.views} views` : '')
                            }
                            author={video.author ? {
                                name: video.author.username || video.author.wallet_address?.slice(0, 8) || 'Unknown',
                                avatar: video.author.avatar_url || 'https://robohash.org/206',
                            } : undefined}
                            isContinueWatching
                            progress={(idx + 1) * 30}
                            showPlayIcon
                            contentType="video"
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}