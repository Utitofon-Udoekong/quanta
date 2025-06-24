import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;
const NOVYPAY_BASE_URL = 'https://burntpay-u44m.onrender.com';
const NOVYPAY_API_KEY = process.env.NOVYPAY_API_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Payment status types
type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled';

// NovyPay payment verification response
interface NovyPayPaymentVerification {
  status: 'success' | 'error';
  payment_status?: PaymentStatus;
  amount?: number;
  currency?: string;
  token_type?: string;
  reference?: string;
  error?: string;
}

// Subscription payment record interface
interface SubscriptionPaymentRecord {
  id: string;
  subscription_id: string;
  novypay_reference: string;
  amount: number;
  currency: string;
  token_type: 'USDC' | 'XION';
  status: PaymentStatus;
  payment_date: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_fullname?: string;
}

/**
 * Check payment status with NovyPay
 */
async function checkNovyPayPaymentStatus(
  reference: string
): Promise<NovyPayPaymentVerification> {
  try {
    if (!NOVYPAY_API_KEY) {
      return {
        status: 'error',
        error: 'NovyPay API key not configured',
      };
    }

    const response = await fetch(`${NOVYPAY_BASE_URL}/payments/verify/${reference}`, {
      method: 'GET',
      headers: {
        'novypay-api-key': NOVYPAY_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'error',
        error: data.error || 'Payment verification failed',
      };
    }

    return {
      status: 'success',
      payment_status: data.payment_status,
      amount: data.amount,
      currency: data.currency,
      token_type: data.token_type,
      reference: data.reference,
    };
  } catch (error) {
    console.error('Error checking NovyPay payment status:', error);
    return {
      status: 'error',
      error: 'Network error occurred',
    };
  }
}

/**
 * Get subscription payment by NovyPay reference
 */
async function getSubscriptionPaymentByReference(
  novypayReference: string
): Promise<SubscriptionPaymentRecord | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*')
      .eq('novypay_reference', novypayReference)
      .single();

    if (error) {
      console.error('Error getting subscription payment by reference:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSubscriptionPaymentByReference:', error);
    return null;
  }
}

/**
 * Update subscription payment status
 */
async function updateSubscriptionPaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('subscription_payments')
      .update({
        status: status,
        payment_date: status === 'success' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (error) {
      console.error('Error updating subscription payment status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionPaymentStatus:', error);
    return false;
  }
}

/**
 * Process subscription payment completion
 */
async function processSubscriptionPaymentCompletion(
  novypayReference: string
): Promise<boolean> {
  try {
    // Get payment record
    const paymentRecord = await getSubscriptionPaymentByReference(novypayReference);
    if (!paymentRecord) {
      console.error('Payment record not found for reference:', novypayReference);
      return false;
    }

    // Check payment status with NovyPay
    const verification = await checkNovyPayPaymentStatus(novypayReference);
    if (verification.status === 'error') {
      console.error('Payment verification failed:', verification.error);
      return false;
    }

    // Update payment status
    const status = verification.payment_status || 'failed';
    await updateSubscriptionPaymentStatus(paymentRecord.id, status);

    // If payment was successful, update subscription
    if (status === 'success') {
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          last_renewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentRecord.subscription_id);

      if (subscriptionError) {
        console.error('Error updating subscription status:', subscriptionError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error in processSubscriptionPaymentCompletion:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Process the payment completion
    const success = await processSubscriptionPaymentCompletion(reference);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    // Get updated payment record
    const paymentRecord = await getSubscriptionPaymentByReference(reference);

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        creator:users!creator_id (username, wallet_address),
        subscriber:users!subscriber_id (username, wallet_address)
      `)
      .eq('id', paymentRecord.subscription_id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentStatus: paymentRecord.status,
      subscription: {
        id: subscription.id,
        type: subscription.type,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        expiresAt: subscription.expires_at,
        creator: {
          username: subscription.creator?.username,
          walletAddress: subscription.creator?.wallet_address,
        },
        subscriber: {
          username: subscription.subscriber?.username,
          walletAddress: subscription.subscriber?.wallet_address,
        },
      },
      message: paymentRecord.status === 'success' 
        ? 'Payment successful and subscription activated' 
        : 'Payment processed',
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Get payment record
    const paymentRecord = await getSubscriptionPaymentByReference(reference);

    if (!paymentRecord) {
      return NextResponse.json(
        { error: 'Payment record not found' },
        { status: 404 }
      );
    }

    // Get subscription details
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        creator:users!creator_id (username, wallet_address),
        subscriber:users!subscriber_id (username, wallet_address)
      `)
      .eq('id', paymentRecord.subscription_id)
      .single();

    if (subscriptionError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentRecord.id,
        reference: paymentRecord.novypay_reference,
        status: paymentRecord.status,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        tokenType: paymentRecord.token_type,
        paymentDate: paymentRecord.payment_date,
        createdAt: paymentRecord.created_at,
      },
      subscription: {
        id: subscription.id,
        type: subscription.type,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        expiresAt: subscription.expires_at,
        creator: {
          username: subscription.creator?.username,
          walletAddress: subscription.creator?.wallet_address,
        },
        subscriber: {
          username: subscription.subscriber?.username,
          walletAddress: subscription.subscriber?.wallet_address,
        },
      },
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 