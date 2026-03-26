'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'

export default function PendingInvitationsPage() {
  const router = useRouter()
  const { user, isReady } = useSession()

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace('/auth')
      return
    }
    router.replace('/dashboard')
  }, [isReady, router, user])

  return null
}
