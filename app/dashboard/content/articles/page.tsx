'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Article } from '@/app/types';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { toast } from '@/app/components/helpers/toast';
import ArticleCard from '@/app/components/ui/dashboard/ArticleCard';
import { useUserStore } from '@/app/stores/user';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const {user, error: userError} = useUserStore();
  const supabase = createClient();
  
  const fetchArticles = async () => {
    if (!account?.bech32Address) return;
    
    try {
      setLoading(true);
      
      // Get current user from Supabase auth
      if (userError || !user) {
        setError('Authentication error. Please sign in again.');
        return;
      }
      
      const { data, error: articleError } = await supabase
        .from('articles')
        .select(`
          *,
          author:users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (articleError) {
        toast(articleError.message || 'Failed to fetch articles', 'error');
        return;
      }
      setArticles(data || []);
    } catch (err: any) {
      toast(err.message || 'Failed to fetch articles', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchArticles();
  }, [account?.bech32Address]);
  
  const deleteArticle = async (id: string) => {
    if (!account?.bech32Address) return;
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      // Get current user from Supabase auth
      const {user, error: userError} = useUserStore();
      if (userError || !user) {
        toast('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) {
        toast(error.message || 'Failed to delete article', 'error');
        return;
      }
      fetchArticles(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting article:', err);
      toast('Failed to delete article. Please try again.', 'error');
    }
  };
  
  if (!account?.bech32Address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to manage your articles and access premium features.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
        <Abstraxion onClose={() => setShowModal(false)} />
      </div>
    );
  }
  
  if (loading) {
    return <div className="text-center p-8">Loading articles...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link
          href="/dashboard/content/articles/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Create New Article
        </Link>
      </div>
      
      {articles.length === 0 ? (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 text-center">
          <p className="text-gray-400">You haven't created any articles yet.</p>
          <Link
            href="/dashboard/content/articles/create"
            className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="relative group">
              <ArticleCard article={article} />
              <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/dashboard/content/articles/${article.id}`}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={() => deleteArticle(article.id)}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}