import { useState, useCallback } from 'react';
import { supabase, ContentData } from '@/app/lib/supabase';

interface UseContentOptions {
  onError?: (error: Error) => void;
}

interface UseContentReturn {
  content: ContentData[];
  loading: boolean;
  error: Error | null;
  fetchContent: () => Promise<void>;
  createContent: (data: Omit<ContentData, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'purchase_count'>) => Promise<ContentData>;
  deleteContent: (id: string) => Promise<boolean>;
}

export function useContent(contentId?: string, options: UseContentOptions = {}): UseContentReturn {
  const [content, setContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('content')
        .select('*')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });

      if (contentId) {
        query = query.eq('id', contentId);
      }

      const { data, error: supabaseError } = await query;

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(contentId ? [data[0]] : data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch content');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [contentId, options.onError]);

  const createContent = async (data: Omit<ContentData, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'purchase_count'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: newContent, error: supabaseError } = await supabase
        .from('content')
        .insert([{
          ...data,
          view_count: 0,
          purchase_count: 0,
        }])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(prev => [newContent, ...prev]);
      return newContent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create content');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('content')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete content');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    fetchContent,
    createContent,
    deleteContent,
  };
}

export function useCreatorContent(creatorId: string, options: UseContentOptions = {}): UseContentReturn {
  const [content, setContent] = useState<ContentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCreatorContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('content')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch creator content');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [creatorId, options.onError]);

  const createContent = async (data: Omit<ContentData, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'purchase_count'>) => {
    try {
      setLoading(true);
      setError(null);

      const { data: newContent, error: supabaseError } = await supabase
        .from('content')
        .insert([{
          ...data,
          creator_id: creatorId,
          view_count: 0,
          purchase_count: 0,
        }])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(prev => [newContent, ...prev]);
      return newContent;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create content');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteContent = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: supabaseError } = await supabase
        .from('content')
        .delete()
        .eq('id', id)
        .eq('creator_id', creatorId);

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      setContent(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete content');
      setError(error);
      options.onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    content,
    loading,
    error,
    fetchContent: fetchCreatorContent,
    createContent,
    deleteContent,
  };
} 