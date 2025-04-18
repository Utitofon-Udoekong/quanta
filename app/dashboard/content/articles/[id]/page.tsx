'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { type Article } from '@/app/types';
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import MarkdownViewer from '@/app/components/ui/MarkdownViewer';
import { trackContentView } from '@/app/utils/content';
import ArticleAuthor from '@/app/components/ui/ArticleAuthor';

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        // First, fetch the article data
        const { data: articleData, error: articleError } = await supabase
          .from('articles')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (articleError) throw articleError;
        
        // Then, fetch the author details from auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error(userError);
          // Continue with the article data even if we can't get the author
          setArticle(articleData);
        } else {
          // Combine the article data with the author information
          const combinedData = {
            ...articleData,
            author: {
              id: user.id,
              email: user.email,
              user_metadata: user.user_metadata
            }
          };
          setArticle(combinedData);
        }
        
        // Track view if article exists
        if (articleData) {
          trackContentView(articleData.id, 'article', articleData.user_id);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch article');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300">{error}</p>
            <Link href="/dashboard/content/articles" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
              Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!article) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-gray-300">The article you're looking for doesn't exist or is not published.</p>
            <Link href="/explore/articles" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
              Back to Articles
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-4xl mx-auto p-8">
        <Link 
          href="/explore/articles" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Articles
        </Link>
        
        <article className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <ArticleAuthor article={article} />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            
            {article.excerpt && (
              <p className="text-xl text-gray-300 mb-6 italic border-l-4 border-blue-500 pl-4">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center text-sm text-gray-400 mb-8">
              <div className="flex items-center mr-4">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {new Date(article.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {Math.ceil(article.content.split(' ').length / 200)} min read
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <MarkdownViewer content={article.content} />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
} 