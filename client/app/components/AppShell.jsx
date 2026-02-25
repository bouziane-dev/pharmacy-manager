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
    <div className='min-h-screen bg-[var(--background)]'>
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute left-[-140px] top-[-120px] h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl' />
        <div className='absolute bottom-[-120px] right-[-100px] h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl' />
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
          <main className='flex-1 p-4 sm:p-6'>{children}</main>
        </div>
      </div>
    </div>
  )
}
