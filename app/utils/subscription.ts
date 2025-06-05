import { getSupabase } from '@/app/utils/supabase';

export async function hasActivePremiumSubscription(userId: string): Promise<boolean> {
    if (!userId) return false;

    const supabase = getSupabase();
    
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