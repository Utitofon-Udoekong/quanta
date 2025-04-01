"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, ChartBarIcon, VideoCameraIcon, NewspaperIcon, AcademicCapIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { useCreatorContent } from '@/app/hooks/use-content';
import { ContentData } from '@/app/lib/supabase';
import { supabase } from '@/app/lib/supabase';
import { ContentGrid } from '@/app/components/content/ContentGrid';
import { useUserStore } from '@/app/store/use-user-store';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";

// Quick stats data structure
interface DashboardStats {
  totalViews: number;
  totalEarnings: number;
  totalContent: number;
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const { data: account } = useAbstraxionAccount();
  const [stats, setStats] = useState<DashboardStats>({
    totalViews: 0,
    totalEarnings: 0,
    totalContent: 0,
  });
  console.log(user);
  console.log(account);
  useEffect(() => {
    const fetchStats = async () => {
      if (!account?.bech32Address) return;

      try {
        // Fetch content count
        const { count: contentCount } = await supabase
          .from('content')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', account.bech32Address);

        // Fetch total views
        const { count: viewCount } = await supabase
          .from('content_usage')
          .select('*', { count: 'exact', head: true })
          .eq('content.creator_id', account.bech32Address);

        // Fetch total earnings
        const { data: payments } = await supabase
          .from('payments')
          .select('amount')
          .eq('to_user_id', account.bech32Address)
          .eq('status', 'COMPLETED');

        const totalEarnings = payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;

        setStats({
          totalViews: viewCount || 0,
          totalEarnings,
          totalContent: contentCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [account?.bech32Address]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Content</p>
                <h3 className="text-2xl font-bold">{stats.totalContent}</h3>
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
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
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
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-6">Your Content</h2>
        <ContentGrid creatorId={account.bech32Address} limit={8} />
      </div>
    </div>
  );
} 