'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/app/stores/user'

export default function UserProvider({
  children
}: {
  children: React.ReactNode
}) {
  const { checkAndSetUser } = useUserStore()

  useEffect(() => {
    checkAndSetUser();
  }, [checkAndSetUser])

  return children
} 