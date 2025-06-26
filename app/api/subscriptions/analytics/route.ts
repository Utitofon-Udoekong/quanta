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
      console.error('Creator lookup error:', creatorError);
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    console.log('Found creator:', creator.id);

    // Get analytics from the subscription_analytics view
    const { data: analytics, error: analyticsError } = await supabase
      .from('subscription_analytics')
      .select('*')
      .eq('user_id', creator.id)
      .single();

    if (analyticsError) {
      console.error('Error getting analytics:', analyticsError);
      return NextResponse.json(
        { error: 'Failed to get analytics' },
        { status: 500 }
      );
    }

    console.log('Analytics data:', analytics);

    return NextResponse.json({
      totalFollowers: analytics?.total_followers || 0,
      paidSubscribers: analytics?.paid_subscribers || 0,
      totalRevenue: analytics?.total_revenue || 0,
      creatorsFollowed: analytics?.creators_followed || 0,
      paidSubscriptions: analytics?.paid_subscriptions || 0,
      totalSpent: analytics?.total_spent || 0
    });

  } catch (error: any) {
    console.error('Error in analytics route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 