"use client";

import Link from 'next/link';
import { useUserStore } from '@/app/stores/user';
import { useAbstraxionSigningClient } from "@burnt-labs/abstraxion";
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';
import GeneralButton from '@/app/components/ui/GeneralButton';
import {
  Abstraxion,
  useAbstraxionAccount,
  useModal,
} from "@burnt-labs/abstraxion";
import { toast } from 'react-hot-toast';
import { getSupabase } from '@/app/utils/supabase/client';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user } = useUserStore();
  const { logout } = useAbstraxionSigningClient();
  const pathname = usePathname();

  const { data: account } = useAbstraxionAccount();
  const [, setShowModal]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useModal();
  console.log('account', account)
  
  const handleCloseModal = async () => {
    if (account?.bech32Address) {
      try {
        // Call backend to authenticate wallet and get JWT
        const res = await fetch('/api/wallet-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: account.bech32Address })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Authentication failed');
        }

        const { token, user } = await res.json();
        console.log('Authentication successful:', { user });

        if (token) {
          // Get Supabase client with the new token
          const supabase = await getSupabase(token);
          
          // Set the session using the custom JWT
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token, // Using same token for refresh
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error('Failed to set session');
          }

          toast.success('Wallet connected successfully');
          
          // Redirect to dashboard or wherever you want
          // router.push('/dashboard');
        }
      } catch (err) {
        console.error('Authentication error:', err);
        toast.error(err instanceof Error ? err.message : 'An error occurred during authentication');
      }
    }
    setShowModal(false);
  };

  const handleSignOut = async () => {
    logout?.();
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-white">
      {/* Left Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 overflow-y-auto flex flex-col justify-between py-8 px-6 bg-[#0A0C10] z-20 shadow-xl shadow-[#8B25FF]/50">
        {!user ? (
          <>
            <div>
              <div className="mb-10 flex items-center sticky top-0 bg-[#0A0C10]">
                <span className="text-4xl font-black bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">QUANTA</span>
              </div>
              <nav className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 py-2 px-3 text-[#8B25FF] bg-[#8B25FF]/5 border-r border-l-[#8B25FF] font-semibold">
                  <span>Home</span>
                </Link>
                <Link href="/discover" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">
                  <span>Discover</span>
                </Link>
                <Link href="/coming-soon" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">
                  <span>Coming Soon</span>
                </Link>
              </nav>
              <div className="mt-10 space-y-1">
                <Link href="/settings" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Settings</Link>
                <Link href="/help" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Help</Link>
              </div>
            </div>
            <div>
              <GeneralButton className="w-full flex items-center justify-center" onClick={() => setShowModal(true)}>
                <Icon icon="mdi:login" className="w-5 h-5 mr-2" />
                Sign In
              </GeneralButton>

            </div>
          </>
        ) : pathname.startsWith('/dashboard') ? (
          <>
            <div>
              <div className="mb-10 flex items-center sticky top-0 bg-[#0A0C10]">
                <span className="text-4xl font-black bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">QUANTA</span>
              </div>
              <nav className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-white font-bold hover:bg-[#8B25FF]/5">
                  <Icon icon="mdi:view-dashboard-outline" className="w-5 h-5 mr-2" />
                  Home
                </Link>
                <Link href="/dashboard/content" className={`flex items-center space-x-3 py-2 px-3 rounded-lg font-bold ${pathname.startsWith('/dashboard/content') ? 'text-[#8B25FF] bg-[#8B25FF]/10' : 'text-gray-300 hover:bg-[#8B25FF]/5'}`}>
                  <Icon icon="mdi:clipboard-text-outline" className="w-5 h-5 mr-2" />
                  Post Management
                </Link>
                <Link href="/settings" className={`flex items-center space-x-3 py-2 px-3 rounded-lg font-bold ${pathname === '/settings' ? 'text-[#8B25FF] bg-[#8B25FF]/10' : 'text-gray-300 hover:bg-[#8B25FF]/5'}`}>
                  <Icon icon="mdi:cog-outline" className="w-5 h-5 mr-2" />
                  Settings
                </Link>
                <Link href="/help" className={`flex items-center space-x-3 py-2 px-3 rounded-lg font-bold ${pathname === '/help' ? 'text-[#8B25FF] bg-[#8B25FF]/10' : 'text-gray-300 hover:bg-[#8B25FF]/5'}`}>
                  <Icon icon="mdi:help-circle-outline" className="w-5 h-5 mr-2" />
                  Help
                </Link>
              </nav>
            </div>
            <div>
              <p className="text-gray-400 text-sm">{account?.bech32Address.slice(0, 8)}</p>
            </div>
            <div>
              <GeneralButton onClick={handleSignOut} className="w-full flex items-center justify-center bg-none text-gray-400 hover:bg-[#8B25FF]/5">
                <Icon icon="mdi:logout" className="w-5 h-5 mr-2" />
                Logout
              </GeneralButton>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="mb-10 flex items-center sticky top-0 bg-[#0A0C10]">
                <span className="text-4xl font-black bg-gradient-to-r from-[#8B25FF] to-[#350FDD] bg-clip-text text-transparent">QUANTA</span>
              </div>
              <nav className="space-y-2">
                <Link href="/" className="flex items-center space-x-3 py-2 px-3 text-[#8B25FF] bg-[#8B25FF]/5 border-r border-l-[#8B25FF] font-semibold">
                  <span>Home</span>
                </Link>
                <Link href="/discover" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">
                  <span>Discover</span>
                </Link>
                <Link href="/coming-soon" className="flex items-center space-x-3 py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">
                  <span>Coming Soon</span>
                </Link>
              </nav>
              <div className="mt-10">
                <div className="uppercase text-xs text-gray-500 mb-2 tracking-widest">Library</div>
                <nav className="space-y-1">
                  <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Downloaded</Link>
                  <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Recently Added</Link>
                  <Link href="#" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Play list</Link>
                  <Link href="/dashboard/subscriptions" className="flex items-center py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">
                    <span>Subscription</span>
                    <span className="ml-2 text-xs bg-[#8B25FF] text-white px-2 py-0.5 rounded-full">NEW</span>
                  </Link>
                </nav>
              </div>
              <div className="mt-10 space-y-1">
                <Link href="/settings" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Settings</Link>
                <Link href="/help" className="block py-2 px-3 rounded-lg text-gray-300 hover:bg-[#8B25FF]/5">Help</Link>
              </div>
            </div>
            <div>
              <GeneralButton onClick={handleSignOut} className="w-full flex items-center justify-center bg-none text-gray-400 hover:bg-[#8B25FF]/5">
                Logout
              </GeneralButton>
            </div>
          </>
        )}
      </aside>

      {/* Main Content (scrollable) */}
      <div className="ml-64 overflow-y-auto relative">
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Abstraxion onClose={handleCloseModal} />
    </div>
  );
} 