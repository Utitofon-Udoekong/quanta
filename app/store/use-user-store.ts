import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatar: string;
  walletAddress: string;
  metaAccountId: string;
  isCreator: boolean;
  isAdmin: boolean;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      updateUser: (data) => set((state) => ({ 
        user: state.user ? { ...state.user, ...data } : null 
      })),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
); 