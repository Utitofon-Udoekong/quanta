"use client";

import Link from 'next/link';
import { Button } from "@burnt-labs/ui";
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { useState } from 'react';
import SearchInput from '@/app/components/ui/SearchInput';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const { logout } = useAbstraxionSigningClient();
  const [activeTab, setActiveTab] = useState('For You');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    logout?.();
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto flex flex-col justify-between py-8 px-6 border-r border-[#8B25FF] bg-[#0A0C10] z-20">
        <div>
          <div className="mb-10 flex items-center sticky top-0 bg-[#0A0C10]">
            <span className="text-4xl font-black bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">QUANTA</span>
          </div>
          <nav className="space-y-2">
            <Link href="/" className="flex items-center space-x-3 py-2 px-3 text-[#8B25FF] bg-[#8B25FF]/5 border-r border-l-[#8B25FF] font-semibold">
              <span>Home</span>
            </Link>
            <Link href="/discover" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">
              <span>Discover</span>
            </Link>
            <Link href="/coming-soon" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">
              <span>Coming Soon</span>
            </Link>
          </nav>
          <div className="mt-10">
            <div className="uppercase text-xs text-gray-500 mb-2 tracking-widest">Library</div>
            <nav className="space-y-1">
              <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">Downloaded</Link>
              <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">Recently Added</Link>
              <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">Play list</Link>
              <Link href="/dashboard/subscriptions" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">
                <span>Subscription</span>
                <span className="ml-2 text-xs bg-[#8B25FF] text-white px-2 py-0.5 rounded-full">NEW</span>
              </Link>
            </nav>
          </div>
          <div className="mt-10 space-y-1">
            <Link href="/settings" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">Settings</Link>
            <Link href="/help" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#212121]">Help</Link>
          </div>
        </div>
        <div>
          <button onClick={handleSignOut} className="w-full flex items-center py-2 px-3 rounded-lg text-gray-400 hover:bg-[#212121]">
            Logout
          </button>
        </div>
      </aside>

      {/* Right Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-64 flex flex-col justify-between py-8 px-6  bg-[#0A0C10] border-l-[0.5px] border-[#8B25FF] z-20">
        {/* Profile Menu */}
        <div>
          {user && (
            <div className="relative mb-8">
              <button
                className="flex items-center space-x-3 w-full focus:outline-none"
                onClick={() => setProfileMenuOpen((open) => !open)}
              >
                <img src={user.avatar_url || 'https://robohash.org/149'} alt="avatar" className="w-12 h-12 rounded-full object-cover border-2 border-purple-500" />
                <div className="flex flex-col flex-1 text-left">
                  <span className="font-semibold text-white text-lg">{user.username || user.wallet_address?.slice(0, 8)}</span>
                  <span className="text-xs text-purple-400">Premium ✨</span>
                </div>
                <Icon icon="mdi:chevron-down" className={`w-5 h-5 text-gray-400 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#181A20] rounded-lg shadow-lg border border-gray-800 z-30">
                  <Link href="/dashboard/profile" className="block px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 rounded-t-lg">Profile</Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-gray-800 rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          {/* Search */}
          <SearchInput className="mb-6" placeholder="Search music" />
          {/* Quick Filters */}
          <div className="grid grid-cols-2 gap-2">
            {['Movie', 'Course', 'Podcast', 'Audio', 'Music', 'Comedy'].map((filter) => (
              <button
                key={filter}
                className="px-4 py-2 rounded-full bg-[#212121]/50 text-gray-300 hover:bg-[#8B25FF] hover:text-white transition-colors font-medium text-left"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        {/* Optionally, add more widgets here */}
      </aside>

      {/* Main Content (scrollable) */}
      <div className="ml-64 mr-64 min-h-screen overflow-y-auto relative">
        {/* Left Gradient */}
        <div className="absolute left-0 top-0 h-full w-12 -z-10 pointer-events-none select-none"
          style={{ background: 'linear-gradient(to right, #350FDD33 60%, transparent 100%)' }} />
        {/* Right Gradient */}
        <div className="absolute right-0 top-0 h-full w-12 -z-10 pointer-events-none select-none"
          style={{ background: 'linear-gradient(to left, #350FDD33 60%, transparent 100%)' }} />
        {/* Top Navigation Bar */}
        <nav className="flex items-center justify-between bg-transparent px-8 py-4 mt-4 mb-8 shadow-lg sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            {['For You', 'Tv Shows', 'Watched'].map((tab) => (
              <Link
                href={`/dashboard/${tab.toLowerCase().replace(' ', '-')}`}
                className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-300 hover:text-white'}`}
              >
                {tab}
              </Link>
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <SearchInput />
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-[#212121] transition-colors">
              <Icon icon="mdi:bell" className="w-6 h-6 text-gray-400" />
            </button>
            <Button className="bg-gradient-to-r from-[#8B25FF] to-[#350FDD] cursor-pointer text-white px-6 py-2 rounded-full font-semibold shadow-lg">Create</Button>
          </div>
        </nav>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
} 