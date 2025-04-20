'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { Subscription, SubscriptionPlan, SubscriptionPayment } from '@/app/types';
import { useUserStore } from '@/app/stores/user';
import { toast } from '@/app/components/helpers/toast';
import {
    CreditCardIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    ClipboardIcon,
    ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import {
    Abstraxion,
    useAbstraxionAccount,
    useAbstraxionSigningClient,
    useAbstraxionClient,
    useModal,
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import "@burnt-labs/ui/dist/index.css";
import { treasuryConfig } from '@/app/layout';
import { 
    TOKEN_DENOM, 
    DENOM_DISPLAY_NAME, 
    DECIMALS, 
    getXionPrice, 
    usdToXion, 
    formatXionAmount, 
    formatUsdAmount 
} from '@/app/utils/xion';

// Define subscription plans as a static object
const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'basic-monthly',
        name: 'Basic',
        description: 'Access to all free content',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
            features: [
                'Access to all free content',
                'Basic support'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: 'premium-monthly',
        name: 'Premium',
        description: 'Access to all premium content',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: {
            features: [
                'Access to all free content',
                'Access to all premium content',
                'Priority support',
                'Ad-free experience'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: 'pro-monthly',
        name: 'Pro',
        description: 'Access to all premium content and exclusive content',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: {
            features: [
                'Access to all free content',
                'Access to all premium content',
                'Access to exclusive content',
                'Priority support',
                'Ad-free experience',
                'Early access to new content'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: 'basic-annual',
        name: 'Basic',
        description: 'Access to all free content with annual discount',
        price: 0,
        currency: 'USD',
        interval: 'year',
        features: {
            features: [
                'Access to all free content',
                'Basic support'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: 'premium-annual',
        name: 'Premium',
        description: 'Access to all premium content with annual discount',
        price: 99.99,
        currency: 'USD',
        interval: 'year',
        features: {
            features: [
                'Access to all free content',
                'Access to all premium content',
                'Priority support',
                'Ad-free experience'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    },
    {
        id: 'pro-annual',
        name: 'Pro',
        description: 'Access to all premium content and exclusive content with annual discount',
        price: 199.99,
        currency: 'USD',
        interval: 'year',
        features: {
            features: [
                'Access to all free content',
                'Access to all premium content',
                'Access to exclusive content',
                'Priority support',
                'Ad-free experience',
                'Early access to new content'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    }
];

export default function SubscriptionsPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [allPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
    const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isAnnual, setIsAnnual] = useState(false);
    const [balance, setBalance] = useState("0");
    const [exResultTransactionHash, setExResultTransactionHash] = useState<string | null>(null);
    const [exResultHeight, setExResultHeight] = useState("");
    const [copied, setCopied] = useState(false);
    const [xionPrice, setXionPrice] = useState<number>(1);

    // Abstraxion hooks
    const { data: account } = useAbstraxionAccount();
    const { client, signArb, logout } = useAbstraxionSigningClient();
    const { client: queryClient } = useAbstraxionClient();
    const [, setShowModal] = useModal();

    const router = useRouter();
    const supabase = createClient();
    const { user } = useUserStore();

    // Filter plans based on the selected interval (monthly or annual)
    const plans = allPlans.filter(plan =>
        isAnnual ? plan.interval === 'year' : plan.interval === 'month'
    );

    // Fetch the token balance and price
    const getTokenBalance = async () => {
        if (account?.bech32Address) {
            if (!queryClient) {
                return;
            }
            setLoading(true);
            try {
                const response = await queryClient.getBalance(account?.bech32Address, TOKEN_DENOM!);
                const amountInXion = parseFloat(response.amount)/DECIMALS
                setBalance(response ? amountInXion.toFixed(2) : "0");
                
                // Fetch Xion price
                const price = await getXionPrice();
                setXionPrice(price);
            } catch (error) {
                console.error("Error querying token balance:", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {

        const fetchSubscriptionData = async () => {
            try {
                setLoading(true);

                // Fetch user's subscription
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user?.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (subscriptionError && subscriptionError.code !== 'PGRST116') {
                    // PGRST116 is "no rows returned" which is fine if user has no subscription
                    throw subscriptionError;
                }

                // If we have a subscription, find the corresponding plan from our static plans
                if (subscriptionData) {
                    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscriptionData.plan_id);
                    setSubscription({
                        ...subscriptionData,
                        plan
                    });

                    // Set the interval toggle based on the current subscription
                    if (plan) {
                        setIsAnnual(plan.interval === 'year');
                    }

                    // Fetch subscription payments
                    const { data: paymentsData, error: paymentsError } = await supabase
                        .from('subscription_payments')
                        .select('*')
                        .eq('subscription_id', subscriptionData.id)
                        .order('payment_date', { ascending: false });

                    if (paymentsError) throw paymentsError;
                    setPayments(paymentsData || []);
                } else {
                    setSubscription(null);
                }
            } catch (err) {
                console.error('Error fetching subscription data:', err);
                setError('Failed to load subscription data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchSubscriptionData();
    }, [user, router, supabase]);

    // Fetch token balance when account changes
    useEffect(() => {
        if (queryClient ) {
            getTokenBalance();
        }
    }, [queryClient]);

    const handleSubscribe = async (planId: string) => {
        if (!user) {
            router.push('/auth');
            return;
        }

        if (!account?.bech32Address) {
            toast('Please connect your Xion wallet to subscribe', 'error');
            setShowModal(true);
            return;
        }

        try {
            setProcessingPayment(true);
            setSelectedPlan(planId);

            // Find the selected plan
            const plan = allPlans.find(p => p.id === planId);
            if (!plan) throw new Error('Selected plan not found');

            // For free plans, create subscription directly
            if (plan.price === 0) {
                await createSubscription(plan);
                return;
            }

            // For paid plans, process payment first
            await processPayment(plan);

        } catch (err) {
            console.error('Error subscribing to plan:', err);
            toast('Failed to activate subscription. Please try again.', 'error');
        } finally {
            setProcessingPayment(false);
            setSelectedPlan(null);
        }
    };

    const processPayment = async (plan: SubscriptionPlan) => {
        if (!account?.bech32Address || !client) {
            toast('Wallet connection required for payment', 'error');
            return;
        }

        try {
            // Convert USD price to token amount using current exchange rate
            const tokenAmount = await usdToXion(plan.price);
            const roundedTokenAmount = Math.ceil(tokenAmount * Math.pow(10, DECIMALS)).toString();

            // Send tokens to treasury
            const result = await client.sendTokens(
                account.bech32Address,
                treasuryConfig.treasury!,
                [{ denom: TOKEN_DENOM!, amount: roundedTokenAmount }],
                1.5
            );

            if (result.code !== 0) {
                throw new Error(`Transaction failed with code ${result.code}`);
            }

            // Store transaction details
            setExResultTransactionHash(result.transactionHash);
            setExResultHeight(result.height.toString());

            // Create subscription after successful payment
            await createSubscription(plan, result.transactionHash);

            // Refresh token balance
            await getTokenBalance();

            toast('Payment successful! Subscription activated.', 'success');
        } catch (error) {
            console.error('Error processing payment:', error);
            toast('Payment failed. Please try again.', 'error');
            throw error;
        }
    };

    const createSubscription = async (plan: SubscriptionPlan, transactionHash?: string) => {
        if (!user) return;

        try {
            // Create a new subscription
            const now = new Date();
            const periodEnd = new Date(now);
            if (plan.interval === 'month') {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            const { data: subscriptionData, error: subscriptionError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: plan.id,
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    payment_method: 'xion_wallet',
                    payment_status: 'succeeded',
                    last_payment_date: now.toISOString(),
                    next_payment_date: periodEnd.toISOString()
                })
                .select()
                .single();

            if (subscriptionError) throw subscriptionError;

            // Create a payment record if this was a paid plan
            if (plan.price > 0 && transactionHash) {
                const { error: paymentError } = await supabase
                    .from('subscription_payments')
                    .insert({
                        subscription_id: subscriptionData.id,
                        amount: plan.price,
                        currency: plan.currency,
                        status: 'succeeded',
                        payment_method: 'xion_wallet',
                        payment_date: now.toISOString(),
                        transaction_hash: transactionHash
                    });

                if (paymentError) throw paymentError;

                // Add the new payment to the payments list
                setPayments([
                    {
                        id: crypto.randomUUID(), // This would be the actual ID from the database
                        subscription_id: subscriptionData.id,
                        amount: plan.price,
                        currency: plan.currency,
                        status: 'succeeded',
                        payment_method: 'xion_wallet',
                        payment_date: now.toISOString(),
                        created_at: now.toISOString()
                    },
                    ...payments
                ]);
            }

            // Update the subscription state
            setSubscription({
                ...subscriptionData,
                plan
            });

        } catch (error) {
            console.error('Error creating subscription:', error);
            toast('Failed to create subscription. Please try again.', 'error');
            throw error;
        }
    };

    const handleCancelSubscription = async () => {
        if (!subscription) return;

        try {
            setProcessingPayment(true);

            // Update the subscription to cancel at the end of the current period
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    cancel_at_period_end: true,
                    canceled_at: new Date().toISOString()
                })
                .eq('id', subscription.id);

            if (error) throw error;

            // Update the subscription state
            setSubscription({
                ...subscription,
                cancel_at_period_end: true,
                canceled_at: new Date().toISOString()
            });

            toast('Subscription will be canceled at the end of the billing period.', 'success');
        } catch (err) {
            console.error('Error canceling subscription:', err);
            toast('Failed to cancel subscription. Please try again.', 'error');
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'canceled':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            case 'expired':
                return <XCircleIcon className="h-5 w-5 text-gray-500" />;
            case 'past_due':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getPaymentStatusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
            case 'failed':
                return <XCircleIcon className="h-5 w-5 text-red-500" />;
            case 'pending':
                return <ClockIcon className="h-5 w-5 text-yellow-500" />;
            case 'refunded':
                return <ArrowPathIcon className="h-5 w-5 text-blue-500" />;
            default:
                return null;
        }
    };

    const blockExplorerUrl = exResultTransactionHash
        ? `https://www.mintscan.io/xion-testnet/tx/${exResultTransactionHash}`
        : '';

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopied(true);
                toast('Address copied to clipboard', 'success');
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                toast('Failed to copy address', 'error');
            });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0C10] text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0A0C10] text-white p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-md">
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0C10] text-white p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold mb-6">Subscription Management</h1>

                {/* Xion Wallet Connection */}
                <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 mb-8 border border-gray-700/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Xion Wallet</h2>
                            <p className="text-gray-400 mb-2">
                                Connect your Xion wallet to make subscription payments
                            </p>
                            {account?.bech32Address && (
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm text-gray-300">
                                        Connected: {account.bech32Address.substring(0, 6)}...{account.bech32Address.substring(account.bech32Address.length - 4)}
                                    </p>
                                    <button 
                                        onClick={() => copyToClipboard(account.bech32Address)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="Copy address to clipboard"
                                    >
                                        {copied ? (
                                            <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ClipboardIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            )}
                            {account?.bech32Address && (
                                <p className="text-sm text-gray-300 mt-1">
                                    Balance: {balance} {DENOM_DISPLAY_NAME}
                                </p>
                            )}
                            <p className="text-sm text-gray-400 mt-1">
                                Current Xion Price: {formatUsdAmount(xionPrice)} USD
                            </p>
                        </div>
                        <div>
                            <Button
                                onClick={() => setShowModal(true)}
                                structure="base"
                                className="px-4 py-2"
                            >
                                {account?.bech32Address ? "Change Wallet" : "Connect Wallet"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Current Subscription */}
                {subscription && (
                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 mb-8 border border-gray-700/30">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-semibold mb-2">Current Subscription</h2>
                                <div className="flex items-center mb-2">
                                    <span className="mr-2">{getStatusIcon(subscription.status)}</span>
                                    <span className="capitalize">{subscription.status}</span>
                                    {subscription.cancel_at_period_end && (
                                        <span className="ml-2 text-yellow-500">(Cancels at period end)</span>
                                    )}
                                </div>
                                <p className="text-gray-400 mb-4">
                                    {subscription.plan?.name} - ${subscription.plan?.price}/{subscription.plan?.interval}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Current Period</p>
                                        <p>{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Next Payment</p>
                                        <p>{subscription.next_payment_date ? formatDate(subscription.next_payment_date) : 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div>
                                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                                    <button
                                        onClick={handleCancelSubscription}
                                        disabled={processingPayment}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white transition-colors"
                                    >
                                        {processingPayment ? 'Processing...' : 'Cancel Subscription'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Subscription Plans */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Available Plans</h2>

                        {/* Billing Interval Toggle */}
                        <div className="flex items-center space-x-3">
                            <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-700'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                            <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                                Annual <span className="text-green-500 text-xs">(Save 20%)</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border ${subscription?.plan_id === plan.id
                                        ? 'border-blue-500/50'
                                        : 'border-gray-700/30'
                                    }`}
                            >
                                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                                <p className="text-gray-400 mb-4">{plan.description}</p>
                                <div className="mb-4">
                                    <span className="text-2xl font-bold">${plan.price}</span>
                                    <span className="text-gray-400">/{plan.interval}</span>
                                    {plan.price > 0 && (
                                        <div className="text-sm text-gray-400 mt-1">
                                            ≈ {formatXionAmount(plan.price / xionPrice)} {DENOM_DISPLAY_NAME}
                                        </div>
                                    )}
                                </div>
                                <ul className="mb-6 space-y-2">
                                    {plan.features.features.map((feature, index) => (
                                        <li key={index} className="flex items-start">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={processingPayment || subscription?.plan_id === plan.id}
                                    className={`w-full py-2 rounded-md transition-colors ${subscription?.plan_id === plan.id
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    {processingPayment && selectedPlan === plan.id
                                        ? 'Processing...'
                                        : subscription?.plan_id === plan.id
                                            ? 'Current Plan'
                                            : 'Subscribe'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment History */}
                {subscription && payments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Payment History</h2>
                        <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/30">
                            <table className="min-w-full divide-y divide-gray-700/30">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Payment Method
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/30">
                                    {payments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {formatDate(payment.payment_date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                ${payment.amount} {payment.currency}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center">
                                                    <span className="mr-2">{getPaymentStatusIcon(payment.status)}</span>
                                                    <span className="capitalize">{payment.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="flex items-center">
                                                    <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                                                    <span className="capitalize">{payment.payment_method || 'N/A'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Transaction Details */}
                {exResultTransactionHash && (
                    <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700/30">
                        <h2 className="text-xl font-semibold mb-4">Latest Transaction</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Transaction Hash</p>
                                <p className="text-sm break-all">{exResultTransactionHash}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Block Height</p>
                                <p className="text-sm">{exResultHeight}</p>
                            </div>
                            <div className="md:col-span-2">
                                <a
                                    href={blockExplorerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 text-sm"
                                >
                                    View in Block Explorer
                                </a>
                            </div>
                        </div>
                    </div>
                )}

                {/* Abstraxion Modal */}
                <Abstraxion onClose={() => setShowModal(false)} />
            </div>
        </div>
    );
} 