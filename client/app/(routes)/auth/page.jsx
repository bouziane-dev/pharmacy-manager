'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, ShieldCheck } from 'lucide-react'
import { getCopy } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'
import { getHomePathForUser } from '@/app/lib/useRouteGuard'

const copy = {
  en: {
    signIn: 'Sign in',
    helper: 'Mock Google auth with role selection for UI-first flow.',
    role: 'Role',
    worker: 'Worker',
    admin: 'Admin',
    startSubscribed: 'Start with active subscription',
    cta: 'Continue with Google (Mock)',
    lang: 'FR'
  },
  fr: {
    signIn: 'Connexion',
    helper: "Authentification Google mock avec selection du role pour flux UI-first.",
    role: 'Role',
    worker: 'Worker',
    admin: 'Admin',
    startSubscribed: 'Demarrer avec abonnement actif',
    cta: 'Continuer avec Google (Mock)',
    lang: 'EN'
  }
}

export default function AuthPage() {
  const router = useRouter()
  const { user, login, locale, setLocale } = useSession()
  const [role, setRole] = useState('worker')
  const [adminSubscribed, setAdminSubscribed] = useState(false)
  const [name, setName] = useState('Sam Worker')
  const [email, setEmail] = useState('sam@pharmacy.local')
  const t = copy[locale] || copy.en
  const common = getCopy(locale)

  useEffect(() => {
    if (user) {
      router.replace(getHomePathForUser(user))
    }
  }, [router, user])

  function handleMockLogin() {
    const nextUser = {
      name: name.trim() || (role === 'admin' ? 'Alex Manager' : 'Sam Worker'),
      email:
        email.trim().toLowerCase() ||
        (role === 'admin' ? 'alex@pharmacy.local' : 'sam@pharmacy.local'),
      role,
      subscriptionActive: role === 'admin' ? adminSubscribed : true
    }
    login(nextUser)
    router.replace(getHomePathForUser(nextUser))
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
            Pharmacy Manager
          </p>
          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className='inline-flex items-center gap-1 rounded-md border border-[var(--border)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            <Globe size={12} />
            {t.lang}
          </button>
        </div>
        <h1 className='mt-2 text-2xl font-semibold text-[var(--foreground)]'>
          {t.signIn}
        </h1>
        <p className='mt-1 text-sm text-[var(--muted)]'>
          {t.helper}
        </p>

        <div className='mt-5 space-y-4'>
          <label className='block text-sm text-[var(--muted)]'>
            {t.role}
            <select
              value={role}
              onChange={e => {
                const nextRole = e.target.value
                setRole(nextRole)
                if (nextRole === 'admin') {
                  setName('Alex Manager')
                  setEmail('alex@pharmacy.local')
                } else {
                  setName('Sam Worker')
                  setEmail('sam@pharmacy.local')
                }
              }}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            >
              <option value='worker'>{t.worker}</option>
              <option value='admin'>{t.admin}</option>
            </select>
          </label>

          <label className='block text-sm text-[var(--muted)]'>
            {common.auth.name}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={common.auth.namePlaceholder}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
          </label>

          <label className='block text-sm text-[var(--muted)]'>
            {common.auth.email}
            <input
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={common.auth.emailPlaceholder}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-[var(--foreground)] outline-none ring-emerald-400/50 transition focus:ring'
            />
          </label>

          {role === 'admin' && (
            <label className='flex items-center gap-2 rounded-lg border border-[var(--border)] p-3 text-sm text-[var(--foreground)]'>
              <input
                type='checkbox'
                checked={adminSubscribed}
                onChange={e => setAdminSubscribed(e.target.checked)}
              />
              {t.startSubscribed}
            </label>
          )}

          <button
            onClick={handleMockLogin}
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
