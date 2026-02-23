'use client'

import AppShell from '@/app/components/AppShell'
import UsersTable from '@/app/components/UsersTable'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function UsersPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireAdmin: true
  })
  const { locale } = useSession()
  const t = getCopy(locale)

  if (isLoading || isBlocked || !user || user.role !== 'admin') return null

  return (
    <AppShell title={t.pages.users}>
      <UsersTable />
    </AppShell>
  )
}
