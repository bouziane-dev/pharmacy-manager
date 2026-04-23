'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Activity,
  Building2,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileClock,
  FlaskConical,
  HeartPulse,
  LayoutDashboard,
  Users
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

const tenantNavItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { key: 'orders', href: '/orders', icon: ClipboardList, adminOnly: false },
  { key: 'tasks', href: '/taches', icon: FileClock, adminOnly: false },
  { key: 'preparations', href: '/preparations', icon: FlaskConical, adminOnly: false },
  { key: 'inbody', href: '/inbody', icon: HeartPulse, adminOnly: false },
  { key: 'agenda', href: '/agenda', icon: CalendarDays, adminOnly: false },
  { key: 'activity', href: '/admin/activity', icon: Activity, adminOnly: true },
  { key: 'users', href: '/users', icon: Users, adminOnly: true },
  { key: 'subscription', href: '/subscription', icon: CreditCard, ownerOnly: true }
]

const superAdminNavItems = [
  { key: 'superadminDashboard', href: '/superadmin', icon: LayoutDashboard },
  {
    key: 'superadminPharmacies',
    href: '/superadmin/pharmacies',
    icon: Building2,
    matchPrefix: '/superadmin/pharmacies'
  },
  {
    key: 'superadminUsers',
    href: '/superadmin/users',
    icon: Users,
    matchPrefix: '/superadmin/users'
  },
  {
    key: 'superadminActivity',
    href: '/superadmin/activity',
    icon: FileClock,
    matchPrefix: '/superadmin/activity'
  }
]

export default function Sidebar({ open, collapsed, setOpen }) {
  const pathname = usePathname()
  const { user, locale } = useSession()
  const t = getCopy(locale)
  const isSuperAdmin =
    user?.role === 'superadmin' ||
    user?.accountRole === 'superadmin' ||
    user?.primaryRole === 'superadmin'
  const isOwner = user?.accountRole === 'owner' || user?.primaryRole === 'owner'

  const navItems = isSuperAdmin ? superAdminNavItems : tenantNavItems

  const visibleItems = navItems
    .filter(item => {
      if (isSuperAdmin) return true
      return (
        (!item.adminOnly || user?.role === 'admin') &&
        (!item.pharmacistOnly || user?.role === 'worker') &&
        (!item.ownerOnly || isOwner)
      )
    })

  return (
    <>
      <div
        aria-hidden
        className={`fixed inset-0 z-30 bg-slate-950/40 transition md:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 overflow-y-auto border-r border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(246,250,255,0.96))] px-4 py-6 shadow-[8px_0_28px_rgba(15,23,42,0.08)] transition-all dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(20,35,63,0.94))] md:sticky md:top-0 md:h-screen md:translate-x-0 md:shrink-0 ${collapsed ? 'md:w-20 md:px-2' : 'md:w-72'} ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <p className='px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]'>
          {collapsed ? 'PM' : <span className='brand-glow'>{t.appName}</span>}
        </p>

        <nav className='mt-6 space-y-1.5'>
          {visibleItems.map(item => {
            const isActive = item.matchPrefix
              ? pathname === item.href || pathname.startsWith(`${item.matchPrefix}/`)
              : pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200 ${
                  collapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  isActive
                    ? 'bg-[linear-gradient(110deg,#0ea5e9,#10b981)] text-white shadow-[0_10px_24px_rgba(2,132,199,0.35)]'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'
                }`}
              >
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    isActive
                      ? 'bg-white/18 text-white'
                      : 'bg-[var(--surface)] text-[var(--muted)] group-hover:bg-white group-hover:text-[var(--foreground)] dark:bg-slate-900/35 dark:group-hover:bg-slate-900/55'
                  }`}
                >
                  <Icon size={17} />
                </span>
                <span className={collapsed ? 'md:hidden' : ''}>{t.sidebar[item.key]}</span>
                {isActive && !collapsed && (
                  <span className='ml-auto h-2 w-2 rounded-full bg-white/90 shadow-[0_0_0_5px_rgba(255,255,255,0.2)]' />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
