'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import AppShell from '@/app/components/AppShell'
import { formatShortDate, getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const digitsOnly = value => value.replace(/\D/g, '')
const parseProductsInput = value =>
  String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
const productsToText = products =>
  Array.isArray(products) ? products.join(', ') : ''

function formatDateTime(dateValue, locale) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

function formatOrderActionDescription(description) {
  const text = String(description || '').trim()
  if (!text) return ''

  return text
    .replace(/\s+order\s+[a-f0-9]{24}/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

const orderCategoryOptions = [
  'general',
  'orthopedie',
  'caba',
  'medicament',
  'parapharmacie',
  'dermo-cosmetique'
]

export default function OrderDetailsPage() {
  const router = useRouter()
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { id } = useParams()
  const {
    locale,
    orders,
    isOrdersLoading,
    updateOrder,
    addOrderComment,
    deleteOrderComment,
    deleteOrder,
    fetchOrderActions,
    showConfirmToast
  } = useSession()
  const t = getCopy(locale)
  const orderText = t.orders
  const categoryLabels = orderText.categories || {}

  const order = useMemo(() => orders.find(item => item.id === id), [id, orders])
  const [comment, setComment] = useState('')
  const [actions, setActions] = useState([])
  const [isActionsLoading, setIsActionsLoading] = useState(false)
  const actionLabels = orderText.actionLabels || {}

  useEffect(() => {
    if (!order?.id) {
      setActions([])
      return
    }

    let isCancelled = false

    async function loadActions() {
      try {
        setIsActionsLoading(true)
        const result =
          typeof fetchOrderActions === 'function'
            ? await fetchOrderActions(order.id)
            : []
        if (!isCancelled) {
          setActions(Array.isArray(result) ? result : [])
        }
      } catch (_error) {
        if (!isCancelled) {
          setActions([])
        }
      } finally {
        if (!isCancelled) {
          setIsActionsLoading(false)
        }
      }
    }

    void loadActions()

    return () => {
      isCancelled = true
    }
  }, [
    order?.id,
    order?.status,
    order?.comments?.length,
    order?.patientName,
    order?.phone,
    order?.arrivalDate,
    order?.versement,
    productsToText(order?.products)
  ])

  function confirmDeleteOrder() {
    showConfirmToast({
      title: orderText.confirmDeleteOrderTitle,
      message: orderText.confirmDeleteOrderMessage,
      confirmLabel: orderText.confirmDelete,
      cancelLabel: orderText.cancelDelete,
      onConfirm: async () => {
        await deleteOrder(order.id)
        router.push('/orders')
      }
    })
  }

  function confirmDeleteComment(commentItem) {
    showConfirmToast({
      title: orderText.confirmDeleteCommentTitle,
      message: orderText.confirmDeleteCommentMessage,
      confirmLabel: orderText.confirmDelete,
      cancelLabel: orderText.cancelDelete,
      onConfirm: () => {
        void deleteOrderComment(order.id, commentItem.id)
      }
    })
  }

  if (isLoading || isBlocked || !user || isOrdersLoading) return null

  if (!order) {
    return (
      <AppShell title={orderText.detailsTitle}>
        <div className='panel p-5 text-sm text-[var(--muted)]'>{orderText.notFound}</div>
      </AppShell>
    )
  }

  return (
    <AppShell title={orderText.detailsTitle}>
      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <Link
              href='/orders'
              className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {orderText.backToOrders}
            </Link>
            <span className='text-sm font-semibold text-[var(--foreground)]'>
              {order.id}
            </span>
          </div>
          <button
            type='button'
            aria-label={orderText.deleteOrderLabel}
            title={orderText.deleteOrderLabel}
            onClick={confirmDeleteOrder}
            className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
          >
            <Trash2 size={18} />
          </button>
        </div>

        <article className='panel p-5'>
          <div className='mb-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)] md:grid-cols-2'>
            <p>
              <span className='font-semibold text-[var(--foreground)]'>
                {orderText.createdByLabel}:{' '}
              </span>
              {order.createdByName || '-'}
            </p>
            <p>
              <span className='font-semibold text-[var(--foreground)]'>
                {orderText.createdAtLabel}:{' '}
              </span>
              {formatDateTime(order.createdAt, locale)}
            </p>
          </div>
          <div className='grid gap-3 md:grid-cols-2'>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.patientName}
              <input
                value={order.patientName}
                onChange={e =>
                  void updateOrder(order.id, { patientName: e.target.value })
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.phone}
              <input
                value={order.phone}
                onChange={e =>
                  void updateOrder(order.id, { phone: digitsOnly(e.target.value) })
                }
                inputMode='numeric'
                pattern='[0-9]*'
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.products}
              <input
                value={productsToText(order.products)}
                onChange={e =>
                  void updateOrder(order.id, {
                    products: parseProductsInput(e.target.value)
                  })
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.category}
              <select
                value={order.category || 'general'}
                onChange={e => void updateOrder(order.id, { category: e.target.value })}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              >
                {orderCategoryOptions.map(category => (
                  <option key={category} value={category}>
                    {categoryLabels[category] || category}
                  </option>
                ))}
              </select>
            </label>
            {order.arrivalDate ? (
              <label className='text-sm text-[var(--muted)]'>
                {orderText.fields.arrivalDate}
                <input
                  type='date'
                  value={order.arrivalDate}
                  onChange={e =>
                    void updateOrder(order.id, { arrivalDate: e.target.value })
                  }
                  onFocus={e => {
                    if (typeof e.currentTarget.showPicker === 'function') {
                      e.currentTarget.showPicker()
                    }
                  }}
                  onKeyDown={e => {
                    if (
                      e.key.length === 1 ||
                      e.key === 'Backspace' ||
                      e.key === 'Delete'
                    ) {
                      e.preventDefault()
                    }
                  }}
                  onPaste={e => e.preventDefault()}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
                />
                <p className='mt-1 text-xs text-[var(--muted)]'>
                  {formatShortDate(order.arrivalDate, locale)}
                </p>
              </label>
            ) : null}
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.versement}
              <input
                type='number'
                min='0'
                step='0.01'
                value={order.versement ?? 0}
                onChange={e =>
                  void updateOrder(order.id, {
                    versement: Number(e.target.value || 0)
                  })
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.columns.status}
              <select
                value={order.status}
                onChange={e => void updateOrder(order.id, { status: e.target.value })}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              >
                <option value='pending'>{orderText.status.pending}</option>
                <option value='ordered'>{orderText.status.ordered}</option>
                <option value='arrived'>{orderText.status.arrived}</option>
                <option value='finished'>{orderText.status.finished}</option>
              </select>
            </label>
          </div>
          <p className='mt-3 text-xs text-[var(--muted)]'>{orderText.saveChanges}</p>
        </article>

        <article className='panel p-5'>
          <h2 className='text-base font-semibold text-[var(--foreground)]'>
            {orderText.columns.comments}
          </h2>
          <div className='mt-3 space-y-3 text-sm'>
            {(order.comments || []).length === 0 ? (
              <p className='text-[var(--muted)]'>{orderText.noComments}</p>
            ) : (
              order.comments.map(item => {
                const canDeleteComment = String(item.authorUserId || '') === String(user.id)

                return (
                  <div
                    key={item.id}
                    className='flex items-start justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'
                  >
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold text-[var(--foreground)]'>
                        {item.author}
                      </p>
                      <p className='text-xs text-[var(--muted)]'>
                        {formatDateTime(item.createdAt, locale)}
                      </p>
                      <p className='mt-2 text-sm text-[var(--muted)]'>{item.text}</p>
                    </div>
                    {canDeleteComment && (
                      <button
                        type='button'
                        aria-label={orderText.deleteCommentLabel}
                        title={orderText.deleteCommentLabel}
                        onClick={() => confirmDeleteComment(item)}
                        className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
          <div className='mt-3 flex gap-2'>
            <input
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={orderText.commentPlaceholder}
              className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
            />
            <button
              onClick={async () => {
                if (!comment.trim()) return
                await addOrderComment(order.id, comment)
                setComment('')
              }}
              className='rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              {orderText.addComment}
            </button>
          </div>
        </article>

        <article className='panel p-5'>
          <h2 className='text-base font-semibold text-[var(--foreground)]'>
            {orderText.actionHistory}
          </h2>
          <div className='mt-3 space-y-3'>
            {isActionsLoading ? (
              <p className='text-sm text-[var(--muted)]'>Loading...</p>
            ) : actions.length === 0 ? (
              <p className='text-sm text-[var(--muted)]'>{orderText.noActions}</p>
            ) : (
              actions.map(item => (
                <div
                  key={item.id}
                  className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'
                >
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {actionLabels[item.action] || item.action}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>
                      {formatDateTime(item.createdAt, locale)}
                    </p>
                  </div>
                  <p className='mt-1 text-xs text-[var(--muted)]'>
                    {item.user?.name || '-'}
                  </p>
                  {item.description && (
                    <p className='mt-2 text-sm text-[var(--muted)]'>
                      {formatOrderActionDescription(item.description)}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </AppShell>
  )
}
