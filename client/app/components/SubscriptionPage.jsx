'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/

function sanitizeSubdomain(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default function SubscriptionPage() {
  const router = useRouter()
  const {
    user,
    locale,
    currentWorkspace,
    createPharmacy,
    checkPharmacySubdomain
  } = useSession()

  const t = getCopy(locale).subscription
  const [pharmacyName, setPharmacyName] = useState('')
  const [pharmacySubdomain, setPharmacySubdomain] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [slugState, setSlugState] = useState('idle')

  const rootDomain = useMemo(() => {
    if (typeof window === 'undefined') return 'phlowit.com'
    const host = String(window.location.host || '')
      .toLowerCase()
      .split(':')[0]
    const parts = host.split('.').filter(Boolean)
    if (parts.length >= 2) {
      return parts.slice(-2).join('.')
    }
    return host || 'phlowit.com'
  }, [])

  const normalizedSubdomain = sanitizeSubdomain(pharmacySubdomain)
  const isSlugFormatValid = SUBDOMAIN_PATTERN.test(normalizedSubdomain)
  const isBusy = isSubmitting
  const hasExistingPharmacy = Boolean(user?.pharmacyId || currentWorkspace?.id)

  useEffect(() => {
    if (!normalizedSubdomain) {
      setSlugState('idle')
      return
    }

    if (!SUBDOMAIN_PATTERN.test(normalizedSubdomain)) {
      setSlugState('invalid')
      return
    }

    let cancelled = false
    setSlugState('checking')

    const timer = window.setTimeout(async () => {
      try {
        const result = await checkPharmacySubdomain(normalizedSubdomain)
        if (cancelled) return
        setSlugState(result.available ? 'available' : 'taken')
      } catch (_error) {
        if (!cancelled) {
          setSlugState('error')
        }
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [checkPharmacySubdomain, normalizedSubdomain])

  async function verifySlugAvailability(subdomain) {
    if (!SUBDOMAIN_PATTERN.test(subdomain)) {
      setSlugState('invalid')
      return { isAvailable: false, reason: 'invalid' }
    }

    try {
      setSlugState('checking')
      const result = await checkPharmacySubdomain(subdomain)
      setSlugState(result.available ? 'available' : 'taken')
      return {
        isAvailable: Boolean(result.available),
        reason: result.available ? 'available' : 'taken'
      }
    } catch (error) {
      setSlugState('error')
      setErrorMessage(error.message)
      return { isAvailable: false, reason: 'error' }
    }
  }

  async function handleCreatePharmacy(event) {
    event.preventDefault()
    setErrorMessage('')

    const trimmedName = pharmacyName.trim()
    if (!trimmedName) {
      setErrorMessage(t.dashboardNameRequired)
      return
    }

    if (normalizedSubdomain !== pharmacySubdomain) {
      setPharmacySubdomain(normalizedSubdomain)
    }

    const slugVerification = await verifySlugAvailability(normalizedSubdomain)
    if (!slugVerification.isAvailable) {
      if (slugVerification.reason === 'taken') {
        setErrorMessage(t.slugTakenError)
      } else if (slugVerification.reason === 'invalid') {
        setErrorMessage(t.slugInvalid)
      }
      return
    }

    try {
      setIsSubmitting(true)
      await createPharmacy(trimmedName, normalizedSubdomain)
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    !isBusy &&
    pharmacyName.trim().length > 0 &&
    normalizedSubdomain.length > 0 &&
    isSlugFormatValid &&
    slugState === 'available'

  if (hasExistingPharmacy) {
    return (
      <section className='mx-auto max-w-3xl'>
        <article className='panel min-h-[280px]' />
      </section>
    )
  }

  return (
    <section className='mx-auto max-w-3xl'>
      <article className='panel p-6 sm:p-7'>
        <p className='text-xs uppercase tracking-[0.2em] text-[var(--muted)]'>
          {t.setupLabel}
        </p>
        <h2 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
          {t.setupTitle}
        </h2>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          {t.signedInAs} {user?.name}. {t.setupText}
        </p>

        {errorMessage && (
          <p className='mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleCreatePharmacy} className='mt-5 space-y-4'>
          <div className='space-y-1.5'>
            <label className='block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]'>
              {t.dashboardNameLabel}
            </label>
            <input
              value={pharmacyName}
              onChange={event => setPharmacyName(event.target.value)}
              placeholder={t.dashboardNamePlaceholder}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
            <p className='text-xs text-[var(--muted)]'>{t.dashboardNameHint}</p>
          </div>

          <div className='space-y-1.5'>
            <label className='block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]'>
              {t.slugLabel}
            </label>
            <input
              value={pharmacySubdomain}
              onChange={event =>
                setPharmacySubdomain(sanitizeSubdomain(event.target.value))
              }
              placeholder={t.slugPlaceholder}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
            <p className='text-xs text-[var(--muted)]'>
              {t.slugHint}
              <span className='ml-1 font-semibold text-[var(--foreground)]'>
                {normalizedSubdomain || 'your-slug'}.{rootDomain}
              </span>
            </p>
            {slugState === 'invalid' && (
              <p className='text-xs font-medium text-amber-600'>
                {t.slugInvalid}
              </p>
            )}
            {slugState === 'checking' && (
              <p className='text-xs font-medium text-cyan-600'>
                {t.slugChecking}
              </p>
            )}
            {slugState === 'available' && (
              <p className='text-xs font-medium text-emerald-600'>
                {t.slugAvailable}
              </p>
            )}
            {slugState === 'taken' && (
              <p className='text-xs font-medium text-rose-600'>{t.slugTaken}</p>
            )}
            {slugState === 'error' && (
              <p className='text-xs font-medium text-rose-600'>
                {t.slugCheckError}
              </p>
            )}
          </div>

          <button
            type='submit'
            disabled={!canSubmit}
            className='w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
          >
            {isBusy ? t.creating : t.createPharmacy}
          </button>
        </form>
      </article>
    </section>
  )
}
