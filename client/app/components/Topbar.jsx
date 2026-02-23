'use client'

import { Globe, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function Topbar({ title, setSidebarOpen }) {
  const router = useRouter()
  const {
    theme,
    setTheme,
    locale,
    setLocale,
    user,
    logout,
    currentWorkspace,
    userWorkspaces,
    setActiveWorkspace
  } = useSession()
  const t = getCopy(locale)
  const roleLabel = user?.role === 'admin' ? 'ADMIN' : 'WORKER'

  function handleLogout() {
    logout()
    router.replace('/auth')
  }

  return (
    <header className='sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur'>
      <div className='flex h-16 items-center justify-between px-4 sm:px-6'>
        <div className='flex items-center gap-3'>
          <button
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] md:hidden'
            onClick={() => setSidebarOpen(prev => !prev)}
          >
            <Menu size={18} />
          </button>
          <h1 className='text-lg font-semibold text-[var(--foreground)]'>{title}</h1>
        </div>

        <div className='flex items-center gap-2 sm:gap-3'>
          {userWorkspaces?.length > 0 && (
            <label className='hidden items-center gap-2 text-xs text-[var(--muted)] lg:flex'>
              {t.topbar.workspace}
              <select
                value={currentWorkspace?.id || ''}
                onChange={e => setActiveWorkspace(e.target.value)}
                className='rounded-md border border-[var(--border)] bg-transparent px-2 py-1 text-xs text-[var(--foreground)]'
              >
                {userWorkspaces.map(workspace => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className='hidden text-right sm:block'>
            <p className='text-sm font-medium text-[var(--foreground)]'>{user?.name}</p>
            <p className='text-xs uppercase text-[var(--muted)]'>{roleLabel}</p>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
            className='inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            <Globe size={14} />
            {locale === 'fr' ? 'FR' : 'EN'}
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
