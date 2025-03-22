import { useState, useCallback, useRef } from 'react';
import { Content, Metadata, User } from '@prisma/client';
import { fetchApi, ApiError } from '@/app/lib/fetch';
import useSWR from 'swr';

// This type represents what we get from Prisma when we include relations
type ContentWithRelations = Content & {
  metadata: Metadata;
  creator: User;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

interface UseContentOptions {
  onSuccess?: (data: ContentWithRelations) => void;
  onError?: (error: string) => void;
}

interface CreateContentData {
  title: string;
  description: string;
  type: string;
  price: number;
  pricingModel: string;
  status: string;
  thumbnail?: string;
  contentUrl?: string;
  previewUrl?: string;
  creatorId: string;
  metadata: Metadata;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error);
  }
  return data.data;
};

export function useContent(contentId?: string, options: UseContentOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ [key: string]: number }>({});
  const DEBOUNCE_MS = 50000; // 5 seconds debounce

  const { data: content, mutate } = useSWR<ContentWithRelations>(
    contentId ? `/api/content/${contentId}` : null,
    fetcher
  );

  const handleError = useCallback((error: Error) => {
    setError(error.message);
    options.onError?.(error.message);
  }, [options.onError]);

  const shouldFetch = useCallback((key: string) => {
    const now = Date.now();
    const lastFetch = lastFetchRef.current[key] || 0;
    
    if (now - lastFetch < DEBOUNCE_MS) {
      return false;
    }
    
    lastFetchRef.current[key] = now;
    return true;
  }, []);

  const fetchAllContent = useCallback(async () => {
    if (!shouldFetch('all')) return;
    
    setIsLoading(true);
    try {
      const data = await fetchApi<ContentWithRelations[]>('/api/content');
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, shouldFetch]);

  const fetchCreatorContent = useCallback(async (creatorId: string) => {
    if (!shouldFetch(`creator-${creatorId}`)) return;
    
    setIsLoading(true);
    try {
      const data = await fetchApi<ContentWithRelations[]>(`/api/dashboard/content?creatorId=${creatorId}`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, shouldFetch]);

  const fetchContentById = useCallback(async (id: string) => {
    if (!shouldFetch(`content-${id}`)) return;
    
    setIsLoading(true);
    try {
      const data = await fetchApi<ContentWithRelations>(`/api/content/${id}`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [handleError, shouldFetch]);

  const createContent = async (data: CreateContentData): Promise<ContentWithRelations | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create content');
      }

      options.onSuccess?.(result.data);
      return result.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create content');
      setError(error.message);
      options.onError?.(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateContent = async (
    id: string,
    data: Partial<CreateContentData>
  ): Promise<ContentWithRelations | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<ContentWithRelations> = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to update content');
      }

      await mutate(result.data);
      options.onSuccess?.(result.data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteContent = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
      });

      const result: ApiResponse<void> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete content');
      }

      await mutate(undefined);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    content,
    isLoading,
    error,
    fetchAllContent,
    fetchCreatorContent,
    fetchContentById,
    createContent,
    updateContent,
    deleteContent,
    mutate,
  };
} 