'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCopy } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

const statusOrder = ['en_cours', 'prepared', 'completed']
const statusStyles = {
  en_cours: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  prepared: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  completed: 'bg-slate-200 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400'
}

function normalizeInput(value) {
  return String(value || '').trim()
}

function formatDateTime(dateValue, locale) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return String(dateValue)
  try {
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date)
  } catch {
    return String(dateValue)
  }
}

function isStaffRequiringPin(user) {
  if (!user) return false
  const accountRole = String(user.accountRole || '').toLowerCase()
  const staffRole = String(user.staffRole || '').toLowerCase()
  return accountRole === 'staff' && staffRole !== 'admin'
}

export default function PreparationsManager() {
  const router = useRouter()
  const {
    locale,
    user,
    preparations,
    prescribers,
    createPreparation,
    deletePreparation,
    showConfirmToast,
    resolveStaffByPin,
    addPrescriber
  } = useSession()

  const t = getCopy(locale).preparations
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [prescriberFilter, setPrescriberFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [form, setForm] = useState({
    patientFullname: '',
    phone: '',
    composition: '',
    price: '',
    prescriber: ''
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const pinInputRef = useRef(null)

  const requiresPin = isStaffRequiringPin(user)

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
      if (statusFilter === 'all') {
        if (!showArchived && item.status === 'completed') return false
      } else {
        if (item.status !== statusFilter) return false
      }
      if (prescriberFilter && item.prescriber !== prescriberFilter) return false
      if (!q) return true
      return [
        item.preparationId,
        item.patientFullname,
        item.phone,
        item.composition,
        item.prescriber
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [preparations, search, statusFilter, showArchived, prescriberFilter])

  function validateForm() {
    const errors = {}
    if (!normalizeInput(form.patientFullname)) {
      errors.patientFullname = 'Required'
    }
    if (!normalizeInput(form.phone)) {
      errors.phone = 'Required'
    }
    if (!normalizeInput(form.composition)) {
      errors.composition = 'Required'
    }
    return errors
  }

  async function submitCreate(receivedByName) {
    setIsSubmitting(true)
    try {
      await createPreparation({
        patientFullname: normalizeInput(form.patientFullname),
        phone: normalizeInput(form.phone),
        composition: normalizeInput(form.composition),
        price: Number(form.price) || 0,
        prescriber: normalizeInput(form.prescriber),
        receivedBy: receivedByName || user?.name || '',
        status: 'en_cours'
      })
      setForm({
        patientFullname: '',
        phone: '',
        composition: '',
        price: '',
        prescriber: ''
      })
      setFieldErrors({})
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCreate() {
    const errors = validateForm()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (!requiresPin) {
      await submitCreate()
      return
    }

    setPinInput('')
    setPinError('')
    setPinModalOpen(true)
  }

  async function handlePinConfirm() {
    const normalizedPin = pinInput.replace(/\D/g, '').slice(0, 6)
    if (normalizedPin.length < 2 || normalizedPin.length > 6) {
      setPinError(locale === 'fr' ? 'PIN invalide (2-6 chiffres).' : 'Invalid PIN (2-6 digits).')
      return
    }

    try {
      setPinError('')
      const matchedStaff = await resolveStaffByPin(normalizedPin)

      if (!matchedStaff) {
        setPinError(
          locale === 'fr'
            ? 'PIN invalide.'
            : 'Invalid PIN.'
        )
        return
      }

      await submitCreate(matchedStaff.name)
      setPinModalOpen(false)
      setPinInput('')
      setPinError('')
    } catch (_error) {
      setPinError(locale === 'fr' ? 'PIN incorrect.' : 'Incorrect PIN.')
    }
  }

  function confirmDelete(item) {
    showConfirmToast({
      title: locale === 'fr' ? 'Confirmation' : 'Confirmation',
      message: t.deleteConfirm,
      confirmLabel: locale === 'fr' ? 'Supprimer' : 'Delete',
      cancelLabel: locale === 'fr' ? 'Annuler' : 'Cancel',
      onConfirm: () => {
        void deletePreparation(item.id)
      }
    })
  }

  return (
    <section className='space-y-4'>
      <article className='panel p-5'>
        <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.addTitle}</h2>
        <p className='mt-1 text-sm text-[var(--muted)]'>{t.addDescription}</p>

        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          <label className='text-sm text-[var(--muted)]'>
            {t.fields.patientFullname}
            <input
              value={form.patientFullname}
              onChange={event => {
                const value = event.target.value
                setForm(prev => ({ ...prev, patientFullname: value }))
                if (normalizeInput(value)) {
                  setFieldErrors(prev => ({ ...prev, patientFullname: '' }))
                }
              }}
              placeholder={t.placeholders.patientFullname}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            {fieldErrors.patientFullname && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.patientFullname}</p>
            )}
          </label>

          <label className='text-sm text-[var(--muted)]'>
            {t.fields.phone}
            <input
              value={form.phone}
              onChange={event => {
                const value = event.target.value
                setForm(prev => ({ ...prev, phone: value }))
                if (normalizeInput(value)) {
                  setFieldErrors(prev => ({ ...prev, phone: '' }))
                }
              }}
              placeholder={t.placeholders.phone}
              inputMode='numeric'
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            {fieldErrors.phone && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.phone}</p>
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
              rows={2}
              placeholder={t.placeholders.composition}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            {fieldErrors.composition && (
              <p className='mt-1 text-xs text-red-600'>{fieldErrors.composition}</p>
            )}
          </label>

          <label className='text-sm text-[var(--muted)]'>
            {t.fields.price}
            <input
              type='number'
              min='0'
              step='0.01'
              value={form.price}
              onChange={event =>
                setForm(prev => ({ ...prev, price: event.target.value }))
              }
              placeholder={t.placeholders.price}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
          </label>

          <label className='text-sm text-[var(--muted)]'>
            {t.fields.prescriber}
            <select
              value={form.prescriber}
              onChange={event => {
                const val = event.target.value
                if (val === '__add__') {
                  const name = window.prompt(locale === 'fr' ? 'Nom du prescripteur:' : 'Prescriber name:')
                  if (name?.trim()) {
                    addPrescriber(name.trim()).then(() => {
                      setForm(prev => ({ ...prev, prescriber: name.trim() }))
                    })
                  }
                } else {
                  setForm(prev => ({ ...prev, prescriber: val }))
                }
              }}
              className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            >
              <option value=''>{t.placeholders.prescriber}</option>
              {prescribers.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
              <option value='__add__'>{locale === 'fr' ? '+ Ajouter un prescripteur' : '+ Add prescriber'}</option>
            </select>
          </label>
        </div>

        <button
          onClick={() => void handleCreate()}
          disabled={isSubmitting}
          className='mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
        >
          {isSubmitting
            ? (locale === 'fr' ? 'Enregistrement...' : 'Saving...')
            : t.addButton}
        </button>
      </article>

      <article className='panel p-5'>
        <div className='grid gap-3 md:grid-cols-[1fr_auto_auto_auto] items-end'>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t.searchPlaceholder}
            className='w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
          />
          <select
            value={prescriberFilter}
            onChange={event => setPrescriberFilter(event.target.value)}
            className='w-full md:w-auto rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
          >
            <option value=''>{locale === 'fr' ? 'Tous les prescripteurs' : 'All prescribers'}</option>
            {prescribers.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className='w-full md:w-auto rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)]'
          >
            <option value='all'>{locale === 'fr' ? 'Tous' : 'All'}</option>
            {statusOrder.map(status => (
              <option key={status} value={status}>
                {t.status[status] || status}
              </option>
            ))}
          </select>
          <button
            type='button'
            onClick={() => setShowArchived(prev => !prev)}
            className={`whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              showArchived
                ? 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-500 dark:bg-slate-500/20 dark:text-slate-300'
                : 'border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-soft)]'
            }`}
          >
            {locale === 'fr' ? 'Archivées' : 'Archived'}
          </button>
        </div>
      </article>

      <section className='panel overflow-hidden'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.listTitle}</h2>
        </header>

        {filteredPreparations.length === 0 ? (
          <p className='px-5 py-4 text-sm text-[var(--muted)]'>{t.empty}</p>
        ) : (
          <div className='space-y-2 p-3'>
            {filteredPreparations.map(item => (
              <article
                key={item.id}
                role='button'
                tabIndex={0}
                onClick={() => router.push(`/preparations/${item.id}`)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    router.push(`/preparations/${item.id}`)
                  }
                }}
                className='flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3 transition hover:bg-[var(--surface)]'
              >
                <div className='flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1'>
                  <p className='text-xs font-mono font-semibold text-[var(--muted)]'>
                    {item.preparationId}
                  </p>
                  <p className='text-sm font-semibold text-[var(--foreground)] truncate'>
                    {item.patientFullname}
                  </p>
                  <p className='text-xs text-[var(--muted)]'>{item.phone}</p>
                  {item.price > 0 && (
                    <p className='text-xs font-semibold text-[var(--foreground)]'>
                      {Number(item.price).toFixed(2)} DZD
                    </p>
                  )}
                </div>
                <div className='flex shrink-0 items-center gap-3'>
                  <span className='text-[10px] text-[var(--muted)]'>
                    {formatDateTime(item.createdAt, locale)}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[item.status] || ''}`}
                  >
                    {t.status[item.status] || item.status}
                  </span>
                  <button
                    type='button'
                    onClick={event => {
                      event.stopPropagation()
                      confirmDelete(item)
                    }}
                    className='rounded-lg border border-red-400/60 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/10'
                  >
                    {t.delete}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {pinModalOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <h3 className='text-base font-semibold text-[var(--foreground)]'>
              {locale === 'fr' ? 'Confirmation PIN' : 'PIN confirmation'}
            </h3>
            <p className='mt-1 text-sm text-[var(--muted)]'>{t.confirmPin}</p>
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
                  void handlePinConfirm()
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
                onClick={() => void handlePinConfirm()}
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
