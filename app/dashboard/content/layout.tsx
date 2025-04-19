'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  DocumentTextIcon, 
  VideoCameraIcon, 
  MusicalNoteIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function ContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/dashboard/content') return 'overview';
    if (pathname.includes('/dashboard/content/articles')) return 'articles';
    if (pathname.includes('/dashboard/content/videos')) return 'videos';
    if (pathname.includes('/dashboard/content/audio')) return 'audio';
    return 'overview';
  };

  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Content Management</h1>
        </div>
        
        {/* Tabs Navigation */}
        <div className="mb-8 border-b border-gray-700/50">
          <div className="flex space-x-8">
            <Link
              href="/dashboard/content"
              className={`pb-4 px-1 font-medium text-sm flex items-center ${
                activeTab === 'overview'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Overview
            </Link>
            <Link
              href="/dashboard/content/articles"
              className={`pb-4 px-1 font-medium text-sm flex items-center ${
                activeTab === 'articles'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Articles
            </Link>
            <Link
              href="/dashboard/content/videos"
              className={`pb-4 px-1 font-medium text-sm flex items-center ${
                activeTab === 'videos'
                  ? 'text-green-400 border-b-2 border-green-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <VideoCameraIcon className="w-4 h-4 mr-2" />
              Videos
            </Link>
            <Link
              href="/dashboard/content/audio"
              className={`pb-4 px-1 font-medium text-sm flex items-center ${
                activeTab === 'audio'
                  ? 'text-purple-400 border-b-2 border-purple-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <MusicalNoteIcon className="w-4 h-4 mr-2" />
              Audio
            </Link>
          </div>
        </div>

        {/* Content Area */}
        {children}
      </div>
    </div>
  );
} 