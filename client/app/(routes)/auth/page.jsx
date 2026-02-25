'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Globe, ShieldCheck } from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy, getLocaleButtonLabel, getNextLocale } from '@/app/lib/i18n'

function decodeBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return window.atob(padded)
}

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, login, locale, setLocale } = useSession()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const hasProcessedCallback = useRef(false)
  const common = getCopy(locale)
  const t = common.authPage
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    []
  )

  function getPostAuthPath(nextUser, onboardingRequired) {
    if (onboardingRequired || !nextUser.onboardingCompleted) {
      return '/onboarding/role'
    }
    if (nextUser.primaryRole === 'owner' && !nextUser.subscriptionActive) {
      return '/subscription'
    }
    if (nextUser.primaryRole === 'pharmacist') {
      return '/invitations/pending'
    }
    return '/dashboard'
  }

  useEffect(() => {
    if (user) {
      router.replace(getPostAuthPath(user, false))
    }
  }, [router, user])

  useEffect(() => {
    const token = searchParams.get('token')
    const encodedUser = searchParams.get('user')
    const authError = searchParams.get('error')
    const onboardingRequired = searchParams.get('onboardingRequired') === 'true'

    if (authError) {
      setIsLoading(false)
      setErrorMessage(t.failed)
      return
    }

    if (!token || !encodedUser) {
      setIsLoading(false)
      return
    }

    if (hasProcessedCallback.current) return
    hasProcessedCallback.current = true

    setIsLoading(true)

    try {
      const parsedUser = JSON.parse(decodeBase64Url(encodedUser))
      const nextUser = {
        name: parsedUser.displayName || parsedUser.email,
        email: parsedUser.email,
        role: parsedUser.primaryRole === 'owner' ? 'admin' : 'worker',
        primaryRole: parsedUser.primaryRole,
        onboardingCompleted: parsedUser.onboardingCompleted,
        subscriptionActive: !!parsedUser.subscriptionActive,
        picture: parsedUser.picture || '',
        googleId: parsedUser.googleId
      }
      login(nextUser, token)
      router.replace(getPostAuthPath(nextUser, onboardingRequired))
    } catch (_error) {
      hasProcessedCallback.current = false
      setIsLoading(false)
      setErrorMessage(t.failed)
    }
  }, [searchParams, login, router, t.failed])

  function handleGoogleLogin() {
    setIsLoading(true)
    window.location.href = `${apiBaseUrl}/auth/google`
  }

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8'>
        <div className='panel w-full max-w-sm p-6 text-center'>
          <div className='mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-emerald-500' />
          <p className='mt-4 text-sm font-medium text-[var(--foreground)]'>{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8'>
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute left-[10%] top-[8%] h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl' />
        <div className='absolute bottom-[8%] right-[10%] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl' />
      </div>

      <section className='panel w-full max-w-md p-6'>
        <div className='flex items-center justify-between'>
          <p className='text-xs uppercase tracking-[0.2em] text-[var(--muted)]'>
            {common.appName}
          </p>
          <button
            onClick={() => setLocale(getNextLocale(locale))}
            className='inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            <Globe size={12} />
            {getLocaleButtonLabel(locale)}
          </button>
        </div>
        <h1 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
          {t.signIn}
        </h1>
        <p className='mt-1 text-sm text-[var(--muted)]'>
          {t.helper}
        </p>
        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}

        <div className='mt-5'>
          <button
            onClick={handleGoogleLogin}
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500'
          >
            <ShieldCheck size={16} />
            {t.cta}
          </button>
        </div>
      </section>
    </div>
  )
}
