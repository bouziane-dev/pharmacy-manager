'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function PendingInvitationsPage() {
  const router = useRouter()
  const { user, locale, isReady, pendingInvitations, respondToInvitation } = useSession()
  const [errorMessage, setErrorMessage] = useState('')
  const t = getCopy(locale)

  useEffect(() => {
    setErrorMessage('')
  }, [pendingInvitations.length])

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth')
    }
  }, [isReady, router, user])

  if (!isReady || !user) return null

  async function handleAccept(invitationId) {
    try {
      setErrorMessage('')
      await respondToInvitation(invitationId, 'accepted')
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <AppShell title={t.pages.pendingInvitations}>
      <section className='space-y-4'>
        {errorMessage && (
          <p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}
        {pendingInvitations.length === 0 ? (
          <article className='panel p-5'>
            <h2 className='text-lg font-semibold text-[var(--foreground)]'>
              {t.pendingInvitationsPage.emptyTitle}
            </h2>
            <p className='mt-2 text-sm text-[var(--muted)]'>
              {t.pendingInvitationsPage.emptyText}
            </p>
          </article>
        ) : (
          pendingInvitations.map(item => (
            <article key={item.id} className='panel p-5'>
              <p className='text-sm font-semibold text-[var(--foreground)]'>
                {item.workspaceName}
              </p>
              <p className='mt-1 text-xs text-[var(--muted)]'>
                {t.pendingInvitationsPage.roleLabel}: {t.users.role[item.role] || item.role}
              </p>
              <button
                onClick={() => handleAccept(item.id)}
                className='mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
              >
                {t.pendingInvitationsPage.accept}
              </button>
            </article>
          ))
        )}
      </section>
    </AppShell>
  )
}
