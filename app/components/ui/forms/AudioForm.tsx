'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { Audio } from '@/app/types';

type AudioFormProps = {
  audio?: Audio;
  isEditing?: boolean;
};

export default function AudioForm({ audio, isEditing = false }: AudioFormProps) {
  const initialState = audio || {
    title: '',
    description: '',
    audio_url: '',
    duration: 0,
    published: false,
  };
  
  const [formData, setFormData] = useState(initialState);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };
  
  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    const { error, data } = await supabase.storage
      .from('audio')
      .upload(filePath, file, {
        upsert: true,
        // Simple progress simulation
        // onUploadProgress: (progress: any) => {
        //   setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
        // },
      });
      
    if (error) throw error;
    
    // Get the public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filePath);
      
    return publicUrlData.publicUrl;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in');
      
      let audioUrl = formData.audio_url;
      
      // Upload audio if a file was selected
      if (audioFile) {
        audioUrl = await uploadFile(audioFile);
      }
      
      const audioData = {
        title: formData.title,
        description: formData.description || null,
        audio_url: audioUrl,
        duration: formData.duration || null,
        published: formData.published,
      };
      
      if (isEditing && audio) {
        // Update existing audio
        const { error } = await supabase
          .from('audio')
          .update({
            ...audioData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', audio.id);
          
        if (error) throw error;
      } else {
        // Create new audio
        const { error } = await supabase
          .from('audio')
          .insert({
            ...audioData,
            user_id: userData.user.id,
          });
          
        if (error) throw error;
      }
      
      router.push('/dashboard/audio');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the audio');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      <div>
        <label htmlFor="audio" className="block text-sm font-medium text-gray-700">
          Audio File
        </label>
        <input
          type="file"
          name="audio"
          id="audio"
          accept="audio/*"
          onChange={handleFileChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        {audioFile && <p className="mt-1 text-sm text-gray-500">Selected file: {audioFile.name}</p>}
        {isEditing && !audioFile && <p className="mt-1 text-sm text-gray-500">Current audio will be kept if no new file is selected</p>}
      </div>
      
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
          Duration (seconds, optional)
        </label>
        <input
          type="number"
          name="duration"
          id="duration"
          min="0"
          value={formData.duration || ''}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      
      {/* Manual URL input as fallback */}
      <div>
        <label htmlFor="audio_url" className="block text-sm font-medium text-gray-700">
          Audio URL (if not uploading a file)
        </label>
        <input
          type="url"
          name="audio_url"
          id="audio_url"
          value={formData.audio_url}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="mt-1 text-xs text-gray-500">Only needed if not uploading a file directly</p>
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          name="published"
          id="published"
          checked={formData.published}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
          Publish this audio
        </label>
      </div>
      
      {loading && uploadProgress > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Upload Progress</label>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
        </div>
      )}
      
      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Audio' : 'Create Audio'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}