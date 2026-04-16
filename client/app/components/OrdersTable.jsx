'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Trash2 } from 'lucide-react'
import { useSession } from '@/app/providers'
import { formatShortDate, getCopy } from '@/app/lib/i18n'

const statusStyles = {
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ordered: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  called: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  arrived: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  finished: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
}
const categoryStyles = {
  general:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-200 dark:border-slate-500/30',
  orthopedie:
    'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:border-indigo-500/30',
  caba: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-200 dark:border-cyan-500/30',
  medicament:
    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:border-emerald-500/30',
  parapharmacie:
    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:border-amber-500/30',
  'dermo-cosmetique':
    'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:border-rose-500/30'
}
const orderCategoryOptions = [
  'general',
  'orthopedie',
  'caba',
  'medicament',
  'parapharmacie',
  'dermo-cosmetique'
]

const digitsOnly = value => value.replace(/\D/g, '')
const requiredFieldOrder = ['patientName', 'phone', 'productsInput']

function parseProductsInput(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
}

function productsToText(products) {
  if (!Array.isArray(products)) return ''
  return products.join(', ')
}

function compactProductsText(products) {
  const text = productsToText(products)
  if (text.length <= 72) return text
  return `${text.slice(0, 69)}...`
}

function getLocalIsoDate() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export default function OrdersTable({ showControls = false }) {
  const router = useRouter()
  const {
    locale,
    user,
    orders,
    createOrder,
    updateOrderStatus,
    deleteOrder,
    resolveStaffByPin,
    loginWithPin,
    showConfirmToast
  } = useSession()
  const t = getCopy(locale).orders
  const isOwner =
    user?.accountRole === 'owner' || user?.primaryRole === 'owner'

  const [search, setSearch] = useState('')
  const [isFinishedOpen, setIsFinishedOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isPinSubmitting, setIsPinSubmitting] = useState(false)
  const [openStatusMenuId, setOpenStatusMenuId] = useState('')
  const [showArrivalDateInput, setShowArrivalDateInput] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    productsInput: '',
    comment: '',
    category: 'general',
    arrivalDate: '',
    versement: '0'
  })
  const patientNameRef = useRef(null)
  const phoneRef = useRef(null)
  const productsInputRef = useRef(null)
  const arrivalDateRef = useRef(null)
  const pinInputRef = useRef(null)
  const statusMenuRef = useRef(null)

  const fieldRefMap = {
    patientName: patientNameRef,
    phone: phoneRef,
    productsInput: productsInputRef,
    arrivalDate: arrivalDateRef
  }

  function validateRequiredFields() {
    const errors = {}
    if (!form.patientName.trim()) {
      errors.patientName = t.validation.patientNameRequired
    }
    if (!form.phone.trim()) {
      errors.phone = t.validation.phoneRequired
    }
    if (parseProductsInput(form.productsInput).length === 0) {
      errors.productsInput = t.validation.productsRequired
    }
    const versementValue = Number(form.versement || 0)
    if (!Number.isFinite(versementValue) || versementValue < 0) {
      errors.versement = t.validation.versementInvalid
    }

    return errors
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchesCategory =
        categoryFilter === 'all' ? true : order.category === categoryFilter
      if (!matchesCategory) return false
      if (!q) return true
      return [productsToText(order.products), order.patientName, order.phone, order.category]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [orders, search, categoryFilter])

  const activeOrders = filteredOrders.filter(order => order.status !== 'finished')
  const finishedOrders = filteredOrders.filter(order => order.status === 'finished')
  const today = getLocalIsoDate()
  const dueOrders = activeOrders.filter(order => {
    if (order.status !== 'pending') return false
    if (!order.arrivalDate) return true
    return order.arrivalDate <= today
  })

  function navigateToOrder(orderId) {
    router.push(`/orders/${orderId}`)
  }

  function getOrderCreatorLabel(order) {
    return order.createdByName || '-'
  }

  function getCategoryLabel(category) {
    return t.categories?.[category] || t.categories?.general || category
  }

  function getCategoryClass(category) {
    return categoryStyles[category] || categoryStyles.general
  }

  function confirmDeleteOrder(order) {
    showConfirmToast({
      title: t.confirmDeleteOrderTitle,
      message: t.confirmDeleteOrderMessage,
      confirmLabel: t.confirmDelete,
      cancelLabel: t.cancelDelete,
      onConfirm: () => {
        void deleteOrder(order.id)
      }
    })
  }

  function renderStatusSelect(order, className = '') {
    return (
      <div className={`relative inline-flex min-w-0 shrink-0 items-center ${className}`}>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[order.status] || ''}`}
        >
          {t.status[order.status] || order.status}
        </span>
        <button
          type='button'
          aria-label={t.statusLabel}
          onClick={event => {
            event.stopPropagation()
            setOpenStatusMenuId(prev => (prev === order.id ? '' : order.id))
          }}
          className='-ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--muted)] shadow-sm transition hover:bg-[var(--surface-soft)]'
        >
          <ChevronDown size={12} />
        </button>
        {openStatusMenuId === order.id && (
          <div
            ref={statusMenuRef}
            className='absolute right-0 top-full z-30 mt-1 min-w-[8.5rem] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_14px_28px_rgba(15,23,42,0.14)]'
            onClick={event => event.stopPropagation()}
          >
            {['pending', 'ordered', 'called', 'arrived', 'finished'].map(status => (
              <button
                key={status}
                type='button'
                onClick={async event => {
                  event.stopPropagation()
                  setOpenStatusMenuId('')
                  if (status !== order.status) {
                    await updateOrderStatus(order.id, status)
                  }
                }}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition hover:bg-[var(--surface-soft)] ${
                  status === order.status
                    ? 'bg-[var(--surface-soft)] font-semibold text-[var(--foreground)]'
                    : 'text-[var(--foreground)]'
                }`}
              >
                <span>{t.status[status] || status}</span>
                {status === order.status && <span className='text-[10px] text-[var(--muted)]'>OK</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  function isInteractiveElement(target) {
    return Boolean(target?.closest('button, a, input, select, textarea, label'))
  }

  useEffect(() => {
    if (!pinModalOpen) return
    const timer = window.setTimeout(() => {
      pinInputRef.current?.focus()
    }, 30)
    return () => window.clearTimeout(timer)
  }, [pinModalOpen])

  useEffect(() => {
    if (!openStatusMenuId) return

    function handlePointerDown(event) {
      if (statusMenuRef.current?.contains(event.target)) return
      setOpenStatusMenuId('')
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenStatusMenuId('')
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openStatusMenuId])

  async function submitOrder(tokenOverride = null) {
    try {
      await createOrder(
        {
          patientName: form.patientName,
          phone: form.phone,
          products: parseProductsInput(form.productsInput),
          comment: form.comment,
          category: form.category,
          arrivalDate: form.arrivalDate,
          versement: Number(form.versement || 0)
        },
        tokenOverride
      )
    } catch (_error) {
      return false
    }

    setFieldErrors({})
    setForm({
      patientName: '',
      phone: '',
      productsInput: '',
      comment: '',
      category: 'general',
      arrivalDate: '',
      versement: '0'
    })
    setShowArrivalDateInput(false)
    return true
  }

  async function handlePinConfirmSubmit() {
    const normalizedPin = pinInput.replace(/\D/g, '').slice(0, 6)
    if (normalizedPin.length < 2 || normalizedPin.length > 6) {
      setPinError(
        locale === 'fr'
          ? 'PIN invalide. Utilisez 2 a 6 chiffres.'
          : 'Invalid PIN. Use 2 to 6 digits.'
      )
      return
    }

    try {
      setIsPinSubmitting(true)
      setPinError('')
      const matchedStaff = await resolveStaffByPin(normalizedPin)
      const isSameStaffSession =
        user?.accountRole === 'staff' && String(user?.id) === String(matchedStaff?.id)

      let tokenOverride = null
      if (!isSameStaffSession) {
        const switched = await loginWithPin(matchedStaff.id, normalizedPin)
        tokenOverride = switched?.token || null
      }

      const saved = await submitOrder(tokenOverride)
      if (!saved) {
        setPinError(
          locale === 'fr'
            ? "Echec de l'enregistrement. Reessayez."
            : 'Failed to save order. Please retry.'
        )
        return
      }

      setPinModalOpen(false)
      setPinInput('')
      setPinError('')
    } catch (_error) {
      setPinError(
        locale === 'fr'
          ? 'PIN incorrect. Veuillez reessayer.'
          : 'Incorrect PIN. Please try again.'
      )
    } finally {
      setIsPinSubmitting(false)
    }
  }

  return (
    <section className='space-y-4'>
      {showControls && (
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.addTitle}
          </h2>
          <p className='mt-1 text-sm text-[var(--muted)]'>{t.addDescription}</p>
          <div className='mt-4 space-y-4'>
            <p className='text-xs text-[var(--muted)]'>* {locale === 'fr' ? 'champs obligatoires' : 'mandatory fields'}</p>
            <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.patientName} <span className='text-rose-500'>*</span>
                  <input
                    ref={patientNameRef}
                    value={form.patientName}
                    onChange={e => {
                      const nextValue = e.target.value
                      setForm(prev => ({ ...prev, patientName: nextValue }))
                      if (nextValue.trim()) {
                        setFieldErrors(prev => ({ ...prev, patientName: '' }))
                      }
                    }}
                    placeholder={t.placeholders.patientName}
                    required
                    aria-invalid={!!fieldErrors.patientName}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                  {fieldErrors.patientName && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.patientName}</p>
                  )}
                </label>
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.phone} <span className='text-rose-500'>*</span>
                  <input
                    ref={phoneRef}
                    value={form.phone}
                    onChange={e => {
                      const nextValue = digitsOnly(e.target.value)
                      setForm(prev => ({ ...prev, phone: nextValue }))
                      if (nextValue.trim()) {
                        setFieldErrors(prev => ({ ...prev, phone: '' }))
                      }
                    }}
                    placeholder={t.placeholders.phone}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    required
                    aria-invalid={!!fieldErrors.phone}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                  {fieldErrors.phone && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.phone}</p>
                  )}
                </label>
                <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                  {t.fields.products} <span className='text-rose-500'>*</span>
                  <input
                    ref={productsInputRef}
                    value={form.productsInput}
                    onChange={e => {
                      const nextValue = e.target.value
                      setForm(prev => ({ ...prev, productsInput: nextValue }))
                      if (parseProductsInput(nextValue).length > 0) {
                        setFieldErrors(prev => ({ ...prev, productsInput: '' }))
                      }
                    }}
                    placeholder={t.placeholders.products}
                    required
                    aria-invalid={!!fieldErrors.productsInput}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                  {fieldErrors.productsInput && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.productsInput}</p>
                  )}
                </label>
              </div>
            </div>
            <div className='rounded-2xl border border-dashed border-[var(--border)]/80 bg-[var(--surface-soft)]/40 p-4'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.category}
                  <select
                    value={form.category}
                    onChange={e =>
                      setForm(prev => ({ ...prev, category: e.target.value }))
                    }
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  >
                    {orderCategoryOptions.map(category => (
                      <option key={category} value={category}>
                        {getCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className='flex flex-col text-sm text-[var(--muted)]'>
                  {!showArrivalDateInput ? (
                    <button
                      type='button'
                      onClick={() => setShowArrivalDateInput(true)}
                      className='mt-6 inline-flex min-h-10 items-center justify-center self-start rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:bg-[var(--surface-soft)]'
                    >
                      {t.addArrivalDate}
                    </button>
                  ) : (
                    <>
                      <div className='flex items-center justify-between gap-2'>
                        <span>{t.fields.arrivalDate}</span>
                        <button
                          type='button'
                          onClick={() => {
                            setShowArrivalDateInput(false)
                            setForm(prev => ({ ...prev, arrivalDate: '' }))
                          }}
                          className='text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--foreground)]'
                        >
                          {t.removeArrivalDate}
                        </button>
                      </div>
                      <input
                        ref={arrivalDateRef}
                        type='date'
                        value={form.arrivalDate}
                        onChange={e => {
                          const nextValue = e.target.value
                          setForm(prev => ({ ...prev, arrivalDate: nextValue }))
                        }}
                        onFocus={e => {
                          if (typeof e.currentTarget.showPicker === 'function') {
                            e.currentTarget.showPicker()
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                            e.preventDefault()
                          }
                        }}
                        onPaste={e => e.preventDefault()}
                        className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                      />
                    </>
                  )}
                </div>
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.versement}
                  <input
                    type='number'
                    min='0'
                    step='0.01'
                    value={form.versement}
                    onChange={e => {
                      const nextValue = e.target.value
                      setForm(prev => ({ ...prev, versement: nextValue }))
                      const parsed = Number(nextValue || 0)
                      if (Number.isFinite(parsed) && parsed >= 0) {
                        setFieldErrors(prev => ({ ...prev, versement: '' }))
                      }
                    }}
                    placeholder={t.placeholders.versement}
                    aria-invalid={!!fieldErrors.versement}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                  {fieldErrors.versement && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.versement}</p>
                  )}
                </label>
                <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                  {t.fields.comment}
                  <input
                    value={form.comment}
                    onChange={e =>
                      setForm(prev => ({ ...prev, comment: e.target.value }))
                    }
                    placeholder={t.placeholders.comment}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                </label>
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              const errors = validateRequiredFields()
              setFieldErrors(errors)
              if (Object.keys(errors).length > 0) {
                const firstMissingField = requiredFieldOrder.find(field => errors[field])
                const targetRef = firstMissingField
                  ? fieldRefMap[firstMissingField]
                  : null
                targetRef?.current?.focus()
                return
              }

              if (isOwner) {
                await submitOrder()
                return
              }

              setPinInput('')
              setPinError('')
              setPinModalOpen(true)
            }}
            className='mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
          >
            {t.addButton}
          </button>
        </article>
      )}

      {showControls && (
        <article className='panel p-5'>
          <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_15rem]'>
            <div>
              <h2 className='text-base font-semibold text-[var(--foreground)]'>
                {t.searchLabel}
              </h2>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className='mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </div>
            <label className='text-sm text-[var(--muted)]'>
              {t.categoryFilterLabel}
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className='mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              >
                <option value='all'>{t.allCategories}</option>
                {orderCategoryOptions.map(category => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </article>
      )}

      {showControls && (
        <article className='panel p-5'>
          <h2 className='text-base font-semibold text-[var(--foreground)]'>
            {t.remindersTitle}
          </h2>
          {dueOrders.length === 0 ? (
            <p className='mt-2 text-sm text-[var(--muted)]'>{t.remindersEmpty}</p>
          ) : (
            <div className='mt-3 grid gap-3 sm:grid-cols-2'>
              {dueOrders.map(order => (
                <div
                  key={order.id}
                  className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'
                >
                  <p className='text-sm font-semibold text-[var(--foreground)]'>
                    {productsToText(order.products)}
                  </p>
                  <p className='text-xs text-[var(--muted)]'>
                    {order.patientName} - {order.phone}
                  </p>
                  <p className='mt-1 text-xs text-[var(--muted)]'>
                    {order.arrivalDate
                      ? `${t.remindersText} (${formatShortDate(order.arrivalDate, locale)})`
                      : t.noArrivalDate}
                  </p>
                  <div className='mt-2 flex flex-wrap gap-2'>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'arrived')}
                      className='rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.arrived}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'called')}
                      className='rounded-md bg-cyan-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.called}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'finished')}
                      className='rounded-md bg-violet-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.finished}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'ordered')}
                      className='rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.ordered}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'pending')}
                      className='rounded-md bg-amber-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.pending}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      )}

      <section className='panel overflow-visible'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.tableTitle}
          </h2>
        </header>
        <div className='space-y-3 p-3 lg:hidden'>
          {activeOrders.map(order => {
            const commentsCount = (order.comments || []).length
            return (
              <article
                key={order.id}
                className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 shadow-sm'
                role='button'
                tabIndex={0}
                onClick={event => {
                  if (isInteractiveElement(event.target)) return
                  navigateToOrder(order.id)
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigateToOrder(order.id)
                  }
                }}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0 flex-1'>
                    <p className='break-words text-sm font-semibold text-[var(--foreground)]'>
                      {order.patientName}
                    </p>
                    <div className='mt-2 inline-flex max-w-full items-center rounded-xl border border-sky-300/70 bg-sky-50 px-3 py-2 text-sm font-semibold tracking-[0.08em] text-sky-800 shadow-sm dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-100'>
                      <span className='mr-2 text-[10px] uppercase tracking-[0.16em] text-sky-600 dark:text-sky-200'>
                        {t.columns.phone}
                      </span>
                      <span className='break-all'>{order.phone}</span>
                    </div>
                  </div>
                  <button
                    type='button'
                    aria-label={t.deleteOrderLabel}
                    title={t.deleteOrderLabel}
                    onClick={() => confirmDeleteOrder(order)}
                    className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className='mt-3 flex flex-wrap items-center gap-2'>
                  {renderStatusSelect(order)}
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClass(order.category)}`}
                  >
                    {getCategoryLabel(order.category)}
                  </span>
                  {commentsCount > 0 && (
                    <span className='inline-flex min-w-7 justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground)]'>
                      {t.columns.comments}: {commentsCount}
                    </span>
                  )}
                </div>

                <div className='mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--muted)]'>
                  <div className='rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/70 p-2.5'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                      {t.columns.addedBy}
                    </p>
                    <p className='mt-1 break-words text-[var(--foreground)]'>
                      {getOrderCreatorLabel(order)}
                    </p>
                  </div>
                  <div className='rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/70 p-2.5'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                      {t.columns.category}
                    </p>
                    <div className='mt-1'>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClass(order.category)}`}
                      >
                        {getCategoryLabel(order.category)}
                      </span>
                    </div>
                  </div>
                  <div className='rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/70 p-2.5'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                      {t.columns.versement}
                    </p>
                    <p className='mt-1 text-[var(--foreground)]'>
                      {Number(order.versement || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className='col-span-2 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/70 p-2.5'>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                      {t.columns.products}
                    </p>
                    <p className='mt-1 break-words text-[var(--foreground)]'>
                      {compactProductsText(order.products)}
                    </p>
                  </div>
                </div>

              </article>
            )
          })}
        </div>

        <div className='hidden overflow-x-auto lg:block'>
          <table className='w-full table-fixed text-left text-sm'>
            <thead>
              <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.patient}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.phone}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.products}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.category}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.addedBy}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.versement}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.status}</th>
                <th className='px-3 py-3 text-right font-medium sm:px-5'>{t.columns.comments}</th>
                <th className='px-3 py-3 text-right font-medium sm:px-5'>{t.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map(order => {
                const commentsCount = (order.comments || []).length
                return (
                  <tr
                    key={order.id}
                    className='border-b border-[var(--border)]/70 align-top transition hover:bg-[var(--surface-soft)]'
                    role='button'
                    tabIndex={0}
                    onClick={event => {
                      if (isInteractiveElement(event.target)) return
                      navigateToOrder(order.id)
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigateToOrder(order.id)
                      }
                    }}
                  >
                    <td className='px-3 py-3 text-[var(--foreground)] sm:px-5'>
                      <p className='break-words font-medium'>{order.patientName}</p>
                    </td>
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      <p className='break-all'>{order.phone}</p>
                    </td>
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      <p className='break-words'>{productsToText(order.products)}</p>
                    </td>
                    <td className='px-3 py-3 sm:px-5'>
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClass(order.category)}`}
                      >
                        {getCategoryLabel(order.category)}
                      </span>
                    </td>
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      <p className='break-words'>{getOrderCreatorLabel(order)}</p>
                    </td>
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      <span>{Number(order.versement || 0).toFixed(2)}</span>
                    </td>
                    <td className='px-3 py-3 sm:px-5'>
                      {renderStatusSelect(order)}
                    </td>
                    <td className='px-3 py-3 text-right text-[var(--muted)] sm:px-5'>
                      {commentsCount > 0 ? (
                        <span className='inline-flex min-w-7 justify-center rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--foreground)]'>
                          {commentsCount}
                        </span>
                      ) : (
                        <span className='text-xs text-[var(--muted)]'>-</span>
                      )}
                    </td>
                    <td className='px-3 py-3 text-right sm:px-5'>
                      <button
                        type='button'
                        aria-label={t.deleteOrderLabel}
                        title={t.deleteOrderLabel}
                        onClick={() => confirmDeleteOrder(order)}
                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className='panel overflow-visible'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <h2 className='text-lg font-semibold text-[var(--foreground)]'>
              {t.finishedTableTitle}
            </h2>
            <button
              onClick={() => setIsFinishedOpen(prev => !prev)}
              className='rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
            >
              {isFinishedOpen ? t.hideFinished : t.showFinished}
            </button>
          </div>
        </header>
        {!isFinishedOpen ? (
          <p className='px-5 py-4 text-sm text-[var(--muted)]'>{t.showFinished}</p>
        ) : finishedOrders.length === 0 ? (
          <p className='px-5 py-4 text-sm text-[var(--muted)]'>{t.finishedEmpty}</p>
        ) : (
          <>
            <div className='space-y-3 p-3 lg:hidden'>
              {finishedOrders.map(order => {
                const commentsCount = (order.comments || []).length
                return (
                  <article
                    key={order.id}
                    className='rounded-2xl border border-emerald-300/70 bg-emerald-50/85 p-3 shadow-sm dark:border-emerald-500/35 dark:bg-emerald-900/20'
                    role='button'
                    tabIndex={0}
                    onClick={event => {
                      if (isInteractiveElement(event.target)) return
                      navigateToOrder(order.id)
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        navigateToOrder(order.id)
                      }
                    }}
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0 flex-1'>
                        <p className='break-words text-sm font-semibold text-[var(--foreground)]'>
                          {order.patientName}
                        </p>
                        <div className='mt-2 inline-flex max-w-full items-center rounded-xl border border-emerald-300/80 bg-white/85 px-3 py-2 text-sm font-semibold tracking-[0.08em] text-emerald-800 shadow-sm dark:border-emerald-500/35 dark:bg-emerald-950/30 dark:text-emerald-100'>
                          <span className='mr-2 text-[10px] uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200'>
                            {t.columns.phone}
                          </span>
                          <span className='break-all'>{order.phone}</span>
                        </div>
                        <p className='mt-1 break-words text-xs text-[var(--muted)]'>
                          {compactProductsText(order.products)}
                        </p>
                      </div>
                      <button
                        type='button'
                        aria-label={t.deleteOrderLabel}
                        title={t.deleteOrderLabel}
                        onClick={() => confirmDeleteOrder(order)}
                        className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]'>
                      <span
                        className={`rounded-full border px-2 py-1 font-semibold ${getCategoryClass(order.category)}`}
                      >
                        {getCategoryLabel(order.category)}
                      </span>
                      <span className='rounded-full border border-emerald-300/80 bg-white/80 px-2 py-1 font-semibold text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-950/30 dark:text-emerald-100'>
                        {Number(order.versement || 0).toFixed(2)}
                      </span>
                      {commentsCount > 0 && (
                        <span className='rounded-full border border-emerald-300/80 bg-white/80 px-2 py-1 font-semibold text-emerald-800 dark:border-emerald-500/35 dark:bg-emerald-950/30 dark:text-emerald-100'>
                          {t.columns.comments}: {commentsCount}
                        </span>
                      )}
                    </div>
                    <p className='mt-3 text-xs text-[var(--muted)]'>
                      {t.columns.addedBy}: {getOrderCreatorLabel(order)}
                    </p>
                    <div className='mt-3'>{renderStatusSelect(order)}</div>
                  </article>
                )
              })}
            </div>
            <div className='hidden overflow-x-auto lg:block'>
              <table className='w-full table-fixed text-left text-sm'>
                <thead>
                  <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.patient}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.phone}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.products}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.category}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.addedBy}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.versement}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.status}</th>
                    <th className='px-3 py-3 text-right font-medium sm:px-5'>
                      {t.columns.comments}
                    </th>
                    <th className='px-3 py-3 text-right font-medium sm:px-5'>
                      {t.columns.actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {finishedOrders.map(order => {
                    const commentsCount = (order.comments || []).length
                    return (
                      <tr
                        key={order.id}
                        className='border-b border-emerald-200/80 bg-emerald-50/70 align-top transition hover:bg-emerald-100/70 dark:border-emerald-500/25 dark:bg-emerald-900/15 dark:hover:bg-emerald-900/25'
                        role='button'
                        tabIndex={0}
                        onClick={event => {
                          if (isInteractiveElement(event.target)) return
                          navigateToOrder(order.id)
                        }}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            navigateToOrder(order.id)
                          }
                        }}
                      >
                        <td className='px-3 py-3 text-[var(--foreground)] sm:px-5'>
                          <p className='break-words font-medium'>{order.patientName}</p>
                        </td>
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          <p className='break-all'>{order.phone}</p>
                        </td>
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          <p className='break-words'>{productsToText(order.products)}</p>
                        </td>
                        <td className='px-3 py-3 sm:px-5'>
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getCategoryClass(order.category)}`}
                          >
                            {getCategoryLabel(order.category)}
                          </span>
                        </td>
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          <p className='break-words'>{getOrderCreatorLabel(order)}</p>
                        </td>
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          <span>{Number(order.versement || 0).toFixed(2)}</span>
                        </td>
                        <td className='px-3 py-3 sm:px-5'>
                          {renderStatusSelect(order)}
                        </td>
                        <td className='px-3 py-3 text-right text-[var(--muted)] sm:px-5'>
                          {commentsCount > 0 ? (
                            <span className='inline-flex min-w-7 justify-center rounded-full bg-[var(--surface-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--foreground)]'>
                              {commentsCount}
                            </span>
                          ) : (
                            <span className='text-xs text-[var(--muted)]'>-</span>
                          )}
                        </td>
                        <td className='px-3 py-3 text-right sm:px-5'>
                          <button
                            type='button'
                            aria-label={t.deleteOrderLabel}
                            title={t.deleteOrderLabel}
                            onClick={() => confirmDeleteOrder(order)}
                            className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {pinModalOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <h3 className='text-base font-semibold text-[var(--foreground)]'>
              {locale === 'fr' ? 'Confirmation PIN' : 'PIN confirmation'}
            </h3>
            <p className='mt-1 text-sm text-[var(--muted)]'>
              {locale === 'fr'
                ? 'Entrez votre PIN pour confirmer la creation de la commande.'
                : 'Enter your PIN to confirm order creation.'}
            </p>
            {pinError && (
              <p className='mt-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-600'>
                {pinError}
              </p>
            )}
            <input
              ref={pinInputRef}
              type='password'
              inputMode='numeric'
              pattern='[0-9]{2,6}'
              maxLength={6}
              value={pinInput}
              onChange={event =>
                setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void handlePinConfirmSubmit()
                }
              }}
              placeholder={locale === 'fr' ? 'PIN (2-6 chiffres)' : 'PIN (2-6 digits)'}
              className='mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            <div className='mt-4 flex justify-end gap-2'>
              <button
                onClick={() => {
                  if (isPinSubmitting) return
                  setPinModalOpen(false)
                  setPinInput('')
                  setPinError('')
                }}
                className='rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={() => void handlePinConfirmSubmit()}
                disabled={isPinSubmitting || pinInput.length < 2 || pinInput.length > 6}
                className='rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
              >
                {isPinSubmitting
                  ? locale === 'fr'
                    ? 'Validation...'
                    : 'Validating...'
                  : locale === 'fr'
                    ? 'Confirmer'
                    : 'Confirm'}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
