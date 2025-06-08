'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Content } from '@/app/types';
import { Button } from '@headlessui/react';
import { signOut } from '@/app/utils/helpers';
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import ContentCard from '@/app/components/ui/ContentCard';
import { Icon } from '@iconify/react';

import { getSupabase } from '@/app/utils/supabase';
import SearchInput from '@/app/components/ui/SearchInput';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function DiscoverPage() {
    const router = useRouter();
    const { data: account } = useAbstraxionAccount();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [contentFilter, setContentFilter] = useState<'all' | 'free' | 'premium'>('all');
    const [showFilters, setShowFilters] = useState(false);
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
    const { user, error: userError } = useUserStore();
    const { logout } = useAbstraxionSigningClient();
    const supabase = getSupabase(account?.bech32Address);

    const handleSignOut = async () => {
        const success = await signOut();
        if (success) {
            logout?.();
            toast('Signed out successfully');
        }
    };

    useEffect(() => {
        const fetchFeaturedContent = async () => {
            try {
                if (userError || !user) {
                    console.error('Error fetching user:', userError);
                    return;
                }

                // Fetch published videos with views
                const { data: videosData } = await supabase
                    .from('videos')
                    .select(`
                        *,
                        author:users(
                            id,
                            username,
                            avatar_url
                        ),
                        content_views!inner(count)
                    `)
                    .eq('published', true)
                    .eq('content_views.content_type', 'video')
                    .eq('content_views.content_id', 'videos.id')
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published audio with views
                const { data: audioData } = await supabase
                    .from('audio')
                    .select(`
                        *,
                        author:users(
                            id,
                            username,
                            avatar_url
                        ),
                        content_views!inner(count)
                    `)
                    .eq('published', true)
                    .eq('content_views.content_type', 'audio')
                    .eq('content_views.content_id', 'audio.id')
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published articles with views
                const { data: articlesData } = await supabase
                    .from('articles')
                    .select(`
                        *,
                        author:users(
                            id,
                            username,
                            avatar_url
                        ),
                        content_views!inner(count)
                    `)
                    .eq('published', true)
                    .eq('content_views.content_type', 'article')
                    .eq('content_views.content_id', 'articles.id')
                    .order('created_at', { ascending: false })
                    .limit(8);

                setFeaturedContent({
                    videos: (videosData || []).map(video => ({
                        ...video,
                        kind: 'video',
                        views: video.content_views?.[0]?.count || 0,
                    })),
                    audio: (audioData || []).map(audio => ({
                        ...audio,
                        kind: 'audio',
                        views: audio.content_views?.[0]?.count || 0,
                    })),
                    articles: (articlesData || []).map(article => ({
                        ...article,
                        kind: 'article',
                        views: article.content_views?.[0]?.count || 0,
                    })),
                });
            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFeaturedContent();
    }, [user]);

    // Filter content based on search term and selected type
    const getFilteredContent = () => {
        let filteredContent = {
            videos: featuredContent.videos,
            audio: featuredContent.audio,
            articles: featuredContent.articles,
        };

        // Apply search filter
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filteredContent = {
                videos: filteredContent.videos.filter(video =>
                    video.kind === 'video' && (
                        video.title.toLowerCase().includes(term) ||
                        ((video).description && (video).description.toLowerCase().includes(term))
                    )
                ),
                audio: filteredContent.audio.filter(audio =>
                    audio.kind === 'audio' && (
                        audio.title.toLowerCase().includes(term) ||
                        ((audio).description && (audio).description.toLowerCase().includes(term))
                    )
                ),
                articles: filteredContent.articles.filter(article =>
                    article.kind === 'article' && (
                        article.title.toLowerCase().includes(term) ||
                        ((article).excerpt && (article).excerpt.toLowerCase().includes(term)) ||
                        ((article).content && (article).content.toLowerCase().includes(term))
                    )
                ),
            };
        }

        // Apply type filter
        if (selectedType !== 'all') {
            filteredContent = {
                videos: selectedType === 'video' ? filteredContent.videos : [],
                audio: selectedType === 'audio' ? filteredContent.audio : [],
                articles: selectedType === 'article' ? filteredContent.articles : [],
            };
        }

        // Apply premium/free filter
        if (contentFilter !== 'all') {
            const isPremium = contentFilter === 'premium';
            filteredContent = {
                videos: filteredContent.videos.filter(video => video.is_premium === isPremium),
                audio: filteredContent.audio.filter(audio => audio.is_premium === isPremium),
                articles: filteredContent.articles.filter(article => article.is_premium === isPremium),
            };
        }

        return filteredContent;
    };

    return (
        <div className="flex-1 flex flex-col relative px-8">
            {/* Top Navigation Bar */}
            <nav className="flex items-center gap-x-4 justify-between bg-transparent py-4 mt-4 mb-8 shadow-lg sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <button 
                        onClick={() => setContentFilter('all')}
                        className={`py-2 text-sm transition-colors font-medium ${
                            contentFilter === 'all' 
                                ? 'text-purple-400 border-b-2 border-purple-400' 
                                : 'text-white hover:text-purple-300'
                        }`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setContentFilter('free')}
                        className={`py-2 text-sm transition-colors font-medium ${
                            contentFilter === 'free' 
                                ? 'text-purple-400 border-b-2 border-purple-400' 
                                : 'text-white hover:text-purple-300'
                        }`}
                    >
                        Free
                    </button>
                    <button 
                        onClick={() => setContentFilter('premium')}
                        className={`py-2 text-sm transition-colors font-medium ${
                            contentFilter === 'premium' 
                                ? 'text-purple-400 border-b-2 border-purple-400' 
                                : 'text-white hover:text-purple-300'
                        }`}
                    >
                        Premium
                    </button>
                </div>
                <div className="flex-1 flex justify-center">
                    <SearchInput />
                </div>
                <div className="flex items-center space-x-4">
                    <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
                        <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
                    </button>
                    <Button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
                </div>
            </nav>
            {/* Featured Banner */}
            <div className="pb-8">
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-800/80 to-blue-800/80 shadow-lg flex items-end h-72 mb-10">
                    {/* Example featured content, replace with dynamic */}
                    <img src="/images/default-thumbnail.png" alt="Featured" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="relative z-10 p-8 flex flex-col max-w-lg">
                        <h2 className="text-3xl font-bold mb-2">Avengers Age of Ultron</h2>
                        <div className="flex items-center space-x-2 mb-4">
                            <img src="https://robohash.org/206" className="w-8 h-8 rounded-full border-2 border-purple-500" />
                            <span className="text-sm text-gray-200">Silvertoken • 67k views • 9 hours ago</span>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold w-32">Watch</Button>
                    </div>
                </div>
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