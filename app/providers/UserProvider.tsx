'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'
import { useAbstraxionAccount } from "@burnt-labs/abstraxion"
import Cookies from 'js-cookie'
import { cookieName } from '@/app/utils/supabase'

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { fetchUser, clearUser } = useUserStore()
  const { data: account } = useAbstraxionAccount()

  useEffect(() => {
    const accessToken = Cookies.get(cookieName);
    console.log('accessToken', accessToken)
    
    if (account?.bech32Address && accessToken) {
      fetchUser(account.bech32Address)
    } else {
      clearUser()
    }
  }, [account?.bech32Address, fetchUser, clearUser])

  return children
} 