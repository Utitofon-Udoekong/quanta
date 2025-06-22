'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'
import { supabase } from '@/app/utils/supabase/client'
import { useAbstraxionAccount } from '@burnt-labs/abstraxion'
import Cookies from 'js-cookie'
import { cookieName } from '@/app/utils/supabase'

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { checkAndSetUser, clearUser, autoSignIn } = useUserStore()
  const { data: account, isConnected } = useAbstraxionAccount()

  useEffect(() => {
    const handleUserCheck = async () => {
      console.log('handleUserCheck', account?.bech32Address, isConnected)
      
      // If no abstraxion account, user should be null
      if (!account?.bech32Address || !isConnected) {
        clearUser()
        return
      }

      const accessToken = Cookies.get(cookieName)
      
      // If there's an account but no access token, run automatic sign-in
      if (!accessToken) {
        console.log('[UserProvider] No access token, running automatic sign-in for:', account.bech32Address)
        await autoSignIn(account.bech32Address)
        return
      }

      // If there's both account and access token, use the normal checkAndSetUser flow
      console.log('[UserProvider] Access token found, checking and setting user')
      await checkAndSetUser()
    }

    // Initial user check on mount
    handleUserCheck()

    // Listen for auth state changes
    // const {
    //   data: { subscription },
    // } = supabase.auth.onAuthStateChange(async (event, session) => {
    //   console.log('[UserProvider] Auth state change:', event, session?.user?.id)
      
    //   if (event === 'SIGNED_IN' && session) {
    //     // User signed in - check and set user data
    //     await checkAndSetUser()
    //   } else if (event === 'SIGNED_OUT') {
    //     // User signed out - clear user data
    //     clearUser()
    //   } else if (event === 'TOKEN_REFRESHED' && session) {
    //     // Token refreshed - update user data
    //     await checkAndSetUser()
    //   }
    // })

    // Cleanup subscription
    // return () => {
    //   subscription.unsubscribe()
    // }
  }, [checkAndSetUser, account?.bech32Address, isConnected, clearUser, autoSignIn])

  return children
}