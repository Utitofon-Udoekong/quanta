'use client';

import { useEffect, useState, use } from 'react';
import { UserData, type Article } from '@/app/types';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import MarkdownViewer from '@/app/components/ui/MarkdownViewer';
import { trackContentView } from '@/app/utils/content';

import { useUserStore } from '@/app/stores/user';
import AuthorInfo from '@/app/components/ui/AuthorInfo';

export default function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {id} = use(params);
  const {user} = useUserStore();
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/content/articles/${id}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch article');
        }
        
        const articleData = await response.json();
        
        if (user) {
          const combinedData = {
            ...articleData,
            author: {
              id: user.id,
              username: user.username,
              avatar_url: user.avatar_url
            }
          };
          setArticle(combinedData);
          trackContentView(articleData.id, 'article', user.id);
        } else {
          setArticle(articleData);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch article');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticle();
  }, [id, user]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
          <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Error</h1>
            <p className="text-gray-300">{error}</p>
        <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
          Back to Home
            </Link>
      </div>
    );
  }
  
  if (!article) {
    return (
          <div className="bg-gray-800/50 border border-gray-700/50 p-6 rounded-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-gray-300">The article you're looking for doesn't exist or is not published.</p>
        <Link href="/" className="mt-4 inline-block text-blue-400 hover:text-blue-300">
          Back to Home
            </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
        <Link 
        href="/" 
          className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-6"
        >
          <Icon icon="material-symbols:arrow-back" className="h-4 w-4 mr-1" />
        Back to Home
        </Link>
        
        <article className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <AuthorInfo author={article.author as UserData} />
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            
            {article.excerpt && (
              <p className="text-xl text-gray-300 mb-6 italic border-l-4 border-blue-500 pl-4">
                {article.excerpt}
              </p>
            )}
            
            <div className="flex items-center text-sm text-gray-400 mb-8">
              <div className="flex items-center mr-4">
                <Icon icon="material-symbols:calendar-month" className="h-4 w-4 mr-1" />
                {new Date(article.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Icon icon="material-symbols:schedule" className="h-4 w-4 mr-1" />
                {Math.ceil(article.content.split(' ').length / 200)} min read
              </div>
            </div>
            
          <div className="prose prose-invert max-w-none">
              <MarkdownViewer content={article.content} />
            </div>
          </div>
        </article>
    </div>
  );
} 