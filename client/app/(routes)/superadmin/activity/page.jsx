'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import { getIntlLocale } from '@/app/lib/i18n'
import { isSuperAdminUser, useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const defaultActions = [
  'CREATE_ORDER',
  'UPDATE_ORDER',
  'UPDATE_STATUS',
  'DELETE_ORDER',
  'PIN_LOGIN',
  'CREATE_STAFF',
  'RESET_STAFF_PIN',
  'DISABLE_STAFF',
  'SUPERADMIN_UPDATE_PHARMACY_STATUS'
]

function formatDateTime(value, locale) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

export default function SuperAdminActivityPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireSuperAdmin: true,
    requireMembership: false,
    requireSubscription: false
  })
  const { locale, fetchSuperAdminActivityLogs, fetchSuperAdminPharmacies } =
    useSession()

  const [selectedPharmacyId, setSelectedPharmacyId] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [logs, setLogs] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const actionOptions = useMemo(() => {
    const fromLogs = logs.map(item => item.action).filter(Boolean)
    return [...new Set([...defaultActions, ...fromLogs])]
  }, [logs])

  useEffect(() => {
    if (!isSuperAdminUser(user)) return
    let cancelled = false

    async function loadPharmacies() {
      try {
        const result = await fetchSuperAdminPharmacies({
          page: 1,
          limit: 200,
          sort: 'desc'
        })
        if (!cancelled) {
          setPharmacies(result.pharmacies || [])
        }
      } catch (_error) {
        if (!cancelled) {
          setPharmacies([])
        }
      }
    }

    loadPharmacies()

    return () => {
      cancelled = true
    }
  }, [fetchSuperAdminPharmacies, user])

  useEffect(() => {
    if (!isSuperAdminUser(user)) return
    let cancelled = false

    async function loadLogs() {
      try {
        setIsLogsLoading(true)
        setErrorMessage('')
        const result = await fetchSuperAdminActivityLogs({
          page,
          limit: 20,
          pharmacyId: selectedPharmacyId,
          action: selectedAction,
          from: fromDate,
          to: toDate
        })
        if (!cancelled) {
          setLogs(result.logs || [])
          setPagination(
            result.pagination || {
              page: 1,
              totalPages: 1,
              total: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          )
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error.message || 'Failed to load global activity logs.')
          setLogs([])
          setPagination({
            page: 1,
            totalPages: 1,
            total: 0,
            hasNextPage: false,
            hasPreviousPage: false
          })
        }
      } finally {
        if (!cancelled) {
          setIsLogsLoading(false)
        }
      }
    }

    loadLogs()

    return () => {
      cancelled = true
    }
  }, [
    fetchSuperAdminActivityLogs,
    fromDate,
    page,
    selectedAction,
    selectedPharmacyId,
    toDate,
    user
  ])

  if (isLoading || isBlocked || !isSuperAdminUser(user)) return null

  return (
    <AppShell title='Super Admin | Activity Logs'>
      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            Global Activity Logs
          </h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            Track actions across all tenants.
          </p>
          {errorMessage && (
            <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
              {errorMessage}
            </p>
          )}
          <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <select
              value={selectedPharmacyId}
              onChange={event => {
                setSelectedPharmacyId(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              <option value=''>All pharmacies</option>
              {pharmacies.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              value={selectedAction}
              onChange={event => {
                setSelectedAction(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              <option value=''>All actions</option>
              {actionOptions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
            <input
              type='date'
              value={fromDate}
              onChange={event => {
                setFromDate(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            />
            <input
              type='date'
              value={toDate}
              onChange={event => {
                setToDate(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            />
          </div>
        </article>

        <article className='panel overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[920px] table-fixed text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>Time</th>
                  <th className='px-4 py-3 font-medium'>User</th>
                  <th className='px-4 py-3 font-medium'>Pharmacy</th>
                  <th className='px-4 py-3 font-medium'>Action</th>
                  <th className='px-4 py-3 font-medium'>Description</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(item => (
                  <tr
                    key={item._id}
                    className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                  >
                    <td className='px-4 py-3 text-[var(--muted)]'>
                      {formatDateTime(item.createdAt, locale)}
                    </td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.user?.name}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.pharmacy?.name}</td>
                    <td className='px-4 py-3'>
                      <span className='rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300'>
                        {item.action}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.description}</td>
                  </tr>
                ))}
                {!isLogsLoading && logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className='px-4 py-8 text-center text-sm text-[var(--muted)]'>
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className='flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3'>
            <p className='text-xs text-[var(--muted)]'>
              Page {pagination.page} / {pagination.totalPages} ({pagination.total} items)
            </p>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={isLogsLoading || !pagination.hasPreviousPage}
                className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isLogsLoading || !pagination.hasNextPage}
                className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </footer>
        </article>
      </section>
    </AppShell>
  )
}
