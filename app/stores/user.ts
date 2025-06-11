import { create } from 'zustand'
import { getSupabase } from '@/app/utils/supabase/client'
import type { UserData } from '@/app/types'
import Cookies from 'js-cookie'
import { cookieName } from '../utils/supabase'
interface UserStore {
  user: UserData | null
  loading: boolean
  error: string | null
  fetchUser: (walletAddress: string) => Promise<void>
  updateUser: (walletAddress: string, data: Partial<UserData>) => Promise<void>
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async (walletAddress: string) => {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) throw new Error('Access token is required');
    const supabase = await getSupabase(accessToken)
    set({ loading: true, error: null })

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single()

      if (userError) throw userError

      set({ user: userData, loading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch user',
        loading: false 
      })
    }
  },
  updateUser: async (walletAddress: string, data: Partial<UserData>) => {
    const accessToken = Cookies.get(cookieName);
    if (!accessToken) throw new Error('Access token is required');
    const supabase = await getSupabase(accessToken);
    const { user } = get();
    if (!user) return;

    set({ loading: true, error: null })

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(data)
        .eq('wallet_address', walletAddress)
        .select()
        .single()

      if (error) throw error

      set({ 
        user: { ...user, ...updatedUser },
        loading: false 
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user',
        loading: false 
      })
    }
  },

  clearUser: () => {
    set({ user: null, loading: false, error: null })
  }
})) 