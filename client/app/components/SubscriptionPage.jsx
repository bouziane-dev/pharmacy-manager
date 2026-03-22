'use client'

import { ArrowDownCircle, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function SubscriptionPage() {
  const router = useRouter()
  const { user, locale, activateSubscription, createPharmacy } = useSession()
  const [pharmacyName, setPharmacyName] = useState('')
  const [pharmacySubdomain, setPharmacySubdomain] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const pharmacySectionRef = useRef(null)
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
      window.setTimeout(() => {
        pharmacySectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 120)
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
      await createPharmacy(pharmacyName, pharmacySubdomain)
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

      {user?.subscriptionActive && (
        <article className='rounded-3xl border border-emerald-400/60 bg-[linear-gradient(145deg,rgba(16,185,129,0.17),rgba(34,197,94,0.12),rgba(255,255,255,0.85))] p-5 shadow-[0_18px_40px_rgba(16,185,129,0.18)] dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.5),rgba(5,46,22,0.4),rgba(2,6,23,0.88))] sm:p-6'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <p className='text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300'>
                {t.nextStepLabel}
              </p>
              <h3 className='mt-1 text-xl font-semibold text-[var(--foreground)]'>
                {t.pharmacyTitle}
              </h3>
              <p className='mt-2 text-sm text-[var(--muted)]'>{t.pharmacyText}</p>
            </div>
            <button
              onClick={() =>
                pharmacySectionRef.current?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                })
              }
              className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              <ArrowDownCircle size={16} />
              {t.createPharmacy}
            </button>
          </div>
        </article>
      )}

      {user?.subscriptionActive && (
        <article ref={pharmacySectionRef} className='panel p-5'>
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
            <input
              value={pharmacySubdomain}
              onChange={e =>
                setPharmacySubdomain(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '')
                )
              }
              placeholder={t.pharmacySubdomainPlaceholder || 'my-pharmacy'}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
            <button
              onClick={handleCreatePharmacy}
              disabled={
                isLoading || !pharmacyName.trim() || !pharmacySubdomain.trim()
              }
              className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
            >
              {t.createPharmacy}
            </button>
          </div>
        </article>
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
    </section>
  )
}
