'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/app/utils/supabase/client';
import { Subscription, SubscriptionPlan, SubscriptionPayment } from '@/app/types';
import { useUserStore } from '@/app/stores/user';
import { toast } from '@/app/components/helpers/toast';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ArrowPathIcon,
    ClipboardIcon,
    ClipboardDocumentCheckIcon,
    ExclamationTriangleIcon,
    XMarkIcon,
    SparklesIcon
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
        id: 'free',
        name: 'Free',
        description: 'Access to all free content',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
            features: [
                'Access to all free content',
                'Basic support',
                'Limited content access',
                'Ad-supported experience'
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
                'Ad-free experience',
                'Early access to new content',
                'Exclusive content'
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
                'Ad-free experience',
                'Early access to new content',
                'Exclusive content',
                'Save 17% compared to monthly'
            ]
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
    }
];

// Add new types for subscription progress
type ProgressStep = {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'completed' | 'error';
    message?: string;
};

type ProgressSteps = {
    [key: string]: ProgressStep;
};

export default function SubscriptionsPage() {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [allPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
    const [payments, setPayments] = useState<SubscriptionPayment[]>([
        {
            id: '1',
            subscription_id: '1',
            amount: 0,
            currency: 'USD',
            status: null,
            payment_method: 'xion',
            payment_date: new Date().toISOString(),
            created_at: new Date().toISOString(),
        }
    ]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [isAnnual, setIsAnnual] = useState(false);
    const [balance, setBalance] = useState("0");
    const [transactionHash, setTransactionHash] = useState<string | null>(null);
    const [blockHeight, setBlockHeight] = useState("");
    const [copied, setCopied] = useState(false);
    const [xionPrice, setXionPrice] = useState<number>(1);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [selectedPlanForConfirmation, setSelectedPlanForConfirmation] = useState<SubscriptionPlan | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successPlan, setSuccessPlan] = useState<SubscriptionPlan | null>(null);
    const [subscriptionProgress, setSubscriptionProgress] = useState<ProgressSteps>({
        payment: {
            id: 'payment',
            label: 'Processing Payment',
            status: 'pending'
        },
        transaction: {
            id: 'transaction',
            label: 'Confirming Transaction',
            status: 'pending'
        },
        subscription: {
            id: 'subscription',
            label: 'Creating Subscription',
            status: 'pending'
        },
        completion: {
            id: 'completion',
            label: 'Finalizing Setup',
            status: 'pending'
        }
    });
    const [showProgress, setShowProgress] = useState(false);
    const [showPlans, setShowPlans] = useState(false);

    // Abstraxion hooks
    const { data: account } = useAbstraxionAccount();
    const { client } = useAbstraxionSigningClient();
    const { client: queryClient } = useAbstraxionClient();
    const [, setShowModal] = useModal();

    const router = useRouter();
    const supabase = createClient();
    const { user } = useUserStore();

    // Filter plans based on the selected interval (monthly or annual)
    const plans = allPlans.filter(plan => {
        if (plan.id === 'free') return true; // Always show free plan
        return isAnnual ? plan.interval === 'year' : plan.interval === 'month';
    });

    // Fetch the token balance and price
    const getTokenBalance = async () => {
        if (account?.bech32Address) {
            if (!queryClient) {
                return;
            }
            setLoading(true);
            try {
                const response = await queryClient.getBalance(account?.bech32Address, 'uxion');
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

    // Fetch subscription data
    useEffect(() => {
        const fetchSubscriptionData = async () => {
            if (!user) return;

            try {
                setLoading(true);

                // Fetch user's subscription
                const { data: subscriptionData, error: subscriptionError } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
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
                    // If no subscription exists, create a free subscription
                    await createFreeSubscription();
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
        if (queryClient && account?.bech32Address) {
            getTokenBalance();
        }
    }, [queryClient, account?.bech32Address]);

    // Create a free subscription for new users
    const createFreeSubscription = async () => {
        if (!user) return;

        try {
            const freePlan = SUBSCRIPTION_PLANS.find(p => p.id === 'free');
            if (!freePlan) return;

            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setFullYear(periodEnd.getFullYear() + 10); // Set a far future date for free plan

            const { data: subscriptionData, error: subscriptionError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: user.id,
                    plan_id: freePlan.id,
                    status: 'active',
                    current_period_start: now.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                    payment_method: 'none',
                    payment_status: null as 'succeeded' | 'failed' | 'pending' | null,
                    last_payment_date: now.toISOString(),
                    next_payment_date: periodEnd.toISOString()
                })
                .select()
                .single();

            if (subscriptionError) throw subscriptionError;

            // Update the subscription state
            setSubscription({
                ...subscriptionData,
                plan: freePlan
            });

        } catch (error) {
            console.error('Error creating free subscription:', error);
            toast('Failed to create free subscription. Please try again.', 'error');
        }
    };

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

        // Find the selected plan
        const plan = allPlans.find(p => p.id === planId);
        if (!plan) throw new Error('Selected plan not found');

        // For free plans, just update the existing subscription
        if (plan.price === 0) {
            try {
                setProcessingPayment(true);
                setSelectedPlan(planId);
                
                // Update the existing subscription to free plan
                if (subscription) {
                    const now = new Date();
                    const periodEnd = new Date(now);
                    periodEnd.setFullYear(periodEnd.getFullYear() + 10); // Set a far future date for free plan
                    
                    const { error: updateError } = await supabase
                        .from('subscriptions')
                        .update({
                            plan_id: plan.id,
                            status: 'active',
                            current_period_start: now.toISOString(),
                            current_period_end: periodEnd.toISOString(),
                            payment_method: 'none',
                            payment_status: null as 'succeeded' | 'failed' | 'pending' | null,
                            last_payment_date: now.toISOString(),
                            next_payment_date: periodEnd.toISOString(),
                            cancel_at_period_end: false,
                            canceled_at: null
                        })
                        .eq('id', subscription.id);
                    
                    if (updateError) throw updateError;
                    
                    // Update the subscription state
                    setSubscription({
                        ...subscription,
                        plan,
                        status: 'active',
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd.toISOString(),
                        payment_method: 'none',
                        payment_status: null as 'succeeded' | 'failed' | 'pending' | null,
                        last_payment_date: now.toISOString(),
                        next_payment_date: periodEnd.toISOString(),
                        cancel_at_period_end: false,
                        canceled_at: null
                    });
                } else {
                    // Create a new free subscription if none exists
                    await createFreeSubscription();
                }
                
                toast('Free plan activated successfully!', 'success');
            } catch (err) {
                console.error('Error subscribing to free plan:', err);
                toast('Failed to activate free plan. Please try again.', 'error');
            } finally {
                setProcessingPayment(false);
                setSelectedPlan(null);
            }
            return;
        }

        // For paid plans, show confirmation modal
        setSelectedPlanForConfirmation(plan);
        setShowConfirmationModal(true);
    };

    const confirmSubscription = async () => {
        if (!selectedPlanForConfirmation) return;

        try {
            setProcessingPayment(true);
            setSelectedPlan(selectedPlanForConfirmation.id);
            await processPayment(selectedPlanForConfirmation);
        } catch (err) {
            console.error('Error subscribing to plan:', err);
            toast('Failed to activate subscription. Please try again.', 'error');
        } finally {
            setProcessingPayment(false);
            setSelectedPlan(null);
            setShowConfirmationModal(false);
            setSelectedPlanForConfirmation(null);
        }
    };

    const processPayment = async (plan: SubscriptionPlan) => {
        if (!account?.bech32Address || !client) {
            toast('Wallet connection required for payment', 'error');
            return;
        }

        setShowProgress(true);
        try {
            // Add debug logs
            console.log('Starting payment process with:', {
                plan,
                account: account?.bech32Address,
                treasury: treasuryConfig.treasury
            });

            // Update payment step status
            setSubscriptionProgress(prev => ({
                ...prev,
                payment: {
                    ...prev.payment,
                    status: 'processing',
                    message: 'Converting USD to XION...'
                }
            }));

            // Convert USD price to token amount using current exchange rate
            const tokenAmount = await usdToXion(plan.price);
            const roundedTokenAmount = Math.ceil(tokenAmount * Math.pow(10, DECIMALS)).toString();
            
            // Log conversion details
            console.log('Payment amount details:', {
                originalPrice: plan.price,
                tokenAmount,
                roundedTokenAmount
            });

            setSubscriptionProgress(prev => ({
                ...prev,
                payment: {
                    ...prev.payment,
                    message: 'Initiating payment transaction...'
                }
            }));

            // Ensure we have all required values
            if (!roundedTokenAmount || !account.bech32Address || !treasuryConfig.treasury) {
                console.error('Missing required payment values:', {
                    amount: roundedTokenAmount,
                    sender: account.bech32Address,
                    recipient: treasuryConfig.treasury
                });
                throw new Error('Missing required payment values');
            }

            // Call the backend payment service
            const paymentBody = {
                amount: roundedTokenAmount,
                sender: account.bech32Address,
                recipient: treasuryConfig.treasury
            };

            console.log('Sending payment request with:', paymentBody);

            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentBody),
            });

            const result = await response.json();
            console.log('Payment response:', result);

            if (!response.ok) {
                setSubscriptionProgress(prev => ({
                    ...prev,
                    payment: {
                        ...prev.payment,
                        status: 'error',
                        message: result.error || 'Payment failed'
                    }
                }));
                throw new Error(result.error || 'Payment failed');
            }

            setSubscriptionProgress(prev => ({
                ...prev,
                payment: {
                    ...prev.payment,
                    status: 'completed',
                    message: 'Payment processed successfully'
                },
                transaction: {
                    ...prev.transaction,
                    status: 'processing',
                    message: 'Waiting for transaction confirmation...'
                }
            }));

            // Store transaction details
            setTransactionHash(result.transactionHash);
            setBlockHeight(result.height?.toString() || '');

            setSubscriptionProgress(prev => ({
                ...prev,
                transaction: {
                    ...prev.transaction,
                    status: 'completed',
                    message: 'Transaction confirmed'
                },
                subscription: {
                    ...prev.subscription,
                    status: 'processing',
                    message: 'Creating subscription...'
                }
            }));

            // Create subscription after successful payment
            await createSubscription(plan, result.transactionHash);

            setSubscriptionProgress(prev => ({
                ...prev,
                subscription: {
                    ...prev.subscription,
                    status: 'completed',
                    message: 'Subscription created successfully'
                },
                completion: {
                    ...prev.completion,
                    status: 'processing',
                    message: 'Refreshing wallet balance...'
                }
            }));

            // Refresh token balance
            await getTokenBalance();

            setSubscriptionProgress(prev => ({
                ...prev,
                completion: {
                    ...prev.completion,
                    status: 'completed',
                    message: 'Setup completed successfully'
                }
            }));

            toast('Payment successful! Subscription activated.', 'success');
        } catch (error) {
            console.error('Error processing payment:', error);
            setSubscriptionProgress(prev => ({
                ...prev,
                payment: {
                    ...prev.payment,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Payment failed'
                }
            }));
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
            if (plan.price > 0) {
                // Prepare payment data without transaction_hash first
                const paymentData: Partial<SubscriptionPayment> = {
                    subscription_id: subscriptionData.id,
                    amount: plan.price,
                    currency: plan.currency,
                    status: 'succeeded',
                    payment_method: 'xion_wallet',
                    payment_date: now.toISOString()
                };
                
                // Only add transaction_hash if it exists
                if (transactionHash) {
                    paymentData.transaction_hash = transactionHash;
                }
                
                const { error: paymentError } = await supabase
                    .from('subscription_payments')
                    .insert(paymentData);

                if (paymentError) {
                    console.error("Error creating payment record:", paymentError);
                    // Continue with subscription creation even if payment record fails
                    // We can retry adding the payment record later if needed
                } else {
                    // Add the new payment to the payments list
                    const newPayment: SubscriptionPayment = {
                        id: crypto.randomUUID(), // This would be the actual ID from the database
                        subscription_id: subscriptionData.id,
                        amount: plan.price,
                        currency: plan.currency,
                        status: 'succeeded',
                        payment_method: 'xion_wallet',
                        payment_date: now.toISOString(),
                        created_at: now.toISOString(),
                        transaction_hash: transactionHash || null
                    };
                    
                    setPayments([newPayment, ...payments]);
                }
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

    const getPaymentStatusIcon = (status: string | null) => {
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

    const blockExplorerUrl = transactionHash
        ? `https://www.mintscan.io/xion-testnet/tx/${transactionHash}`
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

    // Add Progress UI Component
    const ProgressIndicator = ({ step }: { step: ProgressStep }) => (
        <div className="flex items-center space-x-4 mb-4">
            <div className="flex-shrink-0">
                {step.status === 'pending' && (
                    <div className="w-6 h-6 border-2 border-gray-400 rounded-full" />
                )}
                {step.status === 'processing' && (
                    <div className="w-6 h-6">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {step.status === 'completed' && (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                )}
                {step.status === 'error' && (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                )}
            </div>
            <div className="flex-grow">
                <p className={`text-sm font-medium ${
                    step.status === 'completed' ? 'text-green-500' :
                    step.status === 'error' ? 'text-red-500' :
                    step.status === 'processing' ? 'text-blue-500' :
                    'text-gray-400'
                }`}>
                    {step.label}
                </p>
                {step.message && (
                    <p className="text-xs text-gray-400 mt-1">{step.message}</p>
                )}
            </div>
        </div>
    );

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
        <div className="min-h-screen bg-[#0A0C10] text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold">Subscription Management</h1>
                    {account?.bech32Address && (
                        <Button
                            onClick={() => setShowModal(true)}
                            structure="base"
                            className="px-4 py-2"
                        >
                            Change Wallet
                        </Button>
                    )}
                </div>

                {/* Current Subscription Status */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold mb-2">Current Subscription</h2>
                                {subscription && subscription.plan && (
                                    <div className="flex items-center space-x-2">
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            subscription.plan.price > 0 
                                                ? 'bg-blue-500/20 text-blue-400' 
                                                : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {subscription.plan.name}
                                        </div>
                                        <div className="flex items-center">
                                            {getStatusIcon(subscription.status)}
                                            <span className="ml-2 text-sm text-gray-400">
                                                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {subscription && subscription.status === 'active' && !subscription.cancel_at_period_end && subscription.plan && subscription.plan.price > 0 && (
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={processingPayment}
                                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Cancel Subscription
                                </button>
                            )}
                        </div>

                        {subscription && subscription.plan && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {subscription.plan.price > 0 ? (
                                        <>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Billing Period</p>
                                                    <p className="text-sm font-medium mt-1">{formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400">Next Payment</p>
                                                    <p className="text-sm font-medium mt-1">{subscription.next_payment_date ? formatDate(subscription.next_payment_date) : 'N/A'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-sm text-gray-400">Plan Cost</p>
                                                    <p className="text-lg font-semibold mt-1">
                                                        ${subscription.plan.price}/{subscription.plan.interval}
                                                    </p>
                                                </div>
                                                {subscription.cancel_at_period_end && (
                                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                                        <div className="flex items-start">
                                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm text-yellow-500 font-medium">Subscription Ending</p>
                                                                <p className="text-xs text-yellow-500/80 mt-1">
                                                                    Your subscription will end on {formatDate(subscription.current_period_end)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-2">
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                                <div className="flex items-start">
                                                    <SparklesIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm text-blue-400 font-medium">Upgrade Available</p>
                                                        <p className="text-xs text-blue-400/80 mt-1">
                                                            Upgrade to Premium to unlock all features and content
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-gray-400 mb-3">Plan Features</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {subscription.plan.features.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-2">
                                                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                                                <span className="text-sm text-gray-300">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
                        <h2 className="text-lg font-semibold mb-4">Wallet Details</h2>
                        {account?.bech32Address ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        <p className="text-sm">Connected</p>
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(account.bech32Address)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {copied ? (
                                            <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <ClipboardIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-sm font-mono mb-4 text-gray-400">
                                    {account.bech32Address.substring(0, 8)}...{account.bech32Address.substring(account.bech32Address.length - 8)}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Balance</span>
                                        <span className="text-sm font-medium">{balance} {DENOM_DISPLAY_NAME}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Price</span>
                                        <span className="text-sm font-medium">{formatUsdAmount(xionPrice)} USD</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <p className="text-sm text-gray-400 mb-4">Connect your wallet to manage subscriptions</p>
                                <Button
                                    onClick={() => setShowModal(true)}
                                    structure="base"
                                    className="w-full"
                                >
                                    Connect Wallet
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Available Plans */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Available Plans</h2>
                        <div className="flex items-center space-x-4">
                            {subscription?.plan?.price && (
                                <button
                                    onClick={() => setShowPlans(!showPlans)}
                                    className="text-sm text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPlans ? 'Hide Plans' : 'Show Plans'}
                                </button>
                            )}
                            <div className="flex items-center space-x-3 bg-gray-800/50 px-3 py-2 rounded-lg">
                                <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
                                <button
                                    onClick={() => setIsAnnual(!isAnnual)}
                                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${isAnnual ? 'bg-blue-600' : 'bg-gray-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                                <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                                    Annual <span className="text-green-500">(Save 17%)</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {(!subscription?.plan?.price || showPlans) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    className={`bg-gray-800/30 backdrop-blur-sm rounded-xl border ${
                                        subscription?.plan_id === plan.id
                                            ? 'border-blue-500/50'
                                            : 'border-gray-700/30'
                                    }`}
                                >
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-semibold">{plan.name}</h3>
                                                <p className="text-sm text-gray-400">{plan.description}</p>
                                            </div>
                                            {plan.price > 0 && (
                                                <div className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded-md text-xs font-medium">
                                                    {plan.interval === 'year' ? 'Annual' : 'Monthly'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-6">
                                            <div className="flex items-baseline">
                                                <span className="text-3xl font-bold">${plan.price}</span>
                                                {plan.price > 0 && (
                                                    <span className="text-gray-400 ml-1">/{plan.interval}</span>
                                                )}
                                            </div>
                                            {plan.price > 0 && (
                                                <p className="text-sm text-gray-400 mt-1">
                                                    ≈ {formatXionAmount(plan.price / xionPrice)} {DENOM_DISPLAY_NAME}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {plan.features.features.map((feature, index) => (
                                                <div key={index} className="flex items-start">
                                                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                                    <span className="text-sm">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-700/30 p-6">
                                        {plan.price > 0 ? (
                                            <button
                                                onClick={() => handleSubscribe(plan.id)}
                                                disabled={processingPayment || subscription?.plan_id === plan.id}
                                                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                                                    subscription?.plan_id === plan.id
                                                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                            >
                                                {processingPayment && selectedPlan === plan.id
                                                    ? 'Processing...'
                                                    : subscription?.plan_id === plan.id
                                                        ? 'Current Plan'
                                                        : 'Select Plan'}
                                            </button>
                                        ) : (
                                            <div className="text-sm text-center text-gray-400">
                                                Basic Plan
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment History */}
                {subscription?.plan && subscription.plan.price > 0 && payments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold mb-6">Payment History</h2>
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-700/30">
                                    <thead className="bg-gray-800/50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-700/30">
                                        {payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-800/20">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {formatDate(payment.payment_date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    ${payment.amount} {payment.currency}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center">
                                                        <span className="mr-2">{getPaymentStatusIcon(payment.status ?? 'N/A')}</span>
                                                        <span className="capitalize">{payment.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className="capitalize">{payment.payment_method}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transaction Details - Only show if there's a transaction */}
                {transactionHash && (
                    <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border border-gray-700/30">
                        <h2 className="text-xl font-semibold mb-4">Latest Transaction</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Transaction Hash</p>
                                <p className="text-sm break-all">{transactionHash}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Block Height</p>
                                <p className="text-sm">{blockHeight}</p>
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

                {/* Progress Modal */}
                {showProgress && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full border border-gray-700/30">
                            <div className="flex justify-between items-start mb-6">
                                <h3 className="text-xl font-semibold">Subscription Progress</h3>
                                {(Object.values(subscriptionProgress).every(step => 
                                    step.status === 'completed' || step.status === 'error'
                                ) || Object.values(subscriptionProgress).some(step => 
                                    step.status === 'error'
                                )) && (
                                    <button 
                                        onClick={() => {
                                            setShowProgress(false);
                                            // Reset progress state when closing
                                            setSubscriptionProgress({
                                                payment: {
                                                    id: 'payment',
                                                    label: 'Processing Payment',
                                                    status: 'pending'
                                                },
                                                transaction: {
                                                    id: 'transaction',
                                                    label: 'Confirming Transaction',
                                                    status: 'pending'
                                                },
                                                subscription: {
                                                    id: 'subscription',
                                                    label: 'Creating Subscription',
                                                    status: 'pending'
                                                },
                                                completion: {
                                                    id: 'completion',
                                                    label: 'Finalizing Setup',
                                                    status: 'pending'
                                                }
                                            });
                                        }}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="space-y-4">
                                {Object.values(subscriptionProgress).map((step) => (
                                    <ProgressIndicator key={step.id} step={step} />
                                ))}
                            </div>

                            {/* Error Message */}
                            {Object.values(subscriptionProgress).some(step => step.status === 'error') && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <div className="flex items-start">
                                        <XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-red-400 font-medium">Payment Failed</p>
                                            <p className="text-xs text-red-400/80 mt-1">
                                                {Object.values(subscriptionProgress).find(step => step.status === 'error')?.message || 
                                                'An error occurred during the payment process. Please try again.'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowProgress(false)}
                                        className="mt-4 w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}

                            {/* Transaction Details */}
                            {transactionHash && (
                                <div className="mt-6 p-4 bg-gray-700/30 rounded-md">
                                    <p className="text-sm text-gray-300 mb-2">Transaction Details:</p>
                                    <p className="text-xs break-all text-gray-400">
                                        Hash: {transactionHash}
                                    </p>
                                    {blockHeight && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Block Height: {blockHeight}
                                        </p>
                                    )}
                                    <a
                                        href={blockExplorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-block"
                                    >
                                        View in Block Explorer
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirmationModal && selectedPlanForConfirmation && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md w-full border border-gray-700/30">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold">Confirm Subscription</h3>
                                <button 
                                    onClick={() => setShowConfirmationModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-gray-300 mb-4">
                                    You are about to subscribe to the <span className="font-semibold">{selectedPlanForConfirmation.name}</span> plan.
                                </p>
                                
                                <div className="bg-gray-700/30 p-4 rounded-md mb-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-300">Plan</span>
                                        <span className="font-medium">{selectedPlanForConfirmation.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-300">Billing</span>
                                        <span className="font-medium">{selectedPlanForConfirmation.interval === 'month' ? 'Monthly' : 'Annual'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300">Amount</span>
                                        <span className="font-medium">${selectedPlanForConfirmation.price}</span>
                                    </div>
                                    {selectedPlanForConfirmation.price > 0 && (
                                        <div className="mt-2 text-sm text-gray-400">
                                            ≈ {formatXionAmount(selectedPlanForConfirmation.price / xionPrice)} {DENOM_DISPLAY_NAME}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-start text-yellow-400 text-sm">
                                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                                    <p>
                                        By confirming, you authorize us to charge your Xion wallet for the subscription amount. 
                                        The subscription will automatically renew at the end of each billing period unless canceled.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowConfirmationModal(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSubscription}
                                    disabled={processingPayment}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors"
                                >
                                    {processingPayment ? 'Processing...' : 'Confirm & Subscribe'}
                                </button>
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