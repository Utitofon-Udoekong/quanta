'use client';

import { Article } from '@/app/types';
import Link from 'next/link';
import ArticleAuthor from '../ArticleAuthor';

type ArticleCardProps = {
  article: Article;
};

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="mb-4">
          <ArticleAuthor article={article} />
        </div>
        <Link href={`/dashboard/content/articles/${article.id}`}>
          <h2 className="text-xl font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
            {article.title}
          </h2>
        </Link>
        {article.excerpt && (
          <p className="text-gray-300 mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/content/articles/${article.id}`}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Read more →
          </Link>
          {article.is_premium && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
              Premium
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 