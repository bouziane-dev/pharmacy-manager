'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import Topbar from '@/app/components/Topbar'

export default function AppShell({ title, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const saved = window.localStorage.getItem('pm-sidebar-collapsed')
    if (saved === 'true') {
      setSidebarCollapsed(true)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(
      'pm-sidebar-collapsed',
      sidebarCollapsed ? 'true' : 'false'
    )
  }, [sidebarCollapsed])

  return (
    <div className='min-h-screen bg-[var(--background)] text-[var(--foreground)]'>
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(16,185,129,0.14),transparent_42%),radial-gradient(circle_at_84%_10%,rgba(2,132,199,0.12),transparent_44%),radial-gradient(circle_at_50%_95%,rgba(56,189,248,0.06),transparent_46%)]' />
        <div className='absolute left-[-140px] top-[-120px] h-80 w-80 rounded-full bg-emerald-400/25 blur-3xl' />
        <div className='absolute bottom-[-120px] right-[-100px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl' />
        <div className='absolute bottom-[30%] left-[48%] h-52 w-52 rounded-full bg-sky-300/12 blur-3xl' />
      </div>

      <div className='flex min-h-screen'>
        <Sidebar
          open={sidebarOpen}
          collapsed={sidebarCollapsed}
          setOpen={setSidebarOpen}
        />
        <div className='flex min-h-screen min-w-0 flex-1 flex-col'>
          <Topbar
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            setSidebarCollapsed={setSidebarCollapsed}
          />
          <main className='flex-1 p-4 sm:p-6 lg:p-7'>{children}</main>
        </div>
      </div>
    </div>
  )
}
