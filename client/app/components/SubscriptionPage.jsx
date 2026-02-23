'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, locale, activateSubscription } = useSession()
  const t = getCopy(locale).subscription
  const plans = [
    { id: 'starter', name: 'Starter', price: '$29/mo', users: t.upTo5Workers },
    { id: 'growth', name: 'Growth', price: '$59/mo', users: t.upTo15Workers }
  ]

  return (
    <section className='mx-auto max-w-4xl space-y-4'>
      <article className='panel p-6'>
        <p className='text-xs uppercase tracking-[0.2em] text-[var(--muted)]'>
          {t.required}
        </p>
        <h2 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
          {t.unlock}
        </h2>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          {t.signedInAs} {user?.name}. {t.mockBilling}
        </p>
      </article>

      <div className='grid gap-4 md:grid-cols-2'>
        {plans.map(plan => (
          <article
            key={plan.id}
            className='panel p-5'
          >
            <h3 className='text-xl font-semibold text-[var(--foreground)]'>
              {plan.name}
            </h3>
            <p className='mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400'>
              {plan.price}
            </p>
            <p className='mt-1 text-sm text-[var(--muted)]'>{plan.users}</p>
            <ul className='mt-4 space-y-2 text-sm text-[var(--muted)]'>
              {t.features.map(feature => (
                <li key={feature} className='flex items-center gap-2'>
                  <CheckCircle2 size={16} className='text-emerald-500' />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                activateSubscription()
                router.replace('/dashboard')
              }}
              className='mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              {t.choose} {plan.name} (Mock)
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
