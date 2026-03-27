'use client'

import { useEffect, useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

function getReadableActionLabel(action, locale) {
  const labels =
    locale === 'fr'
      ? {
          CREATE_STAFF: 'Ajout membre',
          RESET_STAFF_PIN: 'Reinitialisation PIN',
          DELETE_STAFF: 'Suppression membre',
          CREATE_ORDER: 'Creation commande',
          UPDATE_ORDER: 'Modification commande',
          UPDATE_STATUS: 'Mise a jour statut',
          DELETE_ORDER: 'Suppression commande',
          ADD_ORDER_COMMENT: 'Ajout commentaire',
          PIN_LOGIN: 'Connexion PIN',
          UPDATE_STAFF_ROLE: 'Role staff modifie'
        }
      : {
          CREATE_STAFF: 'Staff created',
          RESET_STAFF_PIN: 'PIN reset',
          DELETE_STAFF: 'Staff deleted',
          CREATE_ORDER: 'Order created',
          UPDATE_ORDER: 'Order updated',
          UPDATE_STATUS: 'Status updated',
          DELETE_ORDER: 'Order deleted',
          ADD_ORDER_COMMENT: 'Comment added',
          PIN_LOGIN: 'PIN login',
          UPDATE_STAFF_ROLE: 'Staff role updated'
        }

  return labels[action] || action
}

export default function UsersTable() {
  const [name, setName] = useState('')
  const [role, setRole] = useState('pharmacist')
  const [pin, setPin] = useState('')
  const [staff, setStaff] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [issuedPin, setIssuedPin] = useState('')
  const {
    locale,
    user,
    listStaffMembers,
    addStaffMember,
    resetStaffMemberPin,
    updateStaffMemberRole,
    deleteStaffMember,
    fetchActivityLogs
  } = useSession()

  const t = getCopy(locale).users
  const generalActionError =
    t.errors?.generic || 'Something went wrong. Please try again.'
  const duplicatePinErrorMessage =
    t.errors?.duplicatePin || 'This PIN is already in use. Please choose another PIN.'
  const canManageStaffRoles =
    user?.accountRole === 'owner' || user?.primaryRole === 'owner'

  async function refreshData() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const [staffRows, activityResult] = await Promise.all([
        listStaffMembers(),
        fetchActivityLogs({ page: 1, limit: 20 }).catch(() => ({ logs: [] }))
      ])
      setStaff(staffRows)
      setActivityLogs(activityResult.logs || [])
    } catch (_error) {
      setErrorMessage(generalActionError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  async function handleCreateStaff() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      setIssuedPin('')
      const result = await addStaffMember({
        name,
        role,
        pin: pin.trim()
      })
      setIssuedPin(result.pin || '')
      setName('')
      setPin('')
      await refreshData()
    } catch (error) {
      const rawMessage = String(error?.message || '').toLowerCase()
      if (
        rawMessage.includes('pin') &&
        (rawMessage.includes('already') || rawMessage.includes('used'))
      ) {
        setErrorMessage(duplicatePinErrorMessage)
      } else if (rawMessage.includes('pin')) {
        setErrorMessage(t.errors?.invalidPin || 'Invalid PIN. Use 2 to 6 digits.')
      } else if (rawMessage.includes('name') && rawMessage.includes('already')) {
        setErrorMessage(
          t.errors?.duplicateName ||
            'A staff member with this name already exists in this pharmacy.'
        )
      } else if (rawMessage.includes('invalid staff role')) {
        setErrorMessage(t.errors?.invalidRole || 'Invalid role. Use Admin or Pharmacist.')
      } else if (
        rawMessage.includes('no access to this pharmacy') ||
        rawMessage.includes('insufficient role') ||
        rawMessage.includes('only owner')
      ) {
        setErrorMessage(
          t.errors?.noPermission ||
            'You do not have permission to add staff in this workspace.'
        )
      } else {
        setErrorMessage(generalActionError)
      }
      setIsLoading(false)
    }
  }

  async function handleResetPin(staffId) {
    const manualPinInput = window.prompt(
      t.prompts?.resetPin ||
        'Enter new PIN (2-6 digits). Leave empty to auto-generate.'
    )
    if (manualPinInput === null) return
    const normalizedPin = manualPinInput.replace(/\D/g, '').slice(0, 6)
    if (normalizedPin && (normalizedPin.length < 2 || normalizedPin.length > 6)) {
      setErrorMessage(t.errors?.pinLength || 'PIN must be between 2 and 6 digits')
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage('')
      await resetStaffMemberPin(staffId, normalizedPin)
      setIssuedPin('')
      await refreshData()
    } catch (error) {
      if (String(error?.message || '').toLowerCase().includes('pin')) {
        setErrorMessage(t.errors?.invalidPin || 'Invalid PIN. Use 2 to 6 digits.')
      } else {
        setErrorMessage(generalActionError)
      }
      setIsLoading(false)
    }
  }

  async function handleDelete(staffId) {
    try {
      setIsLoading(true)
      setErrorMessage('')
      await deleteStaffMember(staffId)
      await refreshData()
    } catch (_error) {
      setErrorMessage(generalActionError)
      setIsLoading(false)
    }
  }

  async function handleUpdateRole(staffId, nextRole, currentRole) {
    if (!canManageStaffRoles) return
    if (!staffId || !nextRole || nextRole === currentRole) return

    try {
      setIsLoading(true)
      setErrorMessage('')
      await updateStaffMemberRole(staffId, nextRole)
      await refreshData()
    } catch (_error) {
      setErrorMessage(generalActionError)
      setIsLoading(false)
    }
  }

  return (
    <section className='space-y-4'>
      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>
          {t.managementTitle || 'Staff Management'}
        </h2>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          {t.managementDescription ||
            'Create staff PIN profiles scoped to this pharmacy slug.'}
        </p>
        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}
        {issuedPin && (
          <p className='mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700'>
            {t.assignedPinLabel || 'Assigned PIN'}:{' '}
            <span className='font-bold tracking-widest'>{issuedPin}</span>
          </p>
        )}
        <div className='mt-3 grid gap-3 md:grid-cols-4'>
          <input
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder={t.placeholders?.staffName || 'Staff name'}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
          />
          <select
            value={role}
            onChange={event => setRole(event.target.value)}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
          >
            <option value='pharmacist'>{t.inviteRoles?.pharmacist || 'Pharmacist'}</option>
            <option value='admin'>{t.inviteRoles?.admin || 'Admin'}</option>
          </select>
          <input
            value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t.placeholders?.pin || 'PIN (2-6 digits)'}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
          />
          <button
            onClick={handleCreateStaff}
            disabled={isLoading || !name.trim() || pin.length < 2 || pin.length > 6}
            className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
          >
            {t.addStaff || 'Add Staff'}
          </button>
        </div>
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
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns?.name || 'Name'}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns?.role || 'Role'}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>
                  {t.columns?.status || 'Status'}
                </th>
                <th className='px-3 py-3 font-medium sm:px-5'>
                  {t.columns?.actions || 'Actions'}
                </th>
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
                  <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                    {canManageStaffRoles ? (
                      <div className='flex items-center gap-2'>
                        <select
                          value={item.role}
                          onChange={event =>
                            handleUpdateRole(item.id, event.target.value, item.role)
                          }
                          disabled={isLoading}
                          className='rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--foreground)] outline-none'
                        >
                          <option value='pharmacist'>
                            {t.inviteRoles?.pharmacist || 'Pharmacist'}
                          </option>
                          <option value='admin'>{t.inviteRoles?.admin || 'Admin'}</option>
                        </select>
                      </div>
                    ) : (
                      item.role
                    )}
                  </td>
                  <td className='px-3 py-3 sm:px-5'>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.isActive
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {item.isActive ? t.active || 'Active' : t.statusDisabled || 'Disabled'}
                    </span>
                  </td>
                  <td className='px-3 py-3 sm:px-5'>
                    <div className='flex flex-wrap gap-2'>
                      <button
                        onClick={() => handleResetPin(item.id)}
                        disabled={isLoading}
                        className='rounded-md border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
                      >
                        {t.resetPin || 'Reset PIN'}
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isLoading}
                        className='rounded-md border border-red-400/40 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10 disabled:opacity-50'
                      >
                        {t.delete || 'Delete'}
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
                    {t.noStaffProfiles || 'No staff profiles yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>
          {t.activityTitle || 'Activity Logs'}
        </h2>
        <div className='mt-3 space-y-2'>
          {activityLogs.length === 0 && (
            <p className='text-sm text-[var(--muted)]'>{t.noActivity || 'No activity yet.'}</p>
          )}
          {activityLogs.slice(0, 20).map(log => (
            <p
              key={log._id}
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]'
            >
              <span className='font-semibold'>
                {getReadableActionLabel(log.action, locale)}
              </span>{' '}
              | {log.user?.name || t.unknownUser || 'Unknown'} |{' '}
              {new Date(log.createdAt).toLocaleString()}
            </p>
          ))}
        </div>
      </article>
    </section>
  )
}
