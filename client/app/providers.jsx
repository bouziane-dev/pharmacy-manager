'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { mockOrders } from '@/app/lib/mock-data'

const SessionContext = createContext(null)
const defaultWorkspaceId = 'ws-alex-primary'

export function AppProviders({ children }) {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState(null)
  const [locale, setLocale] = useState('en')
  const [orders, setOrders] = useState(
    mockOrders.map(order => ({ ...order, workspaceId: defaultWorkspaceId }))
  )
  const [workspaces, setWorkspaces] = useState([
    {
      id: defaultWorkspaceId,
      name: "Alex's Pharmacy",
      ownerEmail: 'alex@pharmacy.local'
    }
  ])
  const [memberships, setMemberships] = useState({
    'alex@pharmacy.local': [defaultWorkspaceId]
  })
  const [activeWorkspaceByEmail, setActiveWorkspaceByEmail] = useState({
    'alex@pharmacy.local': defaultWorkspaceId
  })
  const [invitations, setInvitations] = useState([])
  const [profiles, setProfiles] = useState({
    'alex@pharmacy.local': { name: 'Alex Manager', role: 'admin' },
    'sam@pharmacy.local': { name: 'Sam Worker', role: 'worker' }
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('pm-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }

    const savedUser = window.localStorage.getItem('pm-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    const savedLocale = window.localStorage.getItem('pm-locale')
    if (savedLocale === 'fr' || savedLocale === 'en') {
      setLocale(savedLocale)
    }
    const savedOrders = window.localStorage.getItem('pm-orders')
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders).map(order => ({
        ...order,
        workspaceId: order.workspaceId || defaultWorkspaceId
      }))
      setOrders(parsed)
    }
    const savedWorkspaces = window.localStorage.getItem('pm-workspaces')
    if (savedWorkspaces) {
      setWorkspaces(JSON.parse(savedWorkspaces))
    }
    const savedMemberships = window.localStorage.getItem('pm-memberships')
    if (savedMemberships) {
      setMemberships(JSON.parse(savedMemberships))
    }
    const savedActiveWorkspace = window.localStorage.getItem('pm-active-workspace')
    if (savedActiveWorkspace) {
      setActiveWorkspaceByEmail(JSON.parse(savedActiveWorkspace))
    }
    const savedInvitations = window.localStorage.getItem('pm-invitations')
    if (savedInvitations) {
      setInvitations(JSON.parse(savedInvitations))
    }
    const savedProfiles = window.localStorage.getItem('pm-profiles')
    if (savedProfiles) {
      setProfiles(JSON.parse(savedProfiles))
    }
    setIsReady(true)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('pm-theme', theme)
  }, [theme])

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('pm-user', JSON.stringify(user))
    } else {
      window.localStorage.removeItem('pm-user')
    }
  }, [user])

  useEffect(() => {
    window.localStorage.setItem('pm-locale', locale)
  }, [locale])

  useEffect(() => {
    window.localStorage.setItem('pm-orders', JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    window.localStorage.setItem('pm-workspaces', JSON.stringify(workspaces))
  }, [workspaces])

  useEffect(() => {
    window.localStorage.setItem('pm-memberships', JSON.stringify(memberships))
  }, [memberships])

  useEffect(() => {
    window.localStorage.setItem(
      'pm-active-workspace',
      JSON.stringify(activeWorkspaceByEmail)
    )
  }, [activeWorkspaceByEmail])

  useEffect(() => {
    window.localStorage.setItem('pm-invitations', JSON.stringify(invitations))
  }, [invitations])

  useEffect(() => {
    window.localStorage.setItem('pm-profiles', JSON.stringify(profiles))
  }, [profiles])

  function createOrder({
    patientName,
    phone,
    productName,
    comment,
    arrivalDate,
    urgency
  }) {
    if (!currentWorkspace) return
    const id = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date().toISOString()
    const createdComment = comment?.trim()
      ? [
          {
            id: `${id}-c-${Date.now()}`,
            author: user?.name || 'Unknown',
            text: comment.trim(),
            createdAt: now
          }
        ]
      : []

    const newOrder = {
      id,
      patientName: patientName.trim(),
      phone: phone.trim(),
      productName: productName.trim(),
      status: 'Not Yet',
      urgency,
      arrivalDate,
      createdAt: now,
      workspaceId: currentWorkspace.id,
      comments: createdComment
    }

    setOrders(prev => [newOrder, ...prev])
  }

  function addOrderComment(orderId, text) {
    const cleanText = text.trim()
    if (!cleanText) return
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId
          ? {
              ...order,
              comments: [
                ...(order.comments || []),
                {
                  id: `${orderId}-c-${Date.now()}`,
                  author: user?.name || 'Unknown',
                  text: cleanText,
                  createdAt: new Date().toISOString()
                }
              ]
            }
          : order
      )
    )
  }

  function updateOrderStatus(orderId, status) {
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, status } : order))
    )
  }

  function updateOrderArrivalDate(orderId, arrivalDate) {
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, arrivalDate } : order))
    )
  }

  function updateOrder(orderId, updates) {
    setOrders(prev =>
      prev.map(order => (order.id === orderId ? { ...order, ...updates } : order))
    )
  }

  function ensureWorkspaceForUser(nextUser) {
    if (nextUser.role !== 'admin') return
    let targetWorkspaceId = null
    setWorkspaces(prev => {
      const owned = prev.find(ws => ws.ownerEmail === nextUser.email)
      if (owned) {
        targetWorkspaceId = owned.id
        return prev
      }
      const id = `ws-${Date.now()}`
      targetWorkspaceId = id
      return [
        ...prev,
        {
          id,
          name: `${nextUser.name}'s Workspace`,
          ownerEmail: nextUser.email
        }
      ]
    })
    if (!targetWorkspaceId) return
    setMemberships(prev => ({
      ...prev,
      [nextUser.email]: [...new Set([...(prev[nextUser.email] || []), targetWorkspaceId])]
    }))
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [nextUser.email]: prev[nextUser.email] || targetWorkspaceId
    }))
  }

  function login(nextUser) {
    const normalized = {
      ...nextUser,
      email: nextUser.email.trim().toLowerCase()
    }
    setUser(normalized)
    setProfiles(prev => ({
      ...prev,
      [normalized.email]: { name: normalized.name, role: normalized.role }
    }))

    if (normalized.role === 'admin') {
      ensureWorkspaceForUser(normalized)
    } else {
      setActiveWorkspaceByEmail(prev => ({
        ...prev,
        [normalized.email]:
          prev[normalized.email] || (memberships[normalized.email] || [])[0] || null
      }))
    }
  }

  function setActiveWorkspace(workspaceId) {
    if (!user?.email) return
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [user.email]: workspaceId
    }))
  }

  function inviteToCurrentWorkspace(email) {
    if (!user || user.role !== 'admin' || !currentWorkspace) return
    const targetEmail = email.trim().toLowerCase()
    if (!targetEmail) return

    const alreadyPending = invitations.some(
      item =>
        item.toEmail === targetEmail &&
        item.workspaceId === currentWorkspace.id &&
        item.status === 'pending'
    )
    const alreadyMember = (memberships[targetEmail] || []).includes(
      currentWorkspace.id
    )
    if (alreadyPending || alreadyMember) return

    const invitation = {
      id: `inv-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      workspaceName: currentWorkspace.name,
      toEmail: targetEmail,
      fromEmail: user.email,
      fromName: user.name,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    setInvitations(prev => [invitation, ...prev])
    setProfiles(prev => ({
      ...prev,
      [targetEmail]: prev[targetEmail] || { name: targetEmail, role: 'worker' }
    }))
  }

  function respondToInvitation(invitationId, decision) {
    if (!user?.email) return
    const invitation = invitations.find(item => item.id === invitationId)
    if (!invitation || invitation.toEmail !== user.email) return

    setInvitations(prev =>
      prev.map(item =>
        item.id === invitationId ? { ...item, status: decision } : item
      )
    )

    if (decision === 'accepted') {
      setMemberships(prev => ({
        ...prev,
        [user.email]: [...new Set([...(prev[user.email] || []), invitation.workspaceId])]
      }))
      setActiveWorkspaceByEmail(prev => ({
        ...prev,
        [user.email]: prev[user.email] || invitation.workspaceId
      }))
    }
  }

  const userWorkspaceIds = useMemo(() => {
    if (!user?.email) return []
    const owned = workspaces
      .filter(ws => ws.ownerEmail === user.email)
      .map(ws => ws.id)
    const member = memberships[user.email] || []
    return [...new Set([...owned, ...member])]
  }, [memberships, user, workspaces])

  const userWorkspaces = useMemo(() => {
    return workspaces.filter(ws => userWorkspaceIds.includes(ws.id))
  }, [userWorkspaceIds, workspaces])

  const currentWorkspace = useMemo(() => {
    if (!user?.email) return null
    const activeId = activeWorkspaceByEmail[user.email] || userWorkspaceIds[0]
    return workspaces.find(ws => ws.id === activeId) || null
  }, [activeWorkspaceByEmail, user, userWorkspaceIds, workspaces])

  const sortedOrders = [...orders]
    .filter(order => (currentWorkspace ? order.workspaceId === currentWorkspace.id : false))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const pendingInvitations = useMemo(() => {
    if (!user?.email) return []
    return invitations.filter(
      item => item.toEmail === user.email && item.status === 'pending'
    )
  }, [invitations, user])

  const workspaceMembers = useMemo(() => {
    if (!currentWorkspace) return []

    const emails = new Set([currentWorkspace.ownerEmail])
    Object.entries(memberships).forEach(([email, workspaceIds]) => {
      if (workspaceIds.includes(currentWorkspace.id)) {
        emails.add(email)
      }
    })

    return [...emails].map(email => ({
      email,
      name: profiles[email]?.name || email,
      role: profiles[email]?.role || 'worker'
    }))
  }, [currentWorkspace, memberships, profiles])

  const pendingWorkspaceInvitations = useMemo(() => {
    if (!currentWorkspace) return []
    return invitations.filter(
      item => item.workspaceId === currentWorkspace.id && item.status === 'pending'
    )
  }, [currentWorkspace, invitations])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      user,
      locale,
      setLocale,
      orders: sortedOrders,
      currentWorkspace,
      userWorkspaces,
      workspaceMembers,
      pendingInvitations,
      pendingWorkspaceInvitations,
      isReady,
      login,
      logout: () => setUser(null),
      createOrder,
      addOrderComment,
      updateOrderStatus,
      updateOrderArrivalDate,
      updateOrder,
      setActiveWorkspace,
      inviteToCurrentWorkspace,
      respondToInvitation,
      activateSubscription: () =>
        setUser(prev => (prev ? { ...prev, subscriptionActive: true } : prev))
    }),
    [
      currentWorkspace,
      isReady,
      locale,
      pendingInvitations,
      pendingWorkspaceInvitations,
      sortedOrders,
      theme,
      user,
      userWorkspaces,
      workspaceMembers
    ]
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used inside AppProviders')
  }
  return ctx
}
