'use client';

import VideoForm from '@/app/components/ui/forms/VideoForm';
import WalletGuard from '@/app/components/ui/WalletGuard';

export default function CreateVideoPage() {
  return (
    <WalletGuard contentType="videos">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Video</h1>
        <VideoForm />
      </div>
    </WalletGuard>
  );
}