'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Audio } from '@/app/types';

export default function AudioPage() {
  const [audioFiles, setAudioFiles] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();
  
  const fetchAudio = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audio')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setAudioFiles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audio files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAudio();
  }, []);
  
  const deleteAudio = async (id: string) => {
    if (!confirm('Are you sure you want to delete this audio file?')) return;
    
    try {
      const { error } = await supabase
        .from('audio')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchAudio(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting audio:', err);
      alert('Failed to delete audio. Please try again.');
    }
  };
  
  if (loading) {
    return <div className="text-center p-8">Loading audio files...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">Error: {error}</div>;
  }
  
  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown duration';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Audio Files</h1>
        <Link
          href="/dashboard/audio/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Upload New Audio
        </Link>
      </div>
      
      {audioFiles.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p>You haven't uploaded any audio files yet.</p>
          <Link
            href="/dashboard/audio/create"
            className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
          >
            Upload your first audio file
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-md">
          <ul className="divide-y divide-gray-200">
            {audioFiles.map((audio) => (
              <li key={audio.id}>
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{audio.title}</h3>
                    <p className="mt-1 text-sm text-gray-500 truncate">
                      {audio.description || 'No description'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Created: {new Date(audio.created_at).toLocaleDateString()}
                      {audio.duration && ` | Duration: ${formatDuration(audio.duration)}`}
                      {' | '}
                      Status: {audio.published ? 'Published' : 'Draft'}
                    </p>
                    
                    {/* Audio player */}
                    <div className="mt-2">
                      <audio 
                        controls 
                        className="w-full max-w-md" 
                        src={audio.audio_url}
                      >
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex space-x-3">
                    <Link
                      href={`/dashboard/audio/${audio.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteAudio(audio.id)}
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