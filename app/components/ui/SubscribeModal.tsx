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
  onSuccess?: () => void;
}

type PaymentState = 'initial' | 'pending' | 'success' | 'failed';
type ModalStep = 'initial' | 'billing' | 'payment';

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
  onSuccess,
}: SubscribeModalProps) {
  const [tokenType, setTokenType] = useState<'XION' | 'USDC'>('XION');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('initial');
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ModalStep>('initial');
  const popupCheckInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Billing information state
  const [phoneCountryCode, setPhoneCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('US');

  const paymentWindowRef = useRef<Window | null>(null);

  const getPeriod = () => {
    if (creator.subscription_type === 'monthly') return 'per month';
    if (creator.subscription_type === 'yearly') return 'per year';
    return 'one-time';
  };

  const startPopupCloseListener = (reference: string, popupWindow: Window) => {
    //console.log('Starting popup close listener for reference:', reference);
    let timeoutCounter = 0;
    const MAX_TIMEOUT = 300; // 5 minutes
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
    }
    popupCheckInterval.current = setInterval(() => {
      timeoutCounter++;
      //console.log(`Popup check ${timeoutCounter}: popupWindow exists:`, !!popupWindow, 'closed:', popupWindow?.closed);
      if (popupWindow && popupWindow.closed) {
        //console.log('Popup was closed, checking payment status...');
        checkPaymentStatus(reference);
        clearInterval(popupCheckInterval.current!);
        popupCheckInterval.current = null;
        paymentWindowRef.current = null;
      } else if (timeoutCounter >= MAX_TIMEOUT) {
        //console.log('Timeout reached, checking payment status anyway...');
        checkPaymentStatus(reference);
        clearInterval(popupCheckInterval.current!);
        popupCheckInterval.current = null;
        paymentWindowRef.current = null;
      }
    }, 1000);
  };

  const checkPaymentStatus = async (reference: string) => {
    //console.log('Checking payment status for reference:', reference);
    try {
      const response = await fetch('/api/subscriptions/check-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();
      //console.log('Payment status response:', data);

      if (response.ok) {
        if (data.status === 'completed') {
          //console.log('Payment successful!');
          setPaymentState('success');
          onSuccess?.();
        } else if (data.status === 'failed') {
          //console.log('Payment failed!');
          setPaymentState('failed');
        } else {
          //console.log('Payment still pending');
          // If still pending, show a message asking user to check their payment
          setTimeout(() => {
            setPaymentState('failed');
            setError('Payment failed. Please try again.');
          }, 10000);
        }
      } else {
        console.error('Error checking payment status:', data.error);
        setPaymentState('failed');
        setError('Unable to verify payment status. Please contact support.');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentState('failed');
      setError('Network error while checking payment status.');
    }
  };

  const handleProceed = async () => {
    if (currentStep === 'initial') {
      // Move to billing step
      setCurrentStep('billing');
      return;
    }
    
    if (currentStep === 'billing') {
      // Validate billing info and proceed to payment
      if (!phoneNumber.trim() || !addressLine1.trim() || !city.trim() || !country.trim()) {
        setError('Please fill in all billing information');
        return;
      }
      
      setCurrentStep('payment');
      setError(null);
      await processPayment();
      return;
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError(null);
    setPaymentState('pending');

    try {
      // Initialize payment
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
          userPhone: {
            country_code: phoneCountryCode,
            number: phoneNumber
          },
          userAddress: {
            line1: addressLine1,
            city: city,
            country: country
          }
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Payment initialization failed');
      }

      const data = await res.json();
      
      if (data.status === 'success' && data.payment_url) {
        setPaymentReference(data.payment_reference);
        //console.log('Payment initialized, opening popup with URL:', data.payment_url);
        
        // Open payment window
        const popupWindow = window.open(
          data.payment_url,
          'novypay_payment',
          'width=500,height=700,scrollbars=yes,resizable=yes'
        );
        
        //console.log('Popup window created:', popupWindow);
        
        if (popupWindow) {
          paymentWindowRef.current = popupWindow;
          //console.log('Starting popup close listener...');
          startPopupCloseListener(data.payment_reference, popupWindow);
        } else {
          throw new Error('Failed to open payment window. Please check your popup blocker.');
        }
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPaymentState('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (popupCheckInterval.current) {
      clearInterval(popupCheckInterval.current);
      popupCheckInterval.current = null;
    }
    if (paymentWindowRef.current) {
      paymentWindowRef.current.close();
      paymentWindowRef.current = null;
    }
    // Reset all states
    setLoading(false);
    setError(null);
    setPaymentState('initial');
    setPaymentReference(null);
    setCurrentStep('initial');
    
    // Reset billing form
    setPhoneCountryCode('+1');
    setPhoneNumber('');
    setAddressLine1('');
    setCity('');
    setCountry('US');

    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep('initial');
      setPaymentState('initial');
      setLoading(false);
      setError(null);
      setPaymentReference(null);
      
      // Reset billing form
      setPhoneCountryCode('+1');
      setPhoneNumber('');
      setAddressLine1('');
      setCity('');
      setCountry('US');
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (popupCheckInterval.current) {
        clearInterval(popupCheckInterval.current);
      }
      if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
        paymentWindowRef.current.close();
      }
    };
  }, []);

  const renderContent = () => {
    // Handle payment states (success, failed, pending)
    if (currentStep === 'payment') {
      switch (paymentState) {
        case 'pending':
          return (
            <div className="text-center">
              <Icon icon="eos-icons:loading" className="text-4xl animate-spin mx-auto mb-4 text-purple-500" />
              <h2 className="text-xl font-bold text-white mb-2">Payment in Progress</h2>
              <p className="text-gray-400 mb-4">
                Please complete your payment in the popup window. We'll check the status once you close it.
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
                    setCurrentStep('billing');
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
      }
    }

    // Handle initial step
    if (currentStep === 'initial') {
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

    // Handle billing step
    if (currentStep === 'billing') {
      return (
        <>
          <div className="w-full flex items-center justify-between mb-8">
            <span className="text-base text-white font-semibold">Billing Information</span>
            <button
              onClick={() => setCurrentStep('initial')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Icon icon="mdi:arrow-left" className="w-5 h-5" />
            </button>
          </div>
          
          <div className="text-gray-200 mb-6 text-lg font-medium">
            Please provide your billing information to complete the subscription.
          </div>
          
          {/* Billing Information */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Country Code</label>
                <input
                  type="text"
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  placeholder="+1"
                  className="w-full px-3 py-2 text-sm bg-[#18122B] border border-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="1234567890"
                  className="w-full px-3 py-2 text-sm bg-[#18122B] border border-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">Address</label>
              <input
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main St"
                className="w-full px-3 py-2 text-sm bg-[#18122B] border border-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New York"
                  className="w-full px-3 py-2 text-sm bg-[#18122B] border border-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="US"
                  className="w-full px-3 py-2 text-sm bg-[#18122B] border border-[#333] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          
          {error && <div className="text-red-500 text-center mb-4">{error}</div>}
          
          <Button
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B25FF] to-[#350FDD] text-xl font-bold shadow-lg disabled:opacity-60"
            onClick={handleProceed}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </>
      );
    }
  };

  return (
    <Dialog open={open} onClose={() => {}} className="fixed z-50 inset-0 flex items-center">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      <div className="relative bg-black rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg mx-auto border border-[#222]">
        {currentStep !== 'payment' && (
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