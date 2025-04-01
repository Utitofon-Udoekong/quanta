import { create } from 'zustand';
import { supabase } from '@/app/lib/supabase';
import { UserData } from '@/app/lib/supabase';

interface UserStore {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserData | null) => void;
  fetchUser: (userId: string) => Promise<void>;
  updateUser: (data: Partial<UserData>) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  fetchUser: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      set({ user, isLoading: false });
    } catch (error) {
      console.error('Error fetching user:', error);
      set({ error: 'Failed to fetch user', isLoading: false });
    }
  },

  updateUser: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const { user } = get();

      if (!user?.id) {
        throw new Error('No user found');
      }

      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      set({ user: updatedUser, isLoading: false });
    } catch (error) {
      console.error('Error updating user:', error);
      set({ error: 'Failed to update user', isLoading: false });
    }
  },
})); 