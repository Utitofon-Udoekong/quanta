import { getSupabase } from './supabase/client';

export interface ScheduledContent {
  id: string;
  title: string;
  content_type: 'article' | 'video' | 'audio';
  release_date: string;
  user_id: string;
  username?: string;
  avatar_url?: string;
}

export interface ScheduledContentStats {
  scheduled_articles: number;
  scheduled_videos: number;
  scheduled_audio: number;
  total_scheduled: number;
  next_release?: string;
}

// Get upcoming scheduled content for a user
export async function getUpcomingScheduledContent(
  walletAddress: string,
  limit: number = 10
): Promise<ScheduledContent[]> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return [];

    const { data, error } = await supabase
      .rpc('get_upcoming_scheduled_content', {
        p_user_id: user.id,
        p_limit: limit
      });

    if (error) {
      // console.error('Error fetching scheduled content:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    // console.error('Error in getUpcomingScheduledContent:', error);
    return [];
  }
}

// Get scheduled content count for a user
export async function getScheduledContentCount(walletAddress: string): Promise<number> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return 0;

    const { data, error } = await supabase
      .rpc('get_scheduled_content_count', {
        p_user_id: user.id
      });

    if (error) {
      // console.error('Error fetching scheduled content count:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    // console.error('Error in getScheduledContentCount:', error);
    return 0;
  }
}

// Get scheduled content dashboard stats
export async function getScheduledContentStats(walletAddress: string): Promise<ScheduledContentStats | null> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return null;

    const { data, error } = await supabase
      .from('scheduled_content_dashboard')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // console.error('Error fetching scheduled content stats:', error);
      return null;
    }

    return {
      scheduled_articles: data.scheduled_articles || 0,
      scheduled_videos: data.scheduled_videos || 0,
      scheduled_audio: data.scheduled_audio || 0,
      total_scheduled: data.total_scheduled || 0,
      next_release: data.next_release,
    };
  } catch (error) {
    // console.error('Error in getScheduledContentStats:', error);
    return null;
  }
}

// Schedule content for publication
export async function scheduleContent(
  walletAddress: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio',
  releaseDate: string
): Promise<boolean> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return false;

    // Update the content with release date
    const { error } = await supabase
      .from(contentType + 's') // articles, videos, audio
      .update({ 
        release_date: releaseDate,
        published: false, // Ensure it's not published yet
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .eq('user_id', user.id); // Security: only update own content

    if (error) {
      // console.error('Error scheduling content:', error);
      return false;
    }

    return true;
  } catch (error) {
    // console.error('Error in scheduleContent:', error);
    return false;
  }
}

// Unschedule content (remove release date)
export async function unscheduleContent(
  walletAddress: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio'
): Promise<boolean> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return false;

    // Remove the release date
    const { error } = await supabase
      .from(contentType + 's') // articles, videos, audio
      .update({ 
        release_date: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .eq('user_id', user.id); // Security: only update own content

    if (error) {
      // console.error('Error unscheduling content:', error);
      return false;
    }

    return true;
  } catch (error) {
    // console.error('Error in unscheduleContent:', error);
    return false;
  }
}

// Publish content immediately (override schedule)
export async function publishContentNow(
  walletAddress: string,
  contentId: string,
  contentType: 'article' | 'video' | 'audio'
): Promise<boolean> {
  try {
    const supabase = getSupabase(walletAddress);
    
    // First get the user ID
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (!user) return false;

    // Publish immediately
    const { error } = await supabase
      .from(contentType + 's') // articles, videos, audio
      .update({ 
        published: true,
        release_date: null, // Remove schedule
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .eq('user_id', user.id); // Security: only update own content

    if (error) {
      // console.error('Error publishing content:', error);
      return false;
    }

    return true;
  } catch (error) {
    // console.error('Error in publishContentNow:', error);
    return false;
  }
}

// Format release date for display
export function formatReleaseDate(releaseDate: string): string {
  const date = new Date(releaseDate);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Overdue';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else if (diffDays < 7) {
    return `In ${diffDays} days`;
  } else {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

// Check if content is scheduled
export function isContentScheduled(releaseDate: string | null): boolean {
  if (!releaseDate) return false;
  const scheduledDate = new Date(releaseDate);
  const now = new Date();
  return scheduledDate > now;
}

// Get time until release
export function getTimeUntilRelease(releaseDate: string): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const scheduledDate = new Date(releaseDate);
  const now = new Date();
  const diffTime = scheduledDate.getTime() - now.getTime();
  
  if (diffTime < 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isOverdue: true
    };
  }
  
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
  
  return {
    days,
    hours,
    minutes,
    isOverdue: false
  };
} 