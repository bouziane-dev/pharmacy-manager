'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'

export function isSuperAdminUser(user) {
  return (
    !!user &&
    (user.role === 'superadmin' ||
      user.accountRole === 'superadmin' ||
      user.primaryRole === 'superadmin')
  )
}

export function getHomePathForUser(user) {
  if (!user) return '/auth'
  if (isSuperAdminUser(user)) return '/superadmin'
  if (
    user.primaryRole === 'owner' &&
    (!user.subscriptionActive || !user.pharmacyId)
  ) {
    return '/subscription'
  }
  return '/dashboard'
}

export function useRouteGuard({
  requireAuth = true,
  requireAdmin = false,
  requireSuperAdmin = false,
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

    const isSuperAdmin = isSuperAdminUser(user)

    if (requireSuperAdmin && !isSuperAdmin) {
      router.replace(getHomePathForUser(user))
      return
    }

    if (isSuperAdmin) {
      if (!requireSuperAdmin) {
        router.replace('/superadmin')
      }
      return
    }

    if (requireAdmin && user.role !== 'admin') {
      router.replace('/dashboard')
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
      if (user.primaryRole === 'owner') {
        router.replace('/subscription')
      } else {
        router.replace('/dashboard')
      }
      return
    }
  }, [
    currentWorkspace,
    isBootstrappingSession,
    isReady,
    requireAdmin,
    requireAuth,
    requireSuperAdmin,
    requireMembership,
    requireSubscription,
    router,
    user
  ])

  const blockedBySubscription =
    !!user &&
    !isSuperAdminUser(user) &&
    requireSubscription &&
    user.primaryRole === 'owner' &&
    !user.subscriptionActive

  const missingWorkspace =
    !!user &&
    !isSuperAdminUser(user) &&
    requireMembership &&
    user.primaryRole === 'owner' &&
    !currentWorkspace

  return {
    user,
    isLoading: !isReady || isBootstrappingSession || (requireAuth && (!user || missingWorkspace)),
    isBlocked: blockedBySubscription
  }
}
