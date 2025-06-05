'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Article, Video, Audio } from '@/app/types';
import { Menu, Transition, MenuButton, MenuItems, MenuItem, Button } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { signOut } from '@/app/utils/helpers';
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import ContentSection from '@/app/components/ui/content/ContentSection';
import { getSupabase } from './utils/supabase';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function Home() {
    const router = useRouter();
    const { data: account } = useAbstraxionAccount();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [featuredContent, setFeaturedContent] = useState<{
        videos: Video[];
        audio: Audio[];
        articles: Article[];
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

                // Fetch published videos
                const { data: videosData } = await supabase
                    .from('videos')
                    .select(`
                        *,
                        author:users(
                            id,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published audio
                const { data: audioData } = await supabase
                    .from('audio')
                    .select(`
                        *,
                        author:users(
                            id,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published articles
                const { data: articlesData } = await supabase
                    .from('articles')
                    .select(`
                        *,
                        author:users(
                            id,
                            full_name,
                            avatar_url
                        )
                    `)
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);
                setFeaturedContent({
                    videos: videosData || [],
                    audio: audioData || [],
                    articles: articlesData || [],
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
                    video.title.toLowerCase().includes(term) ||
                    (video.description && video.description.toLowerCase().includes(term))
                ),
                audio: filteredContent.audio.filter(audio =>
                    audio.title.toLowerCase().includes(term) ||
                    (audio.description && audio.description.toLowerCase().includes(term))
                ),
                articles: filteredContent.articles.filter(article =>
                    article.title.toLowerCase().includes(term) ||
                    (article.excerpt && article.excerpt.toLowerCase().includes(term)) ||
                    article.content.toLowerCase().includes(term)
                ),
            };
        }

        // Apply type filter
        if (selectedType !== 'all') {
        return {
                videos: selectedType === 'video' ? filteredContent.videos : [],
                audio: selectedType === 'audio' ? filteredContent.audio : [],
                articles: selectedType === 'article' ? filteredContent.articles : [],
            };
        }

        return filteredContent;
    };

    return (
        <div className="flex min-h-screen bg-[#0A0C10] text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-[#13151A] flex flex-col justify-between py-8 px-6 border-r border-gray-800/50 min-h-screen">
                <div>
                    <div className="mb-10 flex items-center space-x-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">QUANTA</span>
                    </div>
                    <nav className="space-y-2">
                        <Link href="/" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-purple-400 bg-purple-900/20 font-semibold">
                            <span>Home</span>
                        </Link>
                        <Link href="/discover" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">
                            <span>Discover</span>
                        </Link>
                        <Link href="/coming-soon" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">
                            <span>Coming Soon</span>
                        </Link>
                    </nav>
                    <div className="mt-10">
                        <div className="uppercase text-xs text-gray-500 mb-2 tracking-widest">Library</div>
                        <nav className="space-y-1">
                            <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">Downloaded</Link>
                            <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">Recently Added</Link>
                            <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">Play list</Link>
                            <Link href="/dashboard/subscriptions" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">
                                <span>Subscription</span>
                                <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">NEW</span>
                            </Link>
                        </nav>
                    </div>
                    <div className="mt-10 space-y-1">
                        <Link href="/settings" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">Settings</Link>
                        <Link href="/help" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-gray-800/50">Help</Link>
                    </div>
                </div>
                <div>
                    <button onClick={handleSignOut} className="w-full flex items-center py-2 px-3 rounded-lg text-gray-400 hover:bg-gray-800/50">
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header */}
                <header className="flex items-center justify-between px-10 py-6 border-b border-gray-800/50 bg-[#0A0C10]/90">
                    <div className="flex-1 flex items-center space-x-4">
                        <input
                            type="text"
                            placeholder="Search music, artist, albums..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-96 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg">Create</Button>
                        {user && (
                            <div className="flex items-center space-x-2">
                                <img src={user.avatar_url || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-purple-500" />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-white">{user.username || user.wallet_address?.slice(0, 8)}</span>
                                    <span className="text-xs text-purple-400">Premium ✨</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Quick Filters */}
                <div className="flex justify-end px-10 py-4 space-x-3">
                    {['Movie', 'Course', 'Podcast', 'Audio', 'Music', 'Comedy'].map((filter) => (
                        <button
                            key={filter}
                            className="px-4 py-2 rounded-full bg-gray-800/50 text-gray-300 hover:bg-purple-600 hover:text-white transition-colors font-medium"
                        >
                            {filter}
                        </button>
                    ))}
                </div>

                {/* Featured Banner */}
                <div className="px-10 pb-8">
                    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-800/80 to-blue-800/80 shadow-lg flex items-end h-72 mb-10">
                        {/* Example featured content, replace with dynamic */}
                        <img src="/featured-banner.jpg" alt="Featured" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                        <div className="relative z-10 p-8 flex flex-col max-w-lg">
                            <h2 className="text-3xl font-bold mb-2">Avengers Age of Ultron</h2>
                            <div className="flex items-center space-x-2 mb-4">
                                <img src="/default-avatar.png" className="w-8 h-8 rounded-full border-2 border-purple-500" />
                                <span className="text-sm text-gray-200">Silvertoken • 67k views • 9 hours ago</span>
                            </div>
                            <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold w-32">Watch</Button>
                        </div>
                    </div>
                </div>

                {/* Trending Video Section */}
                <section className="px-10 mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Trending Video <span className="text-yellow-400">•</span></h3>
                        <Link href="#" className="text-purple-400 hover:underline">See All</Link>
                    </div>
                    <div className="flex space-x-6 overflow-x-auto pb-2">
                        {/* Example cards, replace with dynamic */}
                        {featuredContent.videos.slice(0, 3).map((video, idx) => (
                            <div key={video.id} className="min-w-[320px] bg-gray-900/80 rounded-xl shadow-lg overflow-hidden relative">
                                <img src={video.thumbnail_url || '/default-thumb.jpg'} alt={video.title} className="w-full h-40 object-cover" />
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold mb-1">{video.title}</h4>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <img src={video.author?.avatar_url || '/default-avatar.png'} className="w-6 h-6 rounded-full border-2 border-purple-500" />
                                        <span className="text-xs text-gray-400">{video.author?.username || video.author?.wallet_address?.slice(0, 8)}</span>
                                    </div>
                                    <Button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-lg text-sm">Watch</Button>
                                </div>
                                <span className="absolute top-4 right-4 bg-yellow-500 text-xs px-2 py-1 rounded-full font-bold">Trending</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Continue Watching Section */}
                <section className="px-10 mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold">Continue Watching</h3>
                        <Link href="#" className="text-purple-400 hover:underline">See All</Link>
                    </div>
                    <div className="flex space-x-6 overflow-x-auto pb-2">
                        {/* Example cards, replace with dynamic */}
                        {featuredContent.videos.slice(3, 6).map((video, idx) => (
                            <div key={video.id} className="min-w-[320px] bg-gray-900/80 rounded-xl shadow-lg overflow-hidden relative">
                                <img src={video.thumbnail_url || '/default-thumb.jpg'} alt={video.title} className="w-full h-40 object-cover" />
                                <div className="p-4">
                                    <h4 className="text-lg font-semibold mb-1">{video.title}</h4>
                                    <div className="flex items-center space-x-2 mb-2">
                                        <img src={video.author?.avatar_url || '/default-avatar.png'} className="w-6 h-6 rounded-full border-2 border-purple-500" />
                                        <span className="text-xs text-gray-400">{video.author?.username || video.author?.wallet_address?.slice(0, 8)}</span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-700 rounded-full mt-2">
                                        <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${(idx + 1) * 30}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}