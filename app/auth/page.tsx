'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useAbstraxionAccount,
} from "@burnt-labs/abstraxion";

import './page.css';
import { getSupabase } from '../utils/supabase/client';
import { toast } from '@/app/components/helpers/toast';
import { useUserStore } from '../stores/user';


export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: account, login, isConnected, isConnecting} = useAbstraxionAccount();
  const { fetchUser } = useUserStore()
  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      // console.error('Login error:', error);
    }
  };

  const handleWalletAuth = async () => {
    if (account?.bech32Address && isConnected) {
      try {
        setLoading(true);
        setError(null);
        // console.log('signing in')
        // Call backend to authenticate wallet and get JWT
        const res = await fetch('/api/wallet-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: account.bech32Address })
        });

        if (!res.ok) {
          const errorData = await res.json();
          const errorMessage = errorData.error || 'Authentication failed';
          
          // Handle specific error types
          if (res.status === 503) {
            setError('Connection issue. Please check your internet and try again.');
          } else if (res.status === 500) {
            setError('Server error. Please try again later.');
          } else {
            setError(errorMessage);
          }
          return;
        }

        const { token, user } = await res.json();
        // console.log('Authentication successful:', { user, token });

        if (token) {
          // Get Supabase client with the new token
          const supabase = await getSupabase(token);
          
          // Set the session using the custom JWT
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: token, // Using same token for refresh
          });

          if (sessionError) {
            // console.error('Session error:', sessionError);
            setError('Failed to establish session. Please try again.');
            return;
          }

          toast.success('Wallet connected successfully');
          await fetchUser(account.bech32Address)
          router.push('/');
        }
      } catch (err) {
        // console.error('Authentication error:', err);
        setError('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (account?.bech32Address) {
      handleWalletAuth();
    }
  }, [account?.bech32Address]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative z-20 overflow-hidden bg-[#181A20] gr-bi">

      {/* Main content */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Let's get you started</h1>
        <p className="text-gray-400">Sign in to access your content</p>
      </div>
      <div className="w-full max-w-md mx-auto flex flex-col items-center">
      {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-md w-full">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
        <button
          className="cursor-pointer bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white px-4 py-2 rounded-4xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleLogin}
          disabled={loading || isConnecting}
        >
          {loading ? 'AUTHENTICATING...' : isConnecting ? 'CONNECTING...' : account?.bech32Address  ? 'VIEW ACCOUNT' : 'CONNECT'}
        </button>
      </div>
    </div>
  );
}