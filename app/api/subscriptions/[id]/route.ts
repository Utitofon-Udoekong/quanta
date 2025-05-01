import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createClient();

    // Get subscription with payment history
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_payments (
          id,
          amount,
          currency,
          status,
          payment_method,
          payment_date
        )
      `)
      .eq('id', id)
      .single();

    if (subscriptionError) {
      return NextResponse.json(
        { error: subscriptionError.message },
        { status: 404 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { user_id, ...renewalData } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify subscription exists and belongs to user
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.user_id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized to renew this subscription' },
        { status: 403 }
      );
    }

    // Begin transaction to handle renewal
    const { error: transactionError } = await supabase.rpc('renew_subscription', {
      p_subscription_id: id,
      p_user_id: user_id,
      p_renewal_data: {
        current_period_start: renewalData.current_period_start,
        current_period_end: renewalData.current_period_end,
        payment_method: renewalData.payment_method,
        payment_status: renewalData.payment_status,
        amount: renewalData.amount,
        currency: renewalData.currency
      }
    });

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    // Fetch the renewed subscription
    const { data: renewedSubscription, error: finalFetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .single();

    if (finalFetchError) {
      return NextResponse.json(
        { error: finalFetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(renewedSubscription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to renew subscription' },
      { status: 500 }
    );
  }
} 