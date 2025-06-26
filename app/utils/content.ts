import { supabase } from '@/app/utils/supabase/client';

/**
 * Track a content view
 * @param contentId The ID of the content being viewed
 * @param contentType The type of content ('article', 'video', or 'audio')
 * @param userId The ID of the user viewing the content
 */
export async function trackContentView(
  contentId: string,
  contentType: 'article' | 'video' | 'audio',
  userId: string
) {
  try {
    // Use upsert with a unique constraint on (content_id, user_id)
    // This will either insert a new view or update the existing one
    const { error } = await supabase
      .from('content_views')
      .upsert({
        content_id: contentId,
        content_type: contentType,
        user_id: userId,
        viewed_at: new Date().toISOString(),
      }, {
        onConflict: 'content_id,user_id',
        ignoreDuplicates: true
    });
    
    if (error) {
      // Only log errors that aren't related to duplicate entries
      if (error.code !== '23505') { // PostgreSQL unique violation code
        console.error('Error tracking content view:', error);
      }
    }
  } catch (error) {
    console.error('Error tracking content view:', error);
  }
}

/**
 * Record an earning for content
 * @param userId The ID of the user earning the money
 * @param contentId The ID of the content that generated the earning
 * @param contentType The type of content ('article', 'video', or 'audio')
 * @param amount The amount earned
 * @param currency The currency of the earning (default: 'USD')
 * @param source The source of the earning (e.g., 'subscription', 'one_time')
 * @param transactionId The ID of the transaction (optional)
 */
export async function recordEarning(
  userId: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio',
  amount: number,
  currency: string = 'USD',
  source: string,
  transactionId?: string
) {
  try {
    const { error } = await supabase.from('earnings').insert({
      user_id: userId,
      content_id: contentId,
      content_type: contentType,
      amount,
      currency,
      source,
      transaction_id: transactionId || null,
    });
    
    if (error) {
      console.error('Error recording earning:', error);
    }
  } catch (error) {
    console.error('Error recording earning:', error);
  }
} 