'use client'

import AppShell from '@/app/components/AppShell'
import InvitationNotifications from '@/app/components/InvitationNotifications'
import OrdersTable from '@/app/components/OrdersTable'
import OverviewCards from '@/app/components/OverviewCards'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function DashboardPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale, orders } = useSession()
  const t = getCopy(locale)
  const today = new Date().toISOString().slice(0, 10)
  const statsValues = {
    total: orders.length,
    due: orders.filter(order => order.arrivalDate <= today).length,
    arrived: orders.filter(order => order.status === 'Arrived').length,
    urgent: orders.filter(order => order.urgency === 'Urgent').length
  }
  const stats = t.dashboard.stats.map(item => ({
    ...item,
    value: String(statsValues[item.id] ?? 0)
  }))

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.dashboard}>
      <div className='space-y-4'>
        <InvitationNotifications />
        <OverviewCards stats={stats} />
        <OrdersTable />
      </div>
    </AppShell>
  )
}
