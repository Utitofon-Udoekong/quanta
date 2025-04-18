'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { Video } from '@/app/types';
import FileDropzone from './FileDropzone';
import { getDuration } from '@/app/utils/helpers';
import { uploadFileResumable } from '@/app/utils/upload';
import { toast } from '@/app/components/helpers/toast';

type VideoFormProps = {
  video?: Video;
  isEditing?: boolean;
};

export default function VideoForm({ video, isEditing = false }: VideoFormProps) {
  const initialState = video || {
    title: '',
    description: '',
    video_url: '',
    thumbnail_url: '',
    duration: 0,
    published: false,
  };
  
  const allowedVideoTypes = {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/ogg': ['.ogv'],
    'video/quicktime': ['.mov']
  };

  const allowedImageTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };
  
  const [formData, setFormData] = useState(initialState);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [thumbnailError, setThumbnailError] = useState<string | undefined>();
  
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
  
  const handleVideoSelect = (file: File) => {
    const duration = getDuration(file, 'video');
    setFormData({
      ...formData,
      duration: duration,
    });
    setVideoFile(file);
    setError(undefined);
  };

  const handleThumbnailSelect = (file: File) => {
    setThumbnailFile(file);
    setThumbnailError(undefined);
  };
  
  const uploadFile = async (file: File, bucketName: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    
    try {
      // Use the resumable upload function
      const publicUrl = await uploadFileResumable(
        bucketName,
        fileName,
        file,
        (percentage) => {
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
    setLoading(true);
    setError(undefined);
    setThumbnailError(undefined);
    setUploadProgress(0);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in');
      
      let videoUrl = formData.video_url;
      let thumbnailUrl = formData.thumbnail_url;
      
      // Upload video if a file was selected
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'videos');
      }
      
      // Upload thumbnail if a file was selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }
      
      const videoData = {
        title: formData.title,
        description: formData.description || undefined,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || undefined,
        duration: formData.duration || undefined,
        published: formData.published,
      };
      
      if (isEditing && video) {
        // Update existing video
        const { error } = await supabase
          .from('videos')
          .update({
            ...videoData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', video.id);
          
        if (error) throw error;
        toast('Video updated successfully', 'success');
      } else {
        // Create new video
        const { error } = await supabase
          .from('videos')
          .insert({
            ...videoData,
            user_id: userData.user.id,
          });
          
        if (error) throw error;
        toast('Video created successfully', 'success');
      }
      
      router.push('/dashboard/content/videos');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the video');
      console.error(err);
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
          Video File
        </label>
        <FileDropzone
          onFileSelect={handleVideoSelect}
          accept={allowedVideoTypes}
          maxSize={50 * 1024 * 1024} // 50MB
          file={videoFile}
          label="Video File"
          error={error}
          currentFileUrl={formData.video_url}
          isEditing={isEditing}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Thumbnail Image (optional)
        </label>
        <FileDropzone
          onFileSelect={handleThumbnailSelect}
          accept={allowedImageTypes}
          maxSize={5 * 1024 * 1024} // 5MB
          file={thumbnailFile}
          label="Thumbnail"
          error={thumbnailError}
          currentFileUrl={formData.thumbnail_url}
          isEditing={isEditing}
        />
      </div>
      
      {/* Manual URL input as fallback */}
      <div>
        <label htmlFor="video_url" className="block text-sm font-medium text-gray-200">
          Video URL (if not uploading a file)
        </label>
        <input
          type="url"
          name="video_url"
          id="video_url"
          value={formData.video_url}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
          className="h-4 w-4 bg-gray-900/50 border-gray-700/50 rounded text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="published" className="ml-2 block text-sm text-gray-200">
          Publish this video
        </label>
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
          {loading ? 'Saving...' : isEditing ? 'Update Video' : 'Create Video'}
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