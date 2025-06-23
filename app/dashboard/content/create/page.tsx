"use client";

import UnifiedContentForm from '@/app/components/ui/forms/UnifiedContentForm';
import WalletGuard from '@/app/components/ui/WalletGuard';
import { useRouter } from 'next/navigation';
import { toast } from '@/app/components/helpers/toast';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function CreateContentPage() {
  const router = useRouter();

  const handleSave = async (data: any, type: string) => {
    try {
      let response;
      
      if (type === 'audio') {
        response = await fetch('/api/content/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          next: { revalidate: 0 },
        });
      } else if (type === 'video') {
        response = await fetch('/api/content/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          next: { revalidate: 0 },
        });
      } else if (type === 'article') {
        response = await fetch('/api/content/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          next: { revalidate: 0 },
        });
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || `Failed to create ${type}`);
      }

      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully!`);
      router.push('/dashboard/content');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating content:', error);
      toast.error(error.message || 'Failed to create content');
      throw error;
    }
  };

  return (
    <WalletGuard contentType="all">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard/content" className="text-gray-400 hover:text-white flex items-center">
            <Icon icon="mdi:arrow-left" className="size-5 mr-2" />
            Back to Content
          </Link>
        </div>
        <h1 className="text-2xl font-bold mb-6">Create New Content</h1>
        <UnifiedContentForm onSave={handleSave} />
      </div>
    </WalletGuard>
  );
} 