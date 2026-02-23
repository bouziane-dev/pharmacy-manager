'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy } from '@/app/lib/i18n'

export default function AgendaBoard() {
  const { locale, orders, updateOrderArrivalDate } = useSession()
  const t = getCopy(locale).agenda
  const [draggedId, setDraggedId] = useState(null)
  const [viewDate, setViewDate] = useState(() => new Date())

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const daysInMonth = monthEnd.getDate()
  const mondayBasedOffset = (monthStart.getDay() + 6) % 7

  const dayHeaders = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'short'
    })
    const monday = new Date(2026, 0, 5)
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return formatter.format(date)
    })
  }, [locale])

  const monthLabel = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    month: 'long',
    year: 'numeric'
  }).format(viewDate)

  const ordersByDate = useMemo(() => {
    return orders.reduce((acc, order) => {
      if (!acc[order.arrivalDate]) acc[order.arrivalDate] = []
      acc[order.arrivalDate].push(order)
      return acc
    }, {})
  }, [orders])

  function handleDrop(dayDate) {
    if (!draggedId) return
    updateOrderArrivalDate(draggedId, dayDate)
    setDraggedId(null)
  }

  const dayCells = Array.from({ length: mondayBasedOffset + daysInMonth }).map(
    (_, index) => {
      if (index < mondayBasedOffset) return null
      const dayNumber = index - mondayBasedOffset + 1
      const fullDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
      return {
        dayNumber,
        fullDate,
        orders: ordersByDate[fullDate] || []
      }
    }
  )

  return (
    <section className='space-y-3'>
      <div className='panel p-4'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <p className='text-lg font-semibold capitalize text-[var(--foreground)]'>
              {monthLabel}
            </p>
            <p className='text-sm text-[var(--muted)]'>{t.monthHint}</p>
          </div>
          <div className='flex items-center gap-2'>
            <button
              onClick={() =>
                setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
              }
              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {t.today}
            </button>
            <button
              onClick={() =>
                setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
              }
              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-7 gap-2'>
        {dayHeaders.map(day => (
          <div key={day} className='px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'>
            {day}
          </div>
        ))}

        {dayCells.map((cell, index) =>
          cell ? (
            <article
              key={cell.fullDate}
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(cell.fullDate)}
              className='panel min-h-[150px] p-2'
            >
              <header className='mb-2 flex items-center justify-between'>
                <p className='text-xs font-semibold text-[var(--foreground)]'>{cell.dayNumber}</p>
                <span className='rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]'>
                  {cell.orders.length}
                </span>
              </header>
              {cell.orders.length === 0 ? (
                <p className='text-[11px] text-[var(--muted)]'>{t.noOrders}</p>
              ) : (
                <div className='space-y-2'>
                  {cell.orders.map(order => (
                    <div
                      key={order.id}
                      draggable
                      onDragStart={() => setDraggedId(order.id)}
                      className='cursor-grab rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-2 active:cursor-grabbing'
                    >
                      <p className='text-[10px] font-semibold uppercase text-[var(--muted)]'>
                        {order.id}
                      </p>
                      <p className='mt-1 text-xs font-semibold text-[var(--foreground)]'>
                        {order.productName}
                      </p>
                      <p className='text-[11px] text-[var(--muted)]'>{order.patientName}</p>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ) : (
            <div key={`empty-${index}`} className='min-h-[150px] rounded-xl border border-dashed border-[var(--border)]/60 bg-transparent' />
          )
        )}
      </div>
    </section>
  )
}
