'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import SubscriptionPage from '@/app/components/SubscriptionPage'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function SubscriptionRoutePage() {
  const router = useRouter()
  const { user, locale, isReady } = useSession()
  const t = getCopy(locale)

  if (!isReady) return null

  const isOwner = !!user && user.primaryRole === 'owner'

  useEffect(() => {
    if (isReady && !isOwner) {
      router.replace('/dashboard')
    }
  }, [isOwner, isReady, router])

  if (!isOwner) {
    return null
  }

  return (
    <AppShell title={t.pages.subscription}>
      <SubscriptionPage />
    </AppShell>
  )
}
