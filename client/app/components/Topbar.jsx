'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRightLeft,
  Globe,
  KeyRound,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Sun
} from 'lucide-react'
import { useSession } from '@/app/providers'
import { getCopy, getLocaleButtonLabel, getNextLocale } from '@/app/lib/i18n'

export default function Topbar({
  title,
  sidebarCollapsed,
  setSidebarOpen,
  setSidebarCollapsed
}) {
  const {
    theme,
    setTheme,
    locale,
    setLocale,
    user,
    logout,
    showConfirmToast,
    fetchStaffLoginUsers,
    loginWithPin
  } = useSession()
  const t = getCopy(locale)
  const isSuperAdmin =
    user?.role === 'superadmin' ||
    user?.accountRole === 'superadmin' ||
    user?.primaryRole === 'superadmin'
  const isOwner =
    user?.accountRole === 'owner' ||
    user?.primaryRole === 'owner'
  const isStaffAdmin =
    user?.accountRole === 'staff' && user?.staffRole === 'admin'
  const roleLabel =
    isSuperAdmin
      ? t.topbar.roleSuperadmin
      : isOwner
        ? t.topbar.roleOwner
        : isStaffAdmin
        ? t.topbar.roleAdmin
        : t.topbar.roleWorker
  const showStaffSwitcher = user?.accountRole === 'staff'
  const [staffUsers, setStaffUsers] = useState([])
  const [selectedStaffUserId, setSelectedStaffUserId] = useState('')
  const [staffPin, setStaffPin] = useState('')
  const [switchError, setSwitchError] = useState('')
  const [isSwitching, setIsSwitching] = useState(false)
  const currentUserId = String(user?.id || '')
  const isCurrentSelection =
    !!selectedStaffUserId && String(selectedStaffUserId) === currentUserId

  useEffect(() => {
    if (!showStaffSwitcher) {
      setStaffUsers([])
      setSelectedStaffUserId('')
      setStaffPin('')
      setSwitchError('')
      return
    }

    let cancelled = false
    ;(async () => {
      const users = await fetchStaffLoginUsers()
      if (cancelled) return
      const nextUsers = users || []
      setStaffUsers(nextUsers)
      setSelectedStaffUserId(prev => {
        const hasCurrentUser = nextUsers.some(
          item => String(item.id || '') === currentUserId
        )
        if (hasCurrentUser) return currentUserId
        const hasPreviousSelection = nextUsers.some(
          item => String(item.id || '') === String(prev || '')
        )
        if (hasPreviousSelection) return prev
        return nextUsers[0]?.id || ''
      })
    })()

    return () => {
      cancelled = true
    }
  }, [currentUserId, fetchStaffLoginUsers, showStaffSwitcher])

  function handleLogout() {
    showConfirmToast({
      title: t.topbar.confirmSignOutTitle,
      message: t.topbar.confirmSignOut,
      cancelLabel: t.topbar.confirmNo,
      confirmLabel: t.topbar.confirmYes,
      onConfirm: () => {
        logout()
      }
    })
  }

  async function handleStaffSwitchSubmit(event) {
    event.preventDefault()
    if (!selectedStaffUserId || staffPin.length < 2 || staffPin.length > 6) return

    try {
      setIsSwitching(true)
      setSwitchError('')
      await loginWithPin(selectedStaffUserId, staffPin)
      setStaffPin('')
    } catch (_error) {
      setSwitchError(
        locale === 'fr'
          ? 'PIN incorrect. Réessayez.'
          : 'Incorrect PIN. Please try again.'
      )
    } finally {
      setIsSwitching(false)
    }
  }

  return (
    <header className='sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur'>
      <div className='flex h-16 items-center justify-between gap-3 px-4 sm:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <button
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] md:hidden'
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            <Menu size={18} />
          </button>
          <button
            className='hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] md:inline-flex'
            onClick={() => setSidebarCollapsed(prev => !prev)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <h1 className='truncate text-lg font-semibold text-[var(--foreground)]'>
            {title}
          </h1>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          {showStaffSwitcher && (
            <form
              onSubmit={handleStaffSwitchSubmit}
              className='hidden items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/80 px-2 py-1.5 lg:flex'
            >
              <span className='inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                <ArrowRightLeft size={12} />
                {locale === 'fr' ? 'Profil équipe' : 'Staff profile'}
              </span>
              <select
                value={selectedStaffUserId}
                onChange={event => {
                  setSelectedStaffUserId(event.target.value)
                  setSwitchError('')
                }}
                className='min-w-36 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--foreground)] outline-none ring-emerald-400/40 transition focus:ring'
              >
                <option value=''>
                  {locale === 'fr' ? 'Sélectionner un profil' : 'Select profile'}
                </option>
                {staffUsers.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={staffPin}
                onChange={event =>
                  setStaffPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder={locale === 'fr' ? 'PIN (2-6)' : 'PIN (2-6)'}
                className='w-24 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none ring-emerald-400/40 transition focus:ring'
              />
              <button
                type='submit'
                disabled={
                  isSwitching ||
                  !selectedStaffUserId ||
                  isCurrentSelection ||
                  staffPin.length < 2 ||
                  staffPin.length > 6
                }
                className='inline-flex items-center gap-1 rounded-lg bg-[linear-gradient(90deg,#059669,#0284c7)] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55'
              >
                <KeyRound size={12} />
                {isCurrentSelection
                  ? locale === 'fr'
                    ? 'Actuel'
                    : 'Current'
                  : locale === 'fr'
                    ? 'Changer'
                    : 'Switch'}
              </button>
            </form>
          )}

          <div className='hidden text-right sm:block'>
            <p className='text-sm font-medium text-[var(--foreground)]'>{user?.name}</p>
            <p className='text-xs uppercase text-[var(--muted)]'>{roleLabel}</p>
            {showStaffSwitcher && switchError && (
              <p className='text-[10px] normal-case text-red-500'>{switchError}</p>
            )}
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setLocale(getNextLocale(locale))}
            className='inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            <Globe size={14} />
            {getLocaleButtonLabel(locale)}
          </button>

          <button
            onClick={handleLogout}
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  )
}
