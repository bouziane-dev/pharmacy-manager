'use client'
export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Globe, Moon, ShieldCheck, Sun, UserRound } from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy, getLocaleButtonLabel, getNextLocale } from '@/app/lib/i18n'

const reservedSubdomains = new Set(['www', 'api', 'localhost'])

function decodeBase64Url(input) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return window.atob(padded)
}

function extractSubdomain(hostValue) {
  const host = String(hostValue || '')
    .trim()
    .toLowerCase()
    .split(':')[0]

  if (!host) return null

  const parts = host.split('.').filter(Boolean)
  if (parts.length >= 3) {
    return reservedSubdomains.has(parts[0]) ? null : parts[0]
  }
  if (parts.length === 2 && parts[1] === 'localhost') {
    return reservedSubdomains.has(parts[0]) ? null : parts[0]
  }
  return null
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthContent />
    </Suspense>
  )
}

function AuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    user,
    login,
    locale,
    setLocale,
    theme,
    setTheme,
    fetchStaffLoginUsers,
    loginWithPin
  } = useSession()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStaffLoading, setIsStaffLoading] = useState(false)
  const [staffUsers, setStaffUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [staffPin, setStaffPin] = useState('')
  const [isTenantHost, setIsTenantHost] = useState(false)
  const hasProcessedCallback = useRef(false)
  const common = getCopy(locale)
  const t = common.authPage
  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
    []
  )

  function getPostAuthPath(nextUser) {
    if (nextUser.role === 'superadmin' || nextUser.accountRole === 'superadmin') {
      return '/superadmin'
    }
    if (
      nextUser.primaryRole === 'owner' &&
      (!nextUser.subscriptionActive || !nextUser.pharmacyId)
    ) {
      return '/subscription'
    }
    return '/dashboard'
  }

  useEffect(() => {
    if (user) {
      router.replace(getPostAuthPath(user))
    }
  }, [router, user])

  useEffect(() => {
    setIsTenantHost(Boolean(extractSubdomain(window.location.host)))
  }, [])

  useEffect(() => {
    if (!isTenantHost) return

    let cancelled = false
    ;(async () => {
      try {
        setIsStaffLoading(true)
        const users = await fetchStaffLoginUsers()
        if (cancelled) return
        setStaffUsers(users)
        setSelectedUserId(users[0]?.id || '')
      } finally {
        if (!cancelled) {
          setIsStaffLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchStaffLoginUsers, isTenantHost])

  useEffect(() => {
    const token = searchParams.get('token')
    const encodedUser = searchParams.get('user')
    const authError = searchParams.get('error')
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
        id: parsedUser.id,
        name: parsedUser.name || parsedUser.displayName || parsedUser.email,
        email: parsedUser.email || `staff-${parsedUser.id}@local.staff`,
        role:
          parsedUser.role === 'superadmin'
            ? 'superadmin'
            : parsedUser.role === 'owner'
              ? 'admin'
              : 'worker',
        accountRole:
          parsedUser.role ||
          (parsedUser.primaryRole === 'superadmin'
            ? 'superadmin'
            : parsedUser.primaryRole === 'owner'
              ? 'owner'
              : 'staff'),
        primaryRole: parsedUser.primaryRole,
        onboardingCompleted: parsedUser.onboardingCompleted,
        subscriptionActive: !!parsedUser.subscriptionActive,
        picture: parsedUser.picture || '',
        googleId: parsedUser.googleId,
        staffRole: parsedUser.staffRole || 'staff',
        pharmacyId: parsedUser.pharmacyId || null
      }
      login(nextUser, token)
      router.replace(getPostAuthPath(nextUser))
    } catch (_error) {
      hasProcessedCallback.current = false
      setIsLoading(false)
      setErrorMessage(t.failed)
    }
  }, [searchParams, login, router, t.failed])

  function handleGoogleLogin() {
    setIsLoading(true)
    const returnTo =
      typeof window !== 'undefined'
        ? `${window.location.origin}/auth`
        : ''
    const params = new URLSearchParams()
    if (returnTo) {
      params.set('returnTo', returnTo)
    }
    const query = params.toString()
    window.location.href = `${apiBaseUrl}/auth/google${query ? `?${query}` : ''}`
  }

  async function handleStaffLogin(event) {
    event.preventDefault()
    if (!selectedUserId || !staffPin.trim()) return

    try {
      setIsLoading(true)
      setErrorMessage('')
      await loginWithPin(selectedUserId, staffPin.trim())
      router.replace('/dashboard')
    } catch (error) {
      setErrorMessage(error.message)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <AuthLoading />
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

        <h1 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>{t.signIn}</h1>
        <p className='mt-1 text-sm text-[var(--muted)]'>
          {isTenantHost
            ? 'Staff accounts are created by the owner. Select a staff profile and enter PIN, or sign in as owner with Google.'
            : t.helper}
        </p>

        {errorMessage && (
          <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-sm text-red-600'>
            {errorMessage}
          </p>
        )}

        {isTenantHost && (
          <form onSubmit={handleStaffLogin} className='mt-5 space-y-3'>
            <label className='block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]'>
              Staff Session
            </label>
            <select
              value={selectedUserId}
              onChange={event => setSelectedUserId(event.target.value)}
              disabled={isStaffLoading || staffUsers.length === 0}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none'
            >
              {staffUsers.length === 0 && <option value=''>No staff profile available</option>}
              {staffUsers.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <input
              type='password'
              inputMode='numeric'
              pattern='[0-9]{2,6}'
              maxLength={6}
              value={staffPin}
              onChange={event =>
                setStaffPin(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder='PIN (2-6 digits)'
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
            <button
              type='submit'
              disabled={
                isStaffLoading || !selectedUserId || staffPin.length < 2 || staffPin.length > 6
              }
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50'
            >
              <UserRound size={16} />
              Continue as Staff
            </button>
          </form>
        )}

        <div className='mt-5'>
          <button
            onClick={handleGoogleLogin}
            className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500'
          >
            <ShieldCheck size={16} />
            {isTenantHost ? 'Owner Sign-in with Google' : t.cta}
          </button>
        </div>
      </section>
    </div>
  )
}

function AuthLoading() {
  const { locale } = useSession()
  const t = getCopy(locale).authPage

  return (
    <div className='flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8'>
      <div className='panel w-full max-w-sm p-6 text-center'>
        <div className='mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--border)] border-t-emerald-500' />
        <p className='mt-4 text-sm font-medium text-[var(--foreground)]'>{t.loading}</p>
      </div>
    </div>
  )
}
