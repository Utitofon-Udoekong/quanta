import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build query
    let query = supabase
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
      `, { count: 'exact' })
      .eq('user_id', user_id);

    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: subscriptions, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriptions,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, plan_id, payment_method, ...subscriptionData } = await request.json();

    if (!user_id || !plan_id || !payment_method) {
      return NextResponse.json(
        { error: 'User ID, plan ID, and payment method are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Begin transaction to create subscription and handle initial payment
    const { data: subscription, error: transactionError } = await supabase.rpc('create_subscription', {
      p_user_id: user_id,
      p_plan_id: plan_id,
      p_payment_method: payment_method,
      p_subscription_data: {
        status: 'active',
        current_period_start: subscriptionData.current_period_start,
        current_period_end: subscriptionData.current_period_end,
        payment_status: 'succeeded',
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD'
      }
    });

    if (transactionError) {
      return NextResponse.json(
        { error: transactionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(subscription);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
} 