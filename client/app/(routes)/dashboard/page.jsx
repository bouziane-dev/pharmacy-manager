'use client'

import AppShell from '@/app/components/AppShell'
import InvitationNotifications from '@/app/components/InvitationNotifications'
import OrdersTable from '@/app/components/OrdersTable'
import OverviewCards from '@/app/components/OverviewCards'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'
import { useState } from 'react'

function getLocalIsoDate() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale, orders, currentWorkspace } = useSession()
  const [showExtraStats, setShowExtraStats] = useState(false)
  const t = getCopy(locale)
  const today = getLocalIsoDate()
  const statsValues = {
    finished: orders.filter(order => order.status === 'finished').length,
    due: orders.filter(
      order => order.arrivalDate <= today && order.status !== 'finished'
    ).length,
    arrived: orders.filter(order => order.status === 'arrived').length,
    ordered: orders.filter(order => order.status === 'ordered').length,
    waiting: orders.filter(order => order.status === 'pending').length,
    completed: orders.filter(
      order => order.status === 'arrived' || order.status === 'finished'
    ).length,
    total: orders.length
  }
  const stats = t.dashboard.stats.map(item => ({
    ...item,
    value: String(statsValues[item.id] ?? 0)
  }))
  const importantStatIds = new Set(['due', 'waiting', 'ordered', 'total'])
  const visibleStats = stats.filter(item => importantStatIds.has(item.id))
  const extraStats = stats.filter(item => !importantStatIds.has(item.id))

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.dashboard}>
      <div className='space-y-4'>
        <section className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3'>
          <p className='text-xs uppercase tracking-[0.16em] text-[var(--muted)]'>
            {locale === 'fr' ? 'Nom du dashboard' : 'Dashboard name'}
          </p>
          <p className='mt-1 text-sm font-semibold text-[var(--foreground)]'>
            {currentWorkspace?.name || (locale === 'fr' ? 'Dashboard' : 'Dashboard')}
          </p>
        </section>
        <InvitationNotifications />
        <OverviewCards stats={visibleStats} />
        {extraStats.length > 0 && (
          <section className='panel p-4'>
            <button
              onClick={() => setShowExtraStats(prev => !prev)}
              className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {showExtraStats
                ? locale === 'fr'
                  ? 'Masquer les paramètres avancés'
                  : 'Hide extra params'
                : locale === 'fr'
                  ? 'Afficher les paramètres avancés'
                  : 'Show extra params'}
            </button>
            {showExtraStats && (
              <div className='mt-3'>
                <OverviewCards stats={extraStats} />
              </div>
            )}
          </section>
        )}
        <OrdersTable />
      </div>
    </AppShell>
  )
}
