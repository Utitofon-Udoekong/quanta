'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import { Content } from '@/app/types';
import { Menu, MenuItems, MenuItem, MenuButton, Transition } from '@headlessui/react';
import { useUserStore } from '@/app/stores/user';
import ContentCard from '@/app/components/ui/ContentCard';
import HeroCarousel from '@/app/components/ui/HeroCarousel';
import { Icon } from '@iconify/react';
import { CarouselItem } from '@/app/utils/carousel';
import { supabase } from './utils/supabase/client';
import { useRouter } from 'next/navigation';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

// Premium filter options
const premiumFilters = [
    { id: 'both', name: 'All' },
    { id: 'free', name: 'Free' },
    { id: 'premium', name: 'Premium' },
];

// Timeline filter options
const timelineFilters = [
    { id: 1, name: '1 Day' },
    { id: 7, name: '7 Days' },
    { id: 14, name: '14 Days' },
];

// Format time ago
const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const contentDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - contentDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

export default function Home() {
    const [selectedType, setSelectedType] = useState('all');
    const [selectedPremium, setSelectedPremium] = useState('both');
    const [selectedTimeline, setSelectedTimeline] = useState(7);
    const [featuredContent, setFeaturedContent] = useState<{
        videos: Content[];
        audio: Content[];
        articles: Content[];
    }>({
        videos: [],
        audio: [],
        articles: [],
    });
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Fetch featured content for carousel and sections
    useEffect(() => {
        const fetchFeaturedContent = async () => {
            try {
                setLoading(true);
                
                // Calculate selected timeline ago
                const timelineAgo = new Date();
                timelineAgo.setDate(timelineAgo.getDate() - selectedTimeline);
                
                // Fetch recently added content (within selected timeline)
                const [videosData, audioData, articlesData] = await Promise.all([
                    supabase
                        .from('videos')
                        .select(`
                            *,
                            author:users(id, username, wallet_address, avatar_url)
                        `)
                        .eq('published', true)
                        .gte('created_at', timelineAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(12),
                    supabase
                        .from('audio')
                        .select(`
                            *,
                            author:users(id, username, wallet_address, avatar_url)
                        `)
                        .eq('published', true)
                        .gte('created_at', timelineAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(12),
                    supabase
                        .from('articles')
                        .select(`
                            *,
                            author:users(id, username, wallet_address, avatar_url)
                        `)
                        .eq('published', true)
                        .gte('created_at', timelineAgo.toISOString())
                        .order('created_at', { ascending: false })
                        .limit(12)
                ]);

                setFeaturedContent({
                    videos: videosData.data?.map((v: any) => ({ ...v, kind: 'video' })) || [],
                    audio: audioData.data?.map((a: any) => ({ ...a, kind: 'audio' })) || [],
                    articles: articlesData.data?.map((ar: any) => ({ ...ar, kind: 'article' })) || [],
                });

            } catch (error) {
                console.error('Error fetching featured content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedContent();
    }, [selectedTimeline]);

    // Handle carousel item click
    const handleCarouselItemClick = (item: CarouselItem) => {
        // Don't navigate for default items (they have string IDs)
        if (item.id === "1" || item.id === "2" || item.id === "3") {
            return;
        }
        router.push(`/content/${item.id}?kind=${item.contentType}`);
    };

    // Get content based on selected type and premium filter
    const getFilteredContent = () => {
        let content = [];
        
        // Filter by content type
        switch (selectedType) {
            case 'video':
                content = featuredContent.videos;
                break;
            case 'audio':
                content = featuredContent.audio;
                break;
            case 'article':
                content = featuredContent.articles;
                break;
            default:
                content = [
                    ...featuredContent.videos,
                    ...featuredContent.audio,
                    ...featuredContent.articles
                ];
        }

        // Filter by premium status
        switch (selectedPremium) {
            case 'free':
                content = content.filter(item => !item.is_premium);
                break;
            case 'premium':
                content = content.filter(item => item.is_premium);
                break;
            default:
                // 'both' - no additional filtering
                break;
        }

        return content;
    };

    const filteredContent = getFilteredContent();

    // Convert filtered content to carousel items (1-5 items)
    const carouselItems = (() => {
        if (filteredContent.length === 0) {
            // Default items when no content is available
            return [
                {
                    id: "1",
                    title: "Welcome to Quanta",
                    image: "/images/default-thumbnail.png",
                    user: "Quanta Team",
                    avatar: "https://robohash.org/quanta",
                    views: "0",
                    timeAgo: "Just now",
                    gradient: "from-blue-600 to-purple-600",
                    contentType: "video" as const
                },
                {
                    id: "2",
                    title: "Create Your First Content",
                    image: "/images/default-thumbnail.png",
                    user: "Get Started",
                    avatar: "https://robohash.org/start",
                    views: "0",
                    timeAgo: "Just now",
                    gradient: "from-purple-600 to-blue-600",
                    contentType: "video" as const
                },
                {
                    id: "3",
                    title: "Join the Community",
                    image: "/images/default-thumbnail.png",
                    user: "Community",
                    avatar: "https://robohash.org/community",
                    views: "0",
                    timeAgo: "Just now",
                    gradient: "from-orange-500 to-red-600",
                    contentType: "article" as const
                }
            ];
        }

        // Use 1-5 items from filtered content
        const itemsToShow = Math.min(Math.max(filteredContent.length, 1), 5);
        return filteredContent.slice(0, itemsToShow).map((content, index) => {
            const contentType = content.kind as 'video' | 'audio' | 'article';
            const gradients = {
                video: ["from-blue-600 to-purple-600", "from-purple-600 to-blue-600", "from-red-600 to-blue-600", "from-green-600 to-blue-600", "from-yellow-600 to-orange-600"],
                audio: ["from-purple-600 to-pink-600", "from-pink-600 to-purple-600", "from-indigo-600 to-purple-600", "from-purple-600 to-indigo-600", "from-pink-600 to-red-600"],
                article: ["from-orange-500 to-red-600", "from-red-600 to-orange-500", "from-yellow-500 to-orange-600", "from-orange-600 to-yellow-500", "from-red-600 to-pink-600"]
            };
            const gradientOptions = gradients[contentType] || gradients.video;
            const gradient = gradientOptions[index % gradientOptions.length];
            
            return {
                id: content.id,
                title: content.title,
                image: content.thumbnail_url || '/images/default-thumbnail.png',
                user: content.author?.username || content.author?.wallet_address?.slice(0, 8) || 'Unknown',
                avatar: content.author?.avatar_url || `https://robohash.org/${content.author?.wallet_address?.slice(0, 8) || 'default'}`,
                views: content.views ? (content.views >= 1000000 ? `${(content.views / 1000000).toFixed(1)}M` : content.views >= 1000 ? `${(content.views / 1000).toFixed(1)}K` : content.views.toString()) : '0',
                timeAgo: formatTimeAgo(content.created_at),
                gradient,
                contentType
            };
        });
    })();

    return (
        <>
            {/* Hero Carousel */}
            <div className="pb-8">
                {loading ? (
                    <div className="relative w-full h-72 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden rounded-2xl flex items-center justify-center">
                        <div className="text-white text-lg">Loading featured content...</div>
                    </div>
                ) : (
                    <HeroCarousel 
                        items={carouselItems} 
                        onItemClick={handleCarouselItemClick} 
                    />
                )}
            </div>

            {/* Filter Dropdowns */}
            <div className="mb-10 flex flex-col sm:flex-row gap-4">
                {/* Timeline Dropdown */}
                <Menu as="div" className="relative w-full sm:w-52 text-left">
                    <MenuButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-r from-[#8B25FF] to-[#350FDD] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                        <span>Timeline: {timelineFilters.find(f => f.id === selectedTimeline)?.name}</span>
                        <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </MenuButton>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <MenuItems className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <div className="py-1">
                                {timelineFilters.map((filter) => (
                                    <MenuItem key={filter.id}>
                                        {({ active }) => (
                                            <button onClick={() => setSelectedTimeline(filter.id)} className={`${active ? 'bg-purple-600 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}>
                                                {filter.name}
                                            </button>
                                        )}
                                    </MenuItem>
                                ))}
                            </div>
                        </MenuItems>
                    </Transition>
                </Menu>

                {/* Content Type Dropdown */}
                <Menu as="div" className="relative w-full sm:w-52 text-left">
                    <MenuButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-r from-[#8B25FF] to-[#350FDD] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                        <span>Type: {contentTypes.find(f => f.id === selectedType)?.name}</span>
                        <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </MenuButton>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <MenuItems className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <div className="py-1">
                                {contentTypes.map((filter) => (
                                    <MenuItem key={filter.id}>
                                        {({ active }) => (
                                            <button onClick={() => setSelectedType(filter.id)} className={`${active ? 'bg-purple-600 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}>
                                                {filter.name}
                                            </button>
                                        )}
                                    </MenuItem>
                                ))}
                </div>
                        </MenuItems>
                    </Transition>
                </Menu>

                {/* Premium Dropdown */}
                <Menu as="div" className="relative w-full sm:w-52 text-left">
                    <MenuButton className="flex w-full justify-between items-center rounded-lg bg-gradient-to-r from-[#8B25FF] to-[#350FDD] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                        <span>Access: {premiumFilters.find(f => f.id === selectedPremium)?.name}</span>
                        <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </MenuButton>
                    <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                        <MenuItems className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                            <div className="py-1">
                                {premiumFilters.map((filter) => (
                                    <MenuItem key={filter.id}>
                                        {({ active }) => (
                                            <button onClick={() => setSelectedPremium(filter.id)} className={`${active ? 'bg-purple-600 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}>
                                                {filter.name}
                                            </button>
                                        )}
                                    </MenuItem>
                    ))}
                </div>
                        </MenuItems>
                    </Transition>
                </Menu>
            </div>

            {/* Content Grid */}
            <section className="mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                    <h3 className="text-xl font-bold">
                        Recently Added Content
                    </h3>
                    <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <span className="text-sm font-normal text-purple-300">
                            Last {selectedTimeline} {selectedTimeline === 1 ? 'Day' : 'Days'}
                        </span>
                        <Link href="/discover" className="text-sm text-purple-400 hover:underline">
                            See All
                        </Link>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    {filteredContent.map((content) => (
                        <Link key={content.id} href={`/content/${content.id}?kind=${content.kind}`} className="block group">
                        <ContentCard
                                    image={content.thumbnail_url || '/images/default-thumbnail.png'}
                                    title={content.title}
                            subtitle={
                                        (content.author?.username || content.author?.wallet_address?.slice(0, 8) || 'Unknown') +
                                        (content.views ? ` - ${content.views} views` : '')
                                    }
                                    actionLabel={content.kind === 'video' ? 'Watch' : content.kind === 'audio' ? 'Listen' : 'Read'}
                                    author={content.author ? {
                                        name: content.author.username || content.author.wallet_address?.slice(0, 8) || 'Unknown',
                                        avatar: content.author.avatar_url || 'https://robohash.org/206',
                            } : undefined}
                                    contentType={content.kind}
                        />
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}