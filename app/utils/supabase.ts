//utils/supabase.ts
import { UserData } from '@/app/types';
import Cookies from 'js-cookie';
import { getSupabase } from '@/app/utils/supabase/client';

export const cookieName = "sb-access-token";

// Generate a Robohash avatar URL for a wallet address
export function generateRobohashAvatar(walletAddress: string): string {
  const seed = walletAddress.slice(0, 8);
  return `https://robohash.org/${seed}?set=set4&size=200x200`;
}

/**
 * Gets the current authenticated user from Supabase
 */
export async function getCurrentUser(): Promise<{
  user: any | null;
  error: Error | null;
}> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) {
      return { user: null, error: new Error('No access token found') };
    }

    const supabase = await getSupabase(accessToken);
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    return { user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Gets a user profile by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<{
  user: UserData | null;
  error: Error | null;
}> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) {
      return { user: null, error: new Error('No access token found') };
    }

    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) throw error;
    return { user: data, error: null };
  } catch (error) {
    console.error('Error in getUserByWallet:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Updates a user's profile
 */
export async function updateUserProfile(
  walletAddress: string,
  updates: Partial<UserData>
): Promise<{
  user: UserData | null;
  error: Error | null;
}> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) {
      return { user: null, error: new Error('No access token found') };
    }

    const supabase = await getSupabase(accessToken);
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;
    return { user: data, error: null };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Signs out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const accessToken = Cookies.get(cookieName);
    if (accessToken) {
      const supabase = await getSupabase(accessToken);
      await supabase.auth.signOut();
    }
    
    // Clear the cookie
    Cookies.remove(cookieName);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error: error as Error };
  }
}