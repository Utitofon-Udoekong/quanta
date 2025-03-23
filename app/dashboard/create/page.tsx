"use client";

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useContent } from '@/app/hooks/use-content';
import { createMetadata } from '@/app/lib/metadata';
import { ContentType, PricingModel, ContentStatus, Metadata } from '@prisma/client';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select } from '@/app/components/ui/select';
import { FileUpload } from '@/app/components/ui/file-upload';
import { toast } from '@/app/components/ui/toast';

export default function CreateContentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { createContent, isLoading, error } = useContent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ContentType.VIDEO,
    price: 0,
    pricingModel: PricingModel.FREE,
    status: ContentStatus.DRAFT,
    thumbnail: '',
    contentUrl: '',
    previewUrl: '',
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast('You must be logged in to create content', 'error');
      return;
    }

    try {
      const metadata = createMetadata(formData.type, {
        thumbnail: formData.thumbnail,
        contentUrl: formData.contentUrl,
        previewUrl: formData.previewUrl,
      });
      const content = await createContent({
        ...formData,
        creatorId: session.user.id,
        metadata: metadata as Metadata,
      });

      if (content) {
        toast('Content created successfully', 'success');
        router.push(`/dashboard/content/${content.id}`);
      } else {
        toast('Failed to create content', 'error');
      }
    } catch (err) {
      toast('An error occurred while creating content', 'error');
    }
  };

  const handleFileUpload = (key: string, url: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: url,
    }));
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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
                <div>
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
                    {Object.values(ContentType).map(type => (
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
                    {Object.values(PricingModel).map(model => (
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
                    {Object.values(ContentStatus).map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Thumbnail
                  </label>
                  <FileUpload
                    onUploadComplete={key => handleFileUpload('thumbnail', key)}
                    prefix="thumbnails"
                    accept={{
                      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
                    }}
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Content File
                  </label>
                  <FileUpload
                    onUploadComplete={key => handleFileUpload('contentUrl', key)}
                    prefix="content"
                    accept={{
                      'video/*': ['.mp4', '.webm', '.ogg'],
                      'audio/*': ['.mp3', '.wav', '.ogg'],
                      'application/pdf': ['.pdf'],
                      'text/markdown': ['.md'],
                      'text/plain': ['.txt'],
                      'application/zip': ['.zip']
                    }}
                    maxSize={100 * 1024 * 1024} // 100MB
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Preview File
                  </label>
                  <FileUpload
                    onUploadComplete={key => handleFileUpload('previewUrl', key)}
                    prefix="previews"
                    accept={{
                      'video/*': ['.mp4', '.webm', '.ogg'],
                      'audio/*': ['.mp3', '.wav', '.ogg'],
                      'application/pdf': ['.pdf'],
                      'text/markdown': ['.md'],
                      'text/plain': ['.txt'],
                      'application/zip': ['.zip']
                    }}
                    maxSize={50 * 1024 * 1024} // 50MB
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
              >
                {isLoading ? 'Creating...' : 'Create Content'}
              </Button>
            </div>

            {error && (
              <div className="text-red-400 text-sm mt-2">{error}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
} 