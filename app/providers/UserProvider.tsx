'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'
import { useAbstraxionAccount } from "@burnt-labs/abstraxion"

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { fetchUser, clearUser } = useUserStore()
  const { data: account } = useAbstraxionAccount()

  useEffect(() => {
    if (account?.bech32Address) {
      fetchUser(account.bech32Address)
    } else {
      clearUser()
    }
  }, [account?.bech32Address, fetchUser, clearUser])

  return children
} 