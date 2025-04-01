import { useState } from 'react';
import { ContentData } from '@/app/lib/supabase';

interface ContentFormProps {
  onSubmit: (data: Partial<ContentData>) => Promise<void>;
  initialData?: Partial<ContentData>;
}

export function ContentForm({ onSubmit, initialData }: ContentFormProps) {
  const [formData, setFormData] = useState<Partial<ContentData>>({
    title: '',
    description: '',
    type: 'VIDEO',
    price: 0,
    pricing_model: 'PER_USE',
    content_url: '',
    thumbnail_url: '',
    duration: 0,
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-200">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-200">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-200">
          Content Type
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="VIDEO">Video</option>
          <option value="AUDIO">Audio</option>
        </select>
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-200">
          Price
        </label>
        <input
          type="number"
          id="price"
          name="price"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="pricing_model" className="block text-sm font-medium text-gray-200">
          Pricing Model
        </label>
        <select
          id="pricing_model"
          name="pricing_model"
          value={formData.pricing_model}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        >
          <option value="PER_USE">Per Use</option>
          <option value="PER_MINUTE">Per Minute</option>
          <option value="CUSTOM">Custom</option>
        </select>
      </div>

      <div>
        <label htmlFor="content_url" className="block text-sm font-medium text-gray-200">
          Content URL
        </label>
        <input
          type="url"
          id="content_url"
          name="content_url"
          value={formData.content_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="thumbnail_url" className="block text-sm font-medium text-gray-200">
          Thumbnail URL
        </label>
        <input
          type="url"
          id="thumbnail_url"
          name="thumbnail_url"
          value={formData.thumbnail_url}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-200">
          Duration (seconds)
        </label>
        <input
          type="number"
          id="duration"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          min="0"
          className="mt-1 block w-full rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Save Content
      </button>
    </form>
  );
} 