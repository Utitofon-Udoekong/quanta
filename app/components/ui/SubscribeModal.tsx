import React, { useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
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

    // Prevent closing on outside click or ESC by not passing onClose to Dialog
    return (
        <Dialog open={open} onClose={() => { }} className="fixed z-50 inset-0 flex items-center ">
            <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
            <div className="relative bg-black rounded-[2.5rem] shadow-2xl p-10 w-full max-w-lg mx-auto border border-[#222]">
                <button
                    className="absolute top-6 right-6 text-gray-400 hover:text-white focus:outline-none"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <Icon icon="mdi:close" className="w-7 h-7" />
                </button>
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
            </div>
        </Dialog>
    );
} 