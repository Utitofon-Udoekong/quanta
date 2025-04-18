'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import AudioForm from '@/app/components/ui/forms/AudioForm';
import { Audio } from '@/app/types';
import { useRouter } from 'next/navigation';

export default function EditAudioPage({ params }: { params: { id: string } }) {
  const [audio, setAudio] = useState<Audio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    const fetchAudio = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('audio')
          .select('*')
          .eq('id', params.id)
          .single();
          
        if (error) throw error;
        setAudio(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch audio');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAudio();
  }, [params.id]);
  
  if (loading) {
    return <div className="text-center p-8">Loading audio...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  if (!audio) {
    return <div className="text-center p-8">Audio not found.</div>;
  }
  
  return (
    <div className='my-8'>
      <h1 className="text-2xl font-bold mb-6">Edit Audio</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <AudioForm audio={audio} isEditing />
      </div>
    </div>
  );
}