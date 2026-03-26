'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/app/providers'
import { formatShortDate, getCopy } from '@/app/lib/i18n'

const statusStyles = {
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ordered: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  arrived: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  finished: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
}

const digitsOnly = value => value.replace(/\D/g, '')
const requiredFieldOrder = ['patientName', 'phone', 'productsInput', 'arrivalDate']

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

function getLocalIsoDate() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

export default function OrdersTable({ showControls = false }) {
  const router = useRouter()
  const { locale, user, orders, createOrder, updateOrderStatus, resolveStaffByPin, loginWithPin } =
    useSession()
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
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    productsInput: '',
    comment: '',
    arrivalDate: '',
    versement: '0'
  })
  const patientNameRef = useRef(null)
  const phoneRef = useRef(null)
  const productsInputRef = useRef(null)
  const arrivalDateRef = useRef(null)
  const pinInputRef = useRef(null)

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
    if (!form.arrivalDate) {
      errors.arrivalDate = t.validation.arrivalDateRequired
    }

    const versementValue = Number(form.versement || 0)
    if (!Number.isFinite(versementValue) || versementValue < 0) {
      errors.versement = t.validation.versementInvalid
    }

    return errors
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders

    return orders.filter(order =>
      [productsToText(order.products), order.patientName, order.phone]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [orders, search])

  const activeOrders = filteredOrders.filter(order => order.status !== 'finished')
  const finishedOrders = filteredOrders.filter(order => order.status === 'finished')
  const today = getLocalIsoDate()
  const dueOrders = activeOrders.filter(
    order => order.arrivalDate <= today && order.status === 'pending'
  )

  function navigateToOrder(orderId) {
    router.push(`/orders/${orderId}`)
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

  async function submitOrder(tokenOverride = null) {
    try {
      await createOrder(
        {
          patientName: form.patientName,
          phone: form.phone,
          products: parseProductsInput(form.productsInput),
          comment: form.comment,
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
      arrivalDate: '',
      versement: '0'
    })
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
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.patientName}
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
              {t.fields.phone}
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
            <label className='text-sm text-[var(--muted)] md:col-span-2'>
              {t.fields.products}
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
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.arrivalDate}
              <input
                ref={arrivalDateRef}
                type='date'
                value={form.arrivalDate}
                onChange={e => {
                  const nextValue = e.target.value
                  setForm(prev => ({ ...prev, arrivalDate: nextValue }))
                  if (nextValue) {
                    setFieldErrors(prev => ({ ...prev, arrivalDate: '' }))
                  }
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
                required
                aria-invalid={!!fieldErrors.arrivalDate}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
              {fieldErrors.arrivalDate && (
                <p className='mt-1 text-xs text-red-600'>{fieldErrors.arrivalDate}</p>
              )}
            </label>
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
            <label className='text-sm text-[var(--muted)] md:col-span-2'>
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
          <h2 className='text-base font-semibold text-[var(--foreground)]'>
            {t.searchLabel}
          </h2>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className='mt-2 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
          />
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
            <div className='mt-3 grid gap-3 md:grid-cols-2'>
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
                    {t.remindersText} ({formatShortDate(order.arrivalDate, locale)})
                  </p>
                  <div className='mt-2 flex gap-2'>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'arrived')}
                      className='rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.arrived}
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

      <section className='panel overflow-hidden'>
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
                className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'
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
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {order.patientName}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>{order.phone}</p>
                  </div>
                </div>

                <p className='mt-2 text-xs text-[var(--muted)]'>
                  <span className='font-semibold text-[var(--foreground)]'>
                    {t.columns.products}:{' '}
                  </span>
                  {productsToText(order.products)}
                </p>
                <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]'>
                  <p>
                    <span className='font-semibold text-[var(--foreground)]'>
                      {t.columns.arrivalDate}:{' '}
                    </span>
                    {formatShortDate(order.arrivalDate, locale)}
                  </p>
                  <p>
                    <span className='font-semibold text-[var(--foreground)]'>
                      {t.columns.versement}:{' '}
                    </span>
                    {Number(order.versement || 0).toFixed(2)}
                  </p>
                  {commentsCount > 0 && (
                    <p>
                      <span className='font-semibold text-[var(--foreground)]'>
                        {t.columns.comments}:{' '}
                      </span>
                      {commentsCount}
                    </p>
                  )}
                </div>

                <div className='mt-2'>
                  <span
                    className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status] || ''}`}
                  >
                    {t.status[order.status] || order.status}
                  </span>
                  {showControls && (
                    <label className='mt-2 block text-[10px] text-[var(--muted)]'>
                      {t.statusLabel}
                      <select
                        value={order.status}
                        onChange={e => void updateOrderStatus(order.id, e.target.value)}
                        className='mt-1 w-full rounded border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)]'
                      >
                        <option value='pending'>{t.status.pending}</option>
                        <option value='ordered'>{t.status.ordered}</option>
                        <option value='arrived'>{t.status.arrived}</option>
                        <option value='finished'>{t.status.finished}</option>
                      </select>
                    </label>
                  )}
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
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.arrivalDate}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.versement}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.status}</th>
                <th className='px-3 py-3 text-right font-medium sm:px-5'>{t.columns.comments}</th>
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
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      {formatShortDate(order.arrivalDate, locale)}
                    </td>
                    <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                      <span>{Number(order.versement || 0).toFixed(2)}</span>
                    </td>
                    <td className='px-3 py-3 sm:px-5'>
                      <div className='space-y-1'>
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[order.status] || ''}`}
                        >
                          {t.status[order.status] || order.status}
                        </span>
                        {showControls && (
                          <label className='block text-[10px] text-[var(--muted)]'>
                            {t.statusLabel}
                            <select
                              value={order.status}
                              onChange={e =>
                                void updateOrderStatus(order.id, e.target.value)
                              }
                              className='mt-1 w-full rounded border border-[var(--border)] bg-transparent px-1.5 py-1 text-[11px] text-[var(--foreground)]'
                            >
                              <option value='pending'>{t.status.pending}</option>
                              <option value='ordered'>{t.status.ordered}</option>
                              <option value='arrived'>{t.status.arrived}</option>
                              <option value='finished'>{t.status.finished}</option>
                            </select>
                          </label>
                        )}
                      </div>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className='panel overflow-hidden'>
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
                    className='rounded-xl border border-emerald-300/70 bg-emerald-50/85 p-3 dark:border-emerald-500/35 dark:bg-emerald-900/20'
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
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {order.patientName}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>{productsToText(order.products)}</p>
                    <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--muted)]'>
                      <p>{formatShortDate(order.arrivalDate, locale)}</p>
                      <p>{Number(order.versement || 0).toFixed(2)}</p>
                      {commentsCount > 0 && <p>{t.columns.comments}: {commentsCount}</p>}
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
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.arrivalDate}</th>
                    <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.versement}</th>
                    <th className='px-3 py-3 text-right font-medium sm:px-5'>
                      {t.columns.comments}
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
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          {formatShortDate(order.arrivalDate, locale)}
                        </td>
                        <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                          <span>{Number(order.versement || 0).toFixed(2)}</span>
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
