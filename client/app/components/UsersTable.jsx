'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function UsersTable() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState('staff')
  const [pin, setPin] = useState('')
  const [switchUserId, setSwitchUserId] = useState('')
  const [switchPin, setSwitchPin] = useState('')
  const [staff, setStaff] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [issuedPin, setIssuedPin] = useState('')
  const {
    locale,
    listStaffMembers,
    addStaffMember,
    resetStaffMemberPin,
    disableStaffMember,
    loginWithPin,
    fetchActivityLogs
  } = useSession()
  const t = getCopy(locale).users

  async function refreshData() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const [staffRows, activityResult] = await Promise.all([
        listStaffMembers(),
        fetchActivityLogs({ page: 1, limit: 20 }).catch(() => ({ logs: [] }))
      ])
      setStaff(staffRows)
      setSwitchUserId(prev => prev || staffRows.find(item => item.isActive)?.id || '')
      setActivityLogs(activityResult.logs || [])
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  const activeStaff = useMemo(
    () => staff.filter(item => item.isActive),
    [staff]
  )

  async function handleCreateStaff() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const result = await addStaffMember({
        name,
        role,
        pin: pin.trim() || undefined
      })
      setIssuedPin(result.pin || '')
      setName('')
      setPin('')
      await refreshData()
    } catch (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  async function handleResetPin(staffId) {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const result = await resetStaffMemberPin(staffId)
      setIssuedPin(result.pin || '')
      await refreshData()
    } catch (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  async function handleDisable(staffId) {
    try {
      setIsLoading(true)
      setErrorMessage('')
      await disableStaffMember(staffId)
      await refreshData()
    } catch (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  async function handleSessionSwitch(event) {
    event.preventDefault()
    if (!switchUserId || switchPin.length !== 4) return

    try {
      setIsLoading(true)
      setErrorMessage('')
      await loginWithPin(switchUserId, switchPin)
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  return (
    <section className='space-y-4'>
      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>
          Staff Management
        </h2>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          Create staff PIN profiles scoped to this pharmacy subdomain.
        </p>
        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}
        {issuedPin && (
          <p className='mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700'>
            Generated PIN: <span className='font-bold tracking-widest'>{issuedPin}</span>
          </p>
        )}
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder='Staff name'
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
          />
          <select
            value={role}
            onChange={event => setRole(event.target.value)}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
          >
            <option value='staff'>Staff</option>
            <option value='pharmacist'>Pharmacist</option>
            <option value='admin'>Admin</option>
            <option value='assistant'>Assistant</option>
          </select>
          <input
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder='PIN (optional)'
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
          />
          <button
            onClick={handleCreateStaff}
            disabled={isLoading || !name.trim()}
            className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
          >
            Add Staff
          </button>
        </div>
      </article>

      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>Session Switch</h2>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          Switch to any active staff profile without logging out first.
        </p>
        <form onSubmit={handleSessionSwitch} className='mt-3 grid gap-3 md:grid-cols-3'>
          <select
            value={switchUserId}
            onChange={event => setSwitchUserId(event.target.value)}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
          >
            <option value=''>Select profile</option>
            {activeStaff.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.role})
              </option>
            ))}
          </select>
          <input
            value={switchPin}
            onChange={event =>
              setSwitchPin(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            placeholder='Staff PIN'
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-cyan-400/50 transition focus:ring'
          />
          <button
            type='submit'
            disabled={isLoading || !switchUserId || switchPin.length !== 4}
            className='rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50'
          >
            Switch Session
          </button>
        </form>
      </article>

      <article className='panel overflow-hidden'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.teamMembers || 'Team Members'}
          </h2>
        </header>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[640px] table-fixed text-left text-sm'>
            <thead>
              <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                <th className='px-3 py-3 font-medium sm:px-5'>Name</th>
                <th className='px-3 py-3 font-medium sm:px-5'>Role</th>
                <th className='px-3 py-3 font-medium sm:px-5'>Status</th>
                <th className='px-3 py-3 font-medium sm:px-5'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(item => (
                <tr
                  key={item.id}
                  className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                >
                  <td className='px-3 py-3 text-[var(--foreground)] sm:px-5'>
                    <p className='break-words'>{item.name}</p>
                  </td>
                  <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>{item.role}</td>
                  <td className='px-3 py-3 sm:px-5'>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {item.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className='px-3 py-3 sm:px-5'>
                    <div className='flex flex-wrap gap-2'>
                      <button
                        onClick={() => handleResetPin(item.id)}
                        disabled={isLoading}
                        className='rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
                      >
                        Reset PIN
                      </button>
                      <button
                        onClick={() => handleDisable(item.id)}
                        disabled={isLoading || !item.isActive}
                        className='rounded-md border border-red-400/40 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50'
                      >
                        Disable
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && staff.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className='px-5 py-8 text-center text-sm text-[var(--muted)]'
                  >
                    No staff profiles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>Activity Logs</h2>
        <div className='mt-3 space-y-2'>
          {activityLogs.length === 0 && (
            <p className='text-sm text-[var(--muted)]'>No activity yet.</p>
          )}
          {activityLogs.slice(0, 20).map(log => (
            <p
              key={log._id}
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]'
            >
              <span className='font-semibold'>{log.action}</span> | {log.user?.name} |{' '}
              {new Date(log.createdAt).toLocaleString()}
            </p>
          ))}
        </div>
      </article>
    </section>
  )
}
