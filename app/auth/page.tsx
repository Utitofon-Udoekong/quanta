'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Abstraxion,
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useModal,
} from "@burnt-labs/abstraxion";
// import { Button } from "@burnt-labs/ui";
// import "@burnt-labs/ui/dist/index.css";
import { handleWalletAuth } from '../utils/wallet-auth';
import './page.css';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { data: account } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const [, setShowModal]: [boolean, React.Dispatch<React.SetStateAction<boolean>>] = useModal();  
  
  const handleCloseModal = async () => {
    if (account?.bech32Address) {
      setLoading(true);
      try {
        // Call backend to get wallet JWT
        const res = await fetch('/api/wallet-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: account.bech32Address })
        });
        const { token } = await res.json();

        if (token) {
          // Set the JWT as the session for Supabase
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          });
        }

        // Existing wallet auth logic
        const { user, error: authError } = await handleWalletAuth({
          bech32Address: account.bech32Address,
          wallet_chain: 'xion',
          wallet_metadata: {
            provider: 'abstraxion',
            connected_at: new Date().toISOString()
          }
        });

        if (authError) {
          setError(authError.message);
          return;
        }

        if (user) {
          router.push('/dashboard');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred during authentication');
      } finally {
        setLoading(false);
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