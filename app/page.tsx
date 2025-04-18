'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { Article, Video, Audio } from '@/app/types';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
// import { AccountCreation } from './components/xion/AccountCreation';
import { Menu, Transition, MenuButton, MenuItems, MenuItem, Button } from '@headlessui/react';
import { Fragment } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { signOut } from '@/app/utils/helpers';
import { toast } from '@/app/components/helpers/toast';
// Categories with proper spacing
const categories = [
    { id: 'all', name: 'All' },
    { id: 'video', name: 'Videos' },
    { id: 'audio', name: 'Audio' },
    { id: 'article', name: 'Articles' },
];

export default function Home() {
    const { data: account } = useAbstraxionAccount();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showAccountCreation, setShowAccountCreation] = useState(false);
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
    const [userEmail, setUserEmail] = useState('');

    const supabase = createClient();

    const handleSignOut = async () => {
        const success = await signOut();
        if (success) {
            toast('Signed out successfully');
        }
    };
    
    useEffect(() => {
        const fetchUserEmail = async () => {
            const { data: userData } = await supabase.auth.getUser();
            if (!userData.user) return;

            const userEmail = userData.user.email;
            setUserEmail(userEmail || '');
        };

        fetchUserEmail();

        const fetchFeaturedContent = async () => {
            try {
                // Get current user
                // Fetch published videos
                const { data: videosData } = await supabase
                    .from('videos')
                    .select('*')
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published audio
                const { data: audioData } = await supabase
                    .from('audio')
                    .select('*')
                    .eq('published', true)
                    .order('created_at', { ascending: false })
                    .limit(8);

                // Fetch published articles
                const { data: articlesData } = await supabase
                    .from('articles')
                    .select('*')
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
    }, []);

    // Filter content based on selected category
    const getFilteredContent = () => {
        if (selectedCategory === 'all') {
            return {
                videos: featuredContent.videos,
                audio: featuredContent.audio,
                articles: featuredContent.articles,
            };
        }

        return {
            videos: selectedCategory === 'video' ? featuredContent.videos : [],
            audio: selectedCategory === 'audio' ? featuredContent.audio : [],
            articles: selectedCategory === 'article' ? featuredContent.articles : [],
        };
    };

    // Function to render content cards based on type and premium status
    const ContentCard = ({ item, type }: { item: Video | Audio | Article; type: 'video' | 'audio' | 'article' }) => {
        const isPremium = item.is_premium;

        return (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1">
                {/* Thumbnail or placeholder */}
                <div className="relative h-48 bg-gray-700/50">
                    {type === 'video' && (item as Video).thumbnail_url && (
                        <img src={(item as Video).thumbnail_url || ''} alt={item.title} className="w-full h-full object-cover" />
                    )}
                    {type === 'audio' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-1.414-2.172m-1.414-9.9a9 9 0 012.828-3.9M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                        </div>
                    )}
                    {type === 'article' && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500/20 to-teal-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" />
                            </svg>
                        </div>
                    )}

                    {/* Premium badge */}
                    {isPremium && (
                        <div className="absolute top-2 right-2 bg-blue-500/20 backdrop-blur-sm px-2 py-1 rounded text-sm font-medium text-blue-400">
                            PREMIUM
                        </div>
                    )}
                </div>

                {/* Content info */}
                <div className="p-4">
                    <h3 className="font-semibold text-lg truncate text-white">{item.title}</h3>
                    <div className="mt-3 flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {!userEmail && isPremium ? (
                            <Button
                                onClick={() => setShowAccountCreation(true)}
                                className="text-sm font-medium px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
                            >
                                Sign in to access
                            </Button>
                        ) : (
                            <Link
                                href={`/content/${type}/${item.id}`}
                                className={`text-sm font-medium px-3 py-1 rounded ${
                                    isPremium
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-700 text-white hover:bg-gray-600'
                                }`}
                            >
                                {isPremium ? 'Unlock' : 'View'}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const ContentSection = ({ title, items, type, showMoreLink }: {
        title: string;
        items: (Video | Audio | Article)[];
        type: 'video' | 'audio' | 'article';
        showMoreLink: string;
    }) => (
        <section className="mb-12">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{title}</h2>
                <Link href={showMoreLink} className="text-blue-400 hover:text-blue-300">
                    View All
                </Link>
            </div>

            {items.length === 0 ? (
                <div className="text-center p-8 bg-gray-800/50 rounded-lg text-gray-400">
                    No content available
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {items.map((item) => (
                        <ContentCard key={item.id} item={item} type={type} />
                    ))}
                </div>
            )}
        </section>
    );

  return (
        <div className="min-h-screen bg-[#0A0C10] text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0A0C10]/90 backdrop-blur-md border-b border-gray-800/50 z-50">
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-12">
                            <Link href="/" className="flex items-center space-x-2">
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    QUANTA
                                </span>
                            </Link>
                            <nav className="hidden md:flex">
                                <div className="flex gap-x-4 bg-gray-800/50 px-8 py-2 rounded-lg">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            onClick={() => setSelectedCategory(category.id)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                selectedCategory === category.id
                                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                            }`}
                                        >
                                            {category.name}
                                        </button>
                                    ))}
                                </div>
                            </nav>
                        </div>
                        <div className="flex items-center space-x-4">
                            {!userEmail ? (
                                <Button
                                    onClick={() => setShowAccountCreation(true)}
                                    className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white"
                                >
                                    Sign In
                                </Button>
                            ) : (
                                <Menu as="div" className="relative">
                                    <MenuButton className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                                            {userEmail.slice(0, 2)}
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
                                                    {userEmail}
                                                </div>
                                                <MenuItem>
                                                    {({ active }) => (
                                                        <Link
                                                            href="/dashboard"
                                                            className={`${
                                                                active ? 'bg-gray-700' : ''
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
                                                            className={`${
                                                                active ? 'bg-gray-700' : ''
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
                <div className="container mx-auto px-6 py-8">
                    {/* Mobile Categories */}
                    <div className="md:hidden overflow-x-auto pb-6">
                        <div className="flex space-x-2 bg-gray-800/50 p-1 rounded-lg">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                                        selectedCategory === category.id
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

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
                                    <h3 className="text-xl font-semibold text-gray-200 mb-2">No Content Available</h3>
                                    <p className="text-gray-400 max-w-md">
                                        There are no published contents at the moment. Please check back later or try a different category.
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
                                        />
                                    )}
                                    
                                    {getFilteredContent().audio.length > 0 && (
                                        <ContentSection
                                            title="Popular Audio"
                                            items={getFilteredContent().audio}
                                            type="audio"
                                            showMoreLink="/explore/audio"
                                        />
                                    )}
                                    
                                    {getFilteredContent().articles.length > 0 && (
                                        <ContentSection
                                            title="Latest Articles"
                                            items={getFilteredContent().articles}
                                            type="article"
                                            showMoreLink="/explore/articles"
                                        />
                                    )}
                                </>
                            )}
                        </>
                    )}
        </div>
      </main>

            {/* Account Creation Modal */}
            {showAccountCreation && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowAccountCreation(false);
                        }
                    }}
                >
                    <div className="bg-[#1A1D24] rounded-xl p-8 max-w-md w-full border border-gray-800 shadow-xl shadow-blue-500/10 relative">
                        <button
                            onClick={() => setShowAccountCreation(false)}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800/50 transition-colors duration-200"
                            aria-label="Close modal"
                        >
                            <svg
                                className="w-5 h-5 text-gray-400 hover:text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>

                        <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
                            <svg
                                className="w-6 h-6 text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        </div>

                        <h2 className="text-2xl font-bold pb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Create Your XION Account
                        </h2>

                        <p className="text-gray-400 pb-8 text-sm leading-relaxed">
                            Get instant access to premium content with gasless transactions. Your XION account enables secure, seamless payments across the platform.
                        </p>

                        <div className="space-y-6">
                            {/* <AccountCreation 
                onSuccess={() => setShowAccountCreation(false)}
                onError={(error: Error) => {
                  console.error('Account creation failed:', error.message);
                  setShowAccountCreation(false);
                }}
              /> */}

                            <div className="text-center">
                                <p className="text-xs text-gray-500">
                                    By creating an account, you agree to our{' '}
                                    <a href="/terms" className="text-blue-400 hover:text-blue-300">
                                        Terms of Service
                                    </a>{' '}
                                    and{' '}
                                    <a href="/privacy" className="text-blue-400 hover:text-blue-300">
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </div>
  );
}