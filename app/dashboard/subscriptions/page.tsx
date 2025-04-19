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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

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
    name: 'Basic (Annual)',
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
    name: 'Premium (Annual)',
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
    name: 'Pro (Annual)',
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
  const [plans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserStore();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const fetchSubscriptionData = async () => {
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
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    try {
      setProcessingPayment(true);
      setSelectedPlan(planId);
      
      // Find the selected plan
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Selected plan not found');
      
      // In a real application, you would integrate with a payment processor here
      // For this example, we'll simulate a successful payment
      
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
          payment_method: 'credit_card',
          payment_status: 'succeeded',
          last_payment_date: now.toISOString(),
          next_payment_date: periodEnd.toISOString()
        })
        .select()
        .single();
        
      if (subscriptionError) throw subscriptionError;
      
      // Create a payment record
      const { error: paymentError } = await supabase
        .from('subscription_payments')
        .insert({
          subscription_id: subscriptionData.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'succeeded',
          payment_method: 'credit_card',
          payment_date: now.toISOString()
        });
        
      if (paymentError) throw paymentError;
      
      // Update the subscription state
      setSubscription({
        ...subscriptionData,
        plan
      });
      
      // Add the new payment to the payments list
      setPayments([
        {
          id: crypto.randomUUID(), // This would be the actual ID from the database
          subscription_id: subscriptionData.id,
          amount: plan.price,
          currency: plan.currency,
          status: 'succeeded',
          payment_method: 'credit_card',
          payment_date: now.toISOString(),
          created_at: now.toISOString()
        },
        ...payments
      ]);
      
      toast('Subscription activated successfully!', 'success');
    } catch (err) {
      console.error('Error subscribing to plan:', err);
      toast('Failed to activate subscription. Please try again.', 'error');
    } finally {
      setProcessingPayment(false);
      setSelectedPlan(null);
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
          <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`bg-gray-800/30 backdrop-blur-sm rounded-lg p-6 border ${
                  subscription?.plan_id === plan.id 
                    ? 'border-blue-500/50' 
                    : 'border-gray-700/30'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-4">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-2xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/{plan.interval}</span>
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
                  className={`w-full py-2 rounded-md transition-colors ${
                    subscription?.plan_id === plan.id
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
      </div>
    </div>
  );
} 