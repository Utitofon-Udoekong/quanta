import { create } from 'zustand'
import { createClient } from '@/app/utils/supabase/client'
import type { UserData } from '@/app/types'

interface UserStore {
  user: UserData | null
  loading: boolean
  error: string | null
  fetchUser: () => Promise<void>
  updateUser: (data: Partial<UserData>) => Promise<void>
  clearUser: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  fetchUser: async () => {
    const supabase = createClient()
    set({ loading: true, error: null })

    try {
      // First get the authenticated user's ID
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!authUser) {
        set({ user: null, loading: false })
        return
      }

      // Then fetch the user's profile from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
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

  updateUser: async (data: Partial<UserData>) => {
    const supabase = createClient()
    const { user } = get()
    if (!user) return

    set({ loading: true, error: null })

    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(data)
        .eq('id', user.id)
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