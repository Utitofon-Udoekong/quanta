'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Content } from '@/app/types';
import { Menu, Transition } from '@headlessui/react';
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

export default function ComingSoonPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPremium, setSelectedPremium] = useState('both');
  const [featuredContent, setFeaturedContent] = useState<Content | null>(null);
  const [scheduledContent, setScheduledContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();

  useEffect(() => {
    const fetchComingSoonContent = async () => {
      setLoading(true);
      try {
        const [videosData, audioData, articlesData] = await Promise.all([
          supabase.from('videos').select(`*, author:users (id, username, wallet_address, avatar_url)`).eq('published', false).gt('release_date', new Date().toISOString()).order('release_date', { ascending: true }),
          supabase.from('audio').select(`*, author:users (id, username, wallet_address, avatar_url)`).eq('published', false).gt('release_date', new Date().toISOString()).order('release_date', { ascending: true }),
          supabase.from('articles').select(`*, author:users (id, username, wallet_address, avatar_url)`).eq('published', false).gt('release_date', new Date().toISOString()).order('release_date', { ascending: true })
        ]);

        const allContent = [
          ...(videosData.data || []).map((item: any) => ({ ...item, kind: 'video' })),
          ...(audioData.data || []).map((item: any) => ({ ...item, kind: 'audio' })),
          ...(articlesData.data || []).map((item: any) => ({ ...item, kind: 'article' }))
        ].sort((a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime());

        if (allContent.length > 0) {
          setFeaturedContent(allContent[0]);
          setScheduledContent(allContent.slice(1));
        }
      } catch (error) {
        console.error('Error fetching coming soon content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchComingSoonContent();
  }, []);

  const getFilteredContent = () => {
    let content = scheduledContent;
    
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
      {/* Page Header */}
      <header className="py-4 mt-4 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Coming Soon</h1>
        <p className="text-gray-400 mt-1">
          Get ready for scheduled content from your favorite creators.
        </p>
      </header>

      {/* Filter Dropdowns */}
      <div className="mb-10 flex flex-col sm:flex-row gap-4">
          {/* Content Type Dropdown */}
          <Menu as="div" className="relative w-full sm:w-52 text-left">
              <Menu.Button className="flex w-full justify-between items-center rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                  <span>Type: {contentTypes.find(f => f.id === selectedType)?.name}</span>
                  <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="py-1">
                          {contentTypes.map((filter) => (
                              <Menu.Item key={filter.id}>
                                  {({ active }) => (
                                      <button onClick={() => setSelectedType(filter.id)} className={`${active ? 'bg-purple-600 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}>
                                          {filter.name}
                                      </button>
                                  )}
                              </Menu.Item>
                          ))}
                      </div>
                  </Menu.Items>
              </Transition>
          </Menu>

          {/* Premium Dropdown */}
          <Menu as="div" className="relative w-full sm:w-52 text-left">
              <Menu.Button className="flex w-full justify-between items-center rounded-lg bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                  <span>Access: {premiumFilters.find(f => f.id === selectedPremium)?.name}</span>
                  <Icon icon="mdi:chevron-down" className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Menu.Button>
              <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute z-10 mt-2 w-full origin-top-right rounded-md bg-gray-900 shadow-lg ring-1 ring-black/5 focus:outline-none">
                      <div className="py-1">
                          {premiumFilters.map((filter) => (
                              <Menu.Item key={filter.id}>
                                  {({ active }) => (
                                      <button onClick={() => setSelectedPremium(filter.id)} className={`${active ? 'bg-purple-600 text-white' : 'text-gray-300'} group flex w-full items-center rounded-md px-4 py-2 text-sm`}>
                                          {filter.name}
                                      </button>
                                  )}
                              </Menu.Item>
                          ))}
                      </div>
                  </Menu.Items>
              </Transition>
          </Menu>
      </div>

      {/* Content Grid Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold">Scheduled For Release</h3>
      </div>

      {/* Content Grid */}
      <section className="mb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredContent.map((content) => (
            <Link key={content.id} href={`/content/${content.id}?kind=${content.kind}`} className="block group">
                <ContentCard
                  image={content.thumbnail_url || '/images/default-thumbnail.png'}
                  title={content.title}
                  subtitle={
                    (content.author?.username || content.author?.wallet_address?.slice(0, 8) || 'Unknown')
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
    </div>
  );
}