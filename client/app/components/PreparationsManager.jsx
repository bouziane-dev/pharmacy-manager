'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { getCopy } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

const statusOrder = ['en_cours', 'prepared', 'delivered']
const statusStyles = {
  en_cours: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  prepared: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
}

function normalizeInput(value) {
  return String(value || '').trim()
}

function getAssignmentFieldByStatus(status) {
  if (status === 'prepared') return 'preparedBy'
  if (status === 'delivered') return 'deliveredBy'
  return 'receivedBy'
}

function isStaffRequiringPin(user) {
  if (!user) return false
  const accountRole = String(user.accountRole || '').toLowerCase()
  const staffRole = String(user.staffRole || '').toLowerCase()
  return accountRole === 'staff' && staffRole !== 'admin'
}

export default function PreparationsManager() {
  const {
    locale,
    user,
    preparations,
    createPreparation,
    updatePreparation,
    deletePreparation,
    showConfirmToast,
    fetchStaffLoginUsers,
    resolveStaffByPin
  } = useSession()

  const t = getCopy(locale).preparations
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [staffOptions, setStaffOptions] = useState([])
  const [form, setForm] = useState({
    preparationType: '',
    composition: '',
    receivedBy: '',
    notes: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [workflowDraftById, setWorkflowDraftById] = useState({})
  const [notesDraftById, setNotesDraftById] = useState({})
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const pinInputRef = useRef(null)

  const requiresReceivedByPin = isStaffRequiringPin(user)

  useEffect(() => {
    fetchStaffLoginUsers()
      .then(rows => {
        const names = (rows || [])
          .map(item => normalizeInput(item?.name))
          .filter(Boolean)
        setStaffOptions(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)))
      })
      .catch(() => {
        setStaffOptions([])
      })
  }, [fetchStaffLoginUsers])

  useEffect(() => {
    if (!pinModalOpen) return
    const timer = window.setTimeout(() => {
      pinInputRef.current?.focus()
    }, 30)
    return () => window.clearTimeout(timer)
  }, [pinModalOpen])

  const filteredPreparations = useMemo(() => {
    const q = search.trim().toLowerCase()
    return preparations.filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      if (!q) return true
      return [
        item.preparationType,
        item.composition,
        item.receivedBy,
        item.preparedBy,
        item.deliveredBy,
        item.notes
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [preparations, search, statusFilter])

  function getWorkflowDraft(item) {
    return (
      workflowDraftById[item.id] || {
        status: item.status || 'en_cours',
        receivedBy: item.receivedBy || '',
        preparedBy: item.preparedBy || '',
        deliveredBy: item.deliveredBy || ''
      }
    )
  }

  function updateWorkflowDraft(itemId, updates) {
    setWorkflowDraftById(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...updates
      }
    }))
  }

  function validateCreateForm() {
    const errors = {}
    if (!normalizeInput(form.preparationType)) {
      errors.preparationType = 'Required'
    }
    if (!normalizeInput(form.composition)) {
      errors.composition = 'Required'
    }
    if (!normalizeInput(form.receivedBy)) {
      errors.receivedBy = 'Required'
    }
    return errors
  }

  async function submitCreatePreparation() {
    await createPreparation({
      preparationType: form.preparationType,
      composition: form.composition,
      receivedBy: form.receivedBy,
      status: 'en_cours',
      notes: form.notes
    })

    setForm({
      preparationType: '',
      composition: '',
      receivedBy: '',
      notes: ''
    })
  }

  async function handleCreatePreparation() {
    const errors = validateCreateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!requiresReceivedByPin) {
      await submitCreatePreparation()
      return
    }

    setPinInput('')
    setPinError('')
    setPinModalOpen(true)
  }

  async function handlePinConfirmSubmit() {
    const normalizedPin = pinInput.replace(/\D/g, '').slice(0, 6)
    if (normalizedPin.length < 2 || normalizedPin.length > 6) {
      setPinError(locale === 'fr' ? 'PIN invalide (2-6 chiffres).' : 'Invalid PIN (2-6 digits).')
      return
    }

    try {
      setPinError('')
      const matchedStaff = await resolveStaffByPin(normalizedPin)
      const selectedReceivedBy = normalizeInput(form.receivedBy).toLowerCase()
      const matchedName = normalizeInput(matchedStaff?.name).toLowerCase()

      if (!matchedName || matchedName !== selectedReceivedBy) {
        setPinError(
          locale === 'fr'
            ? 'Le PIN doit correspondre au pharmacien selectionne dans Recu par.'
            : 'PIN must match the selected pharmacist in Received by.'
        )
        return
      }

      await submitCreatePreparation()
      setPinModalOpen(false)
      setPinInput('')
      setPinError('')
    } catch (_error) {
      setPinError(locale === 'fr' ? 'PIN incorrect.' : 'Incorrect PIN.')
    }
  }

  async function handleSaveWorkflow(item) {
    const draft = getWorkflowDraft(item)
    const assignmentField = getAssignmentFieldByStatus(draft.status)
    const assignmentName = normalizeInput(draft[assignmentField])

    if (!assignmentName) {
      return
    }

    await updatePreparation(item.id, {
      status: draft.status,
      [assignmentField]: assignmentName
    })
  }

  return (
    <section className='space-y-4'>
      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.addTitle}</h2>
        <p className='mt-1 text-sm text-[var(--muted)]'>{t.addDescription}</p>

        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          <label className='text-sm text-[var(--muted)]'>
            {t.fields.preparationType}
            <input
              value={form.preparationType}
              onChange={event => {
                const value = event.target.value
                setForm(prev => ({ ...prev, preparationType: value }))
                if (normalizeInput(value)) {
                  setFieldErrors(prev => ({ ...prev, preparationType: '' }))
                }
              }}
              placeholder={t.placeholders.preparationType}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            {fieldErrors.preparationType && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.preparationType}</p>
            )}
          </label>

          <label className='text-sm text-[var(--muted)]'>
            {t.fields.receivedBy}
            <select
              value={form.receivedBy}
              onChange={event => {
                const value = event.target.value
                setForm(prev => ({ ...prev, receivedBy: value }))
                if (normalizeInput(value)) {
                  setFieldErrors(prev => ({ ...prev, receivedBy: '' }))
                }
              }}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
            >
              <option value=''>{locale === 'fr' ? 'Selectionner un staff' : 'Select staff'}</option>
              {staffOptions.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            {fieldErrors.receivedBy && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.receivedBy}</p>
            )}
          </label>

          <label className='text-sm text-[var(--muted)] md:col-span-2'>
            {t.fields.composition}
            <textarea
              value={form.composition}
              onChange={event => {
                const value = event.target.value
                setForm(prev => ({ ...prev, composition: value }))
                if (normalizeInput(value)) {
                  setFieldErrors(prev => ({ ...prev, composition: '' }))
                }
              }}
              rows={3}
              placeholder={t.placeholders.composition}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            {fieldErrors.composition && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.composition}</p>
            )}
          </label>

          <label className='text-sm text-[var(--muted)] md:col-span-2'>
            {t.fields.notes}
            <input
              value={form.notes}
              onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))}
              placeholder={t.placeholders.notes}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
          </label>
        </div>

        <button
          onClick={() => void handleCreatePreparation()}
          className='mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
        >
          {t.addButton}
        </button>
      </article>

      <article className='panel p-5'>
        <h2 className='text-base font-semibold text-[var(--foreground)]'>{t.searchLabel}</h2>
        <div className='mt-3 grid gap-3 md:grid-cols-2'>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
          />
          <label className='text-sm text-[var(--muted)]'>
            {t.filterLabel}
            <select
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value)}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
            >
              <option value='all'>All</option>
              {statusOrder.map(status => (
                <option key={status} value={status}>
                  {t.status[status] || status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </article>

      <section className='panel overflow-hidden'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.listTitle}</h2>
        </header>

        {filteredPreparations.length === 0 ? (
          <p className='px-5 py-4 text-sm text-[var(--muted)]'>{t.empty}</p>
        ) : (
          <div className='space-y-3 p-3'>
            {filteredPreparations.map(item => {
              const draft = getWorkflowDraft(item)
              const assignmentField = getAssignmentFieldByStatus(draft.status)

              return (
                <article
                  key={item.id}
                  className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                >
                  <div className='flex flex-wrap items-start justify-between gap-2'>
                    <div>
                      <p className='text-sm font-semibold text-[var(--foreground)]'>
                        {item.preparationType}
                      </p>
                      <p className='mt-1 text-xs text-[var(--muted)]'>{item.composition}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status] || ''}`}
                    >
                      {t.status[item.status] || item.status}
                    </span>
                  </div>

                  <div className='mt-3 grid gap-2 text-xs text-[var(--muted)] md:grid-cols-3'>
                    <p>
                      <span className='font-semibold text-[var(--foreground)]'>{t.fields.receivedBy}: </span>
                      {item.receivedBy || '-'}
                    </p>
                    <p>
                      <span className='font-semibold text-[var(--foreground)]'>{t.fields.preparedBy}: </span>
                      {item.preparedBy || '-'}
                    </p>
                    <p>
                      <span className='font-semibold text-[var(--foreground)]'>{t.fields.deliveredBy}: </span>
                      {item.deliveredBy || '-'}
                    </p>
                  </div>

                  <div className='mt-3 grid gap-2 md:grid-cols-[180px_1fr_auto_auto_auto]'>
                    <select
                      value={draft.status}
                      onChange={event => {
                        updateWorkflowDraft(item.id, { status: event.target.value })
                      }}
                      className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
                    >
                      {statusOrder.map(status => (
                        <option key={status} value={status}>
                          {t.status[status] || status}
                        </option>
                      ))}
                    </select>

                    <select
                      value={draft[assignmentField] || ''}
                      onChange={event =>
                        updateWorkflowDraft(item.id, { [assignmentField]: event.target.value })
                      }
                      className='rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
                    >
                      <option value=''>{locale === 'fr' ? 'Selectionner un staff' : 'Select staff'}</option>
                      {staffOptions.map(name => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => void handleSaveWorkflow(item)}
                      className='rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
                    >
                      {t.workflowSave || 'Save workflow'}
                    </button>

                    <button
                      onClick={() =>
                        void updatePreparation(item.id, {
                          notes: notesDraftById[item.id] ?? item.notes ?? ''
                        })
                      }
                      className='rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
                    >
                      {t.saveNotes}
                    </button>

                    <button
                      onClick={() => {
                        showConfirmToast({
                          title: locale === 'fr' ? 'Confirmation' : 'Confirmation',
                          message:
                            locale === 'fr'
                              ? 'Supprimer cette preparation ?'
                              : 'Delete this preparation?',
                          confirmLabel: locale === 'fr' ? 'Supprimer' : 'Delete',
                          cancelLabel: locale === 'fr' ? 'Annuler' : 'Cancel',
                          onConfirm: () => {
                            void deletePreparation(item.id)
                          }
                        })
                      }}
                      className='rounded-lg border border-red-400/60 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-500/10'
                    >
                      {t.delete}
                    </button>
                  </div>

                  <div className='mt-2'>
                    <input
                      value={notesDraftById[item.id] ?? item.notes ?? ''}
                      onChange={event =>
                        setNotesDraftById(prev => ({ ...prev, [item.id]: event.target.value }))
                      }
                      placeholder={t.placeholders.notes}
                      className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
                    />
                  </div>
                </article>
              )
            })}
          </div>
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
                ? 'Entrez le PIN du staff selectionne dans Recu par.'
                : 'Enter the PIN of the staff selected in Received by.'}
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
              onChange={event => setPinInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
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
                disabled={pinInput.length < 2 || pinInput.length > 6}
                className='rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
              >
                {locale === 'fr' ? 'Confirmer' : 'Confirm'}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}
