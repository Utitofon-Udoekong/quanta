'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'
import { supabase } from '@/app/utils/supabase/client'

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { checkAndSetUser, clearUser } = useUserStore()

  useEffect(() => {
    // Initial user check on mount
    checkAndSetUser()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[UserProvider] Auth state change:', event, session?.user?.id)
      
      if (event === 'SIGNED_IN' && session) {
        // User signed in - check and set user data
        await checkAndSetUser()
      } else if (event === 'SIGNED_OUT') {
        // User signed out - clear user data
        clearUser()
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Token refreshed - update user data
        await checkAndSetUser()
      }
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [checkAndSetUser, clearUser])

  return children
}