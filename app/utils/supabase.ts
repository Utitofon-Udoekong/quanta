import { createBrowserClient } from '@supabase/ssr';
import jwt from 'jsonwebtoken';
import { useState, useEffect } from 'react';
import { UserData, WalletUser } from '@/app/types';

const supabaseUrl = process.env.supabaseUrl!;
const supabaseAnonKey = process.env.supabaseAnonKey!;
const jwtSecret = process.env.supabaseJWTSecret!;

// Create a custom JWT token with wallet address
function createWalletJWT(walletAddress: string): string {
  const payload = {
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
    sub: walletAddress,
    email: `${walletAddress}@wallet.local`,
    app_metadata: {
      provider: 'wallet',
      providers: ['wallet']
    },
    user_metadata: {
      wallet_address: walletAddress
    },
    role: 'authenticated',
    wallet_address: walletAddress
  }

  return jwt.sign(payload, jwtSecret, { algorithm: 'HS256' });
}

// Generate a Robohash avatar URL for a wallet address
export function generateRobohashAvatar(walletAddress: string): string {
  // Use the first 8 characters of the wallet address as the seed
  const seed = walletAddress.slice(0, 8);
  return `https://robohash.org/${seed}?set=set4&size=200x200`;
}

// Create Supabase client with wallet authentication
export function getSupabase(walletAddress?: string) {
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

  if (walletAddress) {
    const token = createWalletJWT(walletAddress);
    supabase.auth.setSession({
      access_token: token,
      refresh_token: token,
    });
  }

  return supabase;
}

// React hook for wallet-based Supabase client
export function useWalletSupabase(walletAddress?: string) {
  const [supabase, setSupabase] = useState(() => 
    getSupabase(walletAddress)
  );

  useEffect(() => {
    setSupabase(getSupabase(walletAddress));
  }, [walletAddress]);

  return supabase;
}

/**
 * Creates or updates a user profile based on wallet authentication
 */
export async function handleWalletAuth(walletUser: WalletUser): Promise<{
  user: UserData | null;
  error: Error | null;
}> {
  const supabase = getSupabase(walletUser.bech32Address);
  
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

    const userData = {
      wallet_chain: walletUser.wallet_chain || 'xion',
      wallet_metadata: {
        ...(existingUser?.wallet_metadata || {}),
        ...walletUser.wallet_metadata,
        last_login: new Date().toISOString()
      },
      last_login_at: new Date().toISOString()
    };

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('wallet_address', walletUser.bech32Address)
        .select()
        .single();

      if (updateError) throw updateError;
      return { user: updatedUser, error: null };
    } else {
      // Create new user with Robohash avatar
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address: walletUser.bech32Address,
          ...userData,
          avatar_url: generateRobohashAvatar(walletUser.bech32Address),
          wallet_metadata: {
            ...userData.wallet_metadata,
            created_at: new Date().toISOString()
          }
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
  user: UserData | null;
  error: Error | null;
}> {
  const supabase = getSupabase(walletAddress);
  
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
  updates: Partial<UserData>
): Promise<{
  user: UserData | null;
  error: Error | null;
}> {
  const supabase = getSupabase(walletAddress);
  
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