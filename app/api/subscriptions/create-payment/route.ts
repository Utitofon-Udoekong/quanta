import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;
const NOVYPAY_BASE_URL = 'https://burntpay-u44m.onrender.com';
const NOVYPAY_API_KEY = process.env.NOVYPAY_API_KEY || '';
//console.log('NOVYPAY_API_KEY', NOVYPAY_API_KEY);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// NovyPay payment request interface
interface NovyPayPaymentRequest {
  amount: number;
  currency: string;
  token_type: 'USDC' | 'XION';
  email: string;
  fullname: string;
  phone_country_code: string;
  phone_number: string;
  address_line1: string;
  city: string;
  country: string;
}

// NovyPay payment response interface
interface NovyPayPaymentResponse {
  status: 'success' | 'error';
  reference?: string;
  redirect_url?: string;
  error?: string;
}

/**
 * Initialize a payment with NovyPay
 */
async function initializeNovyPayPayment(
  paymentRequest: NovyPayPaymentRequest
): Promise<NovyPayPaymentResponse> {
  try {
    if (!NOVYPAY_API_KEY) {
      return {
        status: 'error',
        error: 'NovyPay API key not configured',
      };
    }

    const response = await fetch(`${NOVYPAY_BASE_URL}/payments/combined/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'novypay-api-key': NOVYPAY_API_KEY,
      },
      body: JSON.stringify(paymentRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('NovyPay payment initialization failed:', data);
      return {
        status: 'error',
        error: data.error || 'Payment initialization failed',
      };
    }

    return {
      status: 'success',
      reference: data.reference,
      redirect_url: data.redirect_url,
    };
  } catch (error) {
    console.error('Error initializing NovyPay payment:', error);
    return {
      status: 'error',
      error: 'Network error occurred',
    };
  }
}

/**
 * Create a subscription payment record in our database
 */
async function createSubscriptionPaymentRecord(
  subscriptionId: string,
  novypayReference: string,
  amount: number,
  currency: string,
  tokenType: 'USDC' | 'XION'
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('subscription_payments')
      .insert({
        subscription_id: subscriptionId,
        payment_reference: novypayReference,
        amount: amount,
        currency: currency,
        token_type: tokenType,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating subscription payment record:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createSubscriptionPaymentRecord:', error);
    return null;
  }
}

// Helper to create a notification for a user
async function createNotification(userId: string, type: string, message: string, data?: any) {
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      message,
      data,
    });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      creatorWalletAddress,
      subscriberWalletAddress,
      type,
      amount,
      currency = 'USD',
      tokenType = 'XION',
      userPhone,
      userAddress,
    } = body;

    // Validate required fields
    if (!creatorWalletAddress || !subscriberWalletAddress || !type || !amount) {
      //console.log('Missing required fields', body);
        return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!['monthly', 'yearly', 'one-time'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    // Validate token type
    if (!['USDC', 'XION'].includes(tokenType)) {
      return NextResponse.json(
        { error: 'Invalid token type' },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Get user IDs from wallet addresses
        //console.log('body', body);
    const [creatorResult, subscriberResult] = await Promise.all([
      supabase
        .from('users')
        .select('id, username, wallet_address')
        .eq('wallet_address', creatorWalletAddress)
        .single(),
      supabase
        .from('users')
            .select('id, username, wallet_address, email')
        .eq('wallet_address', subscriberWalletAddress)
        .single(),
    ]);

    if (creatorResult.error || !creatorResult.data) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (subscriberResult.error || !subscriberResult.data) {
      return NextResponse.json(
        { error: 'Subscriber not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to subscribe to themselves
    if (creatorWalletAddress === subscriberWalletAddress) {
      return NextResponse.json(
        { error: 'Cannot subscribe to yourself' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('creator_id', creatorResult.data.id)
      .eq('subscriber_id', subscriberResult.data.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription.data) {
      return NextResponse.json(
        { error: 'Active subscription already exists' },
        { status: 409 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    if (type === 'monthly') {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (type === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      // one-time subscriptions don't expire
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);
    }

    // Create subscription record
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        creator_id: creatorResult.data.id,
        subscriber_id: subscriberResult.data.id,
        type: type,
        status: 'pending',
        amount: amount,
        currency: currency,
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Initialize NovyPay payment
    const paymentRequest: NovyPayPaymentRequest = {
      amount: amount,
      currency: currency,
      token_type: tokenType,
      email: subscriberResult.data.email || 'user@example.com',
      fullname: subscriberResult.data.username || 'User',
      phone_country_code: userPhone?.country_code || '+1',
      phone_number: userPhone?.number || '1234567890',
      address_line1: userAddress?.line1 || '123 Main St',
      city: userAddress?.city || 'New York',
      country: userAddress?.country || 'US'
    };

    const paymentResponse = await initializeNovyPayPayment(paymentRequest);
    //console.log('paymentResponse', paymentResponse);
    if (paymentResponse.status === 'error') {
      // Clean up subscription if payment initialization failed
      await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      // Notify subscriber of payment failure
      await createNotification(
        subscriberResult.data.id,
        'payment_failed',
        'Your payment failed. Please try again.',
        { subscriptionId: subscription.id }
      );
      return NextResponse.json(
        { error: paymentResponse.error || 'Payment initialization failed' },
        { status: 500 }
      );
    }

    // Create payment record
    await createSubscriptionPaymentRecord(
      subscription.id,
      paymentResponse.reference!,
      amount,
      currency,
      tokenType
    );

    // Notify subscriber of payment success
    await createNotification(
      subscriberResult.data.id,
      'payment_success',
      'Your payment was successful and your subscription is now active.',
      { subscriptionId: subscription.id }
    );

    return NextResponse.json({
      status: 'success',
      subscriptionId: subscription.id,
      payment_url: paymentResponse.redirect_url,
      payment_reference: paymentResponse.reference,
      message: 'Payment initialized successfully',
    });

  } catch (error) {
    console.error('Error creating subscription payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 