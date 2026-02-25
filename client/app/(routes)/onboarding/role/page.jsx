'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Moon, Sun } from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy, getLocaleButtonLabel, getNextLocale } from '@/app/lib/i18n'

export default function OnboardingRolePage() {
  const router = useRouter()
  const { chooseRole, isReady, user, locale, setLocale, theme, setTheme } =
    useSession()
  const t = getCopy(locale).onboarding
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/auth')
    }
  }, [isReady, router, user])

  if (!isReady || !user) return null

  async function handleChooseRole(role) {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const result = await chooseRole(role)
      if (result.nextStep === 'subscription') {
        router.replace('/subscription')
        return
      }
      router.replace('/invitations/pending')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8'>
      <section className='panel w-full max-w-xl p-6'>
        <div className='flex items-center justify-between'>
          <p className='text-xs uppercase tracking-[0.2em] text-[var(--muted)]'>
            {t.label}
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={() => setLocale(getNextLocale(locale))}
              className='inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              <Globe size={12} />
              {getLocaleButtonLabel(locale)}
            </button>
          </div>
        </div>
        <h1 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
          {t.title}
        </h1>
        <p className='mt-2 text-sm text-[var(--muted)]'>
          {t.text}
        </p>
        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}

        <div className='mt-5 grid gap-3 sm:grid-cols-2'>
          <button
            onClick={() => handleChooseRole('owner')}
            disabled={isLoading}
            className='rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
          >
            {t.owner}
          </button>
          <button
            onClick={() => handleChooseRole('pharmacist')}
            disabled={isLoading}
            className='rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50'
          >
            {t.pharmacist}
          </button>
        </div>
      </section>
    </div>
  )
}
