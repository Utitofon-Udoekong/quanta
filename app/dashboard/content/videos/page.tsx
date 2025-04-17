'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Video } from '@/app/types';

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
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
  }, []);
  
  const deleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchVideos(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading videos...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Videos</h1>
        <Link
          href="/dashboard/videos/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload New Video
        </Link>
      </div>
      
      {videos.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p>You haven't uploaded any videos yet.</p>
          <Link
            href="/dashboard/videos/create"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            Upload your first video
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {videos.map((video) => (
              <li key={video.id}>
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      {video.thumbnail_url && (
                        <div className="flex-shrink-0 mr-4">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="h-16 w-24 object-cover rounded"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{video.title}</h3>
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          {video.description || 'No description'}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Created: {new Date(video.created_at).toLocaleDateString()}
                          {video.duration && ` | Duration: ${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}`}
                          {' | '}
                          Status: {video.published ? 'Published' : 'Draft'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex space-x-3">
                    <Link
                      href={`/dashboard/videos/${video.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteVideo(video.id)}
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