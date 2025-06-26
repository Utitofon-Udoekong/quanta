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
    const { subscriberUserId, contentId, contentType, creatorUserId } = await req.json();

    // Validate input
    if (!subscriberUserId || !contentId || !contentType || !creatorUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Validate content type
    if (!['article', 'video', 'audio'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // First check if the content is premium
    const tableName = contentType === 'video' ? 'videos' : contentType === 'audio' ? 'audio' : 'articles';
    
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('is_premium, published, user_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // If content is not published, only creator can access
    if (!content.published) {
      const hasAccess = subscriberUserId === content.user_id;
      return NextResponse.json({
        hasAccess,
        isPremium: content.is_premium,
        reason: hasAccess ? undefined : 'Content not published'
      });
    }

    // If content is not premium, anyone can access
    if (!content.is_premium) {
      return NextResponse.json({
        hasAccess: true,
        isPremium: false
      });
    }

    // If content is premium, check subscription
    if (content.is_premium) {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('status, expires_at')
        .eq('subscriber_id', subscriberUserId)
        .eq('creator_id', creatorUserId)
        .eq('status', 'active')
        .single();

      if (subError || !subscription) {
        return NextResponse.json({
          hasAccess: false,
          isPremium: true,
          reason: 'Premium subscription required'
        });
      }

      // Check if subscription hasn't expired
      if (subscription.expires_at && new Date(subscription.expires_at) < new Date()) {
        return NextResponse.json({
          hasAccess: false,
          isPremium: true,
          reason: 'Subscription expired'
        });
      }

      return NextResponse.json({
        hasAccess: true,
        isPremium: true
      });
    }

    return NextResponse.json({
      hasAccess: true,
      isPremium: false
    });

  } catch (error) {
    // console.error('Error checking content access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 