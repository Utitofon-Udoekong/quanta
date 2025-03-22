"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import { useContent } from '@/app/hooks/use-content';
import { VideoCameraIcon, NewspaperIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { PricingModel, ContentType } from '@prisma/client';

const contentTypes = [
  { id: ContentType.VIDEO, name: 'Video', icon: VideoCameraIcon },
  { id: ContentType.ARTICLE, name: 'Article', icon: NewspaperIcon },
  { id: ContentType.COURSE, name: 'Course', icon: AcademicCapIcon },
  { id: ContentType.SOFTWARE, name: 'Software', icon: CodeBracketIcon },
];

export default function CreateContentPage() {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    price: number;
    thumbnail: string;
    contentUrl: string;
    previewUrl: string;
    pricingModel: PricingModel;
  }>({
    title: '',
    description: '',
    price: 0,
    thumbnail: '',
    pricingModel: PricingModel.PER_USE,
    contentUrl: '',
    previewUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { createContent } = useContent({
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    }
  });

  if (!account?.bech32Address) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to create content.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setLoading(true);
    setError(null);

    try {
      await createContent({
        ...formData,
        type: selectedType,
        creatorId: account.bech32Address,
        status: 'DRAFT',
        metadataId: null, 
        pricingModel: formData.pricingModel as PricingModel,
      });
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Create New Content</h1>
          <p className="text-gray-400">Choose a content type and fill in the details</p>
        </div>
        {!selectedType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{type.name}</h3>
                      <p className="text-sm text-gray-400">
                        {type.id === ContentType.VIDEO && 'Upload and monetize your videos'}
                        {type.id === ContentType.ARTICLE && 'Create premium articles and tutorials'}
                        {type.id === ContentType.COURSE && 'Design and sell online courses'}
                        {type.id === ContentType.SOFTWARE && 'Share and monetize your software'}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  {(() => {
                    const Icon = contentTypes.find(t => t.id === selectedType)?.icon;
                    return Icon && (
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-400" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-xl font-semibold">
                      {contentTypes.find(t => t.id === selectedType)?.name}
                    </h2>
                    <p className="text-gray-400">Fill in the content details</p>
                  </div>
                </div>
                <Button
                  type="button"
                  structure="base"
                  className="text-gray-400 hover:text-white"
                  onClick={() => setSelectedType(null)}
                >
                  Change Type
                </Button>
              </div>

                
              <div className="space-y-8">
                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full block bg-[#0A0C10]/50 p-4 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter content title"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Description
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#0A0C10]/50 border-2 resize-none border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[200px]"
                    // rows={6}
                    placeholder="Describe your content"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Pricing Model
                  </label>
                  <select
                    value={formData.pricingModel}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      pricingModel: e.target.value as PricingModel,
                      price: e.target.value === PricingModel.FREE ? 0 : formData.price 
                    })}
                    className="w-full bg-[#0A0C10]/50 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value={PricingModel.FREE}>Free</option>
                    <option value={PricingModel.PER_USE}>Per Use</option>
                    <option value={PricingModel.PER_MINUTE}>Per Minute</option>
                    <option value={PricingModel.PER_WORD}>Per Word</option>
                    <option value={PricingModel.PER_FEATURE}>Per Feature</option>
                    <option value={PricingModel.PER_SECTION}>Per Section</option>
                    <option value={PricingModel.CUSTOM}>Custom</option>
                  </select>
                </div>

                {formData.pricingModel !== PricingModel.FREE && (
                  <div>
                    <label className="block text-lg font-medium text-white mb-4">
                      Price (USD)
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full bg-[#0A0C10]/50 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                    className="w-full bg-[#0A0C10]/50 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/thumbnail.jpg"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Content URL
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.contentUrl}
                    onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                    className="w-full bg-[#0A0C10]/50 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/content"
                  />
                </div>

                <div>
                  <label className="block text-lg font-medium text-white mb-4">
                    Preview URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.previewUrl}
                    onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
                    className="w-full bg-[#0A0C10]/50 border-2 border-gray-600 rounded-md text-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com/preview"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  type="button"
                  structure="base"
                  className="bg-gray-700 hover:bg-gray-600"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  structure="base"
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Content'}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 