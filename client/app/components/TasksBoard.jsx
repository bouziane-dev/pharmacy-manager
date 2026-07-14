'use client'

import { useMemo, useState } from 'react'
import { MessageSquare, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

const taskTypeOptions = ['ordonnance', 'patient_convoque', 'patient_appel', 'autres']
const taskStatusOptions = ['pending', 'done']
const taskTabOptions = ['pending', 'done', 'all']
const statusStyles = {
  pending:
    'border-amber-200 bg-amber-100/80 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200',
  done:
    'border-emerald-200 bg-emerald-100/80 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200'
}
const cardToneStyles = {
  pending:
    'border-amber-200/90 bg-[linear-gradient(160deg,rgba(255,251,235,0.98),rgba(255,255,255,0.95))] dark:border-amber-500/20 dark:bg-[linear-gradient(160deg,rgba(51,33,3,0.54),rgba(15,23,42,0.9))]',
  done:
    'border-emerald-200/80 bg-[linear-gradient(160deg,rgba(240,253,244,0.94),rgba(255,255,255,0.94))] opacity-90 dark:border-emerald-500/20 dark:bg-[linear-gradient(160deg,rgba(6,78,59,0.34),rgba(15,23,42,0.88))]'
}

function normalizeText(value) {
  return String(value || '').trim()
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
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

export default function TasksBoard() {
  const {
    locale,
    user,
    tasks,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    addTaskComment,
    showConfirmToast
  } = useSession()
  const t = getCopy(locale).tasks

  const [activeTab, setActiveTab] = useState('pending')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [fieldErrors, setFieldErrors] = useState({})
  const [editingTaskId, setEditingTaskId] = useState('')
  const [editingDraft, setEditingDraft] = useState(null)
  const [openCommentsTaskId, setOpenCommentsTaskId] = useState('')
  const [commentDraftByTaskId, setCommentDraftByTaskId] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState('')
  const [form, setForm] = useState({
    type: 'ordonnance',
    customTypeLabel: '',
    comment: '',
    patientName: '',
    phone: ''
  })

  const tabCounts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter(task => task.status === 'pending').length,
      done: tasks.filter(task => task.status === 'done').length
    }),
    [tasks]
  )

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase()

    return tasks.filter(task => {
      const matchesTab = activeTab === 'all' ? true : task.status === activeTab
      const matchesType = typeFilter === 'all' ? true : task.type === typeFilter
      const matchesStatus = statusFilter === 'all' ? true : task.status === statusFilter
      const matchesUser =
        userFilter === 'all'
          ? true
          : task.createdBy === userFilter || task.createdByName === userFilter
      if (!matchesTab || !matchesType || !matchesStatus || !matchesUser) return false
      if (!query) return true

      return [
        task.displayLabel,
        task.comment,
        task.patientName,
        task.phone,
        ...(task.comments || []).map(item => item.text)
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [activeTab, search, statusFilter, tasks, typeFilter, userFilter])

  const hasSecondaryFilters =
    search.trim().length > 0 ||
    typeFilter !== 'all' ||
    statusFilter !== 'all' ||
    userFilter !== 'all'

  const userOptions = useMemo(() => {
    const optionsByKey = new Map()
    tasks.forEach(task => {
      const label = String(task.createdByName || '').trim()
      if (!label) return
      const key = task.createdBy || label
      if (!optionsByKey.has(key)) {
        optionsByKey.set(key, { key, label })
      }
    })
    return [...optionsByKey.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    )
  }, [tasks])

  function getTabLabel(statusKey) {
    return t.tabs?.[statusKey] || statusKey
  }

  function getStatusLabel(statusKey) {
    return t.status?.[statusKey] || statusKey
  }

  function getTypeLabel(typeKey, customTypeLabel = '') {
    if (typeKey === 'autres' && normalizeText(customTypeLabel)) {
      return normalizeText(customTypeLabel)
    }
    return t.typeLabels?.[typeKey] || typeKey
  }

  function validateForm(values, selectedType) {
    const errors = {}
    if (!selectedType || !taskTypeOptions.includes(selectedType)) {
      errors.type = t.validation.typeRequired
    }
    if (selectedType === 'autres' && !normalizeText(values.customTypeLabel)) {
      errors.customTypeLabel = t.validation.customTypeLabelRequired
    }
    if (normalizeText(values.phone) && digitsOnly(values.phone) !== normalizeText(values.phone)) {
      errors.phone = t.validation.phoneInvalid
    }
    return errors
  }

  async function handleCreateTask(event) {
    event.preventDefault()
    const nextValues = {
      type: form.type,
      customTypeLabel: normalizeText(form.customTypeLabel),
      comment: normalizeText(form.comment),
      patientName: normalizeText(form.patientName),
      phone: digitsOnly(form.phone)
    }
    const errors = validateForm(nextValues, nextValues.type)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setIsSubmitting(true)
      await createTask(nextValues)
      setForm({
        type: 'ordonnance',
        customTypeLabel: '',
        comment: '',
        patientName: '',
        phone: ''
      })
      setFieldErrors({})
      setActiveTab('pending')
    } finally {
      setIsSubmitting(false)
    }
  }

  function beginEdit(task) {
    setEditingTaskId(task.id)
    setEditingDraft({
      comment: task.comment || '',
      customTypeLabel: task.customTypeLabel || '',
      patientName: task.patientName || '',
      phone: task.phone || ''
    })
  }

  function cancelEdit() {
    setEditingTaskId('')
    setEditingDraft(null)
  }

  async function saveEdit(task) {
    const draft = editingDraft || {}
    const nextValues = {
      comment: normalizeText(draft.comment),
      customTypeLabel: normalizeText(draft.customTypeLabel),
      patientName: normalizeText(draft.patientName),
      phone: digitsOnly(draft.phone)
    }
    const errors = validateForm(nextValues, task.type)
    if (errors.type) delete errors.type
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setBusyTaskId(task.id)
      await updateTask(task.id, {
        comment: nextValues.comment,
        customTypeLabel: task.type === 'autres' ? nextValues.customTypeLabel : '',
        patientName: nextValues.patientName,
        phone: nextValues.phone
      })
      cancelEdit()
    } finally {
      setBusyTaskId('')
    }
  }

  async function handleStatusChange(taskId, status) {
    try {
      setBusyTaskId(taskId)
      await updateTaskStatus(taskId, status)
    } finally {
      setBusyTaskId('')
    }
  }

  async function handleAddComment(taskId) {
    const text = normalizeText(commentDraftByTaskId[taskId])
    if (!text) return

    try {
      setBusyTaskId(taskId)
      await addTaskComment(taskId, text)
      setCommentDraftByTaskId(prev => ({ ...prev, [taskId]: '' }))
      setOpenCommentsTaskId(taskId)
    } finally {
      setBusyTaskId('')
    }
  }

  function confirmDeleteTask(task) {
    showConfirmToast({
      title: t.confirmDeleteTitle,
      message: t.confirmDeleteMessage,
      confirmLabel: t.confirmDelete,
      cancelLabel: t.cancelDelete,
      onConfirm: () => {
        void deleteTask(task.id)
      }
    })
  }

  function getEmptyMessage() {
    if (tasks.length === 0) return t.empty.all
    if (hasSecondaryFilters) return t.empty.filtered
    return t.empty[activeTab] || t.empty.all
  }

  return (
    <section className='space-y-4'>
      <article className='panel overflow-hidden'>
        <div className='border-b border-[var(--border)] bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(2,132,199,0.08),transparent)] px-5 py-4'>
          <div className='flex flex-wrap items-start justify-between gap-3'>
            <div>
              <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.addTitle}</h2>
              <p className='mt-1 max-w-2xl text-sm text-[var(--muted)]'>{t.addDescription}</p>
            </div>
            <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 px-3 py-2 text-right shadow-sm'>
              <p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]'>
                {t.fields.createdBy}
              </p>
              <p className='text-sm font-semibold text-[var(--foreground)]'>
                {user?.name || '-'}
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleCreateTask}
          className='grid gap-4 px-5 py-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]'
        >
          <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='text-sm text-[var(--muted)]'>
                {t.fields.type}
                <select
                  value={form.type}
                  onChange={event => {
                    const nextType = event.target.value
                    setForm(prev => ({
                      ...prev,
                      type: nextType,
                      customTypeLabel: nextType === 'autres' ? prev.customTypeLabel : ''
                    }))
                    setFieldErrors(prev => ({ ...prev, type: '', customTypeLabel: '' }))
                  }}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                >
                  {taskTypeOptions.map(type => (
                    <option key={type} value={type}>
                      {getTypeLabel(type)}
                    </option>
                  ))}
                </select>
                {fieldErrors.type && (
                  <p className='mt-1 text-xs text-red-600'>{fieldErrors.type}</p>
                )}
              </label>

              {form.type === 'autres' && (
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.customTypeLabel}
                  <input
                    value={form.customTypeLabel}
                    onChange={event => {
                      setForm(prev => ({ ...prev, customTypeLabel: event.target.value }))
                      if (normalizeText(event.target.value)) {
                        setFieldErrors(prev => ({ ...prev, customTypeLabel: '' }))
                      }
                    }}
                    placeholder={t.placeholders.customTypeLabel}
                    className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                  {fieldErrors.customTypeLabel && (
                    <p className='mt-1 text-xs text-red-600'>{fieldErrors.customTypeLabel}</p>
                  )}
                </label>
              )}
            </div>

            <label className='block text-sm text-[var(--muted)]'>
              {t.fields.comment}
              <textarea
                value={form.comment}
                onChange={event => setForm(prev => ({ ...prev, comment: event.target.value }))}
                rows={4}
                placeholder={t.placeholders.comment}
                className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>
          </div>

          <div className='rounded-2xl border border-dashed border-[var(--border)]/80 bg-[var(--surface-soft)]/70 p-4'>
            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]'>
              {t.recommendedHint}
            </p>
            <div className='mt-3 grid gap-3'>
              <label className='text-sm text-[var(--muted)]'>
                {t.fields.patientName}
                <input
                  value={form.patientName}
                  onChange={event =>
                    setForm(prev => ({ ...prev, patientName: event.target.value }))
                  }
                  placeholder={t.placeholders.patientName}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
              </label>

              <label className='text-sm text-[var(--muted)]'>
                {t.fields.phone}
                <input
                  value={form.phone}
                  onChange={event => {
                    setForm(prev => ({ ...prev, phone: digitsOnly(event.target.value) }))
                    setFieldErrors(prev => ({ ...prev, phone: '' }))
                  }}
                  inputMode='numeric'
                  placeholder={t.placeholders.phone}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
                {fieldErrors.phone && (
                  <p className='mt-1 text-xs text-red-600'>{fieldErrors.phone}</p>
                )}
              </label>
            </div>

            <button
              type='submit'
              disabled={isSubmitting}
              className='mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#059669,#0284c7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,132,199,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
            >
              <Plus size={16} />
              {isSubmitting ? '...' : t.addButton}
            </button>
          </div>
        </form>
      </article>

      <article className='panel p-4'>
        <div className='flex flex-col gap-3'>
          <div className='flex flex-wrap gap-2'>
            {taskTabOptions.map(statusKey => (
              <button
                key={statusKey}
                type='button'
                onClick={() => setActiveTab(statusKey)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  activeTab === statusKey
                    ? 'border-transparent bg-[linear-gradient(90deg,#059669,#0284c7)] text-white shadow-[0_10px_22px_rgba(2,132,199,0.2)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]'
                }`}
              >
                <span>{getTabLabel(statusKey)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    activeTab === statusKey
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--surface-soft)] text-[var(--muted)]'
                  }`}
                >
                  {tabCounts[statusKey] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className='grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_190px_190px_190px]'>
            <label className='relative block'>
              <span className='sr-only'>{t.filters.searchLabel}</span>
              <Search
                size={16}
                className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]'
              />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder={t.placeholders.search}
                className='w-full rounded-xl border border-[var(--border)] bg-transparent py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.filters.typeLabel}
              <select
                value={typeFilter}
                onChange={event => setTypeFilter(event.target.value)}
                className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
              >
                <option value='all'>{t.filters.allTypes}</option>
                {taskTypeOptions.map(type => (
                  <option key={type} value={type}>
                    {getTypeLabel(type)}
                  </option>
                ))}
              </select>
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.filters.statusLabel}
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value)}
                className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
              >
                <option value='all'>{t.filters.allStatuses}</option>
                {taskStatusOptions.map(status => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.filters.userLabel}
              <select
                value={userFilter}
                onChange={event => setUserFilter(event.target.value)}
                className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
              >
                <option value='all'>{t.filters.allUsers}</option>
                {userOptions.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </article>
      {filteredTasks.length === 0 ? (
        <article className='panel px-6 py-10 text-center'>
          <p className='text-lg font-semibold text-[var(--foreground)]'>{getEmptyMessage()}</p>
          <p className='mt-2 text-sm text-[var(--muted)]'>{t.empty.helper}</p>
        </article>
      ) : (
        <div className='space-y-4 2xl:space-y-5'>
          {filteredTasks.map(task => {
            const isEditing = editingTaskId === task.id
            const taskComments = task.comments || []
            const activeDraft = isEditing ? editingDraft || {} : null

            return (
              <article
                key={task.id}
                className={`panel overflow-hidden ${cardToneStyles[task.status] || ''}`}
              >
                <div className='flex flex-col gap-5 px-4 py-4 sm:px-5 2xl:px-6 2xl:py-5'>
                  <div className='flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
                    <div className='min-w-0 flex-1'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[task.status] || ''}`}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                        <span className='rounded-full border border-[var(--border)] bg-[var(--surface)]/80 px-2.5 py-1 text-xs font-semibold text-[var(--muted)]'>
                          {task.type === 'autres'
                            ? `${t.typeLabels.autres} · ${getTypeLabel(task.type, task.customTypeLabel)}`
                            : getTypeLabel(task.type)}
                        </span>
                      </div>

                      <h3 className='mt-3 text-xl font-semibold tracking-tight text-[var(--foreground)] 2xl:text-[1.35rem]'>
                        {getTypeLabel(task.type, task.customTypeLabel) || task.displayLabel}
                      </h3>
                      <p className='mt-2 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)] 2xl:text-[0.96rem]'>
                        {task.comment || t.noMainComment}
                      </p>
                    </div>

                    <div className='flex flex-wrap items-center gap-2'>
                      <button
                        type='button'
                        onClick={() => beginEdit(task)}
                        className='inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/85 px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                      >
                        <Pencil size={14} />
                        {t.actions.edit}
                      </button>
                      <button
                        type='button'
                        onClick={() =>
                          setOpenCommentsTaskId(prev => (prev === task.id ? '' : task.id))
                        }
                        className='inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)]/85 px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                      >
                        <MessageSquare size={14} />
                        {openCommentsTaskId === task.id
                          ? t.actions.hideComments
                          : `${t.actions.comments} (${taskComments.length})`}
                      </button>
                <button
                  type='button'
                  onClick={() => confirmDeleteTask(task)}
                  className='inline-flex items-center justify-center rounded-xl border border-rose-300/70 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                >
                  <Trash2 size={14} />
                </button>
                    </div>
                  </div>

                  <div className='grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4'>
                    <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2'>
                      <span className='font-semibold text-[var(--foreground)]'>
                        {t.fields.createdBy}:{' '}
                      </span>
                      {task.createdByName || '-'}
                    </p>
                    <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2'>
                      <span className='font-semibold text-[var(--foreground)]'>
                        {t.meta.createdAt}:{' '}
                      </span>
                      {formatDateTime(task.createdAt, locale)}
                    </p>
                    <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2'>
                      <span className='font-semibold text-[var(--foreground)]'>
                        {t.meta.updatedAt}:{' '}
                      </span>
                      {formatDateTime(task.updatedAt, locale)}
                    </p>
                    <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/75 px-3 py-2'>
                      <span className='font-semibold text-[var(--foreground)]'>
                        {t.meta.completedAt}:{' '}
                      </span>
                      {task.completedAt ? formatDateTime(task.completedAt, locale) : '-'}
                    </p>
                  </div>

                  {(task.patientName || task.phone || task.completedByName) && (
                    <div className='grid gap-2 text-xs text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'>
                      {task.patientName && (
                        <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-2'>
                          <span className='font-semibold text-[var(--foreground)]'>
                            {t.meta.patient}:{' '}
                          </span>
                          {task.patientName}
                        </p>
                      )}
                      {task.phone && (
                        <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-2'>
                          <span className='font-semibold text-[var(--foreground)]'>
                            {t.meta.phone}:{' '}
                          </span>
                          {task.phone}
                        </p>
                      )}
                      {task.completedByName && (
                        <p className='rounded-xl border border-[var(--border)] bg-[var(--surface)]/65 px-3 py-2'>
                          <span className='font-semibold text-[var(--foreground)]'>
                            {t.meta.completedBy}:{' '}
                          </span>
                          {task.completedByName}
                        </p>
                      )}
                    </div>
                  )}

                  <div className='flex flex-wrap gap-2'>
                    {taskStatusOptions.map(status => (
                      <button
                        key={status}
                        type='button'
                        disabled={busyTaskId === task.id}
                        onClick={() => void handleStatusChange(task.id, status)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                          task.status === status
                            ? `${statusStyles[status]} shadow-sm`
                            : 'border-[var(--border)] bg-[var(--surface)]/80 text-[var(--foreground)] hover:bg-[var(--surface-soft)]'
                        } ${busyTaskId === task.id ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </div>

                  {isEditing && (
                    <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface)]/82 p-4'>
                      <div className='grid gap-3 md:grid-cols-2'>
                        {task.type === 'autres' && (
                          <label className='text-sm text-[var(--muted)]'>
                            {t.fields.customTypeLabel}
                            <input
                              value={activeDraft?.customTypeLabel || ''}
                              onChange={event => {
                                setEditingDraft(prev => ({
                                  ...(prev || {}),
                                  customTypeLabel: event.target.value
                                }))
                                setFieldErrors(prev => ({ ...prev, customTypeLabel: '' }))
                              }}
                              placeholder={t.placeholders.customTypeLabel}
                              className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                            />
                            {fieldErrors.customTypeLabel && (
                              <p className='mt-1 text-xs text-red-600'>
                                {fieldErrors.customTypeLabel}
                              </p>
                            )}
                          </label>
                        )}

                        <label className='text-sm text-[var(--muted)]'>
                          {t.fields.patientName}
                          <input
                            value={activeDraft?.patientName || ''}
                            onChange={event =>
                              setEditingDraft(prev => ({
                                ...(prev || {}),
                                patientName: event.target.value
                              }))
                            }
                            placeholder={t.placeholders.patientName}
                            className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                          />
                        </label>

                        <label className='text-sm text-[var(--muted)]'>
                          {t.fields.phone}
                          <input
                            value={activeDraft?.phone || ''}
                            onChange={event => {
                              setEditingDraft(prev => ({
                                ...(prev || {}),
                                phone: digitsOnly(event.target.value)
                              }))
                              setFieldErrors(prev => ({ ...prev, phone: '' }))
                            }}
                            inputMode='numeric'
                            placeholder={t.placeholders.phone}
                            className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                          />
                          {fieldErrors.phone && (
                            <p className='mt-1 text-xs text-red-600'>{fieldErrors.phone}</p>
                          )}
                        </label>

                        <label className='text-sm text-[var(--muted)] md:col-span-2'>
                          {t.fields.comment}
                          <textarea
                            value={activeDraft?.comment || ''}
                            onChange={event =>
                              setEditingDraft(prev => ({
                                ...(prev || {}),
                                comment: event.target.value
                              }))
                            }
                            rows={3}
                            placeholder={t.placeholders.comment}
                            className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                          />
                        </label>
                      </div>

                      <div className='mt-4 flex flex-wrap justify-end gap-2'>
                        <button
                          type='button'
                          onClick={cancelEdit}
                          className='rounded-xl border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                        >
                          {t.actions.cancel}
                        </button>
                        <button
                          type='button'
                          disabled={busyTaskId === task.id}
                          onClick={() => void saveEdit(task)}
                          className='rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
                        >
                          {t.actions.save}
                        </button>
                      </div>
                    </div>
                  )}

                  {openCommentsTaskId === task.id && (
                    <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface)]/82 p-4'>
                      <div className='space-y-3'>
                        <div className='space-y-2'>
                          {taskComments.length === 0 ? (
                            <p className='text-sm text-[var(--muted)]'>{t.noTaskComments}</p>
                          ) : (
                            taskComments.map(item => (
                              <article
                                key={item.id}
                                className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/70 px-3 py-2.5'
                              >
                                <div className='flex flex-wrap items-center justify-between gap-2'>
                                  <p className='text-sm font-semibold text-[var(--foreground)]'>
                                    {item.author || '-'}
                                  </p>
                                  <p className='text-xs text-[var(--muted)]'>
                                    {formatDateTime(item.createdAt, locale)}
                                  </p>
                                </div>
                                <p className='mt-1 whitespace-pre-wrap text-sm text-[var(--foreground)]'>
                                  {item.text}
                                </p>
                              </article>
                            ))
                          )}
                        </div>

                        <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]'>
                          <input
                            value={commentDraftByTaskId[task.id] || ''}
                            onChange={event =>
                              setCommentDraftByTaskId(prev => ({
                                ...prev,
                                [task.id]: event.target.value
                              }))
                            }
                            placeholder={t.placeholders.commentInput}
                            className='w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                          />
                          <button
                            type='button'
                            disabled={busyTaskId === task.id}
                            onClick={() => void handleAddComment(task.id)}
                            className='rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60'
                          >
                            {t.actions.addComment}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
