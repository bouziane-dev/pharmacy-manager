'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

const statusStyles = {
  'Not Yet':
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  Ordered: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  Arrived:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
}

const urgencyStyles = {
  Urgent: 'text-rose-600 dark:text-rose-400',
  Normal: 'text-[var(--muted)]'
}

function CommentComposer({ orderId, onSubmit, placeholder, cta }) {
  const [text, setText] = useState('')

  return (
    <div className='mt-2 flex gap-2'>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        className='w-full rounded-md border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
      />
      <button
        onClick={async () => {
          if (!text.trim()) return
          await onSubmit(orderId, text)
          setText('')
        }}
        className='rounded-md bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500'
      >
        {cta}
      </button>
    </div>
  )
}

export default function OrdersTable({ showControls = false }) {
  const {
    locale,
    orders,
    createOrder,
    addOrderComment,
    updateOrderStatus
  } = useSession()
  const t = getCopy(locale).orders

  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    productName: '',
    comment: '',
    arrivalDate: '',
    urgency: 'Normal'
  })

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(order =>
      [order.productName, order.patientName, order.phone]
        .join(' ')
        .toLowerCase()
        .includes(q)
    )
  }, [orders, search])

  const today = new Date().toISOString().slice(0, 10)
  const dueOrders = orders.filter(
    order => order.arrivalDate <= today && order.status === 'Not Yet'
  )

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
                value={form.patientName}
                onChange={e =>
                  setForm(prev => ({ ...prev, patientName: e.target.value }))
                }
                placeholder={t.placeholders.patientName}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.phone}
              <input
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t.placeholders.phone}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.productName}
              <input
                value={form.productName}
                onChange={e =>
                  setForm(prev => ({ ...prev, productName: e.target.value }))
                }
                placeholder={t.placeholders.productName}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.arrivalDate}
              <input
                type='date'
                value={form.arrivalDate}
                onChange={e =>
                  setForm(prev => ({ ...prev, arrivalDate: e.target.value }))
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
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
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.urgency}
              <select
                value={form.urgency}
                onChange={e =>
                  setForm(prev => ({ ...prev, urgency: e.target.value }))
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              >
                <option value='Urgent'>{t.urgency.Urgent}</option>
                <option value='Normal'>{t.urgency.Normal}</option>
              </select>
            </label>
          </div>
          <button
            onClick={async () => {
              if (
                !form.patientName.trim() ||
                !form.phone.trim() ||
                !form.productName.trim() ||
                !form.arrivalDate
              )
                return
              await createOrder(form)
              setForm({
                patientName: '',
                phone: '',
                productName: '',
                comment: '',
                arrivalDate: '',
                urgency: 'Normal'
              })
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
                    {order.productName}
                  </p>
                  <p className='text-xs text-[var(--muted)]'>
                    {order.patientName} - {order.phone}
                  </p>
                  <p className='mt-1 text-xs text-[var(--muted)]'>
                    {t.remindersText}
                  </p>
                  <div className='mt-2 flex gap-2'>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'Arrived')}
                      className='rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.arrived}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'Ordered')}
                      className='rounded-md bg-sky-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.ordered}
                    </button>
                    <button
                      onClick={() => void updateOrderStatus(order.id, 'Not Yet')}
                      className='rounded-md bg-amber-600 px-2 py-1 text-xs font-semibold text-white'
                    >
                      {t.reminderActions.notYet}
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
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[820px] table-fixed text-left text-sm'>
            <thead>
              <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.id}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.patient}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.phone}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.product}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.arrivalDate}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.urgency}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.status}</th>
                <th className='px-3 py-3 font-medium sm:px-5'>{t.columns.comments}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr
                  key={order.id}
                  className='border-b border-[var(--border)]/70 align-top transition hover:bg-[var(--surface-soft)]'
                >
                  <td className='px-3 py-3 font-medium text-[var(--foreground)] sm:px-5'>
                    <div className='flex min-w-0 flex-wrap items-center gap-2'>
                      <span className='break-all text-xs sm:text-sm'>{order.id}</span>
                      <Link
                        href={`/orders/${order.id}`}
                        className='rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                      >
                        {t.openDetails}
                      </Link>
                    </div>
                  </td>
                  <td className='px-3 py-3 text-[var(--foreground)] sm:px-5'>
                    <p className='break-words'>{order.patientName}</p>
                  </td>
                  <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                    <p className='break-all'>{order.phone}</p>
                  </td>
                  <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                    <p className='break-words'>{order.productName}</p>
                  </td>
                  <td className='px-3 py-3 text-[var(--muted)] sm:px-5'>
                    {order.arrivalDate}
                  </td>
                  <td className='px-3 py-3 sm:px-5'>
                    <span className={`break-words text-xs font-semibold ${urgencyStyles[order.urgency]}`}>
                      {t.urgency[order.urgency] || order.urgency}
                    </span>
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
                            <option value='Not Yet'>{t.status['Not Yet']}</option>
                            <option value='Ordered'>{t.status.Ordered}</option>
                            <option value='Arrived'>{t.status.Arrived}</option>
                          </select>
                        </label>
                      )}
                    </div>
                  </td>
                  <td className='px-3 py-3 text-xs text-[var(--muted)] sm:px-5'>
                    {(order.comments || []).length === 0 ? (
                      <p>{t.noComments}</p>
                    ) : (
                      <div className='space-y-1'>
                        {order.comments.slice(-3).map(comment => (
                          <p key={comment.id} className='break-words'>
                            <span className='font-semibold text-[var(--foreground)]'>
                              {comment.author}:
                            </span>{' '}
                            {comment.text}
                          </p>
                        ))}
                      </div>
                    )}
                    {showControls && (
                      <CommentComposer
                        orderId={order.id}
                        onSubmit={addOrderComment}
                        placeholder={t.commentPlaceholder}
                        cta={t.addComment}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

