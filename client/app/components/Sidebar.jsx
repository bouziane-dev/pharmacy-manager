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
  LayoutDashboard,
  Users
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

const tenantNavItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { key: 'orders', href: '/orders', icon: ClipboardList, adminOnly: false },
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
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[var(--surface)] px-4 py-6 transition-all md:static md:translate-x-0 ${collapsed ? 'md:w-20 md:px-2' : 'md:w-72'} ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <p className='px-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]'>
          {collapsed ? 'PM' : t.appName}
        </p>

        <nav className='mt-6 space-y-1'>
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  collapsed ? 'md:justify-center md:px-2' : ''
                } ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon size={18} />
                <span className={collapsed ? 'md:hidden' : ''}>{t.sidebar[item.key]}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
