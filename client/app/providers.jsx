'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

const SessionContext = createContext(null)
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
const reservedSubdomains = new Set(['www', 'api', 'localhost'])
const TOAST_DISPLAY_MS = 2000

function extractSubdomainFromHost(hostValue) {
  const host = String(hostValue || '')
    .trim()
    .toLowerCase()
    .split(':')[0]
  if (!host) return null

  const parts = host.split('.').filter(Boolean)
  if (parts.length >= 3) {
    return reservedSubdomains.has(parts[0]) ? null : parts[0]
  }
  if (parts.length === 2 && parts[1] === 'localhost') {
    return reservedSubdomains.has(parts[0]) ? null : parts[0]
  }
  return null
}
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
    orderDateUpdated: "Date d'arrivée mise à jour.",
    subscriptionActivated: 'Abonnement activé.',
    pharmacyCreated: 'Pharmacie créée avec succès.'
  }
}

const errorCopy = {
  en: {
    'Request failed': 'Request failed.',
    'Host header is required': 'Host header is required.',
    'A valid pharmacy subdomain is required':
      'A valid pharmacy workspace is required.',
    'Pharmacy not found': 'Pharmacy not found.',
    'Pharmacy is disabled': 'Pharmacy is disabled.',
    'No access to this pharmacy': 'No access to this pharmacy.',
    'Unauthorized pharmacy access': 'Unauthorized pharmacy access.'
  },
  fr: {
    'Request failed': 'La requete a echoue.',
    'Host header is required': "L'en-tete Host est requis.",
    'A valid pharmacy subdomain is required':
      'Un espace pharmacie valide est requis.',
    'Pharmacy not found': 'Pharmacie introuvable.',
    'Pharmacy is disabled': 'La pharmacie est desactivee.',
    'No access to this pharmacy': "Vous n'avez pas acces a cette pharmacie.",
    'Unauthorized pharmacy access': 'Acces non autorise a la pharmacie.'
  }
}

async function apiRequest(
  path,
  { method = 'GET', token, body, tenantSubdomainOverride = '' } = {}
) {
  const tenantSubdomainFromHost =
    typeof window !== 'undefined'
      ? extractSubdomainFromHost(window.location.host)
      : null
  const tenantSubdomain = tenantSubdomainOverride || tenantSubdomainFromHost

  let response
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        ...(tenantSubdomain ? { 'X-Tenant-Subdomain': tenantSubdomain } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
  } catch (_error) {
    throw new Error(
      `Cannot reach API at ${apiBaseUrl}. Make sure backend server is running and NEXT_PUBLIC_API_BASE_URL is correct.`
    )
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export function AppProviders({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const savedTheme = window.localStorage.getItem('pm-theme')
    return savedTheme === 'dark' || savedTheme === 'light'
      ? savedTheme
      : 'light'
  })
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
  const [isToastFocusActive, setIsToastFocusActive] = useState(false)
  const toastFocusTimerRef = useRef(null)
  const [confirmToast, setConfirmToast] = useState(null)
  const confirmActionRef = useRef(null)
  const [isReady, setIsReady] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false)
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)

  useEffect(() => {
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
    const savedActiveWorkspace = window.localStorage.getItem(
      'pm-active-workspace'
    )
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
    document.documentElement.style.colorScheme = theme
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

  useEffect(() => {
    return () => {
      if (toastFocusTimerRef.current) {
        window.clearTimeout(toastFocusTimerRef.current)
      }
    }
  }, [])

  function dismissToast(toastId) {
    setToasts(prev => prev.filter(item => item.id !== toastId))
  }

  function activateToastFocus(durationMs = TOAST_DISPLAY_MS) {
    if (toastFocusTimerRef.current) {
      window.clearTimeout(toastFocusTimerRef.current)
    }
    setIsToastFocusActive(true)
    toastFocusTimerRef.current = window.setTimeout(() => {
      setIsToastFocusActive(false)
      toastFocusTimerRef.current = null
    }, durationMs)
  }

  function showToast(message, type = 'success') {
    if (!message) return
    const normalizedMessage = String(message)
    const localizedError =
      type === 'error'
        ? (errorCopy[locale] || errorCopy.en)[normalizedMessage] ||
          normalizedMessage
        : normalizedMessage
    const toastId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts(prev =>
      [...prev, { id: toastId, message: localizedError, type }].slice(-4)
    )
    activateToastFocus(TOAST_DISPLAY_MS)
    window.setTimeout(() => dismissToast(toastId), TOAST_DISPLAY_MS)
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
    const userId = String(nextUser.id || '')
    const resolvedEmail = String(
      nextUser.email || `staff-${userId || 'user'}@local.staff`
    ).toLowerCase()
    const backendRole =
      nextUser.role ||
      (nextUser.primaryRole === 'superadmin'
        ? 'superadmin'
        : nextUser.primaryRole === 'owner'
          ? 'owner'
          : 'staff')
    const effectivePrimaryRole =
      nextUser.primaryRole ||
      (backendRole === 'superadmin'
        ? 'superadmin'
        : backendRole === 'owner'
          ? 'owner'
          : 'pharmacist')

    return {
      id: userId,
      name:
        nextUser.name ||
        nextUser.displayName ||
        nextUser.email ||
        `Staff ${userId.slice(0, 6)}`,
      email: resolvedEmail,
      picture: nextUser.picture || '',
      onboardingCompleted: nextUser.onboardingCompleted,
      primaryRole: effectivePrimaryRole,
      subscriptionActive: !!nextUser.subscriptionActive,
      accountRole: backendRole,
      staffRole: nextUser.staffRole || 'staff',
      pharmacyId: nextUser.pharmacyId ? String(nextUser.pharmacyId) : null,
      role:
        backendRole === 'superadmin' || effectivePrimaryRole === 'superadmin'
          ? 'superadmin'
          : backendRole === 'owner' || effectivePrimaryRole === 'owner'
            ? 'admin'
            : backendRole === 'staff' && nextUser.staffRole === 'admin'
              ? 'admin'
              : 'worker'
    }
  }

  function hydrateMembershipState(
    sessionUser,
    workspacesFromApi,
    membershipsFromApi
  ) {
    const resolvedEmail = String(
      sessionUser.email || `staff-${sessionUser.id || 'user'}@local.staff`
    ).toLowerCase()
    const workspaceItems = (workspacesFromApi || []).map(item => ({
      id: String(item.id),
      name: item.name,
      subdomain: item.subdomain || '',
      ownerEmail:
        String(item.ownerUserId) === String(sessionUser.id) ? resolvedEmail : ''
    }))
    const memberWorkspaceIds = (membershipsFromApi || []).map(item =>
      String(item.pharmacyId)
    )

    setWorkspaces(workspaceItems)
    setMemberships(prev => ({
      ...prev,
      [resolvedEmail]: memberWorkspaceIds
    }))
    setActiveWorkspaceByEmail(prev => ({
      ...prev,
      [resolvedEmail]: prev[resolvedEmail] || memberWorkspaceIds[0] || null
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
        if (mappedUser.role === 'superadmin') {
          setWorkspaces([])
          setMemberships({})
          setActiveWorkspaceByEmail({})
          setInvitations([])
          setWorkspaceInvitations([])
        } else {
          hydrateMembershipState(
            result.user,
            result.workspaces,
            result.memberships
          )
          await refreshPendingInvitations(sessionToken, mappedUser.email)
        }
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

  async function refreshWorkspaceOrders(
    tokenOverride = null,
    workspaceOverride = null
  ) {
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

  async function createOrder(
    { patientName, phone, products, comment, arrivalDate, versement },
    tokenOverride = null
  ) {
    const sessionToken = tokenOverride || authToken
    if (!sessionToken || !currentWorkspace) {
      throw new Error('Active workspace is required')
    }
    try {
      const result = await apiRequest('/api/orders', {
        method: 'POST',
        token: sessionToken,
        body: {
          pharmacyId: currentWorkspace.id,
          patientName,
          phone,
          products,
          arrivalDate,
          versement,
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

  async function resolveStaffByPin(pin) {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/staff/resolve-pin', {
      method: 'POST',
      token: authToken,
      body: { pin }
    })
    return result.staff
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

  async function refreshPendingInvitations(
    tokenOverride = null,
    emailOverride = null
  ) {
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
          item.invitedByUserId?.displayName ||
          item.invitedByUserId?.email ||
          'Owner',
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
          item.invitedByUserId?.displayName ||
          item.invitedByUserId?.email ||
          'Owner',
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
    const fallbackEmail = String(
      nextUser.email || `staff-${nextUser.id || 'user'}@local.staff`
    ).trim()
    const normalized = {
      ...nextUser,
      email: fallbackEmail.toLowerCase(),
      role:
        nextUser.accountRole === 'superadmin' ||
        nextUser.primaryRole === 'superadmin'
          ? 'superadmin'
          : nextUser.accountRole === 'owner' || nextUser.primaryRole === 'owner'
            ? 'admin'
            : nextUser.accountRole === 'staff' && nextUser.staffRole === 'admin'
              ? 'admin'
              : nextUser.accountRole === 'staff' ||
                  nextUser.primaryRole === 'pharmacist'
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

  async function createPharmacy(name, subdomain) {
    if (!authToken) throw new Error('Missing auth token')
    if (user?.pharmacyId || currentWorkspace?.id) {
      throw new Error('A pharmacy is already linked to this owner account.')
    }
    try {
      const result = await apiRequest('/api/pharmacy/create', {
        method: 'POST',
        token: authToken,
        body: { name, subdomain }
      })

      const workspace = {
        id: result.pharmacy._id,
        name: result.pharmacy.name,
        subdomain: result.pharmacy.subdomain || '',
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
      setUser(prev =>
        prev
          ? {
              ...prev,
              pharmacyId: String(workspace.id),
              subscriptionActive: true
            }
          : prev
      )
      showActionToast('pharmacyCreated')
      return result
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function checkPharmacySubdomain(subdomain) {
    if (!authToken) throw new Error('Missing auth token')
    const normalizedSubdomain = String(subdomain || '')
      .trim()
      .toLowerCase()
    if (!normalizedSubdomain) {
      throw new Error('Subdomain is required')
    }
    const params = new URLSearchParams()
    params.set('subdomain', normalizedSubdomain)
    return apiRequest(`/api/pharmacy/check-subdomain?${params.toString()}`, {
      token: authToken
    })
  }

  async function fetchStaffLoginUsers() {
    const hostSubdomain = extractSubdomainFromHost(window.location.host)
    const subdomain = hostSubdomain || currentWorkspace?.subdomain || ''
    if (!subdomain) {
      return []
    }

    try {
      const result = await apiRequest('/auth/staff', {
        tenantSubdomainOverride: subdomain
      })
      return result.users || []
    } catch (_error) {
      return []
    }
  }

  async function loginWithPin(userId, pin) {
    try {
      const hostSubdomain = extractSubdomainFromHost(window.location.host)
      const tenantSubdomain = currentWorkspace?.subdomain || hostSubdomain || ''
      const result = await apiRequest('/auth/pin-login', {
        method: 'POST',
        body: { userId, pin },
        tenantSubdomainOverride: tenantSubdomain
      })
      const mappedUser = mapBackendUserToClient(result.user)
      login(mappedUser, result.token)
      await bootstrapSession(result.token)
      showToast('Session switched successfully.')
      return result
    } catch (error) {
      showToast(error.message, 'error')
      throw error
    }
  }

  async function listStaffMembers() {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/staff', {
      token: authToken
    })
    return result.staff || []
  }

  async function addStaffMember({ name, role, pin }) {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest('/api/staff', {
      method: 'POST',
      token: authToken,
      body: { name, role, pin }
    })
    showToast('Staff member created successfully.')
    return result
  }

  async function resetStaffMemberPin(staffId, pin = '') {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest(`/api/staff/${staffId}/reset-pin`, {
      method: 'PATCH',
      token: authToken,
      body: pin ? { pin } : {}
    })
    showToast('PIN reset successfully.')
    return result
  }

  async function updateStaffMemberRole(staffId, role) {
    if (!authToken) throw new Error('Missing auth token')
    const normalizedRole = String(role || '')
      .trim()
      .toLowerCase()
    const result = await apiRequest(`/api/staff/${staffId}/role`, {
      method: 'PATCH',
      token: authToken,
      body: { role: normalizedRole }
    })
    showToast('Staff role updated.')
    return result
  }

  async function deleteStaffMember(staffId) {
    if (!authToken) throw new Error('Missing auth token')
    const result = await apiRequest(`/api/staff/${staffId}`, {
      method: 'DELETE',
      token: authToken
    })
    showToast('Staff member deleted.')
    return result
  }

  async function fetchActivityLogs({
    page = 1,
    limit = 20,
    userId = '',
    action = '',
    from = '',
    to = ''
  } = {}) {
    if (!authToken) throw new Error('Missing auth token')
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (userId) params.set('userId', String(userId))
    if (action) params.set('action', String(action))
    if (from) params.set('from', String(from))
    if (to) params.set('to', String(to))

    const result = await apiRequest(`/api/activity-logs?${params.toString()}`, {
      token: authToken
    })
    return {
      logs: result.logs || [],
      pagination: result.pagination || {
        page: 1,
        limit,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }
  }

  async function fetchSuperAdminStats() {
    if (!authToken) throw new Error('Missing auth token')
    return apiRequest('/api/superadmin/stats', { token: authToken })
  }

  async function fetchSuperAdminPharmacies({
    page = 1,
    limit = 20,
    search = '',
    sort = 'desc'
  } = {}) {
    if (!authToken) throw new Error('Missing auth token')
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    params.set('sort', sort === 'asc' ? 'asc' : 'desc')
    if (search) params.set('search', String(search))

    return apiRequest(`/api/superadmin/pharmacies?${params.toString()}`, {
      token: authToken
    })
  }

  async function updateSuperAdminPharmacyStatus(pharmacyId, isActive) {
    if (!authToken) throw new Error('Missing auth token')
    if (!pharmacyId) throw new Error('pharmacyId is required')
    const result = await apiRequest(
      `/api/superadmin/pharmacies/${pharmacyId}/status`,
      {
        method: 'PATCH',
        token: authToken,
        body: { isActive: Boolean(isActive) }
      }
    )
    showToast('Pharmacy status updated.')
    return result
  }

  async function fetchSuperAdminUsers({
    page = 1,
    limit = 20,
    role = '',
    pharmacyId = '',
    search = ''
  } = {}) {
    if (!authToken) throw new Error('Missing auth token')
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (role) params.set('role', String(role))
    if (pharmacyId) params.set('pharmacyId', String(pharmacyId))
    if (search) params.set('search', String(search))

    return apiRequest(`/api/superadmin/users?${params.toString()}`, {
      token: authToken
    })
  }

  async function fetchSuperAdminActivityLogs({
    page = 1,
    limit = 20,
    pharmacyId = '',
    userId = '',
    action = '',
    from = '',
    to = ''
  } = {}) {
    if (!authToken) throw new Error('Missing auth token')
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', String(limit))
    if (pharmacyId) params.set('pharmacyId', String(pharmacyId))
    if (userId) params.set('userId', String(userId))
    if (action) params.set('action', String(action))
    if (from) params.set('from', String(from))
    if (to) params.set('to', String(to))

    return apiRequest(`/api/superadmin/activity-logs?${params.toString()}`, {
      token: authToken
    })
  }

  const userWorkspaceIds = useMemo(() => {
    if (!user?.email) return []
    if (user.role === 'superadmin' || user.accountRole === 'superadmin')
      return []
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
      item =>
        item.workspaceId === currentWorkspace.id && item.status === 'pending'
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
      resolveStaffByPin,
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
      createPharmacy,
      checkPharmacySubdomain,
      fetchStaffLoginUsers,
      loginWithPin,
      listStaffMembers,
      addStaffMember,
      resetStaffMemberPin,
      updateStaffMemberRole,
      deleteStaffMember,
      fetchActivityLogs,
      fetchSuperAdminStats,
      fetchSuperAdminPharmacies,
      updateSuperAdminPharmacyStatus,
      fetchSuperAdminUsers,
      fetchSuperAdminActivityLogs
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
      resolveStaffByPin,
      checkPharmacySubdomain,
      fetchStaffLoginUsers,
      listStaffMembers,
      addStaffMember,
      resetStaffMemberPin,
      updateStaffMemberRole,
      deleteStaffMember,
      fetchActivityLogs,
      fetchSuperAdminStats,
      fetchSuperAdminPharmacies,
      updateSuperAdminPharmacyStatus,
      fetchSuperAdminUsers,
      fetchSuperAdminActivityLogs,
      loginWithPin,
      workspaceInvitations
    ]
  )

  return (
    <SessionContext.Provider value={value}>
      {children}
      {confirmToast && (
        <div className='fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-xl overflow-hidden rounded-3xl border border-emerald-300/35 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(236,253,245,0.94),rgba(209,250,229,0.9))] p-0 shadow-[0_28px_70px_rgba(2,132,199,0.2)] dark:border-emerald-400/30 dark:bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(6,78,59,0.35),rgba(2,44,34,0.92))]'>
            <div className='h-1.5 w-full bg-[linear-gradient(90deg,rgba(16,185,129,0.95),rgba(14,165,233,0.92))]' />
            <div className='p-6 sm:p-7'>
              {confirmToast.title && (
                <h3 className='text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100'>
                  {confirmToast.title}
                </h3>
              )}
              {confirmToast.message && (
                <p className='mt-3 max-w-prose text-sm leading-6 text-slate-700 dark:text-slate-300'>
                  {confirmToast.message}
                </p>
              )}
              <div className='mt-6 flex flex-wrap justify-end gap-2'>
                <button
                  onClick={closeConfirmToast}
                  className='rounded-xl border border-slate-300/80 bg-white/75 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600/70 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800'
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
                  className='rounded-xl bg-[linear-gradient(90deg,#059669,#0284c7)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(2,132,199,0.35)] transition hover:brightness-110'
                >
                  {confirmToast.confirmLabel}
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
      {isToastFocusActive && toasts.length > 0 && (
        <div className='pointer-events-none fixed inset-0 z-[58] bg-slate-950/35 backdrop-blur-sm transition-opacity duration-200' />
      )}
      <div className='pointer-events-none fixed inset-0 z-[60] flex items-center justify-center px-4'>
        <div className='flex w-full max-w-md flex-col gap-3'>
          {toasts.map(toast => (
            <article
              key={toast.id}
              className={`pointer-events-auto overflow-hidden rounded-3xl border shadow-[0_22px_55px_rgba(2,6,23,0.28)] backdrop-blur ${
                toast.type === 'error'
                  ? 'border-rose-400/45 bg-[linear-gradient(145deg,rgba(254,242,242,0.96),rgba(254,226,226,0.95),rgba(255,241,242,0.92))] text-rose-900 dark:border-rose-400/35 dark:bg-[linear-gradient(145deg,rgba(127,29,29,0.92),rgba(136,19,55,0.9))] dark:text-rose-50'
                  : 'border-emerald-400/45 bg-[linear-gradient(145deg,rgba(236,253,245,0.97),rgba(209,250,229,0.94),rgba(224,242,254,0.92))] text-emerald-900 dark:border-emerald-300/35 dark:bg-[linear-gradient(145deg,rgba(6,78,59,0.9),rgba(3,105,161,0.85))] dark:text-emerald-50'
              }`}
            >
              <div className='flex items-start justify-between gap-3 px-5 py-4'>
                <div className='flex items-start gap-3'>
                  <span
                    className={`mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      toast.type === 'error'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-200 dark:text-rose-900'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-200 dark:text-emerald-900'
                    }`}
                  >
                    {toast.type === 'error' ? '!' : '✓'}
                  </span>
                  <p className='text-base font-semibold leading-6'>
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className='text-current/80 rounded px-1 text-sm font-semibold transition hover:text-current'
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
