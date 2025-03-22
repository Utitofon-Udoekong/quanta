"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useEffect, useState } from 'react';
import { Button } from "@burnt-labs/ui";
import { 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface EarningsStats {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  dailyEarnings: number;
  growthRate: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  date: string;
  contentTitle: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export default function EarningsPage() {
  const { data: account } = useAbstraxionAccount();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    monthlyEarnings: 0,
    weeklyEarnings: 0,
    dailyEarnings: 0,
    growthRate: 0
  });
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      if (!account?.bech32Address) return;
      
      try {
        // TODO: Replace with actual API calls
        // Simulated data for now
        setStats({
          totalEarnings: 12500.50,
          monthlyEarnings: 2500.75,
          weeklyEarnings: 750.25,
          dailyEarnings: 150.00,
          growthRate: 12.5
        });

        setPaymentHistory([
          {
            id: '1',
            amount: 25.00,
            date: '2024-03-15',
            contentTitle: 'Advanced React Patterns',
            status: 'COMPLETED'
          },
          {
            id: '2',
            amount: 15.00,
            date: '2024-03-14',
            contentTitle: 'TypeScript Fundamentals',
            status: 'COMPLETED'
          },
          {
            id: '3',
            amount: 50.00,
            date: '2024-03-13',
            contentTitle: 'Web3 Development Course',
            status: 'PENDING'
          }
        ]);
      } catch (error) {
        console.error('Error fetching earnings data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsData();
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
          <p className="text-gray-400 mb-4">Please connect your wallet to view your earnings.</p>
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
        {/* Earnings Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Earnings</h1>
            <p className="text-gray-400">Track your revenue and payment history</p>
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

        {/* Earnings Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Earnings</p>
                <h3 className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Monthly Earnings</p>
                <h3 className="text-2xl font-bold">${stats.monthlyEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Weekly Earnings</p>
                <h3 className="text-2xl font-bold">${stats.weeklyEarnings.toFixed(2)}</h3>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <ClockIcon className="w-5 h-5 text-purple-400" />
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
              <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
                <ArrowTrendingUpIcon className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
          <div className="p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-semibold">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Content</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-800/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {payment.contentTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      ${payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${payment.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400' :
                          payment.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'}`}>
                        {payment.status}
                      </span>
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