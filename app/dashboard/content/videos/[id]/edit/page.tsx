'use client';

import { useEffect, useState, use } from 'react';
import { getSupabase } from '@/app/utils/supabase';
import VideoForm from '@/app/components/ui/forms/VideoForm';
import { Video } from '@/app/types';

export default function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {id} = use(params);
  const supabase = getSupabase();
  
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('videos')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setVideo(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch video');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideo();
  }, [id]);
  
  if (loading) {
    return <div className="text-center p-8">Loading video...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  if (!video) {
    return <div className="text-center p-8">Video not found.</div>;
  }
  
  return (
    <div className='my-8'>
      <h1 className="text-2xl font-bold mb-6">Edit Video</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <VideoForm video={video} isEditing />
      </div>
    </div>
  );
}