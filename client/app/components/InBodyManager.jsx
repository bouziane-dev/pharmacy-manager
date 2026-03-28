'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

function getCurrentLocalDateTimeValue() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

function formatDateTime(value, locale) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export default function InBodyManager() {
  const { locale, patients, createPatient, fetchPatientTests, createPatientTest } = useSession()
  const t = getCopy(locale).inbody

  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [tests, setTests] = useState([])
  const [isLoadingTests, setIsLoadingTests] = useState(false)
  const [jsonError, setJsonError] = useState('')

  const [patientForm, setPatientForm] = useState({
    patientId: '',
    fullName: '',
    email: '',
    dateOfBirth: ''
  })

  const [testForm, setTestForm] = useState({
    testedAt: getCurrentLocalDateTimeValue(),
    testData: t.testPlaceholders.testData,
    notes: ''
  })

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(item =>
      [item.fullName, item.patientId, item.email].join(' ').toLowerCase().includes(q)
    )
  }, [patients, search])

  const selectedPatient = useMemo(
    () => patients.find(item => item.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  )

  useEffect(() => {
    if (!selectedPatientId) {
      setTests([])
      return
    }

    let cancelled = false
    setIsLoadingTests(true)
    fetchPatientTests(selectedPatientId)
      .then(rows => {
        if (cancelled) return
        setTests(Array.isArray(rows) ? rows : [])
      })
      .catch(() => {
        if (cancelled) return
        setTests([])
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTests(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [fetchPatientTests, selectedPatientId])

  async function handleAddPatient() {
    const created = await createPatient(patientForm)
    setPatientForm({
      patientId: '',
      fullName: '',
      email: '',
      dateOfBirth: ''
    })
    if (created?.id) {
      setSelectedPatientId(created.id)
    }
  }

  async function handleAddTest() {
    if (!selectedPatientId) return

    let parsedData = null
    try {
      parsedData = JSON.parse(testForm.testData)
      setJsonError('')
    } catch (_error) {
      setJsonError(t.jsonError)
      return
    }

    await createPatientTest(selectedPatientId, {
      testedAt: testForm.testedAt ? new Date(testForm.testedAt).toISOString() : undefined,
      testData: parsedData,
      notes: testForm.notes
    })

    const rows = await fetchPatientTests(selectedPatientId)
    setTests(Array.isArray(rows) ? rows : [])
    setTestForm(prev => ({
      ...prev,
      testedAt: getCurrentLocalDateTimeValue(),
      notes: ''
    }))
  }

  return (
    <section className='grid gap-4 lg:grid-cols-[1fr_1.3fr]'>
      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.patientTitle}</h2>
          <p className='mt-1 text-sm text-[var(--muted)]'>{t.patientDescription}</p>

          <div className='mt-4 grid gap-3'>
            <label className='text-sm text-[var(--muted)]'>
              {t.patientFields.patientId}
              <input
                value={patientForm.patientId}
                onChange={event =>
                  setPatientForm(prev => ({
                    ...prev,
                    patientId: event.target.value.replace(/\D/g, '')
                  }))
                }
                placeholder={t.patientPlaceholders.patientId}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.patientFields.fullName}
              <input
                value={patientForm.fullName}
                onChange={event =>
                  setPatientForm(prev => ({ ...prev, fullName: event.target.value }))
                }
                placeholder={t.patientPlaceholders.fullName}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.patientFields.email}
              <input
                type='email'
                value={patientForm.email}
                onChange={event =>
                  setPatientForm(prev => ({ ...prev, email: event.target.value }))
                }
                placeholder={t.patientPlaceholders.email}
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>

            <label className='text-sm text-[var(--muted)]'>
              {t.patientFields.dateOfBirth}
              <input
                type='date'
                value={patientForm.dateOfBirth}
                onChange={event =>
                  setPatientForm(prev => ({ ...prev, dateOfBirth: event.target.value }))
                }
                className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
              />
            </label>
          </div>

          <button
            onClick={() => void handleAddPatient()}
            className='mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
          >
            {t.addPatient}
          </button>
        </article>

        <article className='panel p-5'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{t.patientsListTitle}</h3>
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder={t.patientsSearch}
            className='mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
          />
          <div className='mt-3 space-y-2'>
            {filteredPatients.length === 0 ? (
              <p className='text-sm text-[var(--muted)]'>{t.noPatients}</p>
            ) : (
              filteredPatients.map(patient => (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedPatientId === patient.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-[var(--foreground)]'
                      : 'border-[var(--border)] bg-[var(--surface-soft)] text-[var(--foreground)] hover:bg-[var(--surface)]'
                  }`}
                >
                  <p className='font-semibold'>{patient.fullName}</p>
                  <p className='text-xs text-[var(--muted)]'>
                    {patient.patientId}
                    {patient.email ? ` - ${patient.email}` : ''}
                  </p>
                </button>
              ))
            )}
          </div>
        </article>
      </section>

      <section className='space-y-4'>
        <article className='panel p-5'>
          <h2 className='text-lg font-semibold text-[var(--foreground)]'>{t.testsTitle}</h2>
          <p className='mt-1 text-sm text-[var(--muted)]'>{t.testsDescription}</p>

          {!selectedPatient ? (
            <p className='mt-4 text-sm text-[var(--muted)]'>{t.noPatientSelected}</p>
          ) : (
            <>
              <div className='mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2'>
                <p className='text-sm font-semibold text-[var(--foreground)]'>
                  {selectedPatient.fullName}
                </p>
                <p className='text-xs text-[var(--muted)]'>{selectedPatient.patientId}</p>
              </div>

              <div className='mt-4 grid gap-3'>
                <label className='text-sm text-[var(--muted)]'>
                  {t.testFields.testedAt}
                  <input
                    type='datetime-local'
                    value={testForm.testedAt}
                    onChange={event =>
                      setTestForm(prev => ({ ...prev, testedAt: event.target.value }))
                    }
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                </label>

                <label className='text-sm text-[var(--muted)]'>
                  {t.testFields.testData}
                  <textarea
                    rows={8}
                    value={testForm.testData}
                    onChange={event =>
                      setTestForm(prev => ({ ...prev, testData: event.target.value }))
                    }
                    placeholder={t.testPlaceholders.testData}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                </label>

                <label className='text-sm text-[var(--muted)]'>
                  {t.testFields.notes}
                  <input
                    value={testForm.notes}
                    onChange={event =>
                      setTestForm(prev => ({ ...prev, notes: event.target.value }))
                    }
                    placeholder={t.testPlaceholders.notes}
                    className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                  />
                </label>
              </div>

              {jsonError && <p className='mt-2 text-xs text-red-600'>{jsonError}</p>}

              <button
                onClick={() => void handleAddTest()}
                className='mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
              >
                {t.addTest}
              </button>
            </>
          )}
        </article>

        <article className='panel p-5'>
          {isLoadingTests ? (
            <p className='text-sm text-[var(--muted)]'>Loading...</p>
          ) : tests.length === 0 ? (
            <p className='text-sm text-[var(--muted)]'>{t.noTests}</p>
          ) : (
            <div className='space-y-3'>
              {tests.map(item => (
                <article
                  key={item.id}
                  className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'
                >
                  <p className='text-xs text-[var(--muted)]'>
                    {formatDateTime(item.testedAt || item.createdAt, locale)}
                  </p>
                  <pre className='mt-2 overflow-x-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100'>
                    {JSON.stringify(item.testData || {}, null, 2)}
                  </pre>
                  {item.notes ? (
                    <p className='mt-2 text-xs text-[var(--muted)]'>{item.notes}</p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </section>
  )
}
