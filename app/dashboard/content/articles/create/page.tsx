'use client';

import ArticleForm from '@/app/components/ui/forms/ArticleForm';
import WalletGuard from '@/app/components/ui/WalletGuard';

export default function CreateArticlePage() {
  return (
    <WalletGuard contentType="articles">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Article</h1>
        <ArticleForm />
      </div>
    </WalletGuard>
  );
}

