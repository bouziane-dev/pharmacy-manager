'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  Inbox,
  LayoutDashboard,
  Users
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard, adminOnly: false },
  { key: 'orders', href: '/orders', icon: ClipboardList, adminOnly: false },
  { key: 'agenda', href: '/agenda', icon: CalendarDays, adminOnly: false },
  {
    key: 'pendingInvitations',
    href: '/invitations/pending',
    icon: Inbox,
    adminOnly: false,
    pharmacistOnly: true
  },
  { key: 'users', href: '/users', icon: Users, adminOnly: true },
  { key: 'subscription', href: '/subscription', icon: CreditCard, adminOnly: true }
]

export default function Sidebar({ open, collapsed, setOpen }) {
  const pathname = usePathname()
  const { user, locale, currentWorkspace } = useSession()
  const t = getCopy(locale)

  const visibleItems = navItems
    .filter(
      item =>
        (!item.adminOnly || user?.role === 'admin') &&
        (!item.pharmacistOnly || user?.role === 'worker')
    )
    .filter(item => {
      // Pharmacists without any workspace can only access invitations.
      if (user?.role === 'worker' && !currentWorkspace) {
        return item.href === '/invitations/pending'
      }
      return true
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
            const isActive = pathname === item.href
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
