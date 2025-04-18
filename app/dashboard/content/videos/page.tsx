'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Video } from '@/app/types';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  
  const supabase = createClient();
  
  const {user, error: userError} = useUserStore();
  const fetchVideos = async () => {
    if (!account?.bech32Address) return;
    
    try {
      setLoading(true);
      
      // Get current user from Supabase auth
      if (userError || !user) {
        setError('Authentication error. Please sign in again.');
        return;
      }
      
      const { data, error: videoError } = await supabase
        .from('videos')
        .select('*, author:users (id, full_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (videoError) {
        setError(videoError.message || 'Failed to fetch videos');
        return;
      }
      setVideos(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchVideos();
  }, [account?.bech32Address, user]);
  
  const deleteVideo = async (id: string) => {
    if (!account?.bech32Address) return;
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      // Get current user from Supabase auth
      if (userError || !user) {
        toast('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting video:', err);
      toast('Failed to delete video. Please try again.', 'error');
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
          Connect your wallet to manage your videos and access premium features.
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
    return <div className="text-center p-8">Loading videos...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Videos</h1>
        <Link
          href="/dashboard/content/videos/create"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Upload New Video
        </Link>
      </div>
      
      {videos.length === 0 ? (
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700/50 text-center">
          <p className="text-gray-400">You haven't uploaded any videos yet.</p>
          <Link
            href="/dashboard/content/videos/create"
            className="text-blue-400 hover:text-blue-300 mt-2 inline-block"
          >
            Upload your first video
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800/50 shadow overflow-hidden rounded-md border border-gray-700/50">
          <ul className="divide-y divide-gray-700/50">
            {videos.map((video) => (
              <li key={video.id}>
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{video.title}</h3>
                    <p className="mt-1 text-sm text-gray-400 truncate">
                      {video.description || 'No description available'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(video.created_at).toLocaleDateString()}
                      {' | '}
                      Status: {video.published ? 'Published' : 'Draft'}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex space-x-3">
                    <Link
                      href={`/dashboard/content/videos/${video.id}/edit`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
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