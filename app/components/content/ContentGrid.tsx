import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Content } from '@/app/types/content';
import { ContentType } from '@prisma/client';

interface ContentGridProps {
  initialContent: Content[];
  type?: ContentType;
}

export function ContentGrid({ initialContent, type }: ContentGridProps) {
  const [content] = useState<Content[]>(initialContent);

  const filteredContent = type
    ? content.filter((item) => item.type === type)
    : content;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredContent.map((item) => (
        <Link
          key={item.id}
          href={`/content/${item.type.toLowerCase()}/${item.id}`}
          className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
        >
          <div className="aspect-w-16 aspect-h-9 relative">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gray-100">
                <span className="text-gray-400">No thumbnail</span>
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
              {item.title}
            </h3>
            <p className="mt-2 flex-1 text-sm text-gray-500 line-clamp-2">
              {item.description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                ${item.price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">
                by {item.creator.name}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 