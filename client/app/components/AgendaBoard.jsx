'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSession } from '@/app/providers'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'

const productsToText = products =>
  Array.isArray(products) ? products.join(', ') : ''

function getLocalIsoDate(dateValue) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10)
}

export default function AgendaBoard() {
  const { locale, orders, tasks, updateOrderArrivalDate, updateTask } = useSession()
  const copy = getCopy(locale)
  const t = copy.agenda
  const taskText = copy.tasks
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragMonthTarget, setDragMonthTarget] = useState('')
  const [viewDate, setViewDate] = useState(() => new Date())

  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const monthEnd = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
  const daysInMonth = monthEnd.getDate()
  const mondayBasedOffset = (monthStart.getDay() + 6) % 7

  const dayHeaders = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(getIntlLocale(locale), {
      weekday: 'short'
    })
    const monday = new Date(2026, 0, 5)
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return formatter.format(date)
    })
  }, [locale])

  const monthLabel = new Intl.DateTimeFormat(getIntlLocale(locale), {
    month: 'long',
    year: 'numeric'
  }).format(viewDate)

  function getTaskTypeLabel(task) {
    if (task.type === 'autres' && task.customTypeLabel) {
      return task.customTypeLabel
    }
    return taskText.typeLabels?.[task.type] || task.displayLabel || task.type
  }

  const ordersByDate = useMemo(() => {
    return orders
      .filter(order => order.status !== 'finished')
      .reduce((acc, order) => {
        if (!order.arrivalDate) return acc
        if (!acc[order.arrivalDate]) acc[order.arrivalDate] = []
        acc[order.arrivalDate].push(order)
        return acc
      }, {})
  }, [orders])

  const tasksByDate = useMemo(() => {
    return tasks
      .filter(task => task.status === 'pending')
      .reduce((acc, task) => {
        const taskDate = task.agendaDate || getLocalIsoDate(task.createdAt || task.updatedAt)
        if (!taskDate) return acc
        if (!acc[taskDate]) acc[taskDate] = []
        acc[taskDate].push(task)
        return acc
      }, {})
  }, [tasks])

  useEffect(() => {
    if (!draggedItem || !dragMonthTarget) return undefined

    const direction = dragMonthTarget === 'next' ? 1 : -1
    let intervalId = null
    const timeoutId = window.setTimeout(() => {
      setViewDate(prev =>
        new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
      )
      intervalId = window.setInterval(() => {
        setViewDate(prev =>
          new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
        )
      }, 900)
    }, 420)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [dragMonthTarget, draggedItem])

  function moveMonth(direction) {
    setViewDate(prev =>
      new Date(prev.getFullYear(), prev.getMonth() + direction, 1)
    )
  }

  function handleDragEnd() {
    setDraggedItem(null)
    setDragMonthTarget('')
  }

  function handleDrop(dayDate) {
    if (!draggedItem) return

    if (draggedItem.type === 'order') {
      updateOrderArrivalDate(draggedItem.id, dayDate)
    } else {
      updateTask(draggedItem.id, { agendaDate: dayDate })
    }

    handleDragEnd()
  }

  const dayCells = Array.from({ length: mondayBasedOffset + daysInMonth }).map(
    (_, index) => {
      if (index < mondayBasedOffset) return null
      const dayNumber = index - mondayBasedOffset + 1
      const fullDate = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
      const dayOrders = ordersByDate[fullDate] || []
      const dayTasks = tasksByDate[fullDate] || []

      return {
        dayNumber,
        fullDate,
        orders: dayOrders,
        tasks: dayTasks,
        totalItems: dayOrders.length + dayTasks.length
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
              onClick={() => moveMonth(-1)}
              onDragOver={event => event.preventDefault()}
              onDragEnter={() => setDragMonthTarget('prev')}
              onDragLeave={() => setDragMonthTarget(prev => (prev === 'prev' ? '' : prev))}
              onDrop={() => {
                moveMonth(-1)
                setDragMonthTarget('')
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] ${
                dragMonthTarget === 'prev' ? 'bg-[var(--surface-soft)] ring-2 ring-emerald-400/35' : ''
              }`}
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
              onClick={() => moveMonth(1)}
              onDragOver={event => event.preventDefault()}
              onDragEnter={() => setDragMonthTarget('next')}
              onDragLeave={() => setDragMonthTarget(prev => (prev === 'next' ? '' : prev))}
              onDrop={() => {
                moveMonth(1)
                setDragMonthTarget('')
              }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] ${
                dragMonthTarget === 'next' ? 'bg-[var(--surface-soft)] ring-2 ring-emerald-400/35' : ''
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className='overflow-x-auto'>
        <div className='grid min-w-[720px] grid-cols-7 gap-2'>
          {dayHeaders.map(day => (
            <div
              key={day}
              className='px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]'
            >
              {day}
            </div>
          ))}

          {dayCells.map((cell, index) =>
            cell ? (
              <article
                key={cell.fullDate}
                onDragOver={event => event.preventDefault()}
                onDrop={() => handleDrop(cell.fullDate)}
                onDragEnter={() => setDragMonthTarget('')}
                className='panel min-h-[150px] p-2'
              >
                <header className='mb-2 flex items-center justify-between'>
                  <p className='text-xs font-semibold text-[var(--foreground)]'>
                    {cell.dayNumber}
                  </p>
                  <span className='rounded bg-[var(--surface-soft)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]'>
                    {cell.totalItems}
                  </span>
                </header>
                {cell.totalItems === 0 ? (
                  <p className='text-[11px] text-[var(--muted)]'>{t.noItems}</p>
                ) : (
                  <div className='space-y-2'>
                    {cell.orders.map(order => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={() => setDraggedItem({ type: 'order', id: order.id })}
                        onDragEnd={handleDragEnd}
                        className='cursor-grab rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-2 active:cursor-grabbing'
                      >
                        <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300'>
                          {t.orderLabel}
                        </p>
                        <p className='mt-1 line-clamp-2 break-words text-xs font-semibold text-[var(--foreground)]'>
                          {productsToText(order.products)}
                        </p>
                        <p className='line-clamp-2 break-words text-[11px] text-[var(--muted)]'>
                          {order.patientName}
                        </p>
                      </div>
                    ))}
                    {cell.tasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedItem({ type: 'task', id: task.id })}
                        onDragEnd={handleDragEnd}
                        className='cursor-grab rounded-lg border border-amber-200/80 bg-amber-50/90 p-2 active:cursor-grabbing dark:border-amber-500/25 dark:bg-amber-500/10'
                      >
                        <p className='text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-700 dark:text-amber-300'>
                          {t.taskLabel}
                        </p>
                        <p className='mt-1 line-clamp-2 break-words text-xs font-semibold text-[var(--foreground)]'>
                          {getTaskTypeLabel(task)}
                        </p>
                        <p className='line-clamp-2 break-words text-[11px] text-[var(--muted)]'>
                          {task.patientName || task.comment || task.createdByName || '-'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ) : (
              <div
                key={`empty-${index}`}
                className='min-h-[150px] rounded-xl border border-dashed border-[var(--border)]/60 bg-transparent'
              />
            )
          )}
        </div>
      </div>

      {draggedItem && (
        <div className='pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4'>
          <div className='pointer-events-auto grid w-full max-w-3xl grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.2)] backdrop-blur'>
            <button
              type='button'
              onClick={() => moveMonth(-1)}
              onDragOver={event => event.preventDefault()}
              onDragEnter={() => setDragMonthTarget('prev')}
              onDragLeave={() => setDragMonthTarget(prev => (prev === 'prev' ? '' : prev))}
              className={`flex min-h-16 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                dragMonthTarget === 'prev'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-100'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)]'
              }`}
            >
              <ChevronLeft size={18} />
              {t.previousMonth}
            </button>
            <button
              type='button'
              onClick={() => moveMonth(1)}
              onDragOver={event => event.preventDefault()}
              onDragEnter={() => setDragMonthTarget('next')}
              onDragLeave={() => setDragMonthTarget(prev => (prev === 'next' ? '' : prev))}
              className={`flex min-h-16 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                dragMonthTarget === 'next'
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/35 dark:bg-emerald-500/15 dark:text-emerald-100'
                  : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)]'
              }`}
            >
              {t.nextMonth}
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
