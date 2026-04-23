'use client'

import AppShell from '@/app/components/AppShell'
import DashboardWorkTable from '@/app/components/DashboardWorkTable'
import InvitationNotifications from '@/app/components/InvitationNotifications'
import OverviewCards from '@/app/components/OverviewCards'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'
import { useEffect, useMemo, useState } from 'react'

function getPeriodKey(dateValue, period) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  if (period === 'year') return String(year)
  if (period === 'month') return `${year}-${month}`
  return `${year}-${month}-${day}`
}

export default function DashboardPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { locale, orders, tasks, currentWorkspace, listStaffMembers } = useSession()
  const [showExtraStats, setShowExtraStats] = useState(false)
  const [advancedStatusFilter, setAdvancedStatusFilter] = useState('all')
  const [advancedPeriod, setAdvancedPeriod] = useState('day')
  const [staffCount, setStaffCount] = useState(0)
  const t = getCopy(locale)
  const dashboardText = t.dashboard
  const orderText = t.orders
  const canShowWorkspaceInfo = user?.role === 'admin'
  const isOwner =
    user?.accountRole === 'owner' || user?.primaryRole === 'owner'
  const ownerEmail =
    currentWorkspace?.ownerEmail || (isOwner ? user?.email : '') || '-'
  const orderStatusOptions = ['pending', 'ordered', 'arrived', 'called', 'finished']
  const statsValues = {
    pendingOrders: orders.filter(order => order.status === 'pending').length,
    calledOrders: orders.filter(order => order.status === 'called').length,
    arrivedOrders: orders.filter(order => order.status === 'arrived').length,
    pendingTasks: tasks.filter(task => task.status === 'pending').length
  }
  const stats = dashboardText.stats.map(item => ({
    ...item,
    value: String(statsValues[item.id] ?? 0)
  }))
  const advancedOrders = useMemo(() => {
    const currentPeriodKey = getPeriodKey(new Date(), advancedPeriod)

    return orders.filter(order => {
      const matchesStatus =
        advancedStatusFilter === 'all' ? true : order.status === advancedStatusFilter
      const matchesPeriod =
        getPeriodKey(order.createdAt || order.arrivalDate, advancedPeriod) === currentPeriodKey
      return matchesStatus && matchesPeriod
    })
  }, [advancedPeriod, advancedStatusFilter, orders])
  const advancedStats = [
    {
      id: 'totalOrders',
      label: dashboardText.advanced.totalOrders,
      value: String(orders.length),
      delta: dashboardText.advanced.allTime
    },
    {
      id: 'filteredOrders',
      label: dashboardText.advanced.filteredOrders,
      value: String(advancedOrders.length),
      delta: dashboardText.advanced.periodLabels[advancedPeriod]
    }
  ]
  const orderStatusBreakdown = orderStatusOptions.map(status => ({
    id: status,
    label: orderText.status[status] || status,
    value: String(advancedOrders.filter(order => order.status === status).length),
    delta: dashboardText.advanced.statusBreakdown
  }))

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
              {dashboardText.sideInfoTitle}
            </p>
            <div className='mt-2 grid gap-2 text-sm sm:grid-cols-4'>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{dashboardText.pharmacyName}</span>
                <br />
                <span className='font-semibold'>
                  {currentWorkspace?.name || dashboardText.noWorkspace}
                </span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{dashboardText.pharmacySlug}</span>
                <br />
                <span className='font-semibold'>
                  {currentWorkspace?.subdomain || dashboardText.noSlug}
                </span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{dashboardText.ownerEmail}</span>
                <br />
                <span className='block min-w-0 break-all font-semibold'>{ownerEmail}</span>
              </p>
              <p className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-[var(--foreground)]'>
                <span className='text-xs text-[var(--muted)]'>{dashboardText.staffCount}</span>
                <br />
                <span className='font-semibold'>{staffCount}</span>
              </p>
            </div>
          </section>
        )}
        <InvitationNotifications />
        <OverviewCards stats={stats} />
        <section className='panel p-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <button
              onClick={() => setShowExtraStats(prev => !prev)}
              className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {showExtraStats
                ? dashboardText.advanced.hide
                : dashboardText.advanced.show}
            </button>
            {showExtraStats && (
              <div className='flex flex-wrap gap-2'>
                <label className='text-xs font-semibold text-[var(--muted)]'>
                  {dashboardText.advanced.statusFilter}
                  <select
                    value={advancedStatusFilter}
                    onChange={event => setAdvancedStatusFilter(event.target.value)}
                    className='ml-2 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none'
                  >
                    <option value='all'>{dashboardText.advanced.allStatuses}</option>
                    {orderStatusOptions.map(status => (
                      <option key={status} value={status}>
                        {orderText.status[status] || status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className='text-xs font-semibold text-[var(--muted)]'>
                  {dashboardText.advanced.periodFilter}
                  <select
                    value={advancedPeriod}
                    onChange={event => setAdvancedPeriod(event.target.value)}
                    className='ml-2 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none'
                  >
                    {['day', 'month', 'year'].map(period => (
                      <option key={period} value={period}>
                        {dashboardText.advanced.periodLabels[period]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>
          {showExtraStats && (
            <div className='mt-4 space-y-4'>
              <OverviewCards stats={advancedStats} />
              <OverviewCards stats={orderStatusBreakdown} />
            </div>
          )}
        </section>
        <DashboardWorkTable />
      </div>
    </AppShell>
  )
}
