'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'

export function getHomePathForUser(user) {
  if (!user) return '/auth'
  if (user.role === 'admin' && !user.subscriptionActive) return '/subscription'
  return '/dashboard'
}

export function useRouteGuard({
  requireAuth = true,
  requireAdmin = false,
  requireSubscription = true
}) {
  const { user, isReady } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return
    if (!requireAuth) return

    if (!user) {
      router.replace('/auth')
      return
    }

    if (requireAdmin && user.role !== 'admin') {
      router.replace('/dashboard')
      return
    }

    if (
      requireSubscription &&
      user.role === 'admin' &&
      !user.subscriptionActive
    ) {
      router.replace('/subscription')
    }
  }, [isReady, requireAdmin, requireAuth, requireSubscription, router, user])

  const blockedBySubscription =
    !!user &&
    requireSubscription &&
    user.role === 'admin' &&
    !user.subscriptionActive

  return {
    user,
    isLoading: !isReady || (requireAuth && !user),
    isBlocked: blockedBySubscription
  }
}
