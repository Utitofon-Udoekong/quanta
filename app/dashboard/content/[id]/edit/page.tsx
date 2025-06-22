'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/utils/supabase/client';
import UnifiedContentForm from '@/app/components/ui/forms/UnifiedContentForm';
import { toast } from '@/app/components/helpers/toast';
import { Content } from '@/app/types';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind = searchParams.get('kind') || 'video';

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const tableName = kind === 'video' ? 'videos' : kind === 'audio' ? 'audio' : 'articles';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError('Failed to fetch content details.');
        console.error(error);
      } else {
        setContent({ ...data, kind });
      }
      setLoading(false);
    };

    fetchContent();
  }, [id, kind]);

  const handleSave = async (data: any, type: string) => {
    const { error } = await supabase
      .from(type === 'video' ? 'videos' : type === 'audio' ? 'audio' : 'articles')
      .update(data)
      .eq('id', id);

    if (error) {
      toast.error(error.message || 'Failed to update content.');
    } else {
      toast('Content updated successfully!');
      router.push(`/dashboard/content/${id}?kind=${type}`);
      router.refresh();
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0C10]">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Link href="/dashboard/content" className="mt-4 inline-block text-purple-400 hover:text-purple-300">
              Back to Content
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
          <Link
            href={`/dashboard/content/${id}?kind=${kind}`}
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <Icon icon="material-symbols:arrow-back" className="h-5 w-5 mr-2" />
            <span className="font-medium">Back to Content Details</span>
          </Link>
        </div>
      <h1 className="text-2xl font-bold mb-6 text-white">Edit {kind.charAt(0).toUpperCase() + kind.slice(1)}</h1>
      {content && (
        <UnifiedContentForm
          initialData={content}
          onSave={handleSave}
        />
      )}
    </div>
  );
} 