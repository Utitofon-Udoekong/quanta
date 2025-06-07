'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Article, Video, Audio } from '@/app/types';
import { Button } from '@headlessui/react';
import { signOut } from '@/app/utils/helpers';
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionAccount, useAbstraxionSigningClient } from "@burnt-labs/abstraxion";

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
        <div className="flex-1 flex flex-col min-h-screen">
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
    );
}