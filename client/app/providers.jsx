'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

const SessionContext = createContext(null)
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
const toastCopy = {
  en: {
    invitationSent: 'Invitation sent successfully.',
    invitationAccepted: 'Invitation accepted successfully.',
    invitationDeclined: 'Invitation declined.',
    orderSaved: 'Order saved successfully.',
    commentAdded: 'Comment added successfully.',
    orderStatusUpdated: 'Order status updated.',
    orderDateUpdated: 'Order arrival date updated.',
    subscriptionActivated: 'Subscription activated.',
    pharmacyCreated: 'Pharmacy created successfully.'
  },
  fr: {
    invitationSent: 'Invitation envoyee avec succes.',
    invitationAccepted: 'Invitation acceptee avec succes.',
    invitationDeclined: 'Invitation refusee.',
    orderSaved: 'Commande enregistree avec succes.',
    commentAdded: 'Commentaire ajoute avec succes.',
    orderStatusUpdated: 'Statut de la commande mis a jour.',
    orderDateUpdated: "Date d'arrivee mise a jour.",
    subscriptionActivated: 'Abonnement active.',
    pharmacyCreated: 'Pharmacie creee avec succes.'
  }
}

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
  const [locale, setLocale] = useState('fr')
  const [orders, setOrders] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [memberships, setMemberships] = useState({})
  const [activeWorkspaceByEmail, setActiveWorkspaceByEmail] = useState({})
  const [invitations, setInvitations] = useState([])
  const [workspaceInvitations, setWorkspaceInvitations] = useState([])
  const [profiles, setProfiles] = useState({})
  const [toasts, setToasts] = useState([])
  const [confirmToast, setConfirmToast] = useState(null)
  const confirmActionRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)

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
    const savedWorkspaceInvitations = window.localStorage.getItem(
      'pm-workspace-invitations'
    )
    if (savedWorkspaceInvitations) {
      setWorkspaceInvitations(JSON.parse(savedWorkspaceInvitations))
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
    window.localStorage.setItem(
      'pm-workspace-invitations',
      JSON.stringify(workspaceInvitations)
    )
  }, [workspaceInvitations])

  useEffect(() => {
    window.localStorage.setItem('pm-profiles', JSON.stringify(profiles))
  }, [profiles])

  function dismissToast(toastId) {
    setToasts(prev => prev.filter(item => item.id !== toastId))
  }

  function showToast(message, type = 'success') {
    if (!message) return
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts(prev => [...prev, { id: toastId, message, type }].slice(-4))
    window.setTimeout(() => dismissToast(toastId), 3500)
  }

  function showActionToast(key, type = 'success') {
    const messages = toastCopy[locale] || toastCopy.en
    showToast(messages[key] || key, type)
  }

  function showConfirmToast({
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm
  }) {
    confirmActionRef.current = onConfirm
    setConfirmToast({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      message,
      confirmLabel,
      cancelLabel
    })
  }

  function closeConfirmToast() {
    confirmActionRef.current = null
    setConfirmToast(null)
  }

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

  async function refreshWorkspaceOrders(tokenOverride = null, workspaceOverride = null) {
    const sessionToken = tokenOverride || authToken
    const workspaceId = workspaceOverride || currentWorkspace?.id
    if (!sessionToken || !workspaceId) {
      setIsOrdersLoading(false)
      setOrders([])
      return
    }

    try {
      setIsOrdersLoading(true)
      const result = await apiRequest(`/api/orders?pharmacyId=${workspaceId}`, {
        token: sessionToken
      })
      setOrders(result.orders || [])
    } finally {
      setIsOrdersLoading(false)
    }
  }

  async function createOrder({
    patientName,
    phone,
    productName,
    comment,
    arrivalDate,
    urgency
  }) {
    if (!authToken || !currentWorkspace) {
      throw new Error('Active workspace is required')
    }
    try {
      const result = await apiRequest('/api/orders', {
        method: 'POST',
        token: authToken,
        body: {
          pharmacyId: currentWorkspace.id,
          patientName,
          phone,
          productName,
          arrivalDate,
          urgency,
          comment
        }
      })
      setOrders(prev => [result.order, ...prev])
      showActionToast('orderSaved')
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function addOrderComment(orderId, text) {
    if (!authToken || !currentWorkspace) {
      throw new Error('Active workspace is required')
    }
    const cleanText = text.trim()
    if (!cleanText) return
    try {
      const result = await apiRequest(`/api/orders/${orderId}/comments`, {
        method: 'POST',
        token: authToken,
        body: {
          pharmacyId: currentWorkspace.id,
          text: cleanText
        }
      })
      setOrders(prev =>
        prev.map(order => (order.id === orderId ? result.order : order))
      )
      showActionToast('commentAdded')
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function updateOrder(orderId, updates) {
    if (!authToken || !currentWorkspace) {
      throw new Error('Active workspace is required')
    }
    try {
      const result = await apiRequest(`/api/orders/${orderId}`, {
        method: 'PATCH',
        token: authToken,
        body: {
          pharmacyId: currentWorkspace.id,
          ...updates
        }
      })
      setOrders(prev =>
        prev.map(order => (order.id === orderId ? result.order : order))
      )
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function updateOrderStatus(orderId, status) {
    await updateOrder(orderId, { status })
    showActionToast('orderStatusUpdated')
  }

  async function updateOrderArrivalDate(orderId, arrivalDate) {
    await updateOrder(orderId, { arrivalDate })
    showActionToast('orderDateUpdated')
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
        toEmail: item.email || targetEmail,
        fromName:
          item.invitedByUserId?.displayName || item.invitedByUserId?.email || 'Owner',
        status: item.status,
        role: item.role,
        createdAt: item.createdAt
      }))
      setInvitations(mapped)
    } catch (_error) {
      setInvitations([])
    }
  }

  async function refreshWorkspaceInvitations(
    tokenOverride = null,
    workspaceOverride = null
  ) {
    if (user?.role !== 'admin') {
      setWorkspaceInvitations([])
      return
    }

    const sessionToken = tokenOverride || authToken
    const workspaceId = workspaceOverride || currentWorkspace?.id
    if (!sessionToken || !workspaceId) {
      setWorkspaceInvitations([])
      return
    }

    try {
      const result = await apiRequest(
        `/api/invitations/workspace?pharmacyId=${workspaceId}`,
        { token: sessionToken }
      )
      const mapped = (result.invitations || []).map(item => ({
        id: item._id,
        workspaceId,
        workspaceName: currentWorkspace?.name || 'Pharmacy',
        toEmail: item.email,
        fromName:
          item.invitedByUserId?.displayName || item.invitedByUserId?.email || 'Owner',
        status: item.status,
        role: item.role,
        createdAt: item.createdAt
      }))
      setWorkspaceInvitations(mapped)
    } catch (_error) {
      setWorkspaceInvitations([])
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
    window.localStorage.removeItem('pm-orders')
    window.localStorage.removeItem('pm-workspaces')
    window.localStorage.removeItem('pm-memberships')
    window.localStorage.removeItem('pm-active-workspace')
    window.localStorage.removeItem('pm-invitations')
    window.localStorage.removeItem('pm-workspace-invitations')
    setUser(null)
    setAuthToken(null)
    setWorkspaces([])
    setMemberships({})
    setActiveWorkspaceByEmail({})
    setInvitations([])
    setWorkspaceInvitations([])
    setOrders([])
    setToasts([])
    setConfirmToast(null)
    setIsBootstrappingSession(false)
    setIsOrdersLoading(false)
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
    try {
      await apiRequest('/api/invitations/invite', {
        method: 'POST',
        token: authToken,
        body: {
          pharmacyId: currentWorkspace.id,
          email,
          role
        }
      })
      await refreshWorkspaceInvitations(authToken, currentWorkspace.id)
      showActionToast('invitationSent')
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function respondToInvitation(invitationId, decision) {
    if (!authToken || !user?.email) return
    const invitation = pendingInvitations.find(item => item.id === invitationId)

    if (decision === 'declined') {
      try {
        await apiRequest('/api/invitations/decline', {
          method: 'POST',
          token: authToken,
          body: { invitationId }
        })
        setInvitations(prev => prev.filter(item => item.id !== invitationId))
        showActionToast('invitationDeclined')
      } catch (error) {
        showToast(error.message, 'error')
        throw error
      }
      return
    }

    if (decision !== 'accepted') {
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
    showActionToast('invitationAccepted')
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
    try {
      const result = await apiRequest('/api/onboarding/activate-subscription', {
        method: 'POST',
        token: authToken
      })
      setUser(prev =>
        prev ? { ...prev, subscriptionActive: result.subscriptionActive } : prev
      )
      showActionToast('subscriptionActivated')
      return result
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function createPharmacy(name) {
    if (!authToken) throw new Error('Missing auth token')
    try {
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
      showActionToast('pharmacyCreated')
      return result
    } catch (error) {
      showToast(error.message, 'error')
      throw error
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

  useEffect(() => {
    if (!authToken || !currentWorkspace?.id) {
      setOrders([])
      setWorkspaceInvitations([])
      return
    }
    refreshWorkspaceOrders(authToken, currentWorkspace.id).catch(() => {
      setOrders([])
    })
    refreshWorkspaceInvitations(authToken, currentWorkspace.id).catch(() => {
      setWorkspaceInvitations([])
    })
  }, [authToken, currentWorkspace?.id, user?.role])

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

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
    return workspaceInvitations.filter(
      item => item.workspaceId === currentWorkspace.id && item.status === 'pending'
    )
  }, [currentWorkspace, workspaceInvitations])

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
      isOrdersLoading,
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
      refreshWorkspaceInvitations,
      showToast,
      showConfirmToast,
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
      isOrdersLoading,
      logout,
      chooseRole,
      user,
      userWorkspaces,
      workspaceMembers,
      createPharmacy,
      workspaceInvitations
    ]
  )

  return (
    <SessionContext.Provider value={value}>
      {children}
      {confirmToast && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4'>
          <article className='w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            {confirmToast.title && (
              <h3 className='text-base font-semibold text-[var(--foreground)]'>
                {confirmToast.title}
              </h3>
            )}
            {confirmToast.message && (
              <p className='mt-2 text-sm text-[var(--muted)]'>{confirmToast.message}</p>
            )}
            <div className='mt-4 flex justify-end gap-2'>
              <button
                onClick={closeConfirmToast}
                className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                {confirmToast.cancelLabel}
              </button>
              <button
                onClick={() => {
                  const confirmAction = confirmActionRef.current
                  closeConfirmToast()
                  if (typeof confirmAction === 'function') {
                    confirmAction()
                  }
                }}
                className='rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500'
              >
                {confirmToast.confirmLabel}
              </button>
            </div>
          </article>
        </div>
      )}
      <div className='pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4'>
        <div className='flex w-full max-w-md flex-col gap-3'>
        {toasts.map(toast => (
          <article
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-2xl backdrop-blur ${
              toast.type === 'error'
                ? 'border-red-400/50 bg-[linear-gradient(145deg,rgba(127,29,29,0.95),rgba(69,10,10,0.92))] text-red-50'
                : 'border-emerald-300/60 bg-[linear-gradient(145deg,rgba(5,150,105,0.94),rgba(6,95,70,0.92))] text-emerald-50'
            }`}
          >
            <div className='flex items-start justify-between gap-3 px-4 py-3'>
              <div className='flex items-start gap-3'>
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                    toast.type === 'error'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {toast.type === 'error' ? '!' : '✓'}
                </span>
                <p className='text-sm font-semibold leading-5'>{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className='rounded px-1 text-xs font-semibold text-white/90 transition hover:text-white'
              >
                ✕
              </button>
            </div>
          </article>
        ))}
        </div>
      </div>
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useSession must be used inside AppProviders')
  }
  return ctx
}

