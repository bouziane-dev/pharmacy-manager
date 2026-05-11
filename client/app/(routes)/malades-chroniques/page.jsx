'use client'

import AppShell from '@/app/components/AppShell'
import ChronicPatientsManager from '@/app/components/ChronicPatientsManager'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function MaladesChroniquesPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireAdmin: true
  })
  const { locale } = useSession()
  const t = getCopy(locale)

  if (isLoading || isBlocked || !user || user.role !== 'admin') return null

  return (
    <AppShell title={t.pages.chronicPatients}>
      <ChronicPatientsManager />
    </AppShell>
  )
}
