'use client'

import { useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function UsersTable() {
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('pharmacist')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const {
    locale,
    workspaceMembers,
    pendingWorkspaceInvitations,
    inviteToCurrentWorkspace
  } = useSession()
  const t = getCopy(locale).users

  async function handleInvite() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      await inviteToCurrentWorkspace(inviteEmail, inviteRole)
      setInviteEmail('')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className='space-y-4'>
      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>
          {t.inviteWorker}
        </h2>
        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}
        <div className='mt-3 flex flex-col gap-3 sm:flex-row'>
          <input
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder={t.invitePlaceholder}
            className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
          >
            <option value='pharmacist'>{t.inviteRoles.pharmacist}</option>
            <option value='admin'>{t.inviteRoles.admin}</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={isLoading || !inviteEmail.trim()}
            className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
          >
            {t.sendInvite}
          </button>
        </div>
      </article>

      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>
          {t.pendingInvites}
        </h2>
        {pendingWorkspaceInvitations.length === 0 ? (
          <p className='mt-2 text-sm text-[var(--muted)]'>0</p>
        ) : (
          <div className='mt-2 space-y-2 text-sm text-[var(--muted)]'>
            {pendingWorkspaceInvitations.map(item => (
              <p key={item.id}>
                {item.toEmail} | {t.invitedBy} {item.fromName}
              </p>
            ))}
          </div>
        )}
      </article>

      <article className='panel overflow-hidden'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.teamMembers}
          </h2>
        </header>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[600px] text-left text-sm'>
            <thead>
              <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                <th className='px-5 py-3 font-medium'>{t.columns.name}</th>
                <th className='px-5 py-3 font-medium'>{t.columns.role}</th>
                <th className='px-5 py-3 font-medium'>{t.columns.email}</th>
                <th className='px-5 py-3 font-medium'>{t.columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {workspaceMembers.map(worker => (
                <tr
                  key={worker.email}
                  className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                >
                  <td className='px-5 py-3 text-[var(--foreground)]'>
                    {worker.name}
                  </td>
                  <td className='px-5 py-3 text-[var(--muted)]'>
                    {t.role[worker.role] || worker.role}
                  </td>
                  <td className='px-5 py-3 text-[var(--muted)]'>{worker.email}</td>
                  <td className='px-5 py-3'>
                    <span className='rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'>
                      {t.active}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
