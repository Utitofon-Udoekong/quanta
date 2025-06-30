"use client";

import Link from 'next/link';
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { usePathname, useRouter } from 'next/navigation';
import GeneralButton from '@/app/components/ui/GeneralButton';
import { useAbstraxionAccount } from "@burnt-labs/abstraxion";
import { useState } from 'react';
import SearchInput from './ui/SearchInput';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import NotificationDropdown from './ui/NotificationDropdown';
import { supabase } from '../utils/supabase/client';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const { logout } = useAbstraxionSigningClient();
  const pathname = usePathname();
  const router = useRouter();
  const { logout: logoutAbstraxionAccount } = useAbstraxionAccount();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    const response = await fetch('/api/wallet-auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      supabase.auth.signOut();
      logoutAbstraxionAccount?.();
      logout?.();
      router.push('/');
    }
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    if (isActive) {
      return "flex items-center space-x-3 py-2 px-3 bg-[#8B25FF]/5 border-r text-[#8B25FF] border-l-[#8B25FF] font-semibold";
    }
    return "flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5";
  };

  const getDashboardLinkClass = (path: string) => {
    if (path === '/dashboard') {
      if (pathname === '/dashboard') {
        return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-[#8B25FF] bg-[#8B25FF]/10';
      }
      return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-gray-300 hover:bg-[#8B25FF]/5';
    }
    if (path === '/dashboard/content') {
      if (pathname === '/dashboard/content' || pathname.startsWith('/dashboard/content/')) {
        return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-[#8B25FF] bg-[#8B25FF]/10';
      }
      return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-gray-300 hover:bg-[#8B25FF]/5';
    }
    if (path === '/dashboard/subscriptions') {
      if (pathname === '/dashboard/subscriptions' || pathname.startsWith('/dashboard/subscriptions/')) {
        return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-[#8B25FF] bg-[#8B25FF]/10';
      }
      return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-gray-300 hover:bg-[#8B25FF]/5';
    }
    if (path === '/settings') {
      if (pathname === '/settings' || pathname.startsWith('/settings/')) {
        return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-[#8B25FF] bg-[#8B25FF]/10';
      }
      return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-gray-300 hover:bg-[#8B25FF]/5';
    }
    if (pathname === path) {
      return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-[#8B25FF] bg-[#8B25FF]/10';
    }
    return 'flex items-center space-x-3 py-2 px-3 rounded-lg font-bold text-gray-300 hover:bg-[#8B25FF]/5';
  };

  if (pathname === '/auth') {
    return <>{children}</>;
  }

  const sidebarContent = (
    <>
      <div>
        <div className="mb-10 flex items-center justify-between sticky top-0 bg-[#0A0C10] px-3 py-4">
          <span className="text-2xl font-black bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">ZENTEX</span>
          <button
            className="md:hidden text-gray-400 hover:text-white focus:outline-none"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <Icon icon="mdi:close" className="w-6 h-6" />
          </button>
        </div>

        {pathname.startsWith('/dashboard') && user ? (
          <nav className="space-y-2 px-3">
            <Link href="/explore" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-white font-bold hover:bg-[#8B25FF]/5" onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:arrow-left" className="w-5 h-5 mr-2" />
              Explore
            </Link>
            <Link href="/dashboard" className={getDashboardLinkClass('/dashboard')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:home-outline" className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
            <Link href="/dashboard/content" className={getDashboardLinkClass('/dashboard/content')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:clipboard-text-outline" className="w-5 h-5 mr-2" />
              Content Management
            </Link>
            <Link href="/dashboard/subscriptions" className={getDashboardLinkClass('/dashboard/subscriptions')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:account-group" className="w-5 h-5 mr-2" />
              Subscriptions
            </Link>
            <Link href="/settings" className={getDashboardLinkClass('/settings')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:cog-outline" className="w-5 h-5 mr-2" />
              Settings
            </Link>
            <Link href="/help" className={getDashboardLinkClass('/help')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:help-circle-outline" className="w-5 h-5 mr-2" />
              Help
            </Link>
          </nav>
        ) : (
          <nav className="space-y-2 px-3">
            <Link href="/" className={getLinkClass('/')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:home-outline" className="w-5 h-5 mr-2" />
              Home
            </Link>
            <Link href="/discover" className={getLinkClass('/discover')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:compass-outline" className="w-5 h-5 mr-2" />
              Discover
            </Link>
            <Link href="/coming-soon" className={getLinkClass('/coming-soon')} onClick={() => setIsSidebarOpen(false)}>
              <Icon icon="mdi:clock-outline" className="w-5 h-5 mr-2" />
              Coming Soon
            </Link>
            {user && (
              <div className="mt-10">
                <div className="uppercase text-xs text-gray-500 mb-2 tracking-widest">Library</div>
                <nav className="space-y-1">
                  <Link href="#" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5" onClick={() => setIsSidebarOpen(false)}>
                    <Icon icon="mdi:download-outline" className="w-5 h-5 mr-2" />
                    Downloaded</Link>
                  <Link href="#" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5" onClick={() => setIsSidebarOpen(false)}>
                    <Icon icon="mdi:clock-outline" className="w-5 h-5 mr-2" />
                    Recently Added</Link>
                  <Link href="/dashboard/subscriptions" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5" onClick={() => setIsSidebarOpen(false)}>
                    <Icon icon="mdi:account-group" className="w-5 h-5 mr-2" />
                    <span>Subscription</span>
                    <span className="ml-2 text-xs bg-[#8B25FF] text-white px-2 py-0.5 rounded-full">NEW</span>
                  </Link>
                </nav>
              </div>
            )}
            <div className="mt-10 space-y-1">
              <Link href="/settings" className={getLinkClass('/settings')} onClick={() => setIsSidebarOpen(false)}>
                <Icon icon="mdi:cog-outline" className="w-5 h-5 mr-2" />
                Settings</Link>
              <Link href="/help" className={getLinkClass('/help')} onClick={() => setIsSidebarOpen(false)}>
                <Icon icon="mdi:help-circle-outline" className="w-5 h-5 mr-2" />
                Help</Link>
            </div>
          </nav>
        )}
      </div>
      <div className="px-3">
        {user ? (
          <GeneralButton onClick={handleSignOut} className="w-full flex items-center justify-center bg-transparent text-gray-400 hover:bg-[#8B25FF]/5">
            <Icon icon="mdi:logout" className="w-5 h-5 mr-2" />
            Logout
          </GeneralButton>
        ) : (
          <Link href="/auth">
            <GeneralButton className="w-full flex items-center justify-center">
              <Icon icon="mdi:login" className="w-5 h-5 mr-2" />
              Sign In
            </GeneralButton>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      <header className="sticky top-0 z-30 bg-[#0A0C10]/80 backdrop-blur-sm flex items-center justify-between gap-4 p-4 sm:px-8 md:ml-64 shadow-sm shadow-[#8B25FF]/30">
        {pathname.startsWith('/dashboard') ? (
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white">
                <Icon icon="mdi:menu" className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1">
              <h1 className="text-sm sm:text-2xl md:font-bold text-white">
                Welcome back{user?.username ? `, ${user.username}` : user?.wallet_address ? `, ${user.wallet_address.slice(0, 8)}` : ''}
              </h1>
              <p className="hidden md:block text-gray-400 text-sm mt-1">Manage your content and view all content activities</p>
            </div>
            <div className="flex items-center justify-center">
              <img src={user?.avatar_url || 'https://robohash.org/1234567890'} alt="User Avatar" className="size-10 rounded-full" />
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white">
                <Icon icon="mdi:menu" className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 ">
              <SearchInput />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex">
                <NotificationDropdown />
              </div>
              {user && (
                <Menu as="div" className="relative">
                  <MenuButton className="flex items-center justify-center hover:opacity-80 transition-opacity">
                    <img src={user.avatar_url || 'https://robohash.org/1234567890'} alt="User Avatar" className="size-10 rounded-full border-2 border-transparent hover:border-[#8B25FF]/50 transition-colors" />
                  </MenuButton>
                  <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right bg-[#121418] border border-gray-800 rounded-xl shadow-lg shadow-black/50 focus:outline-none z-50">
                    <div className="p-4 border-b border-gray-800">
                      <div className="flex items-center space-x-3">
                        <img src={user.avatar_url || 'https://robohash.org/1234567890'} alt="User Avatar" className="size-10 rounded-full" />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {user.username || 'User'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {user.wallet_address ? `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}` : 'Connected'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/dashboard"
                            className={`${active ? 'bg-[#8B25FF]/10 text-[#8B25FF]' : 'text-gray-300'
                              } flex items-center px-4 py-3 text-sm transition-colors`}
                          >
                            <Icon icon="mdi:home-outline" className="w-5 h-5 mr-3" />
                            Dashboard
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/dashboard/content"
                            className={`${active ? 'bg-[#8B25FF]/10 text-[#8B25FF]' : 'text-gray-300'
                              } flex items-center px-4 py-3 text-sm transition-colors`}
                          >
                            <Icon icon="mdi:clipboard-text-outline" className="w-5 h-5 mr-3" />
                            Content Management
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/dashboard/subscriptions"
                            className={`${active ? 'bg-[#8B25FF]/10 text-[#8B25FF]' : 'text-gray-300'
                              } flex items-center px-4 py-3 text-sm transition-colors`}
                          >
                            <Icon icon="mdi:account-group" className="w-5 h-5 mr-3" />
                            Subscriptions
                          </Link>
                        )}
                      </MenuItem>
                      <MenuItem>
                        {({ active }) => (
                          <Link
                            href="/settings"
                            className={`${active ? 'bg-[#8B25FF]/10 text-[#8B25FF]' : 'text-gray-300'
                              } flex items-center px-4 py-3 text-sm transition-colors`}
                          >
                            <Icon icon="mdi:cog-outline" className="w-5 h-5 mr-3" />
                            Settings
                          </Link>
                        )}
                      </MenuItem>
                      <div className="border-t border-gray-800 my-2"></div>
                      <MenuItem>
                        {({ active }) => (
                          <button
                            onClick={handleSignOut}
                            className={`${active ? 'bg-red-600/10 text-red-400' : 'text-gray-300'
                              } flex items-center w-full px-4 py-3 text-sm transition-colors`}
                          >
                            <Icon icon="mdi:logout" className="w-5 h-5 mr-3" />
                            Sign Out
                          </button>
                        )}
                      </MenuItem>
                    </div>
                  </MenuItems>
                </Menu>
              )}
              <div className="w-6 md:hidden"></div>
            </div>
          </>
        )}
      </header>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
      <aside className={`fixed top-0 h-screen w-64 overflow-y-auto flex flex-col justify-between py-4 bg-[#0A0C10] z-40 transition-transform duration-300 ease-in-out shadow-sm shadow-[#8B25FF]/50
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 md:left-0`}>
        {sidebarContent}
      </aside>

      <div className="md:ml-64">
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 