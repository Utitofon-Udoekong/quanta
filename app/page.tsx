'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { Article, Video, Audio } from '@/app/types';
import { Menu, Transition, MenuButton, MenuItems, MenuItem, Button } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/solid';
import { signOut } from '@/app/utils/helpers';
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';
import ContentSection from '@/app/components/ui/content/ContentSection';

// Content types for filtering
const contentTypes = [
    { id: 'all', name: 'All Content' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function Home() {
    const router = useRouter();
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

    const supabase = createClient();

    const handleSignOut = async () => {
        const success = await signOut();
        if (success) {
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
                    .eq('user_id', user.id)
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
                    .eq('user_id', user.id)
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
                    .eq('user_id', user.id)
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);
                console.log(articlesData);
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
        <div className="min-h-screen bg-[#0A0C10] text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0A0C10]/90 backdrop-blur-md border-b border-gray-800/50 z-50">
                <div className="mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex flex-1/4 items-center space-x-2">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                QUANTA
                            </span>
                        </Link>
                        <div className="hidden md:flex md:flex-2/4 justify-center items-center space-x-4">
                            <div className="relative w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <MagnifyingGlassIcon className="size-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search content..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center space-x-1 px-3 py-2 rounded-md ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-300 hover:text-white'
                                    }`}
                            >
                                <FunnelIcon className="h-4 w-4" />
                                <span>Filters</span>
                            </button>
                        </div>
                        <div className="flex flex-1/4 justify-end items-center space-x-4">
                            {!user ? (
                                <Button
                                    onClick={() => router.push('/auth')}
                                    className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
                                >
                                    Sign In
                                </Button>
                            ) : (
                                <Menu as="div" className="relative">
                                    <MenuButton className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {user.email?.slice(0, 2)}
                                        </div>
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                    </MenuButton>
                                    <Transition
                                        as={Fragment}
                                        enter="transition ease-out duration-100"
                                        enterFrom="transform opacity-0 scale-95"
                                        enterTo="transform opacity-100 scale-100"
                                        leave="transition ease-in duration-75"
                                        leaveFrom="transform opacity-100 scale-100"
                                        leaveTo="transform opacity-0 scale-95"
                                    >
                                        <MenuItems className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <div className="px-2 py-2">
                                                <div className="px-3 py-2 text-sm text-gray-400 border-b border-gray-700">
                                                    {user.email}
                                                </div>
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <Link
                                                            href="/dashboard"
                                                            className={`${active ? 'bg-gray-700' : ''
                                                                } block px-3 py-2 rounded-md text-sm text-white`}
                                                        >
                                                            Dashboard
                                                        </Link>
                                                    )}
                                                </MenuItem>
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <button
                                                            onClick={handleSignOut}
                                                            className={`${active ? 'bg-gray-700' : ''
                                                                } block w-full text-left px-3 py-2 rounded-md text-sm text-red-400`}
                                                        >
                                                            Sign Out
                                                        </button>
                                                    )}
                                                </MenuItem>
                                            </div>
                                        </MenuItems>
                                    </Transition>
                                </Menu>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="pt-20">
                <div className="mx-auto px-6 py-8">
                    {/* Mobile Search */}
                    <div className="md:hidden mb-6">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search content..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                            <h3 className="text-lg font-medium text-white mb-3">Filter Content</h3>
                            <div className="flex flex-wrap gap-2">
                                {contentTypes.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setSelectedType(type.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedType === type.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                    >
                                        {type.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="mt-4 text-gray-400">Loading content...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {getFilteredContent().videos.length === 0 &&
                                getFilteredContent().audio.length === 0 &&
                                getFilteredContent().articles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-200 mb-2">No Content Found</h3>
                                    <p className="text-gray-400 max-w-md">
                                        {searchTerm ?
                                            `No content matches your search for "${searchTerm}". Try different keywords or filters.` :
                                            "There are no published contents at the moment. Please check back later."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {getFilteredContent().videos.length > 0 && (
                                        <ContentSection
                                            title="Featured Videos"
                                            items={getFilteredContent().videos}
                                            type="video"
                                            showMoreLink="/explore/videos"
                                            userLoggedIn={!!user}
                                        />
                                    )}

                                    {getFilteredContent().audio.length > 0 && (
                                        <ContentSection
                                            title="Popular Audio"
                                            items={getFilteredContent().audio}
                                            type="audio"
                                            showMoreLink="/explore/audio"
                                            userLoggedIn={!!user}
                                        />
                                    )}

                                    {getFilteredContent().articles.length > 0 && (
                                        <ContentSection
                                            title="Latest Articles"
                                            items={getFilteredContent().articles}
                                            type="article"
                                            showMoreLink="/explore/articles"
                                            userLoggedIn={!!user}
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}