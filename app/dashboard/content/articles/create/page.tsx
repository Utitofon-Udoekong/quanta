import ArticleForm from '@/app/components/ui/forms/ArticleForm';

export default function CreateArticlePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Create New Article</h1>
      <div className="bg-white shadow-md rounded-lg p-6">
        <ArticleForm />
      </div>
    </div>
  );
}

