'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Globe,
  Moon,
  Pill,
  Search,
  Sun,
  Users2
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getHomePathForUser } from '@/app/lib/useRouteGuard'
import { getLocaleButtonLabel, getNextLocale } from '@/app/lib/i18n'

const content = {
  en: {
    badge: 'Phlow | Pharmacy + Flow',
    title: 'Run your pharmacy with Phlow',
    subtitle: 'Track orders, tasks, reminders and agenda in one workspace.',
    primary: 'Open Workspace',
    signin: 'Sign In',
    preview: 'Plans',
    theme: 'Night mode',
    summary: [
      { label: 'Order flow', value: 'Live status' },
      { label: 'Team roles', value: 'Admin + pharmacist' },
      { label: 'Setup', value: 'Local ready' }
    ],
    visualTitle: 'Live platform preview',
    visualSearch: 'Search order, patient or product',
    visualStats: [
      { label: 'Orders today', value: '24' },
      { label: 'Due reminders', value: '7' },
      { label: 'Done', value: '15' }
    ],
    visualTimeline: [
      { status: 'Pending', count: '9' },
      { status: 'Ordered', count: '6' },
      { status: 'Finished', count: '15' }
    ],
    sectionsTitle: 'Functionalities',
    sectionsSubtitle: 'Built for daily pharmacy execution.',
    sections: [
      {
        title: 'Suivi des commandes',
        text: 'See status updates in real time from pending to finished.',
        icon: ClipboardList
      },
      {
        title: 'Gérer les tâches',
        text: 'Keep daily tasks organized for the full team.',
        icon: Activity
      },
      {
        title: 'Agenda',
        text: 'Plan and adjust arrival dates quickly.',
        icon: CalendarClock
      },
      {
        title: 'Rappel des commandes',
        text: 'Get reminders for due and delayed orders.',
        icon: Bell
      },
      {
        title: 'Rechercher une commande',
        text: 'Find orders by patient, phone or product instantly.',
        icon: Search
      },
      {
        title: 'Tout en un seul espace',
        text: 'Dashboard, orders, agenda and users in one place.',
        icon: Users2
      }
    ],
    howToUseTitle: 'How to use the platform',
    howToUseSubtitle: 'Owner setup and staff access flow.',
    howToUseSteps: [
      'Owner signs in with Google.',
      'Owner chooses a plan and creates the pharmacy dashboard.',
      'Owner sets a unique subdomain (example: alshifa.saas.com).',
      'Owner creates staff members and PIN codes.',
      'Owner shares the pharmacy link with staff.',
      'Staff open the link, select profile, and log in with PIN.'
    ],
    footer: {
      brand: 'Phlow',
      right: 'All rights reserved.'
    },
    cards: [
      {
        title: 'Dashboard',
        desc: 'Track active workload.',
        href: '/dashboard',
        icon: Activity
      },
      {
        title: 'Agenda',
        desc: 'Plan by date quickly.',
        href: '/agenda',
        icon: CalendarClock
      },
      {
        title: 'Orders',
        desc: 'Create and update orders.',
        href: '/orders',
        icon: ClipboardList
      },
      {
        title: 'Users',
        desc: 'Manage members and invites.',
        href: '/users',
        icon: Users2
      },
      {
        title: 'Subscription',
        desc: 'Manage subscription status.',
        href: '/subscription',
        icon: CreditCard
      }
    ]
  },
  fr: {
    badge: 'Phlow | Pharmacie + Flow',
    title: 'Pilotez votre pharmacie avec Phlow',
    subtitle:
      'Suivi des commandes, gestion des tâches, agenda et rappels dans un seul espace.',
    primary: 'Ouvrir l’espace',
    signin: 'Se connecter',
    preview: 'Abonnements',
    theme: 'Mode nuit',
    summary: [
      { label: 'Flux commandes', value: 'Statut en direct' },
      { label: 'Rôles équipe', value: 'Admin + pharmacien' },
      { label: 'Mise en place', value: 'Prêt localement' }
    ],
    visualTitle: 'Aperçu visuel de la plateforme',
    visualSearch: 'Rechercher commande, patient ou produit',
    visualStats: [
      { label: 'Commandes du jour', value: '24' },
      { label: 'Rappels à traiter', value: '7' },
      { label: 'Terminées', value: '15' }
    ],
    visualTimeline: [
      { status: 'En attente', count: '9' },
      { status: 'Commandée', count: '6' },
      { status: 'Terminée', count: '15' }
    ],
    sectionsTitle: 'Fonctionnalités',
    sectionsSubtitle: 'Pensé pour l’exécution quotidienne en pharmacie.',
    sections: [
      {
        title: 'Chronologie des commandes',
        text: 'Suivez les statuts en temps réel de la saisie à la finalisation.',
        icon: ClipboardList
      },
      {
        title: 'Gérer les tâches',
        text: 'Organisez les tâches quotidiennes de toute l’équipe.',
        icon: Activity
      },
      {
        title: 'Agenda',
        text: 'Planifiez et ajustez rapidement les dates d’arrivée.',
        icon: CalendarClock
      },
      {
        title: 'Rappel des commandes',
        text: 'Recevez des rappels pour les commandes dues et retardées.',
        icon: Bell
      },
      {
        title: 'Rechercher une commande',
        text: 'Retrouvez une commande par patient, téléphone ou produit.',
        icon: Search
      },
      {
        title: 'Tout en un seul espace',
        text: 'Dashboard, commandes, agenda et utilisateurs réunis.',
        icon: Users2
      }
    ],
    howToUseTitle: 'Comment utiliser la plateforme',
    howToUseSubtitle: 'Flux de mise en place propriétaire + staff.',
    howToUseSteps: [
      'Le propriétaire se connecte avec Google.',
      'Le propriétaire choisit un plan et crée le dashboard pharmacie.',
      'Le propriétaire définit un sous-domaine unique (ex: alshifa.saas.com).',
      'Le propriétaire crée les membres staff et leurs PIN.',
      'Le propriétaire envoie le lien de la pharmacie à l’équipe.',
      'Le staff ouvre le lien, choisit son profil et se connecte avec PIN.'
    ],
    footer: {
      brand: 'Phlow',
      right: 'Tous droits réservés.'
    },
    cards: [
      {
        title: 'Tableau de bord',
        desc: 'Suivi de la charge active.',
        href: '/dashboard',
        icon: Activity
      },
      {
        title: 'Agenda',
        desc: 'Planifiez rapidement par date.',
        href: '/agenda',
        icon: CalendarClock
      },
      {
        title: 'Commandes',
        desc: 'Création et suivi des statuts.',
        href: '/orders',
        icon: ClipboardList
      },
      {
        title: 'Utilisateurs',
        desc: 'Gestion de l’équipe et des invitations.',
        href: '/users',
        icon: Users2
      },
      {
        title: 'Abonnement',
        desc: 'Gestion du plan actif.',
        href: '/subscription',
        icon: CreditCard
      }
    ]
  }
}

export default function Home() {
  const router = useRouter()
  const { user, isReady, isBootstrappingSession, locale, setLocale, theme, setTheme } =
    useSession()
  const t = content[locale] || content.en
  const titleParts = t.title.split('Phlow')
  const [starOffset, setStarOffset] = useState({ x: 0, y: 0 })
  const [themeFallback, setThemeFallback] = useState('light')
  const isDarkTheme = (theme || themeFallback) === 'dark'

  useEffect(() => {
    const savedTheme =
      typeof window !== 'undefined' ? window.localStorage.getItem('pm-theme') : null
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setThemeFallback(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      setThemeFallback(theme)
    }
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme)
    document.body.classList.toggle('dark', isDarkTheme)
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  useEffect(() => {
    if (!isReady || isBootstrappingSession) return
    if (user) {
      router.replace(getHomePathForUser(user))
    }
  }, [isBootstrappingSession, isReady, router, user])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const host = String(window.location.host || '')
      .trim()
      .toLowerCase()
      .split(':')[0]
    const parts = host.split('.').filter(Boolean)
    const subdomain = parts.length >= 3 ? parts[0] : null
    const reserved = new Set(['www', 'api', 'localhost'])

    if (!isReady || isBootstrappingSession || user) return
    if (subdomain && !reserved.has(subdomain)) {
      router.replace('/auth')
    }
  }, [isBootstrappingSession, isReady, router, user])

  if (isReady && !isBootstrappingSession && user) {
    return null
  }

  function handleMouseMove(event) {
    if (!isDarkTheme) return
    const { innerWidth, innerHeight } = window
    const x = ((event.clientX / innerWidth) * 2 - 1) * 12
    const y = ((event.clientY / innerHeight) * 2 - 1) * 10
    setStarOffset({ x, y })
  }

  function handleMouseLeave() {
    setStarOffset({ x: 0, y: 0 })
  }

  function handleThemeToggle() {
    const nextTheme = isDarkTheme ? 'light' : 'dark'
    setThemeFallback(nextTheme)
    setTheme(nextTheme)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pm-theme', nextTheme)
    }
    document.documentElement.classList.toggle('dark', nextTheme === 'dark')
    document.body.classList.toggle('dark', nextTheme === 'dark')
    document.documentElement.style.colorScheme = nextTheme === 'dark' ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  return (
    <main
      className={`relative isolate min-h-screen overflow-hidden ${
        isDarkTheme ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
        <div
          className={`absolute inset-0 z-0 ${
            isDarkTheme
              ? 'bg-[linear-gradient(160deg,#020617_0%,#031b1a_45%,#041b26_100%)]'
              : 'bg-[linear-gradient(160deg,#f2f9f4_0%,#eef7ff_48%,#eefcf5_100%)]'
          }`}
        />
        <div
          className={`absolute inset-0 z-10 ${
            isDarkTheme
              ? 'bg-[radial-gradient(circle_at_14%_16%,rgba(110,231,183,0.05),transparent_50%),radial-gradient(circle_at_82%_14%,rgba(34,197,94,0.04),transparent_48%)]'
              : 'bg-[radial-gradient(circle_at_12%_14%,rgba(16,185,129,0.08),transparent_45%),radial-gradient(circle_at_86%_12%,rgba(34,197,94,0.06),transparent_42%),radial-gradient(circle_at_45%_75%,rgba(168,85,247,0.24),transparent_40%)]'
          }`}
        />
        <div
          className={`stars-layer absolute inset-0 z-20 transition-transform duration-300 ease-out ${
            isDarkTheme ? 'block' : 'hidden'
          }`}
          style={{
            transform: `translate3d(${starOffset.x}px, ${starOffset.y}px, 0)`
          }}
        />
      </div>

      <div className='relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:pt-14'>
        <header className='flex items-center justify-between'>
          <p className='inline-flex items-center gap-2 rounded-full border border-emerald-500/45 bg-emerald-100/85 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-emerald-900 backdrop-blur dark:bg-emerald-900/30 dark:text-emerald-100'>
            <Pill size={12} />
            {t.badge}
          </p>
          <div className='flex items-center gap-2'>
            <button
              onClick={handleThemeToggle}
              className='fun-card bg-[var(--surface)]/90 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] backdrop-blur transition hover:bg-[var(--surface-soft)]'
            >
              {isDarkTheme ? <Sun size={14} /> : <Moon size={14} />}
              {t.theme}
            </button>
            <button
              onClick={() => setLocale(getNextLocale(locale))}
              className='fun-card bg-[var(--surface)]/90 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] backdrop-blur transition hover:bg-[var(--surface-soft)]'
            >
              <Globe size={14} />
              {getLocaleButtonLabel(locale)}
            </button>
          </div>
        </header>

        <section className='mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]'>
          <article className='fun-card rounded-3xl border border-emerald-300/55 bg-[linear-gradient(145deg,rgba(16,185,129,0.22),rgba(34,197,94,0.17),rgba(255,255,255,0.84))] p-6 shadow-[0_18px_42px_rgba(5,150,105,0.15)] backdrop-blur-sm dark:bg-[linear-gradient(145deg,rgba(16,185,129,0.19),rgba(34,197,94,0.16),rgba(2,6,23,0.9))] sm:p-8'>
            <h1 className='text-4xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl'>
              {titleParts.length > 1 ? (
                <>
                  {titleParts[0]}
                  <span className='brand-glow'>Phlow</span>
                  {titleParts[1]}
                </>
              ) : (
                t.title
              )}
            </h1>
            <p className='mt-4 max-w-2xl text-sm leading-6 text-slate-700 dark:text-slate-300 sm:text-base'>
              {t.subtitle}
            </p>

            <div className='mt-6 flex flex-wrap gap-3'>
              <Link
                href={user ? getHomePathForUser(user) : '/auth'}
                className='fun-card inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400'
              >
                {user ? t.primary : t.signin}
                <ArrowRight size={16} />
              </Link>
              <Link
                href='/subscription'
                className='fun-card inline-flex items-center gap-2 rounded-lg border border-emerald-400/45 bg-emerald-50/85 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:bg-emerald-950/60'
              >
                {t.preview}
                <CreditCard size={16} />
              </Link>
            </div>
          </article>

          <aside className='rounded-3xl border border-cyan-400/45 bg-[linear-gradient(155deg,rgba(34,211,238,0.2),rgba(16,185,129,0.14),rgba(255,255,255,0.86))] p-5 shadow-[0_18px_44px_rgba(14,165,233,0.2)] backdrop-blur-sm dark:bg-[linear-gradient(155deg,rgba(8,47,73,0.92),rgba(6,95,70,0.7),rgba(2,6,23,0.92))] sm:p-6'>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
              {t.visualTitle}
            </h3>

            <div className='mt-4 rounded-xl border border-cyan-300/50 bg-white/80 px-3 py-2 text-sm text-slate-600 dark:border-cyan-400/35 dark:bg-slate-900/50 dark:text-slate-300'>
              <span className='inline-flex items-center gap-2'>
                <Search size={14} />
                {t.visualSearch}
              </span>
            </div>

            <div className='mt-4 grid grid-cols-3 gap-2'>
              {t.visualStats.map(item => (
                <div
                  key={item.label}
                  className='rounded-xl border border-cyan-300/55 bg-cyan-50/85 px-3 py-3 dark:border-cyan-400/35 dark:bg-cyan-950/35'
                >
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]'>
                    {item.label}
                  </p>
                  <p className='mt-1 text-base font-semibold'>{item.value}</p>
                </div>
              ))}
            </div>

            <div className='mt-4 space-y-2'>
              {t.visualTimeline.map((item, index) => (
                <div
                  key={item.status}
                  className='flex items-center justify-between rounded-lg border border-cyan-300/45 bg-white/80 px-3 py-2 text-sm dark:border-cyan-400/30 dark:bg-slate-900/45'
                >
                  <span className='inline-flex items-center gap-2'>
                    <span
                      className={`inline-block h-2.5 w-2.5 rounded-full ${
                        index === 0
                          ? 'bg-amber-500'
                          : index === 1
                            ? 'bg-cyan-500'
                            : 'bg-emerald-500'
                      }`}
                    />
                    {item.status}
                  </span>
                  <span className='font-semibold'>{item.count}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className='mt-8 grid gap-5 lg:grid-cols-2'>
          <article className='panel rounded-3xl p-6 sm:p-7'>
            <h2 className='text-xl font-semibold'>{t.sectionsTitle}</h2>
            <p className='mt-2 text-sm text-[var(--muted)]'>{t.sectionsSubtitle}</p>
            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              {t.sections.map(item => (
                <article
                  key={item.title}
                  className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                >
                  <div className='flex items-center gap-2'>
                    <item.icon size={16} className='text-emerald-600 dark:text-emerald-400' />
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {item.title}
                    </p>
                  </div>
                  <p className='mt-2 text-sm text-[var(--muted)]'>{item.text}</p>
                </article>
              ))}
            </div>
          </article>

          <article className='rounded-3xl border border-violet-500/70 bg-[linear-gradient(150deg,rgba(124,58,237,0.24),rgba(91,33,182,0.22))] p-6 shadow-[0_14px_32px_rgba(109,40,217,0.26)] dark:border-violet-400/40 dark:bg-[linear-gradient(150deg,rgba(49,20,102,0.88),rgba(38,13,89,0.92))] sm:p-7'>
            <h2 className='text-xl font-semibold'>{t.howToUseTitle}</h2>
            <p className='mt-2 text-sm text-[var(--muted)]'>{t.howToUseSubtitle}</p>
            <div className='mt-4 space-y-2'>
              {t.howToUseSteps.map((step, index) => (
                <p
                  key={step}
                  className='rounded-lg border border-violet-300/70 bg-violet-50/95 px-3 py-2 text-sm text-violet-900 dark:border-violet-400/35 dark:bg-violet-950/45 dark:text-violet-100'
                >
                  {index + 1}. {step}
                </p>
              ))}
            </div>
          </article>
        </section>

        <section className='mt-14 grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          {t.cards.map(card => {
            const Icon = card.icon
            return (
              <Link
                key={card.href}
                href={card.href}
                className='group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[0_10px_25px_rgba(15,23,42,0.07)] transition hover:border-emerald-400/70'
              >
                <Icon
                  size={19}
                  className='text-emerald-600 transition duration-300 group-hover:text-green-500'
                />
                <p className='mt-3 font-semibold'>{card.title}</p>
                <p className='mt-2 text-sm text-[var(--muted)]'>{card.desc}</p>
              </Link>
            )
          })}
        </section>

        <footer className='border-[var(--border)]/80 mt-12 border-t py-6'>
          <div className='flex flex-col items-center justify-center gap-2 text-center text-sm text-[var(--muted)]'>
            <p className='font-semibold text-[var(--foreground)]'>
              {t.footer.brand}
            </p>
            <p>
              {new Date().getFullYear()} {t.footer.brand}. {t.footer.right}
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
