'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  CreditCard,
  Globe,
  Moon,
  Pill,
  ShieldCheck,
  Sun,
  Users2
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getHomePathForUser } from '@/app/lib/useRouteGuard'

const content = {
  en: {
    badge: 'Phlow | Pharmacy + Flow',
    title: 'Run your pharmacy with Phlow',
    subtitle: 'Track orders, plan arrivals, and coordinate your team in minutes.',
    primary: 'Open Workspace',
    signin: 'Sign In',
    preview: 'Plans',
    lang: 'FR',
    theme: 'Night mode',
    summary: [
      { label: 'Order flow', value: 'Live status' },
      { label: 'Team roles', value: 'Admin + pharmacist' },
      { label: 'Setup', value: 'Local ready' }
    ],
    sectionsTitle: 'Core capabilities',
    sections: [
      {
        title: 'Order timeline',
        text: 'Move requests from intake to pickup with clear statuses.'
      },
      {
        title: 'Team access',
        text: 'Invite pharmacists and keep team access simple.'
      },
      {
        title: 'Agenda planning',
        text: 'Schedule arrivals by date to reduce missed handoffs.'
      }
    ],
    localTitle: 'Built for local teams',
    localText: 'Fast bilingual workflow with a modular setup for backend integration.',
    workflowTitle: 'How work moves in Phlow',
    workflowSubtitle:
      'A board-style flow keeps everyone aligned from intake to pickup.',
    workflowColumns: [
      {
        title: 'Intake',
        tone: 'emerald',
        items: ['Capture patient request', 'Attach notes and urgency', 'Assign target date']
      },
      {
        title: 'Supplier Follow-up',
        tone: 'amber',
        items: ['Track delayed items', 'Update expected arrival', 'Share status with team']
      },
      {
        title: 'Ready & Pickup',
        tone: 'sky',
        items: ['Confirm stock arrived', 'Notify pharmacist', 'Close order at pickup']
      }
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
    badge: 'Phlow | Pharmacy + Flow',
    title: 'Pilotez votre pharmacie avec Phlow',
    subtitle:
      'Suivez les commandes, planifiez les arrivages et coordonnez votre equipe rapidement.',
    primary: 'Ouvrir l espace',
    signin: 'Se connecter',
    preview: 'Abonnement',
    lang: 'EN',
    theme: 'Mode nuit',
    summary: [
      { label: 'Flux commandes', value: 'Statut en direct' },
      { label: 'Roles equipe', value: 'Admin + pharmacien' },
      { label: 'Mise en place', value: 'Pret localement' }
    ],
    sectionsTitle: 'Fonctions principales',
    sections: [
      {
        title: 'Timeline commandes',
        text: 'Passez de la demande au retrait avec des statuts clairs.'
      },
      {
        title: 'Acces equipe',
        text: 'Invitez les pharmaciens avec un acces simple pour toute l equipe.'
      },
      {
        title: 'Planification agenda',
        text: 'Organisez les arrivages par date sans friction.'
      }
    ],
    localTitle: 'Pense pour les equipes locales',
    localText:
      'Workflow bilingue rapide et architecture modulaire prete pour votre backend.',
    workflowTitle: 'Comment le travail avance dans Phlow',
    workflowSubtitle:
      'Un flux type board aligne l equipe de la demande jusqu au retrait.',
    workflowColumns: [
      {
        title: 'Reception',
        tone: 'emerald',
        items: ['Saisir la demande patient', 'Ajouter notes et urgence', 'Definir une date cible']
      },
      {
        title: 'Suivi fournisseur',
        tone: 'amber',
        items: ['Suivre les retards', 'Mettre a jour la date d arrivee', 'Partager le statut equipe']
      },
      {
        title: 'Pret & Retrait',
        tone: 'sky',
        items: ['Confirmer la reception stock', 'Notifier le pharmacien', 'Cloturer a la remise']
      }
    ],
    footer: {
      brand: 'Phlow',
      right: 'Tous droits reserves.'
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
        desc: 'Planifiez par date rapidement.',
        href: '/agenda',
        icon: CalendarClock
      },
      {
        title: 'Commandes',
        desc: 'Creation et suivi des statuts.',
        href: '/orders',
        icon: ClipboardList
      },
      {
        title: 'Utilisateurs',
        desc: 'Gestion equipe et invitations.',
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
  const { user, locale, setLocale, theme, setTheme } = useSession()
  const t = content[locale] || content.en
  const titleParts = t.title.split('Phlow')
  const [starOffset, setStarOffset] = useState({ x: 0, y: 0 })

  function handleMouseMove(event) {
    if (theme !== 'dark') return
    const { innerWidth, innerHeight } = window
    const x = ((event.clientX / innerWidth) * 2 - 1) * 12
    const y = ((event.clientY / innerHeight) * 2 - 1) * 10
    setStarOffset({ x, y })
  }

  function handleMouseLeave() {
    setStarOffset({ x: 0, y: 0 })
  }

  return (
    <main
      className='relative isolate min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]'
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
        <div className='absolute inset-0 z-0 bg-[linear-gradient(160deg,#f2f9f4_0%,#eef7ff_48%,#eefcf5_100%)] dark:bg-[linear-gradient(160deg,#020617_0%,#031b1a_45%,#041b26_100%)]' />
        <div className='absolute inset-0 z-10 bg-[radial-gradient(circle_at_12%_14%,rgba(16,185,129,0.08),transparent_45%),radial-gradient(circle_at_86%_12%,rgba(34,197,94,0.06),transparent_42%),radial-gradient(circle_at_45%_75%,rgba(168,85,247,0.24),transparent_40%)] dark:bg-[radial-gradient(circle_at_14%_16%,rgba(110,231,183,0.05),transparent_50%),radial-gradient(circle_at_82%_14%,rgba(34,197,94,0.04),transparent_48%)]' />
        <div
          className='stars-layer absolute inset-0 z-20 hidden transition-transform duration-300 ease-out dark:block'
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='fun-card inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] backdrop-blur transition hover:bg-[var(--surface-soft)]'
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {t.theme}
            </button>
            <button
              onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
              className='fun-card inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] backdrop-blur transition hover:bg-[var(--surface-soft)]'
            >
              <Globe size={14} />
              {t.lang}
            </button>
          </div>
        </header>

        <section className='mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]'>
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

            <div className='mt-5 grid gap-3 sm:grid-cols-3'>
              {t.summary.map(item => (
                <div
                  key={item.label}
                  className='rounded-xl border border-emerald-400/45 bg-emerald-50/85 px-3 py-3 dark:bg-emerald-950/35'
                >
                  <p className='text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]'>
                    {item.label}
                  </p>
                  <p className='mt-1 text-sm font-semibold'>{item.value}</p>
                </div>
              ))}
            </div>

            <div className='mt-5 flex flex-wrap gap-2'>
              {[Activity, CalendarClock, ClipboardList, Users2].map((Icon, index) => (
                <span
                  key={index}
                  className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-500/45 bg-white/80 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300'
                >
                  <Icon size={16} />
                </span>
              ))}
            </div>

            <div className='mt-7 flex flex-wrap gap-3'>
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

          <Link href='/auth' className='block'>
            <aside className='panel fun-card cursor-pointer rounded-3xl bg-[var(--surface)]/95 p-5 sm:p-6'>
              <h2 className='text-lg font-semibold'>{t.sectionsTitle}</h2>
              <div className='mt-4 space-y-4'>
                {t.sections.map(item => (
                  <article
                    key={item.title}
                    className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                  >
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {item.title}
                    </p>
                    <p className='mt-2 text-sm leading-6 text-[var(--muted)]'>
                      {item.text}
                    </p>
                  </article>
                ))}
              </div>
            </aside>
          </Link>
        </section>

        <section className='panel mt-8 rounded-3xl p-6 sm:p-8'>
          <div className='flex items-start gap-3'>
            <ShieldCheck className='mt-1 text-emerald-500' size={18} />
            <div>
              <h2 className='text-xl font-semibold'>{t.localTitle}</h2>
              <p className='mt-2 max-w-4xl text-sm leading-6 text-[var(--muted)]'>
                {t.localText}
              </p>
            </div>
          </div>
        </section>

        <section className='mt-8 rounded-3xl border border-violet-500/70 bg-[linear-gradient(150deg,rgba(124,58,237,0.24),rgba(91,33,182,0.22))] p-6 shadow-[0_14px_32px_rgba(109,40,217,0.26)] dark:border-violet-400/40 dark:bg-[linear-gradient(150deg,rgba(49,20,102,0.88),rgba(38,13,89,0.92))] sm:p-8'>
          <div className='max-w-2xl'>
            <h2 className='text-xl font-semibold'>{t.workflowTitle}</h2>
            <p className='mt-2 text-sm leading-6 text-[var(--muted)]'>
              {t.workflowSubtitle}
            </p>
          </div>
          <div className='mt-5 grid gap-4 md:grid-cols-3'>
            {t.workflowColumns.map(column => {
              return (
                <article
                  key={column.title}
                  className='rounded-2xl border border-violet-400/70 bg-violet-100/90 p-4 dark:border-violet-400/35 dark:bg-violet-950/35'
                >
                  <p className='text-sm font-semibold'>{column.title}</p>
                  <div className='mt-3 space-y-2'>
                    {column.items.map(item => (
                      <p
                        key={item}
                        className='rounded-lg border border-violet-300/70 bg-violet-50/95 px-3 py-2 text-sm text-violet-900 dark:border-violet-400/35 dark:bg-violet-950/45 dark:text-violet-100'
                      >
                        {item}
                      </p>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
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

        <footer className='mt-12 border-t border-[var(--border)]/80 py-6'>
          <div className='flex flex-col items-center justify-center gap-2 text-center text-sm text-[var(--muted)]'>
            <p className='font-semibold text-[var(--foreground)]'>{t.footer.brand}</p>
            <p>
              {new Date().getFullYear()} {t.footer.brand}. {t.footer.right}
            </p>
          </div>
        </footer>
      </div>
    </main>
  )
}
