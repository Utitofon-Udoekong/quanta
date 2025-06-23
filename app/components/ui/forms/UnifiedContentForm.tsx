'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/app/utils/supabase/client';
import { getDuration } from '@/app/utils/helpers';
import { uploadFileResumable } from '@/app/utils/upload';
import FileDropzone from './FileDropzone';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import { toast } from '@/app/components/helpers/toast';
import 'katex/dist/katex.min.css';
import { Icon } from '@iconify/react';
import { useUserStore } from '@/app/stores/user';

const contentTypes = [
  { id: 'audio', name: 'Audio' },
  { id: 'video', name: 'Video' },
  { id: 'article', name: 'Article' },
];

const categories = [
  'Music', 'Podcast', 'Education', 'Entertainment', 'News', 'Other'
];

const subtitleLanguages = [
  'None', 'English', 'Spanish', 'French', 'German', 'Chinese', 'Other'
];

const allowedAudioTypes = {
  'audio/mp3': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/x-m4a': ['.m4a']
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

export default function UnifiedContentForm({
  initialData,
  onSave,
}: {
  initialData?: any;
  onSave: (data: any, type: string) => Promise<void>;
}) {
  const [selectedType, setSelectedType] = useState(initialData?.kind || 'audio');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | undefined>(undefined);

  // Shared fields
  const [title, setTitle] = useState(initialData?.title || '');
  const [introduction, setIntroduction] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [isPremium, setIsPremium] = useState(initialData?.is_premium || false);
  const [price, setPrice] = useState(initialData?.price || '');
  const [publishAction, setPublishAction] = useState<'now' | 'schedule' | 'draft'>(initialData?.published ? 'now' : 'draft');
  const [releaseDate, setReleaseDate] = useState(initialData?.release_date || '');

  // Audio/Video
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileUrl, setMainFileUrl] = useState(initialData?.audio_url || initialData?.video_url || '');
  const [duration, setDuration] = useState<number | undefined>(initialData?.duration);

  // Article
  const [content, setContent] = useState(initialData?.content || '');
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Thumbnail
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || '');

  const router = useRouter();
  const { user } = useUserStore();
  const isEditing = !!initialData;
  const isAlreadyPublished = initialData?.published;

  const getMissingFields = () => {
    const missing = [];
    if (!title) missing.push('Title');
    if (!category) missing.push('Category');
    if (isPremium && !price) missing.push('Price');
    if ((selectedType === 'audio' || selectedType === 'video') && !mainFile && !mainFileUrl) {
      missing.push(selectedType === 'audio' ? 'Audio File' : 'Video File');
    }
    if (!thumbnailFile && !thumbnailUrl) {
      missing.push('Thumbnail');
    }
    if (selectedType === 'article' && !content) missing.push('Article Content');
    if (publishAction === 'schedule' && !releaseDate) missing.push('Release Date');
    return missing;
  };

  const missingFields = getMissingFields();
  const isButtonDisabled = missingFields.length > 0;


  // File handlers
  const handleMainFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setError(null);
      if (selectedType === 'audio') {
        if (!Object.keys(allowedAudioTypes).includes(file.type)) {
          setError('Please select a valid audio file (MP3, WAV, OGG, or M4A)');
          return;
        }
        setDuration(getDuration(file, 'audio'));
      } else if (selectedType === 'video') {
        if (!Object.keys(allowedVideoTypes).includes(file.type)) {
          setError('Please select a valid video file (MP4, WEBM, OGV, MOV)');
          return;
        }
        setDuration(getDuration(file, 'video'));
      }
      setMainFile(file);
    }
  };

  const handleThumbnailInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!Object.keys(allowedImageTypes).includes(file.type)) {
        setThumbnailError('Please select a valid image file (JPEG, PNG, or WebP)');
        return;
      }
      setThumbnailFile(file);
      setThumbnailError(undefined);
    }
  };

  // Upload logic
  const uploadFile = async (file: File, bucketName: string) => {
    console.log('Uploading file:', file, 'to bucket:', bucketName);
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    try {
      const publicUrl = await uploadFileResumable(
        bucketName,
        fileName,
        file,
        (percentage: number) => setUploadProgress(Math.round(percentage))
      );
      return publicUrl;
    } catch (error) {
      setError('Error uploading file');
      toast.error('Error uploading file');
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  // Submission logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setThumbnailError(undefined);
    setLoading(true);
    setUploadProgress(0);
    
    try {
      if (!user) {
        toast.error('You must be logged in to create content.');
        setLoading(false);
        return;
      }

      let uploadedMainFileUrl = mainFileUrl;
      let uploadedThumbnailUrl = thumbnailUrl;

      // Upload main file if needed
      if ((selectedType === 'audio' || selectedType === 'video') && mainFile) {
        uploadedMainFileUrl = await uploadFile(mainFile, selectedType === 'audio' ? 'audio' : 'videos');
      }
      // Upload thumbnail if needed
      if (thumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }

      const published = publishAction === 'now';
      const release_date = publishAction === 'schedule' && releaseDate ? new Date(releaseDate).toISOString() : null;

      // For editing published content, always keep it published
      let finalPublished = published;
      let finalReleaseDate = release_date;
      
      if (isEditing && isAlreadyPublished) {
        finalPublished = true; // Keep published content published
        finalReleaseDate = null; // Clear any scheduled release date
      }

      const baseData = {
          title,
        category,
          is_premium: isPremium,
          thumbnail_url: uploadedThumbnailUrl,
        published: finalPublished,
        release_date: finalReleaseDate,
          user_id: user.id,
      };

      let finalData;

      if (selectedType === 'audio') {
        finalData = { ...baseData, description: introduction, audio_url: uploadedMainFileUrl, duration };
      } else if (selectedType === 'video') {
        finalData = { ...baseData, description: introduction, video_url: uploadedMainFileUrl, duration };
      } else if (selectedType === 'article') {
        finalData = { ...baseData, content, excerpt };
      }

      await onSave(finalData, selectedType);

    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0A0C10] text-white p-6 rounded-lg" noValidate>
      {/* Content Type Dropdown */}
      <div>
        <label htmlFor="content-type" className="block text-sm font-medium text-gray-200 mb-1">
          Content Type
        </label>
        <div className="flex rounded-lg bg-gray-900/40 p-1 space-x-1">
          {contentTypes.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedType === type.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 bg-gray-700 hover:bg-gray-600'
              }`}
              disabled={isEditing}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          required
        />
      </div>

      {/* Introduction */}
      <div>
        <input
          type="text"
          placeholder="Introduction"
          value={introduction}
          onChange={e => setIntroduction(e.target.value)}
          className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Main File Upload (audio/video only) */}
      {(selectedType === 'audio' || selectedType === 'video') && (
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-8 bg-gray-900/30">
          <input type="file" accept={selectedType === 'audio' ? 'audio/*' : 'video/*'} onChange={handleMainFileInput} className="hidden" id="main-file-upload" />
          <label htmlFor="main-file-upload" className="flex flex-col items-center cursor-pointer">
            <span className="text-4xl mb-2">🎵</span>
            <span className="text-gray-400">Upload your {selectedType === 'audio' ? 'Audio' : 'Video'}/drag and drop {selectedType} file from your library</span>
            {mainFile && <span className="mt-2 text-green-400">{mainFile.name}</span>}
          </label>
        </div>
      )}

      {/* Article Content (Markdown Editor) */}
      {selectedType === 'article' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-300">
              Content
            </label>
            <button
              type="button"
              onClick={() => setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit')}
              className="flex items-center text-sm text-gray-400 hover:text-white"
            >
              {previewMode === 'preview' ? (
                <>
                  <Icon icon="material-symbols:edit" className="h-4 w-4 mr-1" />
                  Edit
                </>
              ) : (
                <>
                  <Icon icon="material-symbols:visibility" className="h-4 w-4 mr-1" />
                  Preview
                </>
              )}
            </button>
          </div>
          <div data-color-mode="dark" className="mt-1">
            <MDEditor
              value={content}
              onChange={(value: string | undefined) => setContent(value || '')}
              height={400}
              preview={previewMode}
              previewOptions={{
                rehypePlugins: [[rehypeKatex, rehypeSanitize, rehypeExternalLinks]],
                remarkPlugins: [[remarkGfm, remarkMath]],
              }}
              className="bg-gray-800"
            />
          </div>
          {previewMode === 'edit' && (
            <div className="mt-2 text-xs text-gray-500">
              <p>You can use Markdown formatting to style your article. Learn more about Markdown <a href="https://www.markdownguide.org/cheat-sheet/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline">here</a>.</p>
            </div>
          )}
        </div>
      )}

      {/* Summary/Body for audio/video */}
      {(selectedType === 'audio' || selectedType === 'video') && (
        <div>
          <textarea
            placeholder="Type post summary..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={4}
          />
        </div>
      )}

      {/* Premium/Free Dropdown and Price */}
      <div className="flex items-center space-x-4">
        <select
          value={isPremium ? 'premium' : 'free'}
          onChange={e => setIsPremium(e.target.value === 'premium')}
          className="block bg-gray-900/50 border border-gray-700/50 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        {isPremium && (
          <>
            <span className="text-gray-400">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="150"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-24 bg-gray-900/50 border border-gray-700/50 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </>
        )}
      </div>

      {/* Thumbnail Upload */}
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-lg p-8 bg-gray-900/30">
        <input type="file" accept="image/*" onChange={handleThumbnailInput} className="hidden" id="thumbnail-upload" />
        <label htmlFor="thumbnail-upload" className="flex flex-col items-center cursor-pointer">
          <span className="text-4xl mb-2">🖼️</span>
          <span className="text-gray-400">Upload your Thumbnail/drag and drop Thumbnail file from your library</span>
          {thumbnailFile && <span className="mt-2 text-green-400">{thumbnailFile.name}</span>}
        </label>
      </div>

      {/* Category/Genre */}
      <div>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="block w-full bg-gray-900/50 border border-gray-700/50 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">-Select Category/Genre-</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Publishing Options */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">Publishing Options</label>
        {isEditing && isAlreadyPublished && (
          <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <Icon icon="material-symbols:info" className="inline h-4 w-4 mr-1" />
              This content is already published and cannot be unpublished.
            </p>
          </div>
        )}
        <div className="flex rounded-lg bg-gray-900/40 p-1 space-x-1">
          <button
            type="button"
            onClick={() => setPublishAction('now')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'now' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
            disabled={isEditing && isAlreadyPublished}
          >
            Publish Now
          </button>
          <button
            type="button"
            onClick={() => setPublishAction('schedule')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'schedule' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
            disabled={isEditing && isAlreadyPublished}
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setPublishAction('draft')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'draft' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            } ${isEditing && isAlreadyPublished ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isEditing && isAlreadyPublished}
          >
            Save as Draft
          </button>
        </div>
        {isEditing && isAlreadyPublished && (
          <p className="text-xs text-gray-500 mt-2">
            Published content remains published. You can only update other fields.
          </p>
        )}
      </div>

      {/* Release Date Picker */}
      {publishAction === 'schedule' && (
        <div>
          <label htmlFor="release-date" className="block text-sm font-medium text-gray-200 mb-1">
            Release Date
          </label>
          <input
            type="datetime-local"
            id="release-date"
            value={releaseDate}
            onChange={e => setReleaseDate(e.target.value)}
            className="mt-1 block w-full bg-gray-900/50 border border-gray-700/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required={publishAction === 'schedule'}
          />
          <p className="text-xs text-gray-500 mt-1">Schedule your content to be released at a future date.</p>
        </div>
      )}

      {/* Publish Button */}
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || isButtonDisabled}
      >
        {loading
          ? `Uploading... ${uploadProgress}%`
          : (isEditing ? 'Save Changes' : 'Create Content')}
      </button>

      {isButtonDisabled && (
        <div className="mt-2 text-sm text-red-500 text-center">
          Please complete all required fields: {missingFields.join(', ')}
        </div>
      )}
    </form>
  );
} 