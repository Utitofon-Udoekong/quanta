'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import Link from 'next/link';
import { Audio } from '@/app/types';
import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '@/app/stores/user';
import { PlusIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import AudioCard from '@/app/components/ui/dashboard/AudioCard';
import EmptyState from '@/app/components/ui/dashboard/EmptyState';

export default function AudioPage() {
  const [audioFiles, setAudioFiles] = useState<Audio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal] = useModal();
  const supabase = createClient();
  const {user, error: userError} = useUserStore();

  const fetchAudioFiles = async () => {
    if (!account?.bech32Address) return;
    
    try {
      setLoading(true);
      
      // Get current user from Supabase auth
      if (userError || !user) {
        setError('Authentication error. Please sign in again.');
        return;
      }
      
      const { data, error: audioError } = await supabase
        .from('audio')
        .select('*, author:users (id, full_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (audioError) {
        setError(audioError.message || 'Failed to fetch audio files');
        return;
      }
      setAudioFiles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audio files');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAudioFiles();
  }, [account?.bech32Address, user]);
  
  const deleteAudio = async (id: string) => {
    if (!account?.bech32Address) return;
    if (!confirm('Are you sure you want to delete this audio file?')) return;
    
    try {
      // Get current user from Supabase auth
      if (userError || !user) {
        toast('Authentication error. Please sign in again.', 'error');
        return;
      }
      
      const { error } = await supabase
        .from('audio')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      fetchAudioFiles(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting audio:', err);
      toast('Failed to delete audio. Please try again.', 'error');
    }
  };
  
  if (!account?.bech32Address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to manage your audio files and access premium features.
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Audio Files</h2>
        <Link
          href="/dashboard/content/audio/create"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Upload New Audio
        </Link>
      </div>
      
      {audioFiles.length === 0 ? (
        <EmptyState
          title="No Audio Files Yet"
          description="You haven't uploaded any audio files yet."
          actionText="Upload your first audio file"
          actionHref="/dashboard/content/audio/create"
          icon={<MusicalNoteIcon className="w-8 h-8" />}
          color="purple"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audioFiles.map((audio) => (
            <AudioCard 
              key={audio.id} 
              audio={audio} 
              onDelete={deleteAudio} 
            />
          ))}
        </div>
      )}
    </div>
  );
}