'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

const orderStatusStyles = {
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ordered: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  called: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
  arrived:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  finished:
    'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
}

const taskStatusStyles = {
  pending:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  done:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
}

function productsToText(products) {
  if (!Array.isArray(products)) return ''
  return products.join(', ')
}

function compactText(value, maxLength = 92) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3)}...`
}

function formatDateTime(dateValue, locale) {
  if (!dateValue) return '-'
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return String(dateValue)

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function normalizeSearch(value) {
  return String(value || '').trim().toLowerCase()
}

export default function DashboardWorkTable() {
  const { locale, orders, tasks } = useSession()
  const t = getCopy(locale)
  const workText = t.dashboard.workTable
  const orderText = t.orders
  const taskText = t.tasks
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('all')

  function getTaskTypeLabel(task) {
    if (task.type === 'autres' && task.customTypeLabel) {
      return task.customTypeLabel
    }
    return taskText.typeLabels?.[task.type] || task.displayLabel || task.type
  }

  const rows = useMemo(() => {
    const orderRows = orders.map(order => {
      const products = productsToText(order.products)
      const statusLabel = orderText.status?.[order.status] || order.status

      return {
        id: `order-${order.id}`,
        kind: 'order',
        href: `/orders/${order.id}`,
        typeLabel: workText.orderType,
        title: products || order.patientName || order.id,
        detail: order.patientName || '-',
        phone: order.phone || '-',
        addedById: order.createdBy || '',
        addedBy: order.createdByName || '-',
        status: statusLabel,
        statusClass: orderStatusStyles[order.status] || orderStatusStyles.pending,
        dateValue: order.createdAt,
        dateLabel: formatDateTime(order.createdAt, locale),
        searchText: [
          products,
          order.patientName,
          order.phone,
          order.createdByName,
          order.category,
          statusLabel,
          ...(order.comments || []).map(item => item.text)
        ].join(' ')
      }
    })

    const taskRows = tasks.map(task => {
      const typeLabel = getTaskTypeLabel(task)
      const statusLabel = taskText.status?.[task.status] || task.status

      return {
        id: `task-${task.id}`,
        kind: 'task',
        href: '/taches',
        typeLabel: workText.taskType,
        title: typeLabel,
        detail: task.patientName || task.comment || '-',
        phone: task.phone || '-',
        addedById: task.createdBy || '',
        addedBy: task.createdByName || '-',
        status: statusLabel,
        statusClass: taskStatusStyles[task.status] || taskStatusStyles.pending,
        dateValue: task.updatedAt || task.createdAt,
        dateLabel: formatDateTime(task.updatedAt || task.createdAt, locale),
        searchText: [
          typeLabel,
          task.displayLabel,
          task.comment,
          task.patientName,
          task.phone,
          task.createdByName,
          statusLabel,
          ...(task.comments || []).map(item => item.text)
        ].join(' ')
      }
    })

    return [...orderRows, ...taskRows].sort(
      (a, b) => new Date(b.dateValue || 0) - new Date(a.dateValue || 0)
    )
  }, [locale, orderText.status, orders, taskText.status, tasks, workText.orderType, workText.taskType])

  const userOptions = useMemo(() => {
    const optionsByKey = new Map()
    rows.forEach(row => {
      const label = String(row.addedBy || '').trim()
      if (!label || label === '-') return
      const key = row.addedById || label
      if (!optionsByKey.has(key)) {
        optionsByKey.set(key, { key, label })
      }
    })
    return [...optionsByKey.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    const query = normalizeSearch(search)

    return rows.filter(row =>
      (userFilter === 'all' ||
        row.addedById === userFilter ||
        row.addedBy === userFilter) &&
      (!query ||
        [row.typeLabel, row.title, row.detail, row.phone, row.addedBy, row.status, row.searchText]
          .join(' ')
          .toLowerCase()
          .includes(query))
    )
  }, [rows, search, userFilter])

  return (
    <section className='panel overflow-hidden'>
      <header className='border-b border-[var(--border)] px-5 py-4'>
        <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)_minmax(12rem,16rem)] lg:items-center'>
          <div>
            <h2 className='text-lg font-semibold text-[var(--foreground)]'>
              {workText.title}
            </h2>
            <p className='mt-1 text-xs font-semibold text-[var(--muted)]'>
              {workText.resultCount.replace('{count}', filteredRows.length)}
            </p>
          </div>
          <label className='relative block'>
            <span className='sr-only'>{workText.searchLabel}</span>
            <Search
              size={16}
              className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]'
            />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={workText.searchPlaceholder}
              className='w-full rounded-xl border border-[var(--border)] bg-transparent py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
          </label>
          <label className='text-sm text-[var(--muted)]'>
            {workText.userFilterLabel}
            <select
              value={userFilter}
              onChange={event => setUserFilter(event.target.value)}
              className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            >
              <option value='all'>{workText.allUsers}</option>
              {userOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {filteredRows.length === 0 ? (
        <p className='px-5 py-8 text-center text-sm text-[var(--muted)]'>
          {workText.empty}
        </p>
      ) : (
        <>
          <div className='space-y-3 p-3 lg:hidden'>
            {filteredRows.map(row => (
              <Link
                key={row.id}
                href={row.href}
                className='block rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 shadow-sm transition hover:bg-[var(--surface)]'
              >
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div className='min-w-[12rem] flex-1'>
                    <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                      {row.typeLabel}
                    </p>
                    <p className='mt-1 break-words text-sm font-semibold text-[var(--foreground)]'>
                      {compactText(row.title)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.statusClass}`}
                  >
                    {row.status}
                  </span>
                </div>
                <div className='mt-3 grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2'>
                  <p>{compactText(row.detail, 56)}</p>
                  <p className='break-all'>{row.phone}</p>
                  <p>{workText.columns.addedBy}: {compactText(row.addedBy, 36)}</p>
                  <p>{row.dateLabel}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className='hidden lg:block'>
            <table className='w-full table-fixed text-left text-xs xl:text-sm'>
              <colgroup>
                <col className='w-[10%]' />
                <col className='w-[29%]' />
                <col className='w-[15%]' />
                <col className='w-[11%]' />
                <col className='w-[13%]' />
                <col className='w-[10%]' />
                <col className='w-[12%]' />
              </colgroup>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.type}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.item}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.patient}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.phone}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.addedBy}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.status}</th>
                  <th className='px-2 py-3 font-medium xl:px-3'>{workText.columns.date}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(row => (
                  <tr
                    key={row.id}
                    className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]'
                  >
                    <td className='px-2 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)] xl:px-3'>
                      {row.typeLabel}
                    </td>
                    <td className='px-2 py-3 xl:px-3'>
                      <Link
                        href={row.href}
                        className='block break-words font-semibold leading-5 text-[var(--foreground)] transition hover:text-emerald-700 dark:hover:text-emerald-300'
                      >
                        {row.title}
                      </Link>
                    </td>
                    <td className='px-2 py-3 text-[var(--muted)] xl:px-3'>
                      <p className='break-words'>{compactText(row.detail, 42)}</p>
                    </td>
                    <td className='px-2 py-3 text-[var(--muted)] xl:px-3'>
                      <p className='break-all'>{row.phone}</p>
                    </td>
                    <td className='px-2 py-3 text-[var(--muted)] xl:px-3'>
                      <p className='break-words'>{compactText(row.addedBy, 32)}</p>
                    </td>
                    <td className='px-2 py-3 xl:px-3'>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold xl:text-[11px] ${row.statusClass}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className='px-2 py-3 text-[11px] text-[var(--muted)] xl:px-3 xl:text-xs'>
                      {row.dateLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
