import { useState, useCallback, useRef } from 'react';
import { Content, Metadata } from '@/app/types/content';
import { fetchApi, ApiError } from '@/app/lib/fetch';

interface UseContentOptions {
  onError?: (error: Error) => void;
}

export function useContent(options: UseContentOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const lastFetchRef = useRef<{ [key: string]: number }>({});
  const DEBOUNCE_MS = 50000; // 5 seconds debounce

  const handleError = useCallback((error: Error) => {
    setError(error);
    options.onError?.(error);
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
    
    setLoading(true);
    try {
      const data = await fetchApi<Content[]>('/api/content');
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, shouldFetch]);

  const fetchCreatorContent = useCallback(async (creatorId: string) => {
    if (!shouldFetch(`creator-${creatorId}`)) return;
    
    setLoading(true);
    try {
      const data = await fetchApi<Content[]>(`/api/dashboard/content?creatorId=${creatorId}`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, shouldFetch]);

  const fetchContentById = useCallback(async (id: string) => {
    if (!shouldFetch(`content-${id}`)) return;
    
    setLoading(true);
    try {
      const data = await fetchApi<Content>(`/api/content/${id}`);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, shouldFetch]);

  const createContent = useCallback(async (data: Omit<Content, 'id' | 'creator' | 'metadata' | 'createdAt' | 'updatedAt' | 'viewCount' | 'purchaseCount'>) => {
    setLoading(true);
    try {
      const result = await fetchApi<Content>('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateContent = useCallback(async (id: string, data: Partial<Content>) => {
    setLoading(true);
    try {
      const result = await fetchApi<Content>(`/api/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateMetadata = useCallback(async (contentId: string, data: Partial<Metadata>) => {
    setLoading(true);
    try {
      const result = await fetchApi<Metadata>(`/api/content/${contentId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const deleteContent = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await fetchApi<void>(`/api/content/${id}`, {
        method: 'DELETE',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    loading,
    error,
    fetchAllContent,
    fetchCreatorContent,
    fetchContentById,
    createContent,
    updateContent,
    updateMetadata,
    deleteContent,
  };
} 