'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/app/utils/supabase/client';
import { Article, Video, Audio } from '@/app/types';

export default function Home() {
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
  
  const supabase = createClient();
  
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
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
  
  // Function to render content cards based on type and premium status
  const ContentCard = ({ item, type }: { item: any; type: 'video' | 'audio' | 'article' }) => {
    const isPremium = item.is_premium;
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
        {/* Thumbnail or placeholder */}
        <div className="relative h-48 bg-gray-200">
          {type === 'video' && item.thumbnail_url && (
            <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
          )}
          {type === 'audio' && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.536a5 5 0 01-1.414-2.172m-1.414-9.9a9 9 0 012.828-3.9M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
          )}
          {type === 'article' && (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-teal-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15M9 11l3 3m0 0l3-3m-3 3V8" />
              </svg>
            </div>
          )}
          
          {/* Premium badge */}
          {isPremium && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-xs font-bold text-white px-2 py-1 rounded">
              PREMIUM
            </div>
          )}
        </div>
        
        {/* Content info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{item.title}</h3>
          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
            {item.description || item.excerpt || 'No description available.'}
          </p>
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            <Link 
              href={`/content/${type}/${item.id}`} 
              className={`text-sm font-medium px-3 py-1 rounded ${
                isPremium 
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              {isPremium ? 'Unlock' : 'View'}
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const ContentSection = ({ title, items, type, showMoreLink }: { 
    title: string; 
    items: any[];
    type: 'video' | 'audio' | 'article';
    showMoreLink: string;
  }) => (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <Link href={showMoreLink} className="text-indigo-600 hover:text-indigo-800">
          View All
        </Link>
      </div>
      
      {items.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero section */}
      <div className="bg-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              Your Content Platform
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Discover videos, audio, and articles - with both free and premium content
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                href="/explore"
                className="px-5 py-3 rounded-md bg-white text-indigo-800 font-medium hover:bg-gray-100"
              >
                Explore Content
              </Link>
              <Link
                href="/auth"
                className="px-5 py-3 rounded-md bg-indigo-700 text-white font-medium hover:bg-indigo-900 border border-indigo-900"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading content...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Featured content */}
            <ContentSection 
              title="Featured Videos" 
              items={featuredContent.videos}
              type="video"
              showMoreLink="/explore/videos"
            />
            
            <ContentSection 
              title="Popular Audio" 
              items={featuredContent.audio}
              type="audio"
              showMoreLink="/explore/audio"
            />
            
            <ContentSection 
              title="Latest Articles" 
              items={featuredContent.articles}
              type="article"
              showMoreLink="/explore/articles"
            />
          </>
        )}
        
        {/* Subscription section */}
        <section className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white p-8 md:p-12">
          <div className="md:flex md:items-center md:justify-between">
            <div className="md:w-2/3">
              <h2 className="text-3xl font-bold mb-4">Unlock Premium Content</h2>
              <p className="text-lg text-indigo-100 mb-6">
                Subscribe to get unlimited access to all premium videos, audio, and articles.
              </p>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Exclusive premium content
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Early access to new releases
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  No ads or interruptions
                </li>
              </ul>
            </div>
            
            <div className="md:w-1/3 md:text-center">
              <Link
                href="/pricing"
                className="inline-block px-8 py-4 bg-white text-indigo-700 font-bold rounded-lg hover:bg-gray-100 transition-colors"
              >
                See Pricing Plans
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}