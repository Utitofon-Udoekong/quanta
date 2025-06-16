'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Abstraxion,
  useAbstraxionAccount,
  useModal,
} from "@burnt-labs/abstraxion";

import './page.css';
import { getSupabase } from '../utils/supabase/client';
import { toast } from '@/app/components/helpers/toast';


export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const [, setShowModal]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useModal();  
  
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
          className="cursor-pointer bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white px-4 py-2 rounded-4xl w-full"
          onClick={() => setShowModal(true)}
        disabled={loading}
        >
          {loading ? 'CONNECTING...' : account?.bech32Address ? 'VIEW ACCOUNT' : 'CONNECT'}
        </button>
      </div>
      <Abstraxion onClose={handleCloseModal} />
    </div>
  );
}