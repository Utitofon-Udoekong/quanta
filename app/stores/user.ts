import { create } from 'zustand'
import { supabase } from '@/app/utils/supabase/client'
import type { UserData } from '@/app/types'
import Cookies from 'js-cookie'
import { cookieName, getUserByWallet } from '../utils/supabase'

interface UserStore {
  user: UserData | null
  loading: boolean
  error: string | null
  errorDetails: {
    message: string
    timestamp: Date
    context: string
    stack?: string
  } | null
  checkAndSetUser: () => Promise<void>
  autoSignIn: (walletAddress: string) => Promise<void>
  fetchUser: (walletAddress: string) => Promise<void>
  updateUser: (walletAddress: string, data: Partial<UserData>) => Promise<void>
  clearUser: () => void
  clearError: () => void
  setError: (error: string, context?: string) => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  errorDetails: null,

  checkAndSetUser: async () => {
    set({ loading: true, error: null, errorDetails: null });
    try {
      const accessToken = Cookies.get(cookieName);
      if (!accessToken) {
        set({ user: null, loading: false });
        return;
      }

      // Set the session for the client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: '', // We don't have a refresh token in this flow
      });

      if (sessionError) {
        throw new Error(`Failed to set session: ${sessionError.message}`);
      }

      // Now fetch the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(`Failed to fetch user after setting session: ${userError.message}`);
      }
      
      if (user) {
        // If you have a separate 'users' table with more profile data
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          throw new Error(`Failed to fetch user profile: ${profileError.message}`);
        }
        
        set({ user: profileData as UserData, loading: false });
      } else {
        set({ user: null, loading: false });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check and set user';
      console.error('[UserStore] checkAndSetUser failed:', error);
      get().setError(errorMessage, 'checkAndSetUser');
      set({ loading: false });
    }
  },

  autoSignIn: async (walletAddress: string) => {
    set({ loading: true, error: null, errorDetails: null });
    try {
      //console.log('[UserStore] Starting automatic sign-in for:', walletAddress);
      
      // Call backend to authenticate wallet and get JWT
      const res = await fetch('/api/wallet-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: walletAddress })
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.error || 'Authentication failed';
        throw new Error(errorMessage);
      }

      const { token, user } = await res.json();
      //console.log('[UserStore] Authentication successful:', { user, token });

      if (token) {
        // Set the session using the custom JWT
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: token, // Using same token for refresh
        });

        if (sessionError) {
          console.error('[UserStore] Session error:', sessionError);
          throw new Error('Failed to establish session');
        }

        // Set the user data
        set({ user: user as UserData, loading: false });
        //console.log('[UserStore] Auto sign-in completed successfully');
      } else {
        throw new Error('No token received from authentication');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Automatic sign-in failed';
      console.error('[UserStore] Auto sign-in failed:', error);
      get().setError(errorMessage, 'autoSignIn');
      set({ loading: false });
    }
  },

  setError: (error: string, context: string = 'Unknown') => {
    console.error(`[UserStore Error - ${context}]:`, error);
    set({
      error,
      errorDetails: {
        message: error,
        timestamp: new Date(),
        context,
        stack: new Error().stack
      }
    });
  },

  clearError: () => {
    set({ error: null, errorDetails: null });
  },

  fetchUser: async (walletAddress: string) => {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) {
      // //console.log('[UserStore] No access token found');
      set({ loading: false, error: null, errorDetails: null });
      return;
    }
    // //console.log('[UserStore] Fetching user with token:', accessToken.substring(0, 20) + '...');
    set({ loading: true, error: null, errorDetails: null });

    try {
      const { user: userData, error: userError } = await getUserByWallet(walletAddress);
      // //console.log('[UserStore] User data received:', userData);
      
      if (userError) {
        console.error('[UserStore] Error fetching user:', userError);
        throw userError;
      }

      set({ user: userData, loading: false });
      // //console.log('[UserStore] User successfully set:', userData?.wallet_address);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
      console.error('[UserStore] Fetch user failed:', error);
      get().setError(errorMessage, 'fetchUser');
      set({ loading: false });
    }
  },

  updateUser: async (walletAddress: string, data: Partial<UserData>) => {
    set({ loading: true, error: null, errorDetails: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        get().setError('No authenticated user found for update', 'updateUser');
        return;
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(data)
        .eq('wallet_address', walletAddress)
        .select()
        .single();

      if (error) {
        console.error('[UserStore] Supabase update error:', error);
        throw error;
      }

      set({ 
        user: { ...get().user, ...updatedUser },
        loading: false 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      console.error('[UserStore] Update user failed:', error);
      get().setError(errorMessage, 'updateUser');
      set({ loading: false });
    }
  },

  clearUser: () => {
    //console.log('[UserStore] Clearing user data');
    supabase.auth.signOut();
    Cookies.remove(cookieName);
    set({ user: null, loading: false, error: null, errorDetails: null });
  }
})); 