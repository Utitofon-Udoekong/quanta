import React, { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Description } from '@headlessui/react';
import { Button } from '@burnt-labs/ui';
import { Icon } from '@iconify/react';

interface CreatorInfo {
  id: string;
  username?: string;
  wallet_address: string;
  subscription_price: number;
  subscription_currency: string;
  subscription_type: string;
}

interface SubscriberInfo {
  wallet_address: string;
  email: string;
  fullname: string;
}

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  creator: CreatorInfo;
  subscriber: SubscriberInfo;
  contentTitle?: string;
}

const TOKEN_OPTIONS = [
  { label: 'XION', value: 'XION' },
  { label: 'USDC', value: 'USDC' },
];

export default function SubscribeModal({
  open,
  onClose,
  creator,
  subscriber,
  contentTitle,
}: SubscribeModalProps) {
  const [tokenType, setTokenType] = useState<'XION' | 'USDC'>('XION');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPeriod = () => {
    if (creator.subscription_type === 'monthly') return 'per month';
    if (creator.subscription_type === 'yearly') return 'per year';
    return 'one-time';
  };

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorWalletAddress: creator.wallet_address,
          subscriberWalletAddress: subscriber.wallet_address,
          type: creator.subscription_type,
          amount: creator.subscription_price,
          currency: creator.subscription_currency,
          tokenType,
          userEmail: subscriber.email,
          userFullname: subscriber.fullname,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentUrl) {
        setError(data.error || 'Failed to initialize payment.');
        setLoading(false);
        return;
      }
      window.location.href = data.paymentUrl;
    } catch (e) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
      <DialogPanel className="fixed inset-0 bg-black/60" />
      <div className="relative bg-[#18122B] rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto border border-[#8B25FF]/30 flex flex-col items-center">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={onClose}
          aria-label="Close"
        >
          <Icon icon="mdi:close" className="w-6 h-6" />
        </button>
        <div className="w-full flex items-center justify-between mb-6">
          <span className="text-sm text-gray-300 font-medium">Premium plan</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Token:</span>
            <select
              value={tokenType}
              onChange={e => setTokenType(e.target.value as 'XION' | 'USDC')}
              className="bg-[#18122B] border border-[#8B25FF] text-white rounded-lg px-2 py-1 text-sm focus:outline-none"
            >
              {TOKEN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="text-5xl font-extrabold text-white mb-2">
          {creator.subscription_currency === 'USD' ? '$' : creator.subscription_currency}
          {creator.subscription_price.toFixed(0)}
        </div>
        <div className="text-gray-400 text-lg mb-4">{getPeriod()}</div>
        <div className="text-gray-300 text-center mb-8">
          Unlock Premium Videos from Your Favorite Creators – Subscribe Now!
        </div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <Button
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-lg font-semibold shadow-lg disabled:opacity-60"
          onClick={handleProceed}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed'}
        </Button>
      </div>
    </Dialog>
  );
} 