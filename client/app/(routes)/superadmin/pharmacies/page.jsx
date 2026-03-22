'use client'

import { useEffect, useMemo, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import { getIntlLocale } from '@/app/lib/i18n'
import { isSuperAdminUser, useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

function formatDate(value, locale) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(parsed)
}

export default function SuperAdminPharmaciesPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireSuperAdmin: true,
    requireMembership: false,
    requireSubscription: false
  })
  const { locale, fetchSuperAdminPharmacies, updateSuperAdminPharmacyStatus } =
    useSession()

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [sort, setSort] = useState('desc')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [pendingPharmacyId, setPendingPharmacyId] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(searchInput.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!isSuperAdminUser(user)) return
    let cancelled = false

    async function loadData() {
      try {
        setIsTableLoading(true)
        setErrorMessage('')
        const result = await fetchSuperAdminPharmacies({
          page,
          limit: 20,
          search: searchTerm,
          sort
        })
        if (!cancelled) {
          setRows(result.pharmacies || [])
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
          setErrorMessage(error.message || 'Failed to load pharmacies.')
          setRows([])
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
          setIsTableLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [fetchSuperAdminPharmacies, page, searchTerm, sort, user])

  async function handleToggleStatus(pharmacy) {
    try {
      setPendingPharmacyId(pharmacy.id)
      await updateSuperAdminPharmacyStatus(pharmacy.id, !pharmacy.isActive)
      const refreshed = await fetchSuperAdminPharmacies({
        page,
        limit: 20,
        search: searchTerm,
        sort
      })
      setRows(refreshed.pharmacies || [])
      setPagination(
        refreshed.pagination || {
          page: 1,
          totalPages: 1,
          total: 0,
          hasNextPage: false,
          hasPreviousPage: false
        }
      )
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update pharmacy status.')
    } finally {
      setPendingPharmacyId('')
    }
  }

  const title = useMemo(() => 'Super Admin | Pharmacies', [])

  if (isLoading || isBlocked || !isSuperAdminUser(user)) return null

  return (
    <AppShell title={title}>
      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>All Pharmacies</h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            Search, sort, and enable/disable tenant workspaces globally.
          </p>
          {errorMessage && (
            <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
              {errorMessage}
            </p>
          )}
          <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <input
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder='Search by name or subdomain'
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            />
            <select
              value={sort}
              onChange={event => {
                setSort(event.target.value === 'asc' ? 'asc' : 'desc')
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              <option value='desc'>Newest first</option>
              <option value='asc'>Oldest first</option>
            </select>
          </div>
        </article>

        <article className='panel overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[840px] table-fixed text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>Name</th>
                  <th className='px-4 py-3 font-medium'>Subdomain</th>
                  <th className='px-4 py-3 font-medium'>Owner</th>
                  <th className='px-4 py-3 font-medium'>Status</th>
                  <th className='px-4 py-3 font-medium'>Created</th>
                  <th className='px-4 py-3 font-medium'>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(item => (
                  <tr
                    key={item.id}
                    className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                  >
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.name}</td>
                    <td className='px-4 py-3 text-[var(--muted)]'>{item.subdomain}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.owner?.name}</td>
                    <td className='px-4 py-3'>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-[var(--muted)]'>
                      {formatDate(item.createdAt, locale)}
                    </td>
                    <td className='px-4 py-3'>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={pendingPharmacyId === item.id}
                        className='rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
                      >
                        {item.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!isTableLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-4 py-8 text-center text-sm text-[var(--muted)]'>
                      No pharmacies found.
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
                disabled={isTableLoading || !pagination.hasPreviousPage}
                className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
              >
                Previous
              </button>
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={isTableLoading || !pagination.hasNextPage}
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
