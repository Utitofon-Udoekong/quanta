'use client';

import AudioForm from '@/app/components/ui/forms/AudioForm';
import WalletGuard from '@/app/components/ui/WalletGuard';

export default function CreateAudioPage() {
  return (
    <WalletGuard contentType="audio">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Audio</h1>
        <AudioForm />
      </div>
    </WalletGuard>
  );
}