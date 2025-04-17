'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Article } from '@/app/types';

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setArticles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchArticles();
  }, []);
  
  const deleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchArticles(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting article:', err);
      alert('Failed to delete article. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading articles...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Articles</h1>
        <Link
          href="/dashboard/articles/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Create New Article
        </Link>
      </div>
      
      {articles.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p>You haven't created any articles yet.</p>
          <Link
            href="/dashboard/articles/create"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            Create your first article
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {articles.map((article) => (
              <li key={article.id}>
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{article.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {article.excerpt || article.content.substring(0, 100) + '...'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(article.created_at).toLocaleDateString()}
                      {' | '}
                      Status: {article.published ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex space-x-3">
                    <Link
                      href={`/dashboard/articles/${article.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}