"use client";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { Content } from '@prisma/client';
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import Link from 'next/link';
import { PlusIcon, ChartBarIcon, VideoCameraIcon, NewspaperIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useContent } from '@/app/hooks/use-content';

// Quick stats data structure
interface DashboardStats {
  totalViews: number;
  totalEarnings: number;
  publishedContent: number;
  subscribers: number;
}

export default function DashboardPage() {
  const { data: account } = useAbstraxionAccount();
  const [content, setContent] = useState<Content[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    totalEarnings: 0,
    publishedContent: 0,
    subscribers: 0
  });

  const { 
    isLoading, 
    error, 
    fetchCreatorContent,
    deleteContent: deleteContentById
  } = useContent(account?.bech32Address || '', {
    onError: (error: any) => console.error('Dashboard error:', error)
  });

  useEffect(() => {
    let mounted = true;

    const loadContent = async () => {
      if (!account?.bech32Address) return;
      
      try {
        const data = await fetchCreatorContent(account.bech32Address);
        if (!mounted) return;
        
        setContent(data || []);
        
        // Calculate stats from content data
        setStats({
          totalViews: data?.reduce((acc, item) => acc + (item.viewCount || 0), 0) || 0,
          totalEarnings: data?.reduce((acc, item) => acc + (item.price || 0) * (item.purchaseCount || 0), 0) || 0,
          publishedContent: data?.filter(item => item.status === 'PUBLISHED').length || 0,
          subscribers: Math.floor(Math.random() * 100) // This should come from actual data
        });
      } catch (error) {
        // Error is already handled by the hook
      }
    };

    loadContent();

    return () => {
      mounted = false;
    };
  }, [account?.bech32Address]);

  const handleDeleteContent = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await deleteContentById(id);
        // Refresh content list
        if (account?.bech32Address) {
          const data = await fetchCreatorContent(account.bech32Address);
          setContent(data || []);
        }
      } catch (error) {
        // Error is already handled by the hook
      }
    }
  };

  if (!account?.bech32Address) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to access the creator dashboard.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Creator Dashboard</h1>
            <p className="text-gray-400">Manage your content and track performance</p>
          </div>
          <Link href="/dashboard/create">
            <Button
              structure="base"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Create Content</span>
            </Button>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <h3 className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <h3 className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Published Content</p>
                <h3 className="text-2xl font-bold">{stats.publishedContent}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Subscribers</p>
                <h3 className="text-2xl font-bold">{stats.subscribers}</h3>
              </div>
              <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content Management */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-semibold">Your Content</h2>
          </div>
          {content.length === 0 ? (
            <div className="min-h-screen bg-[#0A0C10] text-white">
                <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-800/30 rounded-xl p-8 text-center">
                  <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-200 mb-4">No Content Yet</h2>
                  <p className="text-gray-400 mb-8 max-w-md">
                    You haven't created any content yet. Start by creating your first piece of content.
                  </p>
                </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Earnings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-16 flex-shrink-0 rounded overflow-hidden">
                            <img
                              className="h-full w-full object-cover"
                              src={item.thumbnail || 'https://picsum.photos/320/180'}
                              alt=""
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">{item.title}</div>
                            <div className="text-sm text-gray-400">{new Date(item.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {item.type === 'VIDEO' && <VideoCameraIcon className="w-4 h-4 text-blue-400 mr-2" />}
                          {item.type === 'ARTICLE' && <NewspaperIcon className="w-4 h-4 text-green-400 mr-2" />}
                          {item.type === 'COURSE' && <AcademicCapIcon className="w-4 h-4 text-purple-400 mr-2" />}
                          {item.type === 'SOFTWARE' && <CodeBracketIcon className="w-4 h-4 text-pink-400 mr-2" />}
                          <span className="text-sm">{item.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${item.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-400' :
                            item.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-gray-500/10 text-gray-400'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{item.viewCount}</td>
                      <td className="px-6 py-4 text-sm">${(item.price * (item.purchaseCount || 0)).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <Link href={`/dashboard/content/${item.id}/edit`}>
                            <Button
                              structure="base"
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-sm"
                            >
                              Edit
                            </Button>
                          </Link>
                          <Button
                            structure="base"
                            className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm"
                            onClick={() => handleDeleteContent(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 