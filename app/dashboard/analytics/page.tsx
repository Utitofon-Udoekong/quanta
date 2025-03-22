"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import { 
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface AnalyticsStats {
  totalViews: number;
  uniqueViewers: number;
  averageWatchTime: string;
  conversionRate: number;
  revenuePerView: number;
  growthRate: number;
}

interface ContentPerformance {
  id: string;
  title: string;
  views: number;
  uniqueViewers: number;
  watchTime: string;
  conversionRate: number;
  revenue: number;
}

export default function AnalyticsPage() {
  const { data: account } = useAbstraxionAccount();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<AnalyticsStats>({
    totalViews: 0,
    uniqueViewers: 0,
    averageWatchTime: '0:00',
    conversionRate: 0,
    revenuePerView: 0,
    growthRate: 0
  });
  const [contentPerformance, setContentPerformance] = useState<ContentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!account?.bech32Address) return;
      
      try {
        // TODO: Replace with actual API calls
        // Simulated data for now
        setStats({
          totalViews: 12500,
          uniqueViewers: 8500,
          averageWatchTime: '12:30',
          conversionRate: 8.5,
          revenuePerView: 2.50,
          growthRate: 15.2
        });

        setContentPerformance([
          {
            id: '1',
            title: 'Advanced React Patterns',
            views: 2500,
            uniqueViewers: 1800,
            watchTime: '15:45',
            conversionRate: 12.5,
            revenue: 6250
          },
          {
            id: '2',
            title: 'TypeScript Fundamentals',
            views: 1800,
            uniqueViewers: 1200,
            watchTime: '10:30',
            conversionRate: 6.8,
            revenue: 2700
          },
          {
            id: '3',
            title: 'Web3 Development Course',
            views: 3200,
            uniqueViewers: 2200,
            watchTime: '18:20',
            conversionRate: 9.2,
            revenue: 8000
          }
        ]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [account?.bech32Address, timeRange]);

  if (!account?.bech32Address) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-4">Please connect your wallet to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-gray-400">Track your content performance and audience engagement</p>
          </div>
          <div className="flex space-x-2">
            {(['day', 'week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                <p className="text-gray-400 text-sm">Unique Viewers</p>
                <h3 className="text-2xl font-bold">{stats.uniqueViewers.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <UsersIcon className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Watch Time</p>
                <h3 className="text-2xl font-bold">{stats.averageWatchTime}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Conversion Rate</p>
                <h3 className="text-2xl font-bold">{stats.conversionRate}%</h3>
              </div>
              <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Revenue per View</p>
                <h3 className="text-2xl font-bold">${stats.revenuePerView.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-pink-500/10 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-pink-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Growth Rate</p>
                <div className="flex items-center">
                  <h3 className="text-2xl font-bold">{stats.growthRate}%</h3>
                  {stats.growthRate >= 0 ? (
                    <ArrowTrendingUpIcon className="w-5 h-5 text-green-400 ml-2" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-5 h-5 text-red-400 ml-2" />
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Performance */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-semibold">Content Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unique Viewers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Watch Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Conversion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {contentPerformance.map((content) => (
                  <tr key={content.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {content.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {content.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {content.uniqueViewers.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {content.watchTime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {content.conversionRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${content.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 