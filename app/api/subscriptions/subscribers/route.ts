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
export async function POST(request: NextRequest) {
  try {
    const { creatorWalletAddress } = await request.json();
    
    if (!creatorWalletAddress) {
      return NextResponse.json(
        { error: 'Creator wallet address is required' },
        { status: 400 }
      );
    }

    // Get creator user ID from wallet address
    const { data: creator, error: creatorError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', creatorWalletAddress)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get paid subscribers (people who have paid to access this creator's premium content)
    const { data: paidSubscribers, error: paidError } = await supabase
      .from('subscriptions')
      .select(`
        type,
        amount,
        currency,
        expires_at,
        created_at,
        subscriber:subscriber_id (
          id,
          username,
          wallet_address,
          avatar_url
        )
      `)
      .eq('creator_id', creator.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (paidError) {
      console.error('Error getting paid subscribers:', paidError);
      return NextResponse.json(
        { error: 'Failed to get paid subscribers' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const subscribers = paidSubscribers?.map(sub => {
      const subscriberData = sub.subscriber as any;
      return {
        id: subscriberData?.id,
        username: subscriberData?.username,
        wallet_address: subscriberData?.wallet_address,
        avatar_url: subscriberData?.avatar_url,
        subscribed_at: sub.created_at,
        subscription_type: sub.type,
        subscription_amount: sub.amount,
        subscription_currency: sub.currency,
        subscription_expires_at: sub.expires_at,
      };
    }).filter(sub => sub.id) || [];

    return NextResponse.json(subscribers);

  } catch (error) {
    console.error('Error in subscribers route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 