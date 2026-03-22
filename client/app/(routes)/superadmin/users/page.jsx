'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/app/components/AppShell'
import { isSuperAdminUser, useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'superadmin', label: 'Superadmin' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin (staff)' },
  { value: 'pharmacist', label: 'Pharmacist (staff)' },
  { value: 'assistant', label: 'Assistant (staff)' },
  { value: 'staff', label: 'Staff (account role)' }
]

export default function SuperAdminUsersPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({
    requireSuperAdmin: true,
    requireMembership: false,
    requireSubscription: false
  })
  const { fetchSuperAdminUsers, fetchSuperAdminPharmacies } = useSession()

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedPharmacyId, setSelectedPharmacyId] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [pharmacyOptions, setPharmacyOptions] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const [isTableLoading, setIsTableLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

    async function loadPharmacyOptions() {
      try {
        const result = await fetchSuperAdminPharmacies({
          page: 1,
          limit: 200,
          sort: 'desc'
        })
        if (!cancelled) {
          setPharmacyOptions(result.pharmacies || [])
        }
      } catch (_error) {
        if (!cancelled) {
          setPharmacyOptions([])
        }
      }
    }

    loadPharmacyOptions()

    return () => {
      cancelled = true
    }
  }, [fetchSuperAdminPharmacies, user])

  useEffect(() => {
    if (!isSuperAdminUser(user)) return
    let cancelled = false

    async function loadUsers() {
      try {
        setIsTableLoading(true)
        setErrorMessage('')
        const result = await fetchSuperAdminUsers({
          page,
          limit: 20,
          role: selectedRole,
          pharmacyId: selectedPharmacyId,
          search: searchTerm
        })
        if (!cancelled) {
          setRows(result.users || [])
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
          setErrorMessage(error.message || 'Failed to load users.')
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

    loadUsers()

    return () => {
      cancelled = true
    }
  }, [fetchSuperAdminUsers, page, searchTerm, selectedPharmacyId, selectedRole, user])

  if (isLoading || isBlocked || !isSuperAdminUser(user)) return null

  return (
    <AppShell title='Super Admin | Users'>
      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>All Users</h2>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            Filter global users by role and pharmacy.
          </p>
          {errorMessage && (
            <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
              {errorMessage}
            </p>
          )}

          <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <input
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder='Search by name or email'
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            />

            <select
              value={selectedRole}
              onChange={event => {
                setSelectedRole(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              {roleOptions.map(option => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedPharmacyId}
              onChange={event => {
                setSelectedPharmacyId(event.target.value)
                setPage(1)
              }}
              className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              <option value=''>All pharmacies</option>
              {pharmacyOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </article>

        <article className='panel overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='w-full min-w-[840px] table-fixed text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>Name</th>
                  <th className='px-4 py-3 font-medium'>Email</th>
                  <th className='px-4 py-3 font-medium'>Role</th>
                  <th className='px-4 py-3 font-medium'>Pharmacy</th>
                  <th className='px-4 py-3 font-medium'>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(item => (
                  <tr
                    key={item.id}
                    className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                  >
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.name}</td>
                    <td className='px-4 py-3 text-[var(--muted)]'>{item.email || '-'}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{item.role}</td>
                    <td className='px-4 py-3 text-[var(--muted)]'>{item.pharmacy?.name || '-'}</td>
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
                  </tr>
                ))}
                {!isTableLoading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className='px-4 py-8 text-center text-sm text-[var(--muted)]'>
                      No users found.
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
