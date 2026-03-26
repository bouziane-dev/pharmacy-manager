'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const DEFAULT_ACTION_OPTIONS = [
  'CREATE_ORDER',
  'UPDATE_STATUS',
  'UPDATE_ORDER',
  'DELETE_ORDER',
  'ADD_ORDER_COMMENT',
  'CREATE_STAFF',
  'RESET_STAFF_PIN',
  'DISABLE_STAFF',
  'DELETE_STAFF'
]

function getActionLabel(action, locale) {
  const labels = locale === 'fr'
    ? {
        CREATE_ORDER: 'Creation commande',
        UPDATE_STATUS: 'Mise a jour statut',
        UPDATE_ORDER: 'Modification commande',
        DELETE_ORDER: 'Suppression commande',
        ADD_ORDER_COMMENT: 'Ajout commentaire',
        CREATE_STAFF: 'Ajout membre',
        RESET_STAFF_PIN: 'Reinitialisation PIN',
        DELETE_STAFF: 'Suppression membre',
        PIN_LOGIN: 'Connexion PIN'
      }
    : {
        CREATE_ORDER: 'Order created',
        UPDATE_STATUS: 'Status updated',
        UPDATE_ORDER: 'Order updated',
        DELETE_ORDER: 'Order deleted',
        ADD_ORDER_COMMENT: 'Comment added',
        CREATE_STAFF: 'Staff created',
        RESET_STAFF_PIN: 'PIN reset',
        DELETE_STAFF: 'Staff deleted',
        PIN_LOGIN: 'PIN login'
      }

  return labels[action] || action
}

function formatLogDate(dateValue, locale) {
  if (!dateValue) return '-'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return String(dateValue)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

export default function ActivityLogsPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({ requireAdmin: true })
  const { locale, fetchActivityLogs, listStaffMembers } = useSession()
  const t = getCopy(locale)

  const [logs, setLogs] = useState([])
  const [staff, setStaff] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLogsLoading, setIsLogsLoading] = useState(false)
  const [isStaffLoading, setIsStaffLoading] = useState(false)

  const actionOptions = useMemo(() => {
    const fromLogs = logs.map(item => item.action).filter(Boolean)
    return [...new Set([...DEFAULT_ACTION_OPTIONS, ...fromLogs])]
  }, [logs])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    let cancelled = false

    async function loadStaff() {
      try {
        setIsStaffLoading(true)
        const staffRows = await listStaffMembers()
        if (!cancelled) {
          setStaff(staffRows || [])
        }
      } catch (_error) {
        if (!cancelled) {
          setStaff([])
        }
      } finally {
        if (!cancelled) {
          setIsStaffLoading(false)
        }
      }
    }

    loadStaff()

    return () => {
      cancelled = true
    }
  }, [listStaffMembers, user])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    let cancelled = false

    async function loadLogs() {
      try {
        setIsLogsLoading(true)
        setErrorMessage('')
        const result = await fetchActivityLogs({
          page,
          limit: 20,
          userId: selectedUserId,
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
          setErrorMessage(error.message || 'Failed to load activity logs.')
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
  }, [fetchActivityLogs, fromDate, page, selectedAction, selectedUserId, toDate, user])

  if (isLoading || isBlocked || !user || user.role !== 'admin') return null

  return (
    <AppShell title={t.pages.activity || 'Activity Logs'}>
      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.pages.activity || 'Activity Logs'}
          </h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            {locale === 'fr'
              ? "Suivez les actions récentes de l'équipe avec filtres."
              : 'Review recent staff actions with filters.'}
          </p>
          {errorMessage && (
            <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
              {errorMessage}
            </p>
          )}

          <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <label className='flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'>
              {locale === 'fr' ? 'Membre' : 'Staff'}
              <select
                value={selectedUserId}
                onChange={event => {
                  setSelectedUserId(event.target.value)
                  setPage(1)
                }}
                disabled={isStaffLoading}
                className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-normal normal-case text-[var(--foreground)] outline-none'
              >
                <option value=''>{locale === 'fr' ? 'Tous' : 'All staff'}</option>
                {staff.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className='flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'>
              {locale === 'fr' ? 'Action' : 'Action'}
              <select
                value={selectedAction}
                onChange={event => {
                  setSelectedAction(event.target.value)
                  setPage(1)
                }}
                className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-normal normal-case text-[var(--foreground)] outline-none'
              >
                <option value=''>{locale === 'fr' ? 'Toutes' : 'All actions'}</option>
                {actionOptions.map(action => (
                  <option key={action} value={action}>
                    {getActionLabel(action, locale)}
                  </option>
                ))}
              </select>
            </label>

            <label className='flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'>
              {locale === 'fr' ? 'Du' : 'From'}
              <input
                type='date'
                value={fromDate}
                onChange={event => {
                  setFromDate(event.target.value)
                  setPage(1)
                }}
                className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-normal normal-case text-[var(--foreground)] outline-none'
              />
            </label>

            <label className='flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'>
              {locale === 'fr' ? 'Au' : 'To'}
              <input
                type='date'
                value={toDate}
                onChange={event => {
                  setToDate(event.target.value)
                  setPage(1)
                }}
                className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-normal normal-case text-[var(--foreground)] outline-none'
              />
            </label>
          </div>
        </article>

        <article className='panel overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[760px] table-fixed text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>
                    {locale === 'fr' ? 'Heure' : 'Time'}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {locale === 'fr' ? 'Membre' : 'Staff Name'}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {locale === 'fr' ? 'Action' : 'Action'}
                  </th>
                  <th className='px-4 py-3 font-medium'>
                    {locale === 'fr' ? 'Description' : 'Description'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr
                    key={log._id}
                    className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                  >
                    <td className='px-4 py-3 text-[var(--muted)]'>
                      {formatLogDate(log.createdAt, locale)}
                    </td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>
                      {log.user?.name || 'Unknown'}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-400/20 dark:text-cyan-300'>
                        {getActionLabel(log.action, locale)}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{log.description}</td>
                  </tr>
                ))}
                {!isLogsLoading && logs.length === 0 && (
                  <tr>
                    <td colSpan={4} className='px-4 py-8 text-center text-sm text-[var(--muted)]'>
                      No activity yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <footer className='flex items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3'>
            <p className='text-xs text-[var(--muted)]'>
              {locale === 'fr'
                ? `Page ${pagination.page} / ${pagination.totalPages} (${pagination.total} elements)`
                : `Page ${pagination.page} / ${pagination.totalPages} (${pagination.total} items)`}
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
