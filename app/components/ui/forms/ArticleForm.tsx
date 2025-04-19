'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { Article } from '@/app/types';
import { toast } from '@/app/components/helpers/toast';
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeExternalLinks from 'rehype-external-links';
import rehypeKatex from 'rehype-katex';
import FileDropzone from '@/app/components/ui/forms/FileDropzone';
import { uploadFileResumable } from '@/app/utils/upload';
import 'katex/dist/katex.min.css';

type ArticleFormProps = {
  article?: Article;
  isEditing?: boolean;
};

export default function ArticleForm({ article, isEditing = false }: ArticleFormProps) {
  const initialState = article || {
    title: '',
    content: '',
    excerpt: '',
    published: false,
    is_premium: false,
    thumbnail_url: '',
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailError, setThumbnailError] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  const allowedImageTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
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
    setLoading(true);
    setError(null);
    setThumbnailError(undefined);
    setUploadProgress(0);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('You must be logged in');

      let thumbnailUrl = formData.thumbnail_url;

      // Upload thumbnail if a file was selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'thumbnails');
      }

      if (isEditing && article) {
        // Update existing article
        const { error } = await supabase
          .from('articles')
          .update({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt || null,
            published: formData.published,
            is_premium: formData.is_premium,
            thumbnail_url: thumbnailUrl || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', article.id);

        if (error) throw error;
      } else {
        // Create new article
        const { error } = await supabase
          .from('articles')
          .insert({
            title: formData.title,
            content: formData.content,
            excerpt: formData.excerpt || null,
            published: formData.published,
            is_premium: formData.is_premium,
            thumbnail_url: thumbnailUrl || null,
            user_id: userData.user.id,
          });

        if (error) throw error;
      }
      toast('Article saved successfully', 'success');
      router.push('/dashboard/content/articles');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the article');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePreviewMode = () => {
    setPreviewMode(previewMode === 'edit' ? 'preview' : 'edit');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#0A0C10] text-white p-6 rounded-lg">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Title
        </label>
        <input
          type="text"
          name="title"
          id="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-gray-300">
          Excerpt (optional)
        </label>
        <input
          type="text"
          name="excerpt"
          id="excerpt"
          value={formData.excerpt || ''}
          onChange={handleChange}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
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

      <div>
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="content" className="block text-sm font-medium text-gray-300">
            Content
          </label>
          <button
            type="button"
            onClick={togglePreviewMode}
            className="flex items-center text-sm text-gray-400 hover:text-white"
          >
            {previewMode === 'preview' ? (
              <>
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-1" />
                Preview
              </>
            )}
          </button>
        </div>

        <div data-color-mode="dark" className="mt-1">
          <MDEditor
            value={formData.content}
            onChange={(value: string | undefined) => setFormData({ ...formData, content: value || '' })}
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

      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="published"
            id="published"
            checked={formData.published}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-300">
            Publish this article
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_premium"
            id="is_premium"
            checked={formData.is_premium}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-700 rounded bg-gray-800"
          />
          <label htmlFor="is_premium" className="ml-2 block text-sm text-gray-300">
            Premium content
          </label>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {loading ? 'Saving...' : isEditing ? 'Update Article' : 'Create Article'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex justify-center py-2 px-4 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}