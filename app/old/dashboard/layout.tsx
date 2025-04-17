"use client";

import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  RectangleStackIcon, 
  ChartBarIcon, 
  CreditCardIcon, 
  UserCircleIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: HomeIcon },
  { name: 'Content', href: '/dashboard/content', icon: RectangleStackIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Earnings', href: '/dashboard/earnings', icon: CreditCardIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: account } = useAbstraxionAccount();
  const pathname = usePathname();

  if (!account?.bech32Address) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#0A0C10]">
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-[#0A0C10]/90 backdrop-blur-md border-b border-gray-800/50 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Main Nav */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  QUANTA
                </span>
              </Link>
              <div className="hidden md:flex ml-10 space-x-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors duration-200">
                <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <div className="flex items-center space-x-2 bg-gray-800 px-3 py-2 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {account.bech32Address.slice(0, 2)}
                </div>
                <span className="text-sm text-gray-300">
                  {account.bech32Address.slice(0, 6)}...{account.bech32Address.slice(-4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A0C10]/90 backdrop-blur-md border-t border-gray-800/50 z-40">
        <div className="flex justify-around py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-200 ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6 mb-1" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-16 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
} 