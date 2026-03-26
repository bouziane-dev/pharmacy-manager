'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'

export default function OnboardingRolePage() {
  const router = useRouter()
  const { isReady, user } = useSession()

  useEffect(() => {
    if (!isReady) return
    if (!user) {
      router.replace('/auth')
      return
    }

    if (user.primaryRole === 'owner') {
      if (!user.pharmacyId || !user.subscriptionActive) {
        router.replace('/subscription')
      } else {
        router.replace('/dashboard')
      }
      return
    }

    router.replace('/dashboard')
  }, [isReady, router, user])

  return null
}
