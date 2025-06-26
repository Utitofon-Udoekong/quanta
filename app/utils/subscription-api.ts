// Client-side utility functions that use API routes instead of direct Supabase calls
import { 
  SubscriberWithUserInfo, 
  CreatorSubscriptionWithUserInfo, 
  SubscriptionStats,
  AccessInfo,
  SubscriptionStatus
} from '@/app/types';

// Check if user has access to specific content
export async function checkContentAccess(
  subscriberUserId: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio',
  creatorUserId: string
): Promise<AccessInfo> {
  try {
    const response = await fetch('/api/subscriptions/check-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriberUserId,
        contentId,
        contentType,
        creatorUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check access');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking content access:', error);
    return {
      hasAccess: false,
      isPremium: false,
      reason: 'Error checking access',
    };
  }
}

// Get subscription status for a user-creator pair
export async function getSubscriptionStatus(
  subscriberUserId: string,
  creatorUserId: string
): Promise<SubscriptionStatus> {
  try {
    const response = await fetch('/api/subscriptions/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriberUserId,
        creatorUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get subscription status');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription status:', error);
    return {
      isFollowing: false,
      isPaidSubscriber: false,
    };
  }
}

// Subscribe to a creator (paid subscription)
export async function followCreator(
  subscriberUserId: string,
  creatorUserId: string,
  subscriptionType: 'monthly' | 'yearly' | 'one-time' = 'monthly',
  amount: number = 0,
  currency: string = 'USD',
  notes?: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/subscriptions/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriberUserId,
        creatorUserId,
        subscriptionType,
        amount,
        currency,
        notes,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to subscribe to creator');
    }

    return true;
  } catch (error) {
    console.error('Error subscribing to creator:', error);
    return false;
  }
}

// Unsubscribe from a creator (cancel paid subscription)
export async function unfollowCreator(
  subscriberUserId: string,
  creatorUserId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/subscriptions/unfollow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscriberUserId,
        creatorUserId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unsubscribe from creator');
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing from creator:', error);
    return false;
  }
}

// Get subscription analytics for a creator
export async function getSubscriptionAnalytics(
  creatorWalletAddress: string
): Promise<SubscriptionStats> {
  try {
    const response = await fetch('/api/subscriptions/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorWalletAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get subscription analytics');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    return {
      totalFollowers: 0,
      paidSubscribers: 0,
      totalRevenue: 0,
      paidSubscriptions: 0,
      totalSpent: 0,
      creatorsFollowed: 0
    };
  }
}

// Get subscribers for a creator
export async function getCreatorSubscribers(
  creatorWalletAddress: string
): Promise<SubscriberWithUserInfo[]> {
  try {
    const response = await fetch('/api/subscriptions/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorWalletAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get creator subscribers');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting creator subscribers:', error);
    return [];
  }
}

// Get subscriptions for a user
export async function getUserSubscriptions(
  userWalletAddress: string
): Promise<CreatorSubscriptionWithUserInfo[]> {
  try {
    const response = await fetch('/api/subscriptions/user-subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userWalletAddress,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get user subscriptions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting user subscriptions:', error);
    return [];
  }
} 