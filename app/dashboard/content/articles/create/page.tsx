import ArticleForm from '@/app/components/ui/forms/ArticleForm';

export default function CreateArticlePage() {
  return (
    <div className="my-8">
      <h1 className="text-2xl font-bold mb-6">Create New Article</h1>
      <div className="bg-[#1a1f28] shadow-md rounded-lg p-6">
        <ArticleForm />
      </div>
    </div>
  );
}

