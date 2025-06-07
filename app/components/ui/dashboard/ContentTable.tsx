'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export type ContentItem = {
  id: string;
  title: string;
  type: 'article' | 'video' | 'audio';
  created_at: string;
  published: boolean;
  is_premium: boolean;
  views?: number;
  thumbnail_url?: string;
  duration?: number;
};

interface ContentTableProps {
  content: ContentItem[];
  onDelete?: (id: string, type: string) => void;
}

export default function ContentTable({ content, onDelete }: ContentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    premium: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Apply search and filters whenever content, searchTerm, or filters change
  useEffect(() => {
    let result = [...content];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter(item => item.type === filters.type);
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(item => 
        filters.status === 'published' ? item.published : !item.published
      );
    }
    
    // Apply premium filter
    if (filters.premium !== 'all') {
      result = result.filter(item => 
        filters.premium === 'premium' ? item.is_premium : !item.is_premium
      );
    }
    
    setFilteredContent(result);
  }, [content, searchTerm, filters]);

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <Icon icon="material-symbols:article" className="w-5 h-5 text-blue-400" />;
      case 'video':
        return <Icon icon="material-symbols:videocam" className="w-5 h-5 text-green-400" />;
      case 'audio':
        return <Icon icon="material-symbols:music-note" className="w-5 h-5 text-purple-400" />;
      default:
        return null;
    }
  };

  const getContentTypeColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'text-blue-400';
      case 'video':
        return 'text-green-400';
      case 'audio':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  const getContentTypeLink = (item: ContentItem) => {
    switch (item.type) {
      case 'article':
        return `/dashboard/content/articles/${item.id}`;
      case 'video':
        return `/dashboard/content/videos/${item.id}`;
      case 'audio':
        return `/dashboard/content/audio/${item.id}`;
      default:
        return '#';
    }
  };

  const getContentEditLink = (item: ContentItem) => {
    switch (item.type) {
      case 'article':
        return `/dashboard/content/articles/${item.id}/edit`;
      case 'video':
        return `/dashboard/content/videos/${item.id}/edit`;
      case 'audio':
        return `/dashboard/content/audio/${item.id}/edit`;
      default:
        return '#';
    }
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: 'all',
      premium: 'all'
    });
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon icon="material-symbols:search" className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-700 rounded-md text-sm font-medium text-gray-300 bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <Icon icon="material-symbols:filter-list" className="h-5 w-5 mr-2 text-gray-400" />
              Filters
            </button>
          </div>
        </div>
        
        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-900 rounded-md border border-gray-700">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium text-gray-300">Filter Options</h3>
              <button
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-gray-300 flex items-center"
              >
                <Icon icon="material-symbols:close" className="h-4 w-4 mr-1" />
                Clear all
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Content Type
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="all">All Types</option>
                  <option value="article">Articles</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Premium Status
                </label>
                <select
                  className="block w-full pl-3 pr-10 py-2 text-base border border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white"
                  value={filters.premium}
                  onChange={(e) => setFilters({...filters, premium: e.target.value})}
                >
                  <option value="all">All Content</option>
                  <option value="premium">Premium Only</option>
                  <option value="free">Free Only</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-700/30 text-left">
              <th className="py-3 px-4 font-medium text-gray-400">Type</th>
              <th className="py-3 px-4 font-medium text-gray-400">Title</th>
              <th className="py-3 px-4 font-medium text-gray-400">Date</th>
              <th className="py-3 px-4 font-medium text-gray-400">Status</th>
              <th className="py-3 px-4 font-medium text-gray-400">Premium</th>
              <th className="py-3 px-4 font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContent.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No content found matching your criteria
                </td>
              </tr>
            ) : (
              filteredContent.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-t border-gray-700/30 hover:bg-gray-700/20">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {getContentTypeIcon(item.type)}
                      <span className="ml-2 capitalize">{item.type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium">{item.title}</td>
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.is_premium ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {item.is_premium ? 'Premium' : 'Free'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-3">
                      <Link 
                        href={getContentEditLink(item)}
                        className={`hover:opacity-80 transition-opacity`}
                      >
                        <Icon icon="material-symbols:edit" className="w-4 h-4" />
                      </Link>
                      <Link 
                        href={getContentTypeLink(item)}
                        className="text-gray-400 hover:text-gray-300 transition-colors"
                        // target="_blank"
                      >
                        <Icon icon="material-symbols:visibility" className="w-4 h-4" />
                      </Link>
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item.id, item.type)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Icon icon="material-symbols:delete" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 