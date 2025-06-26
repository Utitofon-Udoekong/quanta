import { getSupabase } from '@/app/utils/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieName } from '@/app/utils/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriber_id = searchParams.get('subscriber_id');
    const creator_id = searchParams.get('creator_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!subscriber_id && !creator_id) {
      return NextResponse.json(
        { error: 'Either subscriber_id or creator_id is required' },
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
      `, { count: 'exact' });

    // Apply filters based on provided parameters
    if (subscriber_id) {
      query = query.eq('subscriber_id', subscriber_id);
    }
    if (creator_id) {
      query = query.eq('creator_id', creator_id);
    }

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
    const { creator_id, subscriber_id, type, amount, currency = 'USD', notes } = await request.json();

    if (!creator_id || !subscriber_id || !type || !amount) {
      return NextResponse.json(
        { error: 'Creator ID, subscriber ID, type, and amount are required' },
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

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
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

    // Check if user is trying to subscribe to themselves
    if (creator_id === subscriber_id) {
      return NextResponse.json(
        { error: 'Cannot subscribe to yourself' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('creator_id', creator_id)
      .eq('subscriber_id', subscriber_id)
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
        creator_id: creator_id,
        subscriber_id: subscriber_id,
        type: type,
        status: 'active',
        amount: amount,
        currency: currency,
        expires_at: expiresAt.toISOString(),
        notes: notes
      })
      .select('*')
      .single();

    if (subscriptionError) {
      // console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
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