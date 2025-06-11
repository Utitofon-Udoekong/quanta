import { getSupabase } from '@/app/utils/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    const supabase = await getSupabase(accessToken);
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id, ...renewalData } = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabase(accessToken);

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user_id, ...updateData } = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await getSupabase(accessToken);

    // First verify if the subscription belongs to the user
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id')
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
        { error: 'Unauthorized to update this subscription' },
        { status: 403 }
      );
    }

    // Update the subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSubscription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update subscription' },
      { status: 500 }
    );
  }
} 