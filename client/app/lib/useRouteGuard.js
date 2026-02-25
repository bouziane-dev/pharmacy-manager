'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'

export function getHomePathForUser(user) {
  if (!user) return '/auth'
  if (!user.onboardingCompleted) return '/onboarding/role'
  if (user.primaryRole === 'owner' && !user.subscriptionActive) return '/subscription'
  return '/dashboard'
}

export function useRouteGuard({
  requireAuth = true,
  requireAdmin = false,
  requireSubscription = true,
  requireMembership = true
}) {
  const { user, isReady, isBootstrappingSession, currentWorkspace } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isReady) return
    if (isBootstrappingSession) return
    if (!requireAuth) return

    if (!user) {
      router.replace('/auth')
      return
    }

    if (requireAdmin && user.role !== 'admin') {
      router.replace('/dashboard')
      return
    }

    if (!user.onboardingCompleted) {
      router.replace('/onboarding/role')
      return
    }

    if (
      requireSubscription &&
      user.primaryRole === 'owner' &&
      !user.subscriptionActive
    ) {
      router.replace('/subscription')
      return
    }

    if (requireMembership && !currentWorkspace) {
      if (user.primaryRole === 'pharmacist') {
        router.replace('/invitations/pending')
      } else {
        router.replace('/subscription')
      }
    }
  }, [
    currentWorkspace,
    isBootstrappingSession,
    isReady,
    requireAdmin,
    requireAuth,
    requireMembership,
    requireSubscription,
    router,
    user
  ])

  const blockedBySubscription =
    !!user &&
    requireSubscription &&
    user.primaryRole === 'owner' &&
    !user.subscriptionActive

  return {
    user,
    isLoading:
      !isReady ||
      isBootstrappingSession ||
      (requireAuth && (!user || (requireMembership && !currentWorkspace))),
    isBlocked: blockedBySubscription
  }
}
