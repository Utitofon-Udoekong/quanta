'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Article } from '@/app/types';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { toast } from '@/app/components/helpers/toast';
import ArticleCard from '@/app/components/ui/dashboard/ArticleCard';
import EmptyState from '@/app/components/ui/dashboard/EmptyState';
import { useUserStore } from '@/app/stores/user';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const {user, error: userError} = useUserStore();
  const supabase = createClient();
  
  const fetchArticles = async () => {
    
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Articles</h2>
        <Link
          href="/dashboard/content/articles/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create New Article
        </Link>
      </div>
      
      {articles.length === 0 ? (
        <EmptyState
          title="No Articles Yet"
          description="You haven't created any articles yet."
          actionText="Create your first article"
          actionHref="/dashboard/content/articles/create"
          icon={<DocumentTextIcon className="w-8 h-8" />}
          color="blue"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
            <ArticleCard 
              key={article.id} 
              article={article} 
              onDelete={deleteArticle} 
            />
            ))}
        </div>
      )}
    </div>
  );
}