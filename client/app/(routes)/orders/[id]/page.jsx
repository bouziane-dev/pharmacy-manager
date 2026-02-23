'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function OrderDetailsPage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { id } = useParams()
  const { locale, orders, updateOrder, addOrderComment } = useSession()
  const t = getCopy(locale)
  const orderText = t.orders

  const order = useMemo(() => orders.find(item => item.id === id), [id, orders])
  const [comment, setComment] = useState('')

  if (isLoading || isBlocked || !user) return null

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
                  updateOrder(order.id, { patientName: e.target.value })
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.phone}
              <input
                value={order.phone}
                onChange={e => updateOrder(order.id, { phone: e.target.value })}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.productName}
              <input
                value={order.productName}
                onChange={e =>
                  updateOrder(order.id, { productName: e.target.value })
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
                  updateOrder(order.id, { arrivalDate: e.target.value })
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.fields.urgency}
              <select
                value={order.urgency}
                onChange={e => updateOrder(order.id, { urgency: e.target.value })}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              >
                <option value='Urgent'>{orderText.urgency.Urgent}</option>
                <option value='Normal'>{orderText.urgency.Normal}</option>
              </select>
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {orderText.columns.status}
              <select
                value={order.status}
                onChange={e => updateOrder(order.id, { status: e.target.value })}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
              >
                <option value='Not Yet'>{orderText.status['Not Yet']}</option>
                <option value='Ordered'>{orderText.status.Ordered}</option>
                <option value='Arrived'>{orderText.status.Arrived}</option>
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
              onClick={() => {
                if (!comment.trim()) return
                addOrderComment(order.id, comment)
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
