'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import SubscriptionPage from '@/app/components/SubscriptionPage'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function SubscriptionRoutePage() {
  const router = useRouter()
  const { user, locale, isReady } = useSession()
  const t = getCopy(locale)

  if (!isReady) return null

  const canManageSubscription =
    !!user && user.role === 'admin' && !user.subscriptionActive

  if (!canManageSubscription) {
    return (
      <AppShell title={t.pages.subscription}>
        <section className='mx-auto max-w-3xl'>
          <article className='panel p-6'>
            <p className='text-xs uppercase tracking-[0.18em] text-[var(--muted)]'>
              {t.subscriptionPreview.mode}
            </p>
            <h2 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
              {t.subscriptionPreview.title}
            </h2>
            <p className='mt-3 text-sm text-[var(--muted)]'>
              {t.subscriptionPreview.text}
            </p>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Link
                href='/auth'
                className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
              >
                {t.subscriptionPreview.goToLogin}
              </Link>
              <button
                onClick={() => router.push('/dashboard')}
                className='rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                {t.subscriptionPreview.openDashboard}
              </button>
            </div>
          </article>
        </section>
      </AppShell>
    )
  }

  return (
    <AppShell title={t.pages.subscription}>
      <SubscriptionPage />
    </AppShell>
  )
}
