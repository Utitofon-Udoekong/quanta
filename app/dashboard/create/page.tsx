"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/app/store/use-user-store';
import { useContent } from '@/app/hooks/use-content';
import { ContentData } from '@/app/lib/firebase';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select } from '@/app/components/ui/select';
import { FileUpload } from '@/app/components/ui/file-upload';
import { toast } from '@/app/components/ui/toast';
import { useAbstraxionAccount } from '@burnt-labs/abstraxion';
import { Button } from '@/app/components/ui/button';

type ContentType = 'VIDEO' | 'AUDIO' | 'COURSE';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type PricingModel = 'PAY_PER_VIEW';

export default function CreateContentPage() {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const { createContent, isLoading, error } = useContent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'VIDEO' as ContentType,
    price: 0,
    pricingModel: 'PAY_PER_VIEW' as PricingModel,
    status: 'DRAFT' as ContentStatus,
    thumbnailUrl: '',
    contentUrl: '',
    duration: 0,
  });

  const [selectedFiles, setSelectedFiles] = useState<{
    thumbnail: File | null;
    content: File | null;
  }>({
    thumbnail: null,
    content: null,
  });

  if (!account?.bech32Address) {
    return (
      <div className="min-h-screen bg-[#0A0C10] text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Authentication Required</h2>
          <p className="text-gray-400">Please connect your wallet to create content.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadError(null);

    if (!account?.bech32Address) {
      toast('You must be logged in to create content', 'error');
      setIsSubmitting(false);
      return;
    }

    if (!selectedFiles.content) {
      toast('Please select a content file', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      // Upload files first
      const uploadPromises = [];
      if (selectedFiles.thumbnail) {
        uploadPromises.push(
          uploadFile(selectedFiles.thumbnail, 'thumbnails')
            .then(url => ({ type: 'thumbnail', url }))
            .catch(err => {
              setUploadError('Failed to upload thumbnail');
              throw err;
            })
        );
      }
      if (selectedFiles.content) {
        uploadPromises.push(
          uploadFile(selectedFiles.content, 'content')
            .then(url => ({ type: 'content', url }))
            .catch(err => {
              setUploadError('Failed to upload content file');
              throw err;
            })
        );
      }

      const uploadResults = await Promise.all(uploadPromises);
      const uploadedFiles = uploadResults.reduce((acc, { type, url }) => {
        acc[type] = url;
        return acc;
      }, {} as Record<string, string>);

      const content = await createContent({
        ...formData,
        creatorId: account.bech32Address,
        thumbnailUrl: uploadedFiles.thumbnail,
        contentUrl: uploadedFiles.content,
      });

      if (content) {
        toast('Content created successfully', 'success');
        router.push(`/dashboard/content/${content.id}`);
      } else {
        toast('Failed to create content', 'error');
      }
    } catch (err) {
      console.error('Error creating content:', err);
      toast(uploadError || 'An error occurred while creating content', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (type: 'thumbnail' | 'content', file: File | null) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file,
    }));
  };

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    if (!account?.bech32Address) {
      throw new Error('Wallet address is required for upload');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', prefix);

    const response = await fetch(`/api/upload?walletAddress=${encodeURIComponent(account.bech32Address)}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const getFileAcceptTypes = (): Record<string, string[]> => {
    switch (formData.type) {
      case 'VIDEO':
        return {
          'video/*': ['.mp4', '.webm', '.ogg']
        };
      case 'AUDIO':
        return {
          'audio/*': ['.mp3', '.wav', '.ogg']
        };
      case 'COURSE':
        return {
          'video/*': ['.mp4', '.webm', '.ogg'],
          'audio/*': ['.mp3', '.wav', '.ogg'],
          'application/pdf': ['.pdf']
        };
      default:
        return {};
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Create New Content</h1>
            <p className="text-gray-400">Fill in the details to create your content</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-gray-700 hover:bg-gray-600"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Form */}
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
              <div className="space-y-6">
                <div className='flex flex-col gap-2'>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-200">
                    Title
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-200">
                    Type
                  </label>
                  <Select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['VIDEO', 'AUDIO', 'COURSE'] as ContentType[]).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-200">
                    Price
                  </label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="pricingModel" className="block text-sm font-medium text-gray-200">
                    Pricing Model
                  </label>
                  <Select
                    id="pricingModel"
                    name="pricingModel"
                    value={formData.pricingModel}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['PAY_PER_VIEW'] as PricingModel[]).map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-200">
                    Status
                  </label>
                  <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as ContentStatus[]).map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-200">
                    Duration (seconds)
                  </label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full bg-[#0A0C10]/90 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Thumbnail
                  </label>
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('thumbnail', file)}
                    prefix="thumbnails"
                    accept={{
                      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
                    }}
                    maxSize={5 * 1024 * 1024} // 5MB
                    value={selectedFiles.thumbnail}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Content File
                  </label>
                  <FileUpload
                    onFileSelect={(file) => handleFileSelect('content', file)}
                    prefix="content"
                    accept={getFileAcceptTypes()}
                    maxSize={100 * 1024 * 1024} // 100MB
                    value={selectedFiles.content}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoading}
                className="!bg-blue-600 !px-2 hover:!bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Content'
                )}
              </Button>
            </div>

            {(error || uploadError) && (
              <div className="text-red-400 text-sm mt-2">
                {error || uploadError}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 