'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Content } from '@/app/types';
import { Menu, MenuItems, MenuItem, MenuButton, Transition } from '@headlessui/react';
import { useUserStore } from '@/app/stores/user';
import ContentCard from '@/app/components/ui/ContentCard';
import { Icon } from '@iconify/react';
import { supabase } from '@/app/utils/supabase/client';

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

export default function DiscoverPage() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState('all');
    const [selectedPremium, setSelectedPremium] = useState('both');
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUserStore();

    useEffect(() => {
        const fetchContent = async () => {
            try {
                setLoading(true);
                const [videosData, audioData, articlesData] = await Promise.all([
                    supabase.from('videos').select(`*, author:users(id, username, wallet_address, avatar_url)`).eq('published', true).order('created_at', { ascending: false }),
                    supabase.from('audio').select(`*, author:users(id, username, wallet_address, avatar_url)`).eq('published', true).order('created_at', { ascending: false }),
                    supabase.from('articles').select(`*, author:users(id, username, wallet_address, avatar_url)`).eq('published', true).order('created_at', { ascending: false })
                ]);

                const combined = [
                    ...(videosData.data || []).map((item: any) => ({ ...item, kind: 'video' })),
                    ...(audioData.data || []).map((item: any) => ({ ...item, kind: 'audio' })),
                    ...(articlesData.data || []).map((item: any) => ({ ...item, kind: 'article' })),
                ];
                setAllContent(combined);
            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const getFilteredContent = () => {
        let content = allContent;
        if (selectedType !== 'all') {
            content = content.filter(item => item.kind === selectedType);
        }
        if (selectedPremium !== 'both') {
            content = content.filter(item => (selectedPremium === 'premium' ? item.is_premium : !item.is_premium));
        }
        return content;
    };

    const filteredContent = getFilteredContent();

    return (
        <div className="flex-1 flex flex-col relative">
            <header className="py-4 mt-4 mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-white">Discover</h1>
                <p className="text-gray-400 mt-1">
                    Find new videos, audio, and articles from creators.
                </p>
            </header>

            {/* Filter Dropdowns */}
            <div className="mb-10 flex flex-col sm:flex-row gap-4">
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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h3 className="text-xl font-bold">All Content</h3>
                <span className="text-sm text-gray-400 mt-2 sm:mt-0">
                    {filteredContent.length} {filteredContent.length === 1 ? 'item' : 'items'} found
                </span>
            </div>

            <section className="mb-10">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredContent.map((content) => (
                            <ContentCard
                                key={content.id}
                                content={content}
                            />
                        ))}
                    </div>
                )}
                
                {!loading && filteredContent.length === 0 && (
                    <div className="text-center py-12">
                        <Icon icon="material-symbols:search-off" className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No content found</h3>
                        <p className="text-gray-500">Try adjusting your filters or check back later for new content.</p>
                    </div>
                )}
            </section>
        </div>
    );
}