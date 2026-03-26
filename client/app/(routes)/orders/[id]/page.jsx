'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { formatShortDate, getCopy } from '@/app/lib/i18n'
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

export default function OrderDetailsPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { id } = useParams()
  const { locale, orders, isOrdersLoading, updateOrder, addOrderComment } =
    useSession()
  const t = getCopy(locale)
  const orderText = t.orders

  const order = useMemo(() => orders.find(item => item.id === id), [id, orders])
  const [comment, setComment] = useState('')

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

        <article className='panel p-5'>
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
                  if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
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
          <div className='mt-3 space-y-2 text-sm'>
            {(order.comments || []).length === 0 ? (
              <p className='text-[var(--muted)]'>{orderText.noComments}</p>
            ) : (
              order.comments.map(item => (
                <p key={item.id} className='text-[var(--muted)]'>
                  <span className='font-semibold text-[var(--foreground)]'>
                    {item.author}:
                  </span>{' '}
                  {item.text}
                </p>
              ))
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
      </section>
    </AppShell>
  )
}
