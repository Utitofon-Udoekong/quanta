'use client';

import { Article } from '@/app/types';
import Link from 'next/link';
import { PencilIcon, TrashIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ArticleCardProps {
  article: Article;
  onDelete: (id: string) => void;
}

export default function ArticleCard({ article, onDelete }: ArticleCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-bold text-lg text-white">{article.title}</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            article.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {article.published ? 'Published' : 'Draft'}
          </span>
        </div>
        
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {article.excerpt || 'No excerpt available'}
        </p>
        
        <div className="flex items-center text-sm text-gray-400 mb-4">
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex space-x-3">
            <Link 
              href={`/dashboard/content/articles/${article.id}`}
              className="text-blue-400 hover:text-blue-300 transition-colors flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-1" />
              Edit
            </Link>
            <Link 
              href={`/dashboard/content/articles/${article.id}`}
              className="text-gray-400 hover:text-gray-300 transition-colors flex items-center"
              // target="_blank"
            >
              <EyeIcon className="w-4 h-4 mr-1" />
              View
            </Link>
          </div>
          <button
            onClick={() => onDelete(article.id)}
            className="text-red-400 hover:text-red-300 transition-colors flex items-center"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
} 