import { create } from 'zustand';
import { supabase } from '@/app/old/lib/supabase';
import { UserData } from '@/app/old/lib/supabase';

interface UserStore {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserData | null) => void;
  fetchUser: (walletAddress: string) => Promise<void>;
  updateUser: (data: Partial<UserData>) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({ user });
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
      }
    }
  },

  fetchUser: async (walletAddress) => {
    try {
      set({ isLoading: true, error: null });
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (error) {
        throw error;
      }

      set({ user, isLoading: false });
      if (user && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ error: 'Failed to fetch user', isLoading: false });
    }
  },

  updateUser: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = get();

      if (!user?.wallet_address) {
        throw new Error('No user found');
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', user.wallet_address)
        .select()
        .single();

      if (error) {
        throw error;
      }

      set({ user: updatedUser, isLoading: false });
      if (updatedUser && typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: 'Failed to update user', isLoading: false });
    }
  },
}));

// Load persisted user on store initialization (client-side only)
if (typeof window !== 'undefined') {
  const persistedUser = localStorage.getItem('user');
  if (persistedUser) {
    try {
      const user = JSON.parse(persistedUser);
      useUserStore.getState().setUser(user);
    } catch (error) {
      console.error('Error parsing persisted user:', error);
      localStorage.removeItem('user');
    }
  }
} 