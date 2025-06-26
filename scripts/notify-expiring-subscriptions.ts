import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to create a notification for a user
async function createNotification(userId: string, type: string, message: string, data?: any) {
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      message,
      data,
    });
}

async function notifyExpiringSubscriptions() {
  try {
    // Get subscriptions expiring in the next 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSubscriptions, error } = await supabase
      .from('subscriptions')
      .select(`
        id,
        creator_id,
        subscriber_id,
        type,
        amount,
        currency,
        expires_at,
        creator:creator_id (
          id,
          username,
          wallet_address
        ),
        subscriber:subscriber_id (
          id,
          username,
          wallet_address
        )
      `)
      .eq('status', 'active')
      .lte('expires_at', sevenDaysFromNow.toISOString())
      .gte('expires_at', new Date().toISOString());

    if (error) {
      // console.error('Error fetching expiring subscriptions:', error);
      return;
    }

    // console.log(`Found ${expiringSubscriptions?.length || 0} expiring subscriptions`);

    for (const subscription of expiringSubscriptions || []) {
      const expiresAt = new Date(subscription.expires_at);
      const daysUntilExpiry = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      const creator = subscription.creator as any;
      const subscriber = subscription.subscriber as any;

      // Notify subscriber about expiring subscription
      await createNotification(
        subscription.subscriber_id,
        'subscription_expiring',
        `Your subscription to ${creator?.username || 'Creator'} expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Renew now to maintain access to premium content.`,
        {
          subscriptionId: subscription.id,
          creatorId: subscription.creator_id,
          daysUntilExpiry,
          amount: subscription.amount,
          currency: subscription.currency,
          type: subscription.type
        }
      );

      // Notify creator about expiring subscriber
      await createNotification(
        subscription.creator_id,
        'subscriber_expiring',
        `Your subscriber ${subscriber?.username || 'User'} has a subscription expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}.`,
        {
          subscriptionId: subscription.id,
          subscriberId: subscription.subscriber_id,
          daysUntilExpiry,
          amount: subscription.amount,
          currency: subscription.currency,
          type: subscription.type
        }
      );

      // console.log(`Notified users about subscription ${subscription.id} expiring in ${daysUntilExpiry} days`);
    }

    // console.log('Subscription expiration notifications completed');
  } catch (error) {
    // console.error('Error in notifyExpiringSubscriptions:', error);
  }
}

// Run the script
notifyExpiringSubscriptions(); 