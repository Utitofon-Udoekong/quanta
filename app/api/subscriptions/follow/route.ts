import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: NextRequest) {
  try {
    const { subscriberUserId, creatorUserId, subscriptionType = 'monthly', amount = 0, currency = 'USD', notes } = await req.json();

    // Validate input
    if (!subscriberUserId || !creatorUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('subscriber_id', subscriberUserId)
      .eq('creator_id', creatorUserId)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Already subscribed to this creator' },
        { status: 409 }
      );
    }

    // Create the paid subscription
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        subscriber_id: subscriberUserId,
        creator_id: creatorUserId,
        type: subscriptionType,
        amount: amount,
        currency: currency,
        status: 'active',
        notes: notes || null,
        started_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating subscription:', error);
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to creator'
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 