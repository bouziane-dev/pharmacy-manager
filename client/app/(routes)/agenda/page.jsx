'use client'

import AgendaBoard from '@/app/components/AgendaBoard'
import AppShell from '@/app/components/AppShell'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function AgendaPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale } = useSession()
  const t = getCopy(locale)

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.agenda}>
      <AgendaBoard />
    </AppShell>
  )
}
