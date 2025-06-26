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
    const { subscriber_id, ...updateData } = await request.json();
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
      );
    }
    if (!subscriber_id) {
      return NextResponse.json(
        { error: 'Subscriber ID is required' },
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

    if (subscription.subscriber_id !== subscriber_id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this subscription' },
        { status: 403 }
      );
    }

    // Update subscription
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update(updateData)
      .eq('id', id)
      .select('*')
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const subscriber_id = searchParams.get('subscriber_id');

    if (!subscriber_id) {
      return NextResponse.json(
        { error: 'Subscriber ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(cookieName)?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token found' },
        { status: 401 }
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

    if (subscription.subscriber_id !== subscriber_id) {
      return NextResponse.json(
        { error: 'Unauthorized to cancel this subscription' },
        { status: 403 }
      );
    }

    // Cancel subscription (soft delete by setting status to cancelled)
    const { data: cancelledSubscription, error: cancelError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (cancelError) {
      return NextResponse.json(
        { error: cancelError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(cancelledSubscription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 