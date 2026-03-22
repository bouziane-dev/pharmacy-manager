'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import { getCopy } from '@/app/lib/i18n'
import { isSuperAdminUser, useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const defaultStats = {
  totalPharmacies: 0,
  totalUsers: 0,
  totalOrders: 0,
  activePharmacies: 0
}

export default function SuperAdminDashboardPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireSuperAdmin: true,
    requireMembership: false,
    requireSubscription: false
  })
  const { locale, fetchSuperAdminStats } = useSession()
  const t = getCopy(locale)

  const [stats, setStats] = useState(defaultStats)
  const [isStatsLoading, setIsStatsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isSuperAdminUser(user)) return
    let cancelled = false

    async function loadStats() {
      try {
        setIsStatsLoading(true)
        setErrorMessage('')
        const result = await fetchSuperAdminStats()
        if (!cancelled) {
          setStats({
            totalPharmacies: result.totalPharmacies || 0,
            totalUsers: result.totalUsers || 0,
            totalOrders: result.totalOrders || 0,
            activePharmacies: result.activePharmacies || 0
          })
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || 'Failed to load global stats.')
          setStats(defaultStats)
        }
      } finally {
        if (!cancelled) {
          setIsStatsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [fetchSuperAdminStats, user])

  if (isLoading || isBlocked || !isSuperAdminUser(user)) return null

  const cards = [
    { label: 'Total pharmacies', value: stats.totalPharmacies, tone: 'emerald' },
    { label: 'Total users', value: stats.totalUsers, tone: 'cyan' },
    { label: 'Total orders', value: stats.totalOrders, tone: 'violet' },
    { label: 'Active pharmacies', value: stats.activePharmacies, tone: 'amber' }
  ]

  return (
    <AppShell title={t.pages.superadmin || 'Super Admin'}>
      <section className='space-y-4'>
        {errorMessage && (
          <p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}

        <article className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {cards.map(card => (
            <div key={card.label} className='panel p-4'>
              <p className='text-xs uppercase tracking-[0.14em] text-[var(--muted)]'>
                {card.label}
              </p>
              <p
                className={`mt-2 text-3xl font-semibold ${
                  card.tone === 'emerald'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : card.tone === 'cyan'
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : card.tone === 'violet'
                        ? 'text-violet-600 dark:text-violet-400'
                        : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {isStatsLoading ? '-' : card.value}
              </p>
            </div>
          ))}
        </article>

        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>Platform Management</h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            Manage pharmacies, global users, and platform activity from one space.
          </p>
          <div className='mt-4 grid gap-3 sm:grid-cols-3'>
            <Link
              href='/superadmin/pharmacies'
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
            >
              Open Pharmacies
            </Link>
            <Link
              href='/superadmin/users'
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
            >
              Open Users
            </Link>
            <Link
              href='/superadmin/activity'
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
            >
              Open Activity Logs
            </Link>
          </div>
        </article>
      </section>
    </AppShell>
  )
}
