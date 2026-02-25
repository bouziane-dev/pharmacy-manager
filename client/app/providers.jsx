'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { mockOrders } from '@/app/lib/mock-data'

const SessionContext = createContext(null)
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'

async function apiRequest(path, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export function AppProviders({ children }) {
  const [theme, setTheme] = useState('light')
  const [user, setUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [locale, setLocale] = useState('en')
  const [orders, setOrders] = useState(
    mockOrders.map(order => ({ ...order, workspaceId: null }))
  )
  const [workspaces, setWorkspaces] = useState([])
  const [memberships, setMemberships] = useState({})
  const [activeWorkspaceByEmail, setActiveWorkspaceByEmail] = useState({})
  const [invitations, setInvitations] = useState([])
  const [profiles, setProfiles] = useState({})
  const [isReady, setIsReady] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false)

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('pm-theme')
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }

    const savedUser = window.localStorage.getItem('pm-user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    const savedToken = window.localStorage.getItem('pm-token')
    if (savedToken) {
      setAuthToken(savedToken)
    }
    const savedLocale = window.localStorage.getItem('pm-locale')
    if (savedLocale === 'fr' || savedLocale === 'en') {
      setLocale(savedLocale)
    }
    const savedOrders = window.localStorage.getItem('pm-orders')
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders).map(order => ({ ...order }))
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
    if (authToken) {
      window.localStorage.setItem('pm-token', authToken)
    } else {
      window.localStorage.removeItem('pm-token')
    }
  }, [authToken])

  useEffect(() => {
    window.localStorage.setItem('pm-locale', locale)
    document.documentElement.lang = locale
    document.documentElement.dir = 'ltr'
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

  function mapBackendUserToClient(nextUser) {
    return {
      id: nextUser.id,
      name: nextUser.displayName || nextUser.email,
      email: nextUser.email,
      picture: nextUser.picture || '',
      onboardingCompleted: nextUser.onboardingCompleted,
      primaryRole: nextUser.primaryRole,
      subscriptionActive: !!nextUser.subscriptionActive,
      role: nextUser.primaryRole === 'owner' ? 'admin' : 'worker'
    }
  }

  function hydrateMembershipState(sessionUser, workspacesFromApi, membershipsFromApi) {
    const email = sessionUser.email.toLowerCase()
    const workspaceItems = (workspacesFromApi || []).map(item => ({
      id: String(item.id),
      name: item.name,
      ownerEmail: String(item.ownerUserId) === String(sessionUser.id) ? email : ''
    }))
    const memberWorkspaceIds = (membershipsFromApi || []).map(item =>
      String(item.pharmacyId)
    )

    setWorkspaces(workspaceItems)
    setMemberships(prev => ({
      ...prev,
      [email]: memberWorkspaceIds
    }))
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [email]: prev[email] || memberWorkspaceIds[0] || null
    }))
  }

  async function bootstrapSession(tokenOverride = null) {
    const sessionToken = tokenOverride || authToken
    if (!sessionToken) return

    try {
      setIsBootstrappingSession(true)
      const result = await apiRequest('/api/session/bootstrap', {
        token: sessionToken
      })

      if (result?.user) {
        const mappedUser = mapBackendUserToClient(result.user)
        setUser(mappedUser)
        setProfiles(prev => ({
          ...prev,
          [mappedUser.email]: {
            name: mappedUser.name,
            role: mappedUser.role
          }
        }))
        hydrateMembershipState(result.user, result.workspaces, result.memberships)
        await refreshPendingInvitations(sessionToken, mappedUser.email)
      }
    } catch (_error) {
      logout()
    } finally {
      setIsBootstrappingSession(false)
    }
  }

  useEffect(() => {
    if (!authToken) return
    bootstrapSession(authToken)
  }, [authToken])

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

  async function refreshPendingInvitations(tokenOverride = null, emailOverride = null) {
    const sessionToken = tokenOverride || authToken
    const targetEmail = (emailOverride || user?.email || '').toLowerCase()
    if (!sessionToken || !targetEmail) return

    try {
      const result = await apiRequest('/api/invitations/pending', {
        token: sessionToken
      })
      const mapped = (result.invitations || []).map(item => ({
        id: item._id,
        workspaceId: item.pharmacyId?._id || item.pharmacyId,
        workspaceName: item.pharmacyId?.name || 'Pharmacy',
        toEmail: targetEmail,
        fromName: 'Owner',
        status: item.status,
        role: item.role,
        createdAt: item.createdAt
      }))
      setInvitations(mapped)
    } catch (_error) {
      setInvitations([])
    }
  }

  function login(nextUser, token = null) {
    const normalized = {
      ...nextUser,
      email: nextUser.email.trim().toLowerCase(),
      role:
        nextUser.primaryRole === 'owner'
          ? 'admin'
          : nextUser.primaryRole === 'pharmacist'
            ? 'worker'
            : nextUser.role || 'worker'
    }
    setUser(normalized)
    if (token) {
      setAuthToken(token)
    }
    setProfiles(prev => ({
      ...prev,
      [normalized.email]: { name: normalized.name, role: normalized.role }
    }))
  }

  function logout() {
    // Clear persisted auth immediately to avoid redirect races.
    window.localStorage.removeItem('pm-user')
    window.localStorage.removeItem('pm-token')
    window.localStorage.removeItem('pm-workspaces')
    window.localStorage.removeItem('pm-memberships')
    window.localStorage.removeItem('pm-active-workspace')
    window.localStorage.removeItem('pm-invitations')
    setUser(null)
    setAuthToken(null)
    setWorkspaces([])
    setMemberships({})
    setActiveWorkspaceByEmail({})
    setInvitations([])
    setIsBootstrappingSession(false)
  }

  function setActiveWorkspace(workspaceId) {
    if (!user?.email) return
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [user.email]: workspaceId
    }))
  }

  async function inviteToCurrentWorkspace(email, role = 'pharmacist') {
    if (!authToken || !currentWorkspace) {
      throw new Error('Active workspace is required')
    }
    await apiRequest('/api/invitations/invite', {
      method: 'POST',
      token: authToken,
      body: {
        pharmacyId: currentWorkspace.id,
        email,
        role
      }
    })
  }

  async function respondToInvitation(invitationId, decision) {
    if (!authToken || !user?.email) return
    const invitation = invitations.find(item => item.id === invitationId)
    if (decision !== 'accepted') {
      setInvitations(prev => prev.filter(item => item.id !== invitationId))
      return
    }

    const result = await apiRequest('/api/invitations/accept', {
      method: 'POST',
      token: authToken,
      body: { invitationId }
    })

    const newPharmacyId = result?.membership?.pharmacyId
    setMemberships(prev => ({
      ...prev,
      [user.email]: [...new Set([...(prev[user.email] || []), newPharmacyId])]
    }))
    if (invitation?.workspaceId && invitation?.workspaceName) {
      setWorkspaces(prev => {
        if (prev.some(workspace => workspace.id === invitation.workspaceId)) {
          return prev
        }
        return [
          ...prev,
          {
            id: invitation.workspaceId,
            name: invitation.workspaceName,
            ownerEmail: ''
          }
        ]
      })
    }
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [user.email]: prev[user.email] || newPharmacyId
    }))
    await refreshPendingInvitations(authToken)
  }

  async function chooseRole(role) {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/onboarding/choose-role', {
      method: 'POST',
      token: authToken,
      body: { role }
    })
    setUser(prev =>
      prev
        ? {
            ...prev,
            primaryRole: result.user.primaryRole,
            onboardingCompleted: result.user.onboardingCompleted,
            role: result.user.primaryRole === 'owner' ? 'admin' : 'worker'
          }
        : prev
    )
    return result
  }

  async function activateSubscription() {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/onboarding/activate-subscription', {
      method: 'POST',
      token: authToken
    })
    setUser(prev =>
      prev ? { ...prev, subscriptionActive: result.subscriptionActive } : prev
    )
    return result
  }

  async function createPharmacy(name) {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/pharmacy/create', {
      method: 'POST',
      token: authToken,
      body: { name }
    })

    const workspace = {
      id: result.pharmacy._id,
      name: result.pharmacy.name,
      ownerEmail: user?.email || ''
    }
    setWorkspaces(prev => [...prev, workspace])
    setMemberships(prev => ({
      ...prev,
      [user.email]: [...new Set([...(prev[user.email] || []), workspace.id])]
    }))
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [user.email]: workspace.id
    }))
    return result
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
      authToken,
      locale,
      setLocale,
      orders: sortedOrders,
      currentWorkspace,
      userWorkspaces,
      workspaceMembers,
      pendingInvitations,
      pendingWorkspaceInvitations,
      isReady,
      isBootstrappingSession,
      login,
      chooseRole,
      logout,
      createOrder,
      addOrderComment,
      updateOrderStatus,
      updateOrderArrivalDate,
      updateOrder,
      setActiveWorkspace,
      inviteToCurrentWorkspace,
      respondToInvitation,
      refreshPendingInvitations,
      activateSubscription,
      createPharmacy
    }),
    [
      currentWorkspace,
      isReady,
      locale,
      pendingInvitations,
      pendingWorkspaceInvitations,
      sortedOrders,
      theme,
      authToken,
      isBootstrappingSession,
      logout,
      chooseRole,
      user,
      userWorkspaces,
      workspaceMembers,
      createPharmacy
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

