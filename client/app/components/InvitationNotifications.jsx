'use client'

import { useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function InvitationNotifications() {
  const { locale, pendingInvitations, respondToInvitation } = useSession()
  const t = getCopy(locale).invitations
  const [pendingDecision, setPendingDecision] = useState(null)

  if (pendingInvitations.length === 0) return null

  return (
    <section className='panel p-5'>
      <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.title}</h2>
      <div className='mt-3 space-y-3'>
        {pendingInvitations.map(item => (
          <article
            key={item.id}
            className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3'
          >
            <p className='text-sm font-semibold text-[var(--foreground)]'>
              {item.workspaceName}
            </p>
            <p className='text-xs text-[var(--muted)]'>
              {t.from}: {item.fromName}
            </p>
            <div className='mt-2 flex gap-2'>
              <button
                onClick={() => setPendingDecision({ id: item.id, decision: 'accepted' })}
                className='rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white'
              >
                {t.accept}
              </button>
              <button
                onClick={() => setPendingDecision({ id: item.id, decision: 'declined' })}
                className='rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]'
              >
                {t.decline}
              </button>
            </div>
          </article>
        ))}
      </div>

      {pendingDecision && (
        <div className='fixed bottom-4 right-4 z-50 w-[320px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl'>
          <p className='text-sm font-semibold text-[var(--foreground)]'>
            {t.confirmTitle}
          </p>
          <p className='mt-1 text-sm text-[var(--muted)]'>
            {pendingDecision.decision === 'accepted'
              ? t.confirmAccept
              : t.confirmDecline}
          </p>
          <div className='mt-3 flex justify-end gap-2'>
            <button
              onClick={() => setPendingDecision(null)}
              className='rounded-md border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)]'
            >
              {t.confirmNo}
            </button>
            <button
              onClick={() => {
                respondToInvitation(pendingDecision.id, pendingDecision.decision)
                setPendingDecision(null)
              }}
              className='rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white'
            >
              {t.confirmYes}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
