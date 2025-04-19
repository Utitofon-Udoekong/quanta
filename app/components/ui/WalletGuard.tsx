'use client';

import { useAbstraxionAccount, useModal } from "@burnt-labs/abstraxion";
import { Abstraxion } from "@burnt-labs/abstraxion";
import { ReactNode, useState } from "react";
import { useUserStore } from "@/app/stores/user";

interface WalletGuardProps {
  children: ReactNode;
  contentType?: string;
}

export default function WalletGuard({ children, contentType = 'content' }: WalletGuardProps) {
  const { data: account } = useAbstraxionAccount();
  const { user } = useUserStore();
  const [showModal, setShowModal] = useState(false);

  if (!account?.bech32Address && !user?.wallet_address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0C10] p-4">
        <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 text-white">Connect Your Wallet</h1>
        <p className="text-gray-400 mb-6 text-center max-w-md">
          Connect your wallet to create and manage {contentType}.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Connect Wallet
        </button>
        <Abstraxion onClose={() => setShowModal(false)} />
      </div>
    );
  }

  return <>{children}</>;
} 