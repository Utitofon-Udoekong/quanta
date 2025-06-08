import UnifiedContentForm from '@/app/components/ui/forms/UnifiedContentForm';
import WalletGuard from '@/app/components/ui/WalletGuard';

export default function CreateContentPage() {
  return (
    <WalletGuard contentType="all">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Content</h1>
        <UnifiedContentForm />
      </div>
    </WalletGuard>
  );
} 