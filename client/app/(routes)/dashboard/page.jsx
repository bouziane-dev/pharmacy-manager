'use client'

import AppShell from '@/app/components/AppShell'
import InvitationNotifications from '@/app/components/InvitationNotifications'
import OrdersTable from '@/app/components/OrdersTable'
import OverviewCards from '@/app/components/OverviewCards'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'
import { useEffect, useState } from 'react'

function getLocalIsoDate() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale, orders, currentWorkspace, listStaffMembers } = useSession()
  const [showExtraStats, setShowExtraStats] = useState(false)
  const [staffCount, setStaffCount] = useState(0)
  const t = getCopy(locale)
  const today = getLocalIsoDate()
  const canShowWorkspaceInfo = user?.role === 'admin'
  const isOwner =
    user?.accountRole === 'owner' || user?.primaryRole === 'owner'
  const ownerEmail =
    currentWorkspace?.ownerEmail || (isOwner ? user?.email : '') || '-'
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

  useEffect(() => {
    if (!canShowWorkspaceInfo || !currentWorkspace?.id) {
      setStaffCount(0)
      return
    }

    let isCancelled = false
    listStaffMembers()
      .then(rows => {
        if (isCancelled) return
        setStaffCount(Array.isArray(rows) ? rows.length : 0)
      })
      .catch(() => {
        if (isCancelled) return
        setStaffCount(0)
      })

    return () => {
      isCancelled = true
    }
  }, [canShowWorkspaceInfo, currentWorkspace?.id, listStaffMembers])

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.dashboard}>
      <div className='space-y-4'>
        {canShowWorkspaceInfo && (
          <section className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3'>
            <p className='text-xs uppercase tracking-[0.16em] text-[var(--muted)]'>
              {t.dashboard.sideInfoTitle}
            </p>
            <div className='mt-2 grid gap-2 text-sm sm:grid-cols-4'>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{t.dashboard.pharmacyName}</span>
                <br />
                <span className='font-semibold'>
                  {currentWorkspace?.name || t.dashboard.noWorkspace}
                </span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{t.dashboard.pharmacySlug}</span>
                <br />
                <span className='font-semibold'>
                  {currentWorkspace?.subdomain || t.dashboard.noSlug}
                </span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{t.dashboard.ownerEmail}</span>
                <br />
                <span className='block min-w-0 break-all font-semibold'>{ownerEmail}</span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{t.dashboard.staffCount}</span>
                <br />
                <span className='font-semibold'>{staffCount}</span>
              </p>
            </div>
          </section>
        )}
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
