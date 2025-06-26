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
    const { userWalletAddress } = await request.json();
    
    if (!userWalletAddress) {
      return NextResponse.json(
        { error: 'User wallet address is required' },
        { status: 400 }
      );
    }

    // Get user ID from wallet address
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', userWalletAddress)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get creators the user has subscribed to (paid subscriptions)
    const { data: follows, error: followsError } = await supabase
      .from('subscriptions')
      .select(`
        type,
        amount,
        currency,
        expires_at,
        created_at,
        creator:creator_id (
          id,
          username,
          wallet_address,
          avatar_url
        )
      `)
      .eq('subscriber_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (followsError) {
      console.error('Error getting follows:', followsError);
      return NextResponse.json(
        { error: 'Failed to get follows' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const subscriptions = follows?.map(follow => {
      const creatorData = follow.creator as any;
      return {
        id: creatorData?.id,
        username: creatorData?.username,
        wallet_address: creatorData?.wallet_address,
        avatar_url: creatorData?.avatar_url,
        subscribed_at: follow.created_at,
        subscription_type: follow.type,
        subscription_amount: follow.amount,
        subscription_currency: follow.currency,
        subscription_expires_at: follow.expires_at,
      };
    }).filter(sub => sub.id) || [];

    return NextResponse.json(subscriptions);

  } catch (error) {
    console.error('Error in user-subscriptions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 