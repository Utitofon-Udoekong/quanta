import { getSupabase } from '@/app/utils/supabase/client';
import Cookies from 'js-cookie';
import { cookieName } from '@/app/utils/supabase';

export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
    const accessToken = Cookies.get(cookieName);
    if (!userId || !accessToken) return false;

    const supabase = await getSupabase(accessToken);

    const { data, error } = await supabase
        .from('subscriptions')
        .select('status, plan_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

    if (error || !data) return false;

    // Check if the plan is a premium plan
    return data.plan_id === 'premium-monthly' || data.plan_id === 'premium-annual';
}

export interface SubscriptionStats {
  totalFollowers: number;
  paidSubscribers: number;
  totalRevenue: number;
  creatorsFollowed: number;
  paidSubscriptions: number;
  totalSpent: number;
}

export interface Subscriber {
  id: string;
  subscriber_id: string;
  username?: string;
  avatar_url?: string;
  wallet_address: string;
  subscription_type: 'free' | 'premium' | 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'past_due';
  subscribed_at: string;
  expires_at?: string;
  amount?: number;
  currency?: string;
  last_interaction: string;
}

export interface CreatorSubscription {
  id: string;
  creator_id: string;
  username?: string;
  avatar_url?: string;
  wallet_address: string;
  type: 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'cancelled' | 'expired' | 'pending' | 'past_due';
  started_at: string;
  expires_at?: string;
  amount: number;
  currency: string;
}

// Get subscription analytics for a user
export async function getSubscriptionAnalytics(walletAddress: string): Promise<SubscriptionStats | null> {
  try {
    const supabase = getSupabase(walletAddress);
    
    const { data, error } = await supabase
      .from('subscription_analytics')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) {
      console.error('Error fetching subscription analytics:', error);
      return null;
    }

    return {
      totalFollowers: data.total_followers || 0,
      paidSubscribers: data.paid_subscribers || 0,
      totalRevenue: data.total_revenue || 0,
      creatorsFollowed: data.creators_followed || 0,
      paidSubscriptions: data.paid_subscriptions || 0,
      totalSpent: data.total_spent || 0,
    };
  } catch (error) {
    console.error('Error in getSubscriptionAnalytics:', error);
    return null;
  }
}

// Get all subscribers for a creator
export async function getCreatorSubscribers(walletAddress: string): Promise<Subscriber[]> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return [];

    // Get subscribers with user details
    const { data, error } = await supabase
      .from('subscribers')
      .select(`
        id,
        subscriber_id,
        status,
        created_at,
        last_interaction,
        notes,
        users!subscriber_id (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .eq('creator_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
      return [];
    }

    // Get paid subscriptions for the same creator
    const { data: paidSubs, error: paidError } = await supabase
      .from('subscriptions')
      .select(`
        id,
        subscriber_id,
        type,
        status,
        started_at,
        expires_at,
        amount,
        currency,
        users!subscriber_id (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .eq('creator_id', user.id)
      .eq('status', 'active');

    if (paidError) {
      console.error('Error fetching paid subscriptions:', paidError);
    }

    // Combine free and paid subscribers
    const subscribers: Subscriber[] = [];
    
    // Add free subscribers
    data?.forEach(sub => {
      subscribers.push({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        username: sub.users[0]?.username,
        avatar_url: sub.users[0]?.avatar_url,
        wallet_address: sub.users[0]?.wallet_address,
        subscription_type: 'free',
        status: sub.status,
        subscribed_at: sub.created_at,
        last_interaction: sub.last_interaction,
      });
    });

    // Add paid subscribers (they're also in subscribers table, but we want to show their paid status)
    paidSubs?.forEach(sub => {
      const existingIndex = subscribers.findIndex(s => s.subscriber_id === sub.subscriber_id);
      if (existingIndex >= 0) {
        // Update existing subscriber with paid info
        subscribers[existingIndex] = {
          ...subscribers[existingIndex],
          subscription_type: sub.type,
          amount: sub.amount,
          currency: sub.currency,
          expires_at: sub.expires_at,
        };
      } else {
        // Add new paid subscriber
        subscribers.push({
          id: sub.id,
          subscriber_id: sub.subscriber_id,
          username: sub.users[0]?.username,
          avatar_url: sub.users[0]?.avatar_url,
          wallet_address: sub.users[0]?.wallet_address,
          subscription_type: sub.type,
          status: sub.status,
          subscribed_at: sub.started_at,
          expires_at: sub.expires_at,
          amount: sub.amount,
          currency: sub.currency,
          last_interaction: sub.started_at,
        });
      }
    });

    return subscribers;
  } catch (error) {
    console.error('Error in getCreatorSubscribers:', error);
    return [];
  }
}

// Get all creators a user subscribes to
export async function getUserSubscriptions(walletAddress: string): Promise<CreatorSubscription[]> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return [];

    // Get paid subscriptions
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        creator_id,
        type,
        status,
        started_at,
        expires_at,
        amount,
        currency,
        users!creator_id (
          username,
          avatar_url,
          wallet_address
        )
      `)
      .eq('subscriber_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }

    return data?.map(sub => ({
      id: sub.id,
      creator_id: sub.creator_id,
      username: sub.users?.[0]?.username,
      avatar_url: sub.users[0]?.avatar_url,
      wallet_address: sub.users[0]?.wallet_address,
      type: sub.type,
      status: sub.status,
      started_at: sub.started_at,
      expires_at: sub.expires_at,
      amount: sub.amount,
      currency: sub.currency,
    })) || [];
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    return [];
  }
}

// Check if user has premium access to a creator
export async function checkPremiumAccess(
  subscriberWallet: string, 
  creatorWallet: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(subscriberWallet);
    
    const { data, error } = await supabase
      .rpc('has_premium_access', {
        p_subscriber_id: subscriberWallet,
        p_creator_id: creatorWallet
      });

    if (error) {
      console.error('Error checking premium access:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Error in checkPremiumAccess:', error);
    return false;
  }
}

// Follow a creator (free)
export async function followCreator(
  subscriberWallet: string,
  creatorWallet: string,
  notes?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(subscriberWallet);
    
    const { error } = await supabase
      .rpc('follow_creator', {
        p_subscriber_id: subscriberWallet,
        p_creator_id: creatorWallet,
        p_notes: notes
      });

    if (error) {
      console.error('Error following creator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in followCreator:', error);
    return false;
  }
}

// Unfollow a creator
export async function unfollowCreator(
  subscriberWallet: string,
  creatorWallet: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(subscriberWallet);
    
    const { error } = await supabase
      .rpc('unfollow_creator', {
        p_subscriber_id: subscriberWallet,
        p_creator_id: creatorWallet
      });

    if (error) {
      console.error('Error unfollowing creator:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in unfollowCreator:', error);
    return false;
  }
}

// Create a paid subscription
export async function createPaidSubscription(
  subscriberWallet: string,
  creatorWallet: string,
  type: 'monthly' | 'yearly' | 'one-time',
  amount: number,
  currency: string = 'USD',
  notes?: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(subscriberWallet);
    
    const { error } = await supabase
      .rpc('create_paid_subscription', {
        p_subscriber_id: subscriberWallet,
        p_creator_id: creatorWallet,
        p_type: type,
        p_amount: amount,
        p_currency: currency,
        p_notes: notes
      });

    if (error) {
      console.error('Error creating paid subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createPaidSubscription:', error);
    return false;
  }
}

// Cancel a paid subscription
export async function cancelPaidSubscription(
  subscriberWallet: string,
  creatorWallet: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(subscriberWallet);
    
    const { error } = await supabase
      .rpc('cancel_paid_subscription', {
        p_subscriber_id: subscriberWallet,
        p_creator_id: creatorWallet
      });

    if (error) {
      console.error('Error cancelling paid subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in cancelPaidSubscription:', error);
    return false;
  }
}

// Check if user has access to premium content from a specific creator
export async function hasPremiumAccessToCreator(
  subscriberUserId: string, 
  creatorUserId: string
): Promise<boolean> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!subscriberUserId || !creatorUserId || !accessToken) return false;

    const supabase = await getSupabase(accessToken);

    // Check if user has an active subscription to this creator
    const { data, error } = await supabase
      .from('subscriptions')
      .select('status, expires_at')
      .eq('subscriber_id', subscriberUserId)
      .eq('creator_id', creatorUserId)
      .eq('status', 'active')
      .single();

    if (error || !data) return false;

    // Check if subscription hasn't expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking premium access:', error);
    return false;
  }
}

// Check if user has access to specific premium content
export async function hasAccessToContent(
  subscriberUserId: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio',
  creatorUserId: string
): Promise<{ hasAccess: boolean; isPremium: boolean; reason?: string }> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!subscriberUserId || !contentId || !accessToken) {
      return { hasAccess: false, isPremium: false, reason: 'Not authenticated' };
    }

    const supabase = await getSupabase(accessToken);

    // First check if the content is premium
    const tableName = contentType === 'video' ? 'videos' : contentType === 'audio' ? 'audio' : 'articles';
    
    const { data: content, error: contentError } = await supabase
      .from(tableName)
      .select('is_premium, published, user_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return { hasAccess: false, isPremium: false, reason: 'Content not found' };
    }

    // If content is not published, only creator can access
    if (!content.published) {
      return { 
        hasAccess: subscriberUserId === content.user_id, 
        isPremium: content.is_premium,
        reason: subscriberUserId === content.user_id ? undefined : 'Content not published'
      };
    }

    // If content is not premium, anyone can access
    if (!content.is_premium) {
      return { hasAccess: true, isPremium: false };
    }

    // If content is premium, check subscription
    if (content.is_premium) {
      const hasSubscription = await hasPremiumAccessToCreator(subscriberUserId, creatorUserId);
      return { 
        hasAccess: hasSubscription, 
        isPremium: true,
        reason: hasSubscription ? undefined : 'Premium subscription required'
      };
    }

    return { hasAccess: true, isPremium: false };
  } catch (error) {
    console.error('Error checking content access:', error);
    return { hasAccess: false, isPremium: false, reason: 'Error checking access' };
  }
}

// Get subscription status for a user-creator pair
export async function getSubscriptionStatus(
  subscriberUserId: string,
  creatorUserId: string
): Promise<{
  isFollowing: boolean;
  isPaidSubscriber: boolean;
  subscriptionType?: string;
  expiresAt?: string;
  amount?: number;
  currency?: string;
}> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!subscriberUserId || !creatorUserId || !accessToken) {
      return { isFollowing: false, isPaidSubscriber: false };
    }

    const supabase = await getSupabase(accessToken);

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

    return {
      isFollowing: !!followerData,
      isPaidSubscriber: !!paidData,
      subscriptionType: paidData?.type,
      expiresAt: paidData?.expires_at,
      amount: paidData?.amount,
      currency: paidData?.currency,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return { isFollowing: false, isPaidSubscriber: false };
  }
} 