'use client'

import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, locale, activateSubscription, createPharmacy } = useSession()
  const [pharmacyName, setPharmacyName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const t = getCopy(locale).subscription
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '0dzd/year',
      users: t.upTo5Workers
    },
    { id: 'growth', name: 'Growth', price: '0dzd/year', users: t.upTo15Workers }
  ]

  async function handleChoosePlan() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      await activateSubscription()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreatePharmacy() {
    try {
      setIsLoading(true)
      setErrorMessage('')
      await createPharmacy(pharmacyName)
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

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

      {errorMessage && (
        <p className='rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
          {errorMessage}
        </p>
      )}

      <div className='grid gap-4 md:grid-cols-2'>
        {plans.map(plan => (
          <article key={plan.id} className='panel p-5'>
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
              onClick={handleChoosePlan}
              disabled={isLoading || user?.subscriptionActive}
              className='mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              {user?.subscriptionActive ? t.active : `${t.choose} ${plan.name}`}
            </button>
          </article>
        ))}
      </div>

      {user?.subscriptionActive && (
        <article className='panel p-5'>
          <h3 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.pharmacyTitle}
          </h3>
          <p className='mt-2 text-sm text-[var(--muted)]'>{t.pharmacyText}</p>
          <div className='mt-3 flex flex-col gap-3 sm:flex-row'>
            <input
              value={pharmacyName}
              onChange={e => setPharmacyName(e.target.value)}
              placeholder={t.pharmacyPlaceholder}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
            <button
              onClick={handleCreatePharmacy}
              disabled={isLoading || !pharmacyName.trim()}
              className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
            >
              {t.createPharmacy}
            </button>
          </div>
        </article>
      )}
    </section>
  )
}
