import { createClient } from './supabase/client';
import { User } from '@supabase/supabase-js';

export interface WalletUser {
  bech32Address: string;
  wallet_chain?: string;
  wallet_metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  wallet_address: string;
  wallet_chain: string;
  wallet_metadata: Record<string, any>;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  last_login_at?: string;
}

/**
 * Creates or updates a user profile based on wallet authentication
 */
export async function handleWalletAuth(walletUser: WalletUser): Promise<{
  user: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();
  
  try {
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletUser.bech32Address)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          wallet_chain: walletUser.wallet_chain || 'xion',
          wallet_metadata: {
            ...existingUser.wallet_metadata,
            ...walletUser.wallet_metadata,
            last_login: new Date().toISOString()
          },
          last_login_at: new Date().toISOString()
        })
        .eq('wallet_address', walletUser.bech32Address)
        .select()
        .single();

      if (updateError) throw updateError;
      return { user: updatedUser, error: null };
    } else {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletUser.bech32Address,
          wallet_chain: walletUser.wallet_chain || 'xion',
          wallet_metadata: {
            ...walletUser.wallet_metadata,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString()
          },
          last_login_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return { user: newUser, error: null };
    }
  } catch (error) {
    console.error('Error in handleWalletAuth:', error);
    return { user: null, error: error as Error };
  }
}

/**
 * Gets a user profile by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<{
  user: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();
  
  try {
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
  updates: Partial<UserProfile>
): Promise<{
  user: UserProfile | null;
  error: Error | null;
}> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
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