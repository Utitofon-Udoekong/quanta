'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'
import { createClient } from '@/app/utils/supabase/client'

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { fetchUser, clearUser } = useUserStore()

  useEffect(() => {
    const supabase = createClient()

    // Fetch user data on mount
    fetchUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        clearUser()
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUser, clearUser])

  return children
} 