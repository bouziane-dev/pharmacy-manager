'use client'

import AppShell from '@/app/components/AppShell'
import OrdersTable from '@/app/components/OrdersTable'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function OrdersPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale } = useSession()
  const t = getCopy(locale)

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.orders}>
      <OrdersTable showControls />
    </AppShell>
  )
}
