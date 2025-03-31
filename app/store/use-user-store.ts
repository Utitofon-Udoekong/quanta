import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createOrUpdateUser, getUserByWallet, UserData } from '@/app/lib/firebase';

interface UserState {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: UserData | null) => void;
  updateUser: (userData: Partial<UserData>) => Promise<void>;
  fetchUser: (walletAddress: string) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      setUser: (user) => set({ user }),
      updateUser: async (userData) => {
        if (!userData.walletAddress) {
          set({ error: 'Wallet address is required' });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const updatedUser = await createOrUpdateUser(userData.walletAddress, userData);
          set({ user: updatedUser });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to update user' });
        } finally {
          set({ isLoading: false });
        }
      },
      fetchUser: async (walletAddress) => {
        set({ isLoading: true, error: null });
        try {
          const user = await getUserByWallet(walletAddress);
          set({ user });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Failed to fetch user' });
        } finally {
          set({ isLoading: false });
        }
      },
      clearUser: () => set({ user: null, error: null }),
    }),
    {
      name: 'user-storage',
    }
  )
); 