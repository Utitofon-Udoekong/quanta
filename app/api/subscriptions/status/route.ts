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
    const { subscriberUserId, creatorUserId } = await req.json();

    // Validate input
    if (!subscriberUserId || !creatorUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if following (free subscription)
    const { data: followerData } = await supabase
      .from('subscribers')
      .select('status')
      .eq('subscriber_id', subscriberUserId)
      .eq('creator_id', creatorUserId)
      .eq('status', 'active')
      .single();

    // Check if paid subscriber
    const { data: paidData } = await supabase
      .from('subscriptions')
      .select('type, expires_at, amount, currency')
      .eq('subscriber_id', subscriberUserId)
      .eq('creator_id', creatorUserId)
      .eq('status', 'active')
      .single();

    return NextResponse.json({
      isFollowing: !!followerData,
      isPaidSubscriber: !!paidData,
      subscriptionType: paidData?.type,
      expiresAt: paidData?.expires_at,
      amount: paidData?.amount,
      currency: paidData?.currency,
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 