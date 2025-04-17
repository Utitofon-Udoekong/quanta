"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";

type ContentType = 'VIDEO' | 'AUDIO' | 'COURSE';
type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type PricingModel = 'PAY_PER_VIEW' | 'PER_USE';

interface ContentData {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  status: ContentStatus;
  price: number;
  pricing_model: PricingModel;
  creator_id: string;
  thumbnail_url?: string;
  content_url: string;
  preview_url?: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

interface ContentEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface FormData {
  title: string;
  description: string;
  price: number;
  thumbnail_url: string;
  content_url: string;
  preview_url: string;
  status: ContentStatus;
  type: ContentType;
  duration: number;
  pricing_model: PricingModel;
}

export default function ContentEditPage({ params }: ContentEditPageProps) {
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageParams, setPageParams] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    price: 0,
    thumbnail_url: '',
    content_url: '',
    preview_url: '',
    status: 'DRAFT',
    type: 'VIDEO',
    duration: 0,
    pricing_model: 'PER_USE',
  });

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPageParams(resolvedParams);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!pageParams) return;

      try {
        const response = await fetch(`/api/content/${pageParams.id}`);
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        
        setContent(data);
        setFormData({
          title: data.title,
          description: data.description,
          price: data.price,
          thumbnail_url: data.thumbnail_url || '',
          content_url: data.content_url || '',
          preview_url: data.preview_url || '',
          status: data.status as ContentStatus,
          type: data.type as ContentType,
          duration: data.duration,
          pricing_model: data.pricing_model as PricingModel,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (account?.bech32Address) {
      fetchContent();
    }
  }, [account?.bech32Address, pageParams?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (!account?.bech32Address) {
      setError('Please connect your wallet to update content');
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`/api/content/${pageParams?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          creator_id: account.bech32Address,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (!account?.bech32Address) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to edit content.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-400 mb-2">Content Not Found</h2>
          <p className="text-gray-400 mb-4">The content you're trying to edit doesn't exist or you don't have permission to edit it.</p>
          <Button
            onClick={() => router.push('/dashboard')}
            structure="base"
            className="bg-gray-700 hover:bg-gray-600"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Edit Content</h1>
            <p className="text-gray-400">Update your content details</p>
          </div>
          <Button
            onClick={() => router.push('/dashboard')}
            structure="base"
            className="bg-gray-700 hover:bg-gray-600"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Edit Form */}
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-6">
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-200">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-200">
                    Description
                  </label>
                  <textarea
                    id="description"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-200">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    id="price"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-200">
                    Content Type
                  </label>
                  <select
                    id="type"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['VIDEO', 'AUDIO', 'COURSE'] as ContentType[]).map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-200">
                    Pricing Model
                  </label>
                  <select
                    id="pricing_model"
                    required
                    value={formData.pricing_model}
                    onChange={(e) => setFormData({ ...formData, pricing_model: e.target.value as PricingModel })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['PAY_PER_VIEW', 'PER_USE'] as PricingModel[]).map(model => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-200">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    required
                    min="0"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-200">
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as ContentStatus[]).map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-200">
                    Thumbnail URL
                  </label>
                  <input
                    type="url"
                    id="thumbnail_url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="content_url" className="block text-sm font-medium text-gray-200">
                    Content URL
                  </label>
                  <input
                    type="url"
                    id="content_url"
                    required
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="preview_url" className="block text-sm font-medium text-gray-200">
                    Preview URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="preview_url"
                    value={formData.preview_url}
                    onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                    className="mt-1 block w-full bg-gray-900/50 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    structure="base"
                    className="bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    structure="base"
                    className="bg-blue-600 hover:bg-blue-500"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 