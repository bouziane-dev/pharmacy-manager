'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, Trash2 } from 'lucide-react'
import AppShell from '@/app/components/AppShell'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

const statusOrder = ['en_cours', 'prepared']
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

export default function PreparationDetailsPage() {
  const router = useRouter()
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { id } = useParams()
  const {
    locale,
    preparations,
    prescribers,
    updatePreparation,
    deletePreparation,
    showConfirmToast,
    resolveStaffByPin,
    addPrescriber
  } = useSession()
  const t = getCopy(locale).preparations

  const preparation = useMemo(
    () => preparations.find(item => item.id === id),
    [id, preparations]
  )

  const [fieldDraft, setFieldDraft] = useState(null)
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pendingStatus, setPendingStatus] = useState(null)
  const [allNotes, setAllNotes] = useState([])
  const [newNoteText, setNewNoteText] = useState('')
  const pinInputRef = useRef(null)

  useEffect(() => {
    setAllNotes(preparation?.notes ?? [])
    setNewNoteText('')
  }, [id])

  useEffect(() => {
    if (!pinModalOpen) return
    const timer = window.setTimeout(() => {
      pinInputRef.current?.focus()
    }, 30)
    return () => window.clearTimeout(timer)
  }, [pinModalOpen])

  const draft = fieldDraft ?? preparation ?? {}

  function getFieldValue(field) {
    const draftVal = fieldDraft?.[field]
    if (draftVal !== undefined && draftVal !== null) return draftVal
    return preparation?.[field] ?? ''
  }

  function setField(field, value) {
    setFieldDraft(prev => ({
      ...(prev ?? {}),
      [field]: value
    }))
  }

  function getAssignmentFieldByStatus(status) {
    if (status === 'prepared') return 'preparedBy'
    return null
  }

  const requiresPin = isStaffRequiringPin(user)
  const isArchived = preparation?.status === 'completed'

  async function handleFieldChange(field, value) {
    if (isArchived) return
    setField(field, value)
    if (!requiresPin) {
      try {
        await updatePreparation(id, { [field]: value })
        setFieldDraft(prev => {
          const next = { ...prev }
          delete next[field]
          return Object.keys(next).length > 0 ? next : null
        })
      } catch {
      }
    }
  }

  async function handleStatusChange(newStatus) {
    if (isArchived) return
    const assignmentField = getAssignmentFieldByStatus(newStatus)

    if (assignmentField) {
      const assignmentName = normalizeInput(preparation?.[assignmentField] || '')
      if (!assignmentName) {
        const userName = normalizeInput(user?.name || '')
        if (!userName) return

        if (requiresPin) {
          setPendingStatus(newStatus)
          setPinInput('')
          setPinError('')
          setPinModalOpen(true)
          return
        }

        try {
          await updatePreparation(id, {
            status: newStatus,
            [assignmentField]: userName
          })
        } catch {
        }
        return
      }
    }

    try {
      await updatePreparation(id, { status: newStatus })
    } catch {
    }
  }

  async function handlePinConfirm() {
    if (isArchived) return
    const normalizedPin = pinInput.replace(/\D/g, '').slice(0, 6)
    if (normalizedPin.length < 2 || normalizedPin.length > 6) {
      setPinError(locale === 'fr' ? 'PIN invalide (2-6 chiffres).' : 'Invalid PIN (2-6 digits).')
      return
    }

    try {
      setPinError('')
      const matchedStaff = await resolveStaffByPin(normalizedPin)
      if (!matchedStaff?.name) {
        setPinError(locale === 'fr' ? 'PIN incorrect.' : 'Incorrect PIN.')
        return
      }

      if (pendingStatus) {
        const assignmentField = getAssignmentFieldByStatus(pendingStatus)
        const updates = { status: pendingStatus }
        if (assignmentField) {
          updates[assignmentField] = matchedStaff.name
        }
        await updatePreparation(id, updates)
        setPendingStatus(null)
      }

      const changedFields = {}
      if (fieldDraft) {
        for (const key of Object.keys(fieldDraft)) {
          if (JSON.stringify(fieldDraft[key]) !== JSON.stringify(preparation?.[key])) {
            changedFields[key] = fieldDraft[key]
          }
        }
        if (Object.keys(changedFields).length > 0) {
          await updatePreparation(id, changedFields)
        }
        setFieldDraft(null)
      }

      setPinModalOpen(false)
      setPinInput('')
      setPinError('')
    } catch (_error) {
      setPinError(locale === 'fr' ? 'PIN incorrect.' : 'Incorrect PIN.')
    }
  }

  function confirmDelete() {
    showConfirmToast({
      title: locale === 'fr' ? 'Confirmation' : 'Confirmation',
      message: t.deleteConfirm,
      confirmLabel: locale === 'fr' ? 'Supprimer' : 'Delete',
      cancelLabel: locale === 'fr' ? 'Annuler' : 'Cancel',
      onConfirm: async () => {
        await deletePreparation(id)
        router.push('/preparations')
      }
    })
  }

  if (isLoading || isBlocked || !user) return null

  if (!preparation) {
    return (
      <AppShell title={t.detailsTitle}>
        <div className='panel p-5 text-sm text-[var(--muted)]'>{t.notFound}</div>
      </AppShell>
    )
  }

  return (
    <AppShell title={t.detailsTitle}>
      <section className='space-y-4'>
        <div className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3'>
            <Link
              href='/preparations'
              className='rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              {t.backToList}
            </Link>
            <span className='text-sm font-mono font-semibold text-[var(--muted)]'>
              {preparation.preparationId}
            </span>
          </div>
          <button
            type='button'
            onClick={confirmDelete}
            className='inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-300/70 bg-rose-50 text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
          >
            <Trash2 size={18} />
          </button>
        </div>

        <article className='panel p-5'>
          <div className='mb-4 grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)] md:grid-cols-3'>
            <p>
              <span className='font-semibold text-[var(--foreground)]'>{t.fields.createdBy}: </span>
              {preparation.receivedBy || '-'}
            </p>
            <p>
              <span className='font-semibold text-[var(--foreground)]'>{t.fields.createdAt}: </span>
              {formatDateTime(preparation.createdAt, locale)}
            </p>
            <p>
              <span className='font-semibold text-[var(--foreground)]'>{t.fields.status}: </span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[preparation.status] || ''}`}
              >
                {t.status[preparation.status] || preparation.status}
              </span>
            </p>
          </div>

          <div className='grid gap-3 md:grid-cols-2'>
            <label className='text-sm text-[var(--muted)]'>
              {t.fields.patientFullname}
              <input
                value={getFieldValue('patientFullname')}
                onChange={e => handleFieldChange('patientFullname', e.target.value)}
                readOnly={isArchived}
                className={`mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] ${isArchived ? 'bg-[var(--surface-soft)] cursor-not-allowed' : 'bg-transparent'}`}
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.fields.phone}
              <input
                value={getFieldValue('phone')}
                onChange={e => handleFieldChange('phone', e.target.value)}
                inputMode='numeric'
                readOnly={isArchived}
                className={`mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] ${isArchived ? 'bg-[var(--surface-soft)] cursor-not-allowed' : 'bg-transparent'}`}
              />
            </label>

            <label className='text-sm text-[var(--muted)] md:col-span-2'>
              {t.fields.composition}
              <textarea
                value={getFieldValue('composition')}
                onChange={e => handleFieldChange('composition', e.target.value)}
                rows={3}
                readOnly={isArchived}
                className={`mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] ${isArchived ? 'bg-[var(--surface-soft)] cursor-not-allowed' : 'bg-transparent'}`}
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.fields.price}
              <input
                type='number'
                min='0'
                step='0.01'
                value={getFieldValue('price')}
                onChange={e => handleFieldChange('price', Number(e.target.value) || 0)}
                readOnly={isArchived}
                className={`mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] ${isArchived ? 'bg-[var(--surface-soft)] cursor-not-allowed' : 'bg-transparent'}`}
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.fields.prescriber}
              <select
                value={getFieldValue('prescriber')}
                onChange={e => {
                  const val = e.target.value
                  if (val === '__add__') {
                    const name = window.prompt(locale === 'fr' ? 'Nom du prescripteur:' : 'Prescriber name:')
                    if (name?.trim()) {
                      addPrescriber(name.trim()).then(() => {
                        handleFieldChange('prescriber', name.trim())
                      })
                    }
                  } else {
                    handleFieldChange('prescriber', val)
                  }
                }}
                disabled={isArchived}
                className={`mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] ${isArchived ? 'bg-[var(--surface-soft)] cursor-not-allowed' : 'bg-transparent'}`}
              >
                <option value=''>{t.placeholders.prescriber}</option>
                {prescribers.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value='__add__'>{locale === 'fr' ? '+ Ajouter un prescripteur' : '+ Add prescriber'}</option>
              </select>
            </label>
          </div>

          {!isArchived && requiresPin && fieldDraft && (
            <div className='mt-4 flex justify-end gap-2'>
              <button
                onClick={() => {
                  setFieldDraft(null)
                  setAllNotes(preparation?.notes ?? [])
                  setNewNoteText('')
                }}
                className='rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                {locale === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  setFieldDraft(prev => ({
                    ...(prev ?? {}),
                    notes: allNotes
                  }))
                  setPinInput('')
                  setPinError('')
                  setPinModalOpen(true)
                }}
                className='rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500'
              >
                {locale === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            </div>
          )}

          {!isArchived && !requiresPin && (
            <p className='mt-3 text-xs text-[var(--muted)]'>{t.saveChanges}</p>
          )}
        </article>

        <article className='panel p-5'>
          {preparation.status === 'completed' ? (
            <div className='flex items-center gap-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-600 dark:bg-slate-500/10 dark:text-slate-400'>
              <CheckCircle2 size={20} className='shrink-0 text-slate-400' />
              <span className='font-semibold'>{locale === 'fr' ? 'Preparation archivee' : 'Archived preparation'}</span>
            </div>
          ) : (
            <>
              <h2 className='text-base font-semibold text-[var(--foreground)]'>
                {t.fields.status}
              </h2>
              <div className='mt-3 flex flex-wrap gap-2'>
                {statusOrder.map(status => (
                  <button
                    key={status}
                    onClick={() => void handleStatusChange(status)}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      preparation.status === status
                        ? 'bg-[var(--surface-soft)] border-[var(--foreground)] text-[var(--foreground)]'
                        : 'border-[var(--border)] text-[var(--muted)] hover:bg-[var(--surface-soft)]'
                    }`}
                  >
                    {t.status[status] || status}
                  </button>
                ))}
                <button
                  onClick={() => void handleStatusChange('completed')}
                  className='inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/60 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300'
                >
                  <CheckCircle2 size={16} />
                  {locale === 'fr' ? 'Terminer' : 'Complete'}
                </button>
              </div>
              <div className='mt-3 grid gap-3 md:grid-cols-1'>
                <label className='text-sm text-[var(--muted)]'>
                  {t.fields.preparedBy}
                  <input
                    value={preparation.preparedBy || ''}
                    readOnly
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--foreground)]'
                  />
                </label>
              </div>
            </>
          )}
        </article>

        <article className='panel p-5'>
          <h2 className='text-base font-semibold text-[var(--foreground)]'>
            {t.fields.notes}
          </h2>

          {allNotes.length > 0 && (
            <div className='mt-3 space-y-2'>
              {allNotes.map((note, idx) => (
                <div
                  key={idx}
                  className='flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2'
                >
                  <div className='min-w-0 flex-1'>
                    <p className='whitespace-pre-wrap text-sm text-[var(--foreground)]'>
                      {note.text}
                    </p>
                    <p className='mt-1 text-[10px] text-[var(--muted)]'>
                      {note.createdBy && <span className='font-medium'>{note.createdBy}</span>}
                      {note.createdBy && ' · '}
                      {formatDateTime(note.createdAt, locale)}
                    </p>
                  </div>
                  {!isArchived && (
                    <button
                      type='button'
                      onClick={() => {
                        const noteText = note.text.length > 50 ? note.text.slice(0, 50) + '...' : note.text
                        showConfirmToast({
                          title: locale === 'fr' ? 'Confirmation' : 'Confirmation',
                          message: locale === 'fr'
                            ? `Supprimer cette note ?\n\n"${noteText}"`
                            : `Delete this note?\n\n"${noteText}"`,
                          confirmLabel: locale === 'fr' ? 'Supprimer' : 'Delete',
                          cancelLabel: locale === 'fr' ? 'Annuler' : 'Cancel',
                          onConfirm: async () => {
                            const updatedNotes = allNotes.filter((_, i) => i !== idx)
                            setAllNotes(updatedNotes)
                            try {
                              await updatePreparation(id, { notes: updatedNotes })
                            } catch {}
                          }
                        })
                      }}
                      className='mt-0.5 shrink-0 rounded p-1 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-600'
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!isArchived && (
            <div className='mt-3'>
              <textarea
                value={newNoteText}
                onChange={e => setNewNoteText(e.target.value)}
                rows={2}
                placeholder={t.placeholders.notes}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
              <div className='mt-2 flex justify-end'>
                <button
                  onClick={async () => {
                    const text = normalizeInput(newNoteText)
                    if (!text) return
                    const newNote = {
                      text,
                      createdAt: new Date().toISOString(),
                      createdBy: user?.name || ''
                    }
                    const updatedNotes = [...allNotes, newNote]
                    setAllNotes(updatedNotes)
                    setNewNoteText('')

                    if (requiresPin) {
                      setFieldDraft(prev => ({
                        ...(prev ?? {}),
                        notes: updatedNotes
                      }))
                      setPinInput('')
                      setPinError('')
                      setPinModalOpen(true)
                    } else {
                      try {
                        await updatePreparation(id, { notes: updatedNotes })
                      } catch {}
                    }
                  }}
                  disabled={!normalizeInput(newNoteText)}
                  className='rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
                >
                  {t.saveNotes}
                </button>
              </div>
            </div>
          )}
        </article>
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
                  setPendingStatus(null)
                  setAllNotes(preparation?.notes ?? [])
                  setNewNoteText('')
                  setFieldDraft(prev => {
                    if (!prev) return null
                    const { notes, ...rest } = prev
                    return Object.keys(rest).length > 0 ? rest : null
                  })
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
    </AppShell>
  )
}
