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

export default function UnifiedContentForm() {
  const [selectedType, setSelectedType] = useState('audio');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | undefined>(undefined);

  // Shared fields
  const [title, setTitle] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [category, setCategory] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');
  const [publishAction, setPublishAction] = useState<'now' | 'schedule' | 'draft'>('now');
  const [releaseDate, setReleaseDate] = useState('');

  // Audio/Video
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileUrl, setMainFileUrl] = useState('');
  const [duration, setDuration] = useState<number | undefined>(undefined);

  // Article
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');

  // Thumbnail
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const router = useRouter();
  const { user } = useUserStore();

  const getMissingFields = () => {
    const missing = [];
    if (!title) missing.push('Title');
    if (!category) missing.push('Category');
    if (isPremium && !price) missing.push('Price');
    if ((selectedType === 'audio' || selectedType === 'video') && !mainFile) {
      missing.push(selectedType === 'audio' ? 'Audio File' : 'Video File');
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
    console.log('Form submission initiated...');
    e.preventDefault();
    setError(null);
    setThumbnailError(undefined);
    setLoading(true);
    setUploadProgress(0);
    try {
      console.log('User from store:', user);
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
        console.log('Uploaded main file:', uploadedMainFileUrl);
      }
      // Upload thumbnail if needed
      if (thumbnailFile) {
        uploadedThumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
        console.log('Uploaded thumbnail:', uploadedThumbnailUrl);
      }

      let published: boolean;
      let release_date: string | null;

      switch (publishAction) {
        case 'now':
          published = true;
          release_date = new Date().toISOString();
          break;
        case 'schedule':
          if (!releaseDate) {
            throw new Error('Please select a release date for scheduling.');
          }
          published = false;
          release_date = new Date(releaseDate).toISOString();
          break;
        case 'draft':
        default:
          published = false;
          release_date = null;
          break;
      }

      if (selectedType === 'audio') {
        const audioData = {
          title,
          description: introduction,
          audio_url: uploadedMainFileUrl,
          duration,
          published,
          is_premium: isPremium,
          thumbnail_url: uploadedThumbnailUrl,
          category,
          user_id: user.id,
          release_date,
        };

        console.log('Audio data:', audioData);
        const response = await fetch('/api/content/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(audioData),
          next: { revalidate: 0 },
        });
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to create audio');
          return;
        }
        toast('Audio created successfully');
        router.push('/dashboard/content/audio');
        router.refresh();
      } else if (selectedType === 'video') {
        const videoData = {
          title,
          description: introduction,
          video_url: uploadedMainFileUrl,
          thumbnail_url: uploadedThumbnailUrl,
          duration,
          published,
          is_premium: isPremium,
          category,
          user_id: user.id,
          release_date,
        };
        console.log('Video data:', videoData);
        const response = await fetch('/api/content/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(videoData),
          next: { revalidate: 0 },
        });
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to create video');
          return;
        }
        toast('Video created successfully');
        router.push('/dashboard/content/videos');
        router.refresh();
      } else if (selectedType === 'article') {
        const articleData = {
          title,
          content,
          excerpt,
          published,
          is_premium: isPremium,
          thumbnail_url: uploadedThumbnailUrl,
          category,
          user_id: user.id,
          release_date,
        };
        console.log('Article data:', articleData);
        const response = await fetch('/api/content/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
          next: { revalidate: 0 },
        });
        if (!response.ok) {
          const errorData = await response.json();
          toast.error(errorData.error || 'Failed to create article');
          return;
        }
        toast('Article created successfully');
        router.push('/dashboard/content/articles');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the content');
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
        <select
          id="content-type"
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
          className="block w-full bg-gray-900/50 border border-gray-700/50 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {contentTypes.map(type => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
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
        <div className="flex rounded-lg bg-gray-900/40 p-1 space-x-1">
          <button
            type="button"
            onClick={() => setPublishAction('now')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'now' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Publish Now
          </button>
          <button
            type="button"
            onClick={() => setPublishAction('schedule')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'schedule' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Schedule
          </button>
          <button
            type="button"
            onClick={() => setPublishAction('draft')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              publishAction === 'draft' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'
            }`}
          >
            Save as Draft
          </button>
        </div>
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
        disabled={isButtonDisabled || loading} 
        className="w-full cursor-pointer bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white font-bold py-2 px-4 rounded mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            {publishAction === 'now' ? 'Publishing...' : publishAction === 'schedule' ? 'Scheduling...' : 'Saving...'}
          </>
        ) : (
          publishAction === 'now' ? 'Publish Now' : publishAction === 'schedule' ? 'Schedule Post' : 'Save Draft'
        )}
      </button>

      {isButtonDisabled && (
        <div className="mt-2 text-sm text-red-500 text-center">
          Please complete all required fields: {missingFields.join(', ')}
        </div>
      )}
    </form>
  );
} 