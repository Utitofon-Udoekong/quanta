'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/app/utils/supabase';
import { Audio } from '@/app/types';
import FileDropzone from './FileDropzone';
import { getDuration } from '@/app/utils/helpers';
import { uploadFileResumable } from '@/app/utils/upload';

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
    is_premium: false,
    thumbnail_url: '',
  };

  const allowedAudioTypes = {
    'audio/mp3': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/x-m4a': ['.m4a']
  };

  const allowedImageTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };

  const [formData, setFormData] = useState(initialState);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | undefined>(undefined);
  const [thumbnailError, setThumbnailError] = useState<string | undefined>(undefined);

  const router = useRouter();
  const supabase = getSupabase();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleFileSelect = (file: File) => {
    if (!Object.keys(allowedAudioTypes).includes(file.type)) {
      setError('Please select a valid audio file (MP3, WAV, OGG, or M4A)');
      return;
    }
    const duration = getDuration(file, 'audio');
    setFormData({
      ...formData,
      duration: duration,
    });
    setAudioFile(file);
    setError(undefined);
  };

  const handleThumbnailSelect = (file: File) => {
    if (!Object.keys(allowedImageTypes).includes(file.type)) {
      setThumbnailError('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    setThumbnailFile(file);
    setThumbnailError(undefined);
  };

  const uploadFile = async (file: File, bucketName: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    try {
      const publicUrl = await uploadFileResumable(
        bucketName,
        fileName,
        file,
        (percentage: number) => {
          setUploadProgress(Math.round(percentage));
        }
      );

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setThumbnailError(undefined);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in to create audio content');
      }

      let thumbnailUrl = formData.thumbnail_url;

      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }

      if (audioFile) {
        const audioUrl = await uploadFile(audioFile, 'audio');
        formData.audio_url = audioUrl;
      }

      const audioData = {
        ...formData,
        thumbnail_url: thumbnailUrl,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (audio) {
        // Update existing audio using API endpoint
        const response = await fetch(`/api/content/audio/${audio.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...audioData,
            user_id: user.id,
          }),
          next: {
            revalidate: 0, // Don't cache PUT requests
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update audio');
        }
      } else {
        // Create new audio using API endpoint
        const response = await fetch('/api/content/audio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(audioData),
          next: {
            revalidate: 0, // Don't cache POST requests
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create audio');
        }
      }

      router.push('/dashboard/content/audio');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0A0C10] text-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-200">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-200">
          Description (optional)
        </label>
        <textarea
          name="description"
          id="description"
          rows={4}
          value={formData.description || ''}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Audio File
        </label>
        <FileDropzone
          onFileSelect={handleFileSelect}
          accept={allowedAudioTypes}
          maxSize={10 * 1024 * 1024} // 10MB
          file={audioFile}
          label="Audio File"
          error={error}
          currentFileUrl={formData.audio_url}
          isEditing={isEditing}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail Image
        </label>
        <FileDropzone
          onFileSelect={handleThumbnailSelect}
          accept={allowedImageTypes}
          maxSize={5 * 1024 * 1024} // 5MB
          error={thumbnailError}
          file={thumbnailFile}
          label="Thumbnail Image"
          currentFileUrl={formData.thumbnail_url}
          isEditing={isEditing}
        />
        {formData.thumbnail_url && !thumbnailFile && (
          <div className="mt-2">
            <img
              src={formData.thumbnail_url}
              alt="Current thumbnail"
              className="h-32 w-32 object-cover rounded-lg"
        />
          </div>
        )}
      </div>

      {/* Manual URL input as fallback */}
      <div>
        <label htmlFor="audio_url" className="block text-sm font-medium text-gray-200">
          Audio URL (if not uploading a file)
        </label>
        <input
          type="url"
          name="audio_url"
          id="audio_url"
          value={formData.audio_url}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">Only needed if not uploading a file directly</p>
      </div>

      <div className="flex items-center space-x-6">
      <div className="flex items-center">
        <input
          type="checkbox"
          name="published"
          id="published"
          checked={formData.published}
          onChange={handleChange}
          className="h-4 w-4 bg-gray-900/50 border-gray-700/50 rounded text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-gray-200">
          Publish this audio
        </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_premium"
            id="is_premium"
            checked={formData.is_premium}
            onChange={handleChange}
            className="h-4 w-4 bg-gray-900/50 border-gray-700/50 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_premium" className="ml-2 block text-sm text-gray-200">
            Premium content
          </label>
        </div>
      </div>

      {loading && uploadProgress > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-200">Upload Progress</label>
          <div className="w-full bg-gray-900/50 rounded-full h-2.5 mt-1">
            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{uploadProgress}% complete</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Audio' : 'Create Audio'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex justify-center py-2 px-4 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}