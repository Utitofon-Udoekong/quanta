import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { Button } from "@headlessui/react"
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

type PaymentState = 'initial' | 'pending' | 'success' | 'failed';

const TOKEN_OPTIONS = [
    { label: 'XION', value: 'XION', icon: 'cryptocurrency:xion' },
    { label: 'USDC', value: 'USDC', icon: 'cryptocurrency:usdc' },
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
  const [paymentState, setPaymentState] = useState<PaymentState>('initial');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  const getPeriod = () => {
    if (creator.subscription_type === 'monthly') return 'per month';
    if (creator.subscription_type === 'yearly') return 'per year';
    return 'one-time';
  };

  const startPolling = (reference: string) => {
    // Clear any existing polling
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Start polling every 3 seconds
    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch('/api/subscriptions/check-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.status === 'success') {
            setPaymentState('success');
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
            }
            // Close payment window if it's still open
            if (paymentWindow && !paymentWindow.closed) {
              paymentWindow.close();
            }
          } else if (data.status === 'failed') {
            setPaymentState('failed');
            if (pollingInterval.current) {
              clearInterval(pollingInterval.current);
            }
            // Close payment window if it's still open
            if (paymentWindow && !paymentWindow.closed) {
              paymentWindow.close();
            }
          }
          // If status is 'pending', continue polling
        } else {
          console.error('Error checking payment status:', data.error);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, 3000);
  };

  const handleProceed = async () => {
    setLoading(true);
    setError(null);
    setPaymentState('pending');
    
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
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.paymentUrl) {
        setError(data.error || 'Failed to initialize payment.');
        setPaymentState('initial');
        setLoading(false);
        return;
      }

      setPaymentReference(data.reference);
      
      // Open payment in new window
      const newWindow = window.open(data.paymentUrl, 'payment', 'width=600,height=700');
      setPaymentWindow(newWindow);
      
      // Start polling for payment status
      startPolling(data.reference);
      
      setLoading(false);
    } catch (e) {
      setError('Network error. Please try again.');
      setPaymentState('initial');
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clear polling interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    // Close payment window if open
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    
    // Reset state
    setPaymentState('initial');
    setPaymentReference(null);
    setPaymentWindow(null);
    setError(null);
    
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close();
      }
    };
  }, [paymentWindow]);

  const renderContent = () => {
    switch (paymentState) {
      case 'pending':
        return (
          <div className="text-center">
            <Icon icon="eos-icons:loading" className="text-4xl animate-spin mx-auto mb-4 text-purple-500" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Payment</h2>
            <p className="text-gray-400 mb-4">
              Please complete your payment in the popup window. We'll notify you once it's processed.
            </p>
            <div className="bg-[#121418] rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-400">
                If the payment window didn't open, please check your popup blocker.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:check" className="text-3xl text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-400 mb-6">
              Your subscription has been activated. You now have access to premium content.
            </p>
            <Button
              onClick={handleClose}
              className="px-6 py-2 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white rounded-lg"
            >
              Continue
            </Button>
          </div>
        );

      case 'failed':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="mdi:close" className="text-3xl text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Failed</h2>
            <p className="text-gray-400 mb-6">
              We couldn't process your payment. Please try again.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => {
                  setPaymentState('initial');
                  setError(null);
                }}
                className="w-full px-6 py-2 bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-white rounded-lg"
              >
                Try Again
              </Button>
              <Button
                onClick={handleClose}
                className="w-full px-6 py-2 bg-gray-600 text-white rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <>
            <div className="w-full flex items-center justify-between mb-8">
              <span className="text-base text-white font-semibold">Premium plan</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Token:</span>
                <div className="relative">
                  <select
                    value={tokenType}
                    onChange={e => setTokenType(e.target.value as 'XION' | 'USDC')}
                    className="appearance-none bg-[#18122B] border border-[#333] text-white rounded-full px-4 py-1.5 text-base font-medium pr-8 focus:outline-none flex items-center min-w-[90px]"
                    style={{ paddingLeft: '2.2rem' }}
                  >
                    {TOKEN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon icon={TOKEN_OPTIONS.find(opt => opt.value === tokenType)?.icon || ''} className="w-5 h-5" />
                  </span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="w-5 h-5 text-gray-400" />
                  </span>
                </div>
              </div>
            </div>
            <div className="text-5xl font-extrabold text-white mb-2">
              {creator.subscription_currency === 'USD' ? '$' : creator.subscription_currency}
              {creator.subscription_price.toFixed(0)}
              <sub className="text-gray-400 text-base font-normal">{getPeriod()}</sub>
            </div>
            <div className="text-gray-200 mb-10 text-lg font-medium">
              Unlock Premium Videos from Your Favorite Creators – Subscribe Now!
            </div>
            {error && <div className="text-red-500 text-center mb-4">{error}</div>}
            <Button
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-xl font-bold shadow-lg disabled:opacity-60"
              onClick={handleProceed}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed'}
            </Button>
          </>
        );
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} className="fixed z-50 inset-0 flex items-center">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="relative bg-black rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg mx-auto border border-[#222]">
        {paymentState === 'initial' && (
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-white focus:outline-none"
            onClick={handleClose}
            aria-label="Close"
          >
            <Icon icon="mdi:close" className="w-7 h-7" />
          </button>
        )}
        {renderContent()}
      </div>
    </Dialog>
  );
} 