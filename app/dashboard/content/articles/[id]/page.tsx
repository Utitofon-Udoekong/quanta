'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import ArticleForm from '@/app/components/ui/forms/ArticleForm';
import { Article } from '@/app/types';
import { useRouter } from 'next/navigation';

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) throw error;
        setArticle(data);
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
    return <div className="text-center p-8">Loading article...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  if (!article) {
    return <div className="text-center p-8">Article not found.</div>;
  }
  
  return (
    <div className='my-8'>
      <h1 className="text-2xl font-bold mb-6">Edit Article</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <ArticleForm article={article} isEditing />
      </div>
    </div>
  );
}