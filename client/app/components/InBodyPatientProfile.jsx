'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Plus,
  Printer,
  Trash2,
  UserRound
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

function nowLocalDateTime() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60 * 1000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

function n(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

function fmtDate(value, locale, withTime = false) {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(d)
}

function fmtMetric(value, unit = '') {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return '--'
  return `${parsed.toFixed(1)}${unit ? ` ${unit}` : ''}`
}

function TrendCard({ title, dataKey, color, unit, data, locale }) {
  return (
    <article className='inbody-chart-card rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'>
      <h4 className='text-sm font-semibold text-[var(--foreground)]'>{title}</h4>
      <div className='mt-3 h-56'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 10 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='rgba(148,163,184,0.25)' />
            <XAxis dataKey='label' tick={{ fontSize: 11 }} stroke='rgba(100,116,139,0.9)' />
            <YAxis tick={{ fontSize: 11 }} stroke='rgba(100,116,139,0.9)' width={36} />
            <Tooltip
              formatter={value =>
                Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)} ${unit}` : '--'
              }
              contentStyle={{
                borderRadius: '0.75rem',
                border: '1px solid rgba(148,163,184,0.35)',
                background: 'rgba(15,23,42,0.92)',
                color: '#f8fafc'
              }}
            />
            <Line type='monotone' dataKey={dataKey} stroke={color} strokeWidth={2.2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className='mt-1 text-xs text-[var(--muted)]'>
        {locale === 'fr' ? 'Evolution dans le temps' : 'Progress over time'}
      </p>
    </article>
  )
}

export default function InBodyPatientProfile({ patientId }) {
  const searchParams = useSearchParams()
  const {
    locale,
    patients,
    currentWorkspace,
    user,
    showConfirmToast,
    fetchPatientProfile,
    fetchPatientTests,
    createPatientTest,
    updatePatientSubscription,
    deletePatientTest,
    fetchStaffLoginUsers,
    listStaffMembers
  } = useSession()

  const isFr = locale === 'fr'
  const patient = useMemo(
    () => patients.find(item => item.id === patientId) || null,
    [patients, patientId]
  )

  const [tests, setTests] = useState([])
  const [latestTest, setLatestTest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [subscriptionOpen, setSubscriptionOpen] = useState(false)
  const [testOpen, setTestOpen] = useState(false)
  const [subSessions, setSubSessions] = useState(4)
  const [subPrice, setSubPrice] = useState('')
  const [savingPkg, setSavingPkg] = useState(false)
  const [savingTest, setSavingTest] = useState(false)
  const [deletingTestId, setDeletingTestId] = useState('')
  const [testError, setTestError] = useState('')
  const [staffMembers, setStaffMembers] = useState([])
  const [showInBodyParams, setShowInBodyParams] = useState(false)
  const [form, setForm] = useState({
    testDate: nowLocalDateTime(),
    operator: '',
    weight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    bodyWater: '',
    notes: ''
  })

  const totalSessions = Number(patient?.subscription?.totalSessions || 0)
  const remainingSessions = Number(patient?.subscription?.remainingSessions || 0)
  const usedPercent =
    totalSessions > 0
      ? Math.max(0, Math.min(100, Math.round(((totalSessions - remainingSessions) / totalSessions) * 100)))
      : 0
  const summary = latestTest || tests[0] || null

  const cards = useMemo(() => {
    const raw = [
      { id: 'weight', label: isFr ? 'Poids' : 'Weight', value: summary?.weight, unit: 'kg', color: 'text-sky-700 dark:text-sky-200', bg: 'from-sky-500/20 to-cyan-500/20 border-sky-200/70 dark:border-sky-500/30' },
      { id: 'bodyFat', label: isFr ? 'Masse grasse' : 'Body fat', value: summary?.bodyFat, unit: '%', color: 'text-rose-700 dark:text-rose-200', bg: 'from-rose-500/20 to-pink-500/20 border-rose-200/70 dark:border-rose-500/30' },
      { id: 'muscleMass', label: isFr ? 'Masse musculaire' : 'Muscle mass', value: summary?.muscleMass, unit: 'kg', color: 'text-emerald-700 dark:text-emerald-200', bg: 'from-emerald-500/20 to-green-500/20 border-emerald-200/70 dark:border-emerald-500/30' },
      { id: 'bmi', label: 'IMC', value: summary?.bmi, unit: '', color: 'text-amber-700 dark:text-amber-200', bg: 'from-amber-500/20 to-orange-500/20 border-amber-200/70 dark:border-amber-500/30' },
      { id: 'bodyWater', label: isFr ? 'Eau corporelle' : 'Body water', value: summary?.bodyWater, unit: 'L', color: 'text-violet-700 dark:text-violet-200', bg: 'from-violet-500/20 to-fuchsia-500/20 border-violet-200/70 dark:border-violet-500/30' }
    ]
    return raw.filter(c => Number.isFinite(Number(c.value)) && Number(c.value) > 0)
  }, [summary, isFr])

  const chartData = useMemo(() => {
    return [...tests].reverse().map((item, index) => {
      const date = new Date(item.testedAt || item.createdAt)
      const label = Number.isNaN(date.getTime())
        ? `#${index + 1}`
        : new Intl.DateTimeFormat(getIntlLocale(locale), { day: '2-digit', month: '2-digit' }).format(date)

      return {
        label,
        weight: Number.isFinite(Number(item.weight)) && Number(item.weight) > 0 ? Number(item.weight) : null,
        bodyFat: Number.isFinite(Number(item.bodyFat)) && Number(item.bodyFat) > 0 ? Number(item.bodyFat) : null,
        muscleMass: Number.isFinite(Number(item.muscleMass)) && Number(item.muscleMass) > 0 ? Number(item.muscleMass) : null,
        bmi: Number.isFinite(Number(item.bmi)) && Number(item.bmi) > 0 ? Number(item.bmi) : null,
        bodyWater: Number.isFinite(Number(item.bodyWater)) && Number(item.bodyWater) > 0 ? Number(item.bodyWater) : null
      }
    })
  }, [tests, locale])

  const hasTestData = useMemo(() => {
    return tests.some(item =>
      (Number.isFinite(Number(item.weight)) && Number(item.weight) > 0) ||
      (Number.isFinite(Number(item.bodyFat)) && Number(item.bodyFat) > 0) ||
      (Number.isFinite(Number(item.muscleMass)) && Number(item.muscleMass) > 0) ||
      (Number.isFinite(Number(item.bmi)) && Number(item.bmi) > 0) ||
      (Number.isFinite(Number(item.bodyWater)) && Number(item.bodyWater) > 0)
    )
  }, [tests])

  async function loadData() {
    try {
      setIsLoading(true)
      setLoadError('')
      const [profile, testRows] = await Promise.all([
        fetchPatientProfile(patientId),
        fetchPatientTests(patientId)
      ])
      const rows = Array.isArray(testRows) ? testRows : []
      setTests(rows)
      setLatestTest(profile?.latestTest || rows[0] || null)
    } catch (error) {
      setLoadError(error?.message || (isFr ? 'Patient introuvable.' : 'Patient not found.'))
      setTests([])
      setLatestTest(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!patientId) return
    void loadData()
  }, [patientId, currentWorkspace?.id])

  useEffect(() => {
    setSubSessions(4)
    setSubPrice(String(patient?.subscription?.price || ''))
  }, [patientId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let rows = []
        try {
          rows = await fetchStaffLoginUsers()
        } catch (_error) {
          rows = await listStaffMembers()
        }
        if (cancelled) return
        const names = (Array.isArray(rows) ? rows : [])
          .map(item => String(item?.name || '').trim())
          .filter(Boolean)
        setStaffMembers(names)
        setForm(prev => {
          if (prev.operator && names.includes(prev.operator)) return prev
          return { ...prev, operator: names[0] || '' }
        })
      } catch (_error) {
        if (cancelled) return
        setStaffMembers([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [fetchStaffLoginUsers, listStaffMembers, currentWorkspace?.id])

  useEffect(() => {
    if (searchParams.get('addTest') === 'true' && !isLoading) {
      setTestOpen(true)
    }
  }, [searchParams, isLoading])

  function resetForm() {
    setForm({
      testDate: nowLocalDateTime(),
      operator: staffMembers[0] || user?.name || '',
      weight: '',
      bodyFat: '',
      muscleMass: '',
      bmi: '',
      bodyWater: '',
      notes: ''
    })
    setShowInBodyParams(false)
    setTestError('')
  }

  async function saveSubscription() {
    try {
      setSavingPkg(true)
      const sessions = Math.max(1, Math.min(500, Math.round(Number(subSessions) || 0)))
      const price = Math.max(0, Number(subPrice) || 0)
      await updatePatientSubscription(patientId, {
        totalSessions: sessions,
        mode: 'replace',
        price
      })
      await loadData()
      setSubscriptionOpen(false)
    } finally {
      setSavingPkg(false)
    }
  }

  async function saveTest() {
    try {
      setSavingTest(true)
      setTestError('')
      await createPatientTest(patientId, {
        testedAt: form.testDate ? new Date(form.testDate).toISOString() : undefined,
        operator: form.operator.trim(),
        weight: n(form.weight),
        bodyFat: n(form.bodyFat),
        muscleMass: n(form.muscleMass),
        bmi: n(form.bmi),
        bodyWater: n(form.bodyWater),
        notes: form.notes.trim()
      })
      await loadData()
      setTestOpen(false)
      resetForm()
    } finally {
      setSavingTest(false)
    }
  }

  function askDeleteTest(item) {
    showConfirmToast({
      title: isFr ? 'Supprimer cette seance ?' : 'Delete this session?',
      message: `${fmtDate(item.testedAt, locale, true)}\n${isFr ? "La seance sera retiree de l'historique." : 'This session will be removed from history.'}`,
      confirmLabel: isFr ? 'OK, supprimer' : 'OK, delete',
      cancelLabel: isFr ? 'Annuler' : 'Cancel',
      onConfirm: async () => {
        try {
          setDeletingTestId(item.id)
          await deletePatientTest(patientId, item.id)
          await loadData()
        } finally {
          setDeletingTestId('')
        }
      }
    })
  }

  if (isLoading) {
    return <section className='panel p-5 text-sm text-[var(--muted)]'>{isFr ? 'Chargement du profil InBody...' : 'Loading InBody profile...'}</section>
  }

  if (!patient) {
    return (
      <section className='space-y-4'>
        <div className='panel p-5 text-sm text-[var(--muted)]'>{loadError}</div>
        <Link href='/inbody' className='inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'>
          <ArrowLeft size={16} />
          {isFr ? 'Retour' : 'Back'}
        </Link>
      </section>
    )
  }

  return (
    <section className='inbody-print-page space-y-5'>
      <header className='panel overflow-hidden p-5 sm:p-6'>
        <div className='pointer-events-none absolute left-0 top-0 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-500/10' />
        <div className='pointer-events-none absolute right-0 top-0 h-36 w-36 rounded-full bg-cyan-400/20 blur-3xl dark:bg-cyan-500/10' />
        <div className='relative flex flex-wrap items-start justify-between gap-3'>
          <div>
            <Link href='/inbody' className='inbody-no-print inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'>
              <ArrowLeft size={14} />
              {isFr ? 'Retour' : 'Back'}
            </Link>
            <h2 className='mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]'>{patient.fullName}</h2>
            <p className='text-sm text-[var(--muted)]'>ID: {patient.patientId} | {isFr ? 'Rapport patient InBody' : 'InBody patient report'}</p>
          </div>
          <div className='inbody-no-print flex flex-wrap items-center gap-2'>
            <button onClick={() => setTestOpen(true)} className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'>
              <Plus size={15} />
              {isFr ? 'Ajouter une seance InBody' : 'Add InBody session'}
            </button>
            <button onClick={() => window.print()} className='inline-flex items-center gap-2 rounded-xl border border-sky-300/70 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200'>
              <Printer size={15} />
              {isFr ? 'Imprimer le rapport' : 'Print report'}
            </button>
          </div>
        </div>
      </header>

      <section className='grid gap-4 xl:grid-cols-[1.3fr_1fr]'>
        <article className='panel p-5'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{isFr ? 'Informations patient' : 'Patient information'}</h3>
          <div className='mt-4 grid gap-3 sm:grid-cols-2'>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>ID</p><p className='mt-1 text-sm font-semibold text-[var(--foreground)]'>{patient.patientId}</p></div>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Nom' : 'Name'}</p><p className='mt-1 inline-flex items-center gap-1 text-sm font-semibold text-[var(--foreground)]'><UserRound size={14} />{patient.fullName}</p></div>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Telephone' : 'Phone'}</p><p className='mt-1 inline-flex items-center gap-1 text-sm text-[var(--foreground)]'><Phone size={14} />{patient.phone || '-'}</p></div>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>Email</p><p className='mt-1 inline-flex items-center gap-1 text-sm text-[var(--foreground)]'><Mail size={14} />{patient.email || '-'}</p></div>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Date de naissance' : 'Date of birth'}</p><p className='mt-1 text-sm text-[var(--foreground)]'>{fmtDate(patient.dateOfBirth, locale)}</p></div>
            <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Dernier test' : 'Last test'}</p><p className='mt-1 inline-flex items-center gap-1 text-sm text-[var(--foreground)]'><CalendarDays size={14} />{fmtDate(patient.lastInBodyTestAt || summary?.testedAt, locale, true)}</p></div>
          </div>
        </article>

        <article className='panel p-5'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{isFr ? 'Abonnement InBody' : 'InBody subscription'}</h3>
          {remainingSessions > 0 ? (
            <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1'>
              <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Sessions restantes' : 'Remaining sessions'}</p><p className='mt-2 text-3xl font-semibold text-[var(--foreground)]'>{remainingSessions}</p></div>
              <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Total sessions' : 'Total sessions'}</p><p className='mt-2 text-3xl font-semibold text-[var(--foreground)]'>{totalSessions}</p></div>
              {patient?.subscription?.price > 0 && (
                <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'><p className='text-xs text-[var(--muted)]'>{isFr ? 'Prix' : 'Price'}</p><p className='mt-2 text-xl font-semibold text-[var(--foreground)]'>{Number(patient.subscription.price).toFixed(2)} DZD</p></div>
              )}
            </div>
          ) : (
            <p className='mt-4 text-sm text-[var(--muted)]'>{isFr ? "Ce patient n'a pas d'abonnement." : 'This patient does not have a subscription.'}</p>
          )}
          {remainingSessions > 0 && (
          <div className='mt-4'>
            <div className='mb-2 flex items-center justify-between text-xs text-[var(--muted)]'><span>{isFr ? 'Progression' : 'Progress'}</span><span>{usedPercent}%</span></div>
            <div className='h-2.5 rounded-full bg-slate-200/80 dark:bg-slate-700/65'><div className='h-full rounded-full bg-[linear-gradient(90deg,#10b981,#0284c7)] transition-all' style={{ width: `${usedPercent}%` }} /></div>
          </div>
          )}
          <div className='mt-4'>
            <button
              onClick={() => {
                setSubSessions(totalSessions || 4)
                setSubPrice(String(patient?.subscription?.price || ''))
                setSubscriptionOpen(true)
              }}
              className='w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
            >
              {isFr ? 'Creer / Modifier abonnement' : 'Create / Update subscription'}
            </button>
          </div>
        </article>
      </section>

      {hasTestData && (
        <section className='panel p-5'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{isFr ? 'Dernieres mesures' : 'Latest measurements'}</h3>
          {!summary ? <p className='mt-3 text-sm text-[var(--muted)]'>{isFr ? 'Aucune seance InBody enregistree.' : 'No InBody sessions yet.'}</p> : (
            <div className='mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
              {cards.map(card => (
                <article key={card.id} className={`rounded-2xl border bg-gradient-to-br p-4 ${card.bg} ${card.color}`}>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{card.label}</p>
                  <p className='mt-3 text-2xl font-semibold'>{fmtMetric(card.value, card.unit)}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {hasTestData && chartData.length >= 2 && (
        <section className='panel p-5'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{isFr ? 'Progression des mesures' : 'Measurement progress'}</h3>
          <div className='mt-4 grid gap-4 xl:grid-cols-2'>
            <TrendCard title={isFr ? 'Poids' : 'Weight'} dataKey='weight' color='#0284c7' unit='kg' data={chartData} locale={locale} />
            <TrendCard title={isFr ? 'Masse grasse' : 'Body fat'} dataKey='bodyFat' color='#e11d48' unit='%' data={chartData} locale={locale} />
            <TrendCard title={isFr ? 'Masse musculaire' : 'Muscle mass'} dataKey='muscleMass' color='#059669' unit='kg' data={chartData} locale={locale} />
            <TrendCard title='IMC' dataKey='bmi' color='#d97706' unit='' data={chartData} locale={locale} />
            <div className='xl:col-span-2'>
              <TrendCard title={isFr ? 'Eau corporelle' : 'Body water'} dataKey='bodyWater' color='#7c3aed' unit='L' data={chartData} locale={locale} />
            </div>
          </div>
        </section>
      )}
          <section className='panel overflow-hidden'>
        <header className='border-b border-[var(--border)] px-5 py-4'>
          <h3 className='text-base font-semibold text-[var(--foreground)]'>{isFr ? 'Historique des seances' : 'Session history'}</h3>
        </header>

        {tests.length === 0 ? <p className='px-5 py-4 text-sm text-[var(--muted)]'>{isFr ? 'Aucune seance InBody enregistree.' : 'No InBody sessions yet.'}</p> : (
            <div className='overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Date' : 'Date'}</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Poids' : 'Weight'}</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Masse grasse' : 'Body fat'}</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Masse musculaire' : 'Muscle mass'}</th>
                  <th className='px-4 py-3 font-medium'>IMC</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Eau' : 'Water'}</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Operateur' : 'Operator'}</th>
                  <th className='px-4 py-3 font-medium'>{isFr ? 'Notes' : 'Notes'}</th>
                  <th className='inbody-no-print px-4 py-3 text-right font-medium'>{isFr ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(item => (
                  <tr key={item.id} className='border-b border-[var(--border)]/70 align-top transition hover:bg-[var(--surface-soft)]/70'>
                    <td className='px-4 py-3 text-[var(--muted)]'>{fmtDate(item.testedAt || item.createdAt, locale, true)}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{fmtMetric(item.weight, 'kg')}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{fmtMetric(item.bodyFat, '%')}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{fmtMetric(item.muscleMass, 'kg')}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{fmtMetric(item.bmi)}</td>
                    <td className='px-4 py-3 text-[var(--foreground)]'>{fmtMetric(item.bodyWater, 'L')}</td>
                    <td className='px-4 py-3 text-[var(--muted)]'>{item.operator || '-'}</td>
                    <td className='px-4 py-3 text-[var(--muted)]'><p className='line-clamp-3'>{item.notes || '-'}</p></td>
                    <td className='inbody-no-print px-4 py-3 text-right'>
                      <button onClick={() => askDeleteTest(item)} disabled={deletingTestId === item.id} className='inline-flex items-center justify-center rounded-lg border border-rose-300/70 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {subscriptionOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <h3 className='text-lg font-semibold text-[var(--foreground)]'>{isFr ? 'Creer / Modifier abonnement' : 'Create / Update subscription'}</h3>
            <p className='mt-1 text-sm text-[var(--muted)]'>{patient.fullName}</p>
            <div className='mt-4 space-y-3'>
              <label className='block text-sm text-[var(--muted)]'>
                {isFr ? 'Nombre de seances' : 'Number of sessions'}
                <input type='number' min='1' max='500' value={subSessions} onChange={event => setSubSessions(event.target.value)} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              </label>
              <label className='block text-sm text-[var(--muted)]'>
                {isFr ? 'Prix total (DZD)' : 'Total price (DZD)'}
                <input type='number' min='0' step='0.01' value={subPrice} onChange={event => setSubPrice(event.target.value)} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              </label>
            </div>
            <div className='mt-5 flex justify-end gap-2'>
              <button onClick={() => setSubscriptionOpen(false)} className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'>{isFr ? 'Annuler' : 'Cancel'}</button>
              <button onClick={() => void saveSubscription()} disabled={savingPkg} className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'>{savingPkg ? (isFr ? 'Chargement...' : 'Saving...') : (isFr ? 'Enregistrer' : 'Save')}</button>
            </div>
          </article>
        </div>
      )}

      {testOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <h3 className='text-lg font-semibold text-[var(--foreground)]'>{isFr ? 'Ajouter une seance InBody' : 'Add InBody session'}</h3>
            <p className='mt-1 text-sm text-[var(--muted)]'>{patient.fullName}</p>
            <div className='mt-4 space-y-3'>
              <label className='block text-sm text-[var(--muted)]'>
                {isFr ? 'Date du test' : 'Test date'}
                <input type='datetime-local' value={form.testDate} onChange={event => setForm(prev => ({ ...prev, testDate: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              </label>
              <label className='block text-sm text-[var(--muted)]'>
                {isFr ? 'Operateur' : 'Operator'}
                <select
                  value={form.operator}
                  onChange={event => setForm(prev => ({ ...prev, operator: event.target.value }))}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                >
                  {staffMembers.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
              <label className='block text-sm text-[var(--muted)]'>
                {isFr ? 'Notes (optionnelle)' : 'Notes (optional)'}
                <textarea rows={2} value={form.notes} onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              </label>
              <button onClick={() => setShowInBodyParams(prev => !prev)} className='inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'>
                {showInBodyParams ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                {isFr ? 'Parametres InBody' : 'InBody parameters'}
              </button>
              {showInBodyParams && (
                <div className='grid gap-3 sm:grid-cols-2'>
                  <label className='block text-sm text-[var(--muted)]'>{isFr ? 'Poids (kg)' : 'Weight (kg)'}<input type='number' step='0.1' value={form.weight} onChange={event => setForm(prev => ({ ...prev, weight: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' /></label>
                  <label className='block text-sm text-[var(--muted)]'>{isFr ? 'Masse grasse (%)' : 'Body fat (%)'}<input type='number' step='0.1' value={form.bodyFat} onChange={event => setForm(prev => ({ ...prev, bodyFat: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' /></label>
                  <label className='block text-sm text-[var(--muted)]'>{isFr ? 'Masse musculaire (kg)' : 'Muscle mass (kg)'}<input type='number' step='0.1' value={form.muscleMass} onChange={event => setForm(prev => ({ ...prev, muscleMass: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' /></label>
                  <label className='block text-sm text-[var(--muted)]'>IMC<input type='number' step='0.1' value={form.bmi} onChange={event => setForm(prev => ({ ...prev, bmi: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' /></label>
                  <label className='block text-sm text-[var(--muted)] sm:col-span-2'>{isFr ? 'Eau corporelle (L)' : 'Body water (L)'}<input type='number' step='0.1' value={form.bodyWater} onChange={event => setForm(prev => ({ ...prev, bodyWater: event.target.value }))} className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' /></label>
                </div>
              )}
            </div>
            {testError && <p className='mt-3 text-xs text-red-600'>{testError}</p>}
            <div className='mt-5 flex justify-end gap-2'>
              <button onClick={() => { setTestOpen(false); resetForm() }} className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'>{isFr ? 'Annuler' : 'Cancel'}</button>
              <button onClick={() => void saveTest()} disabled={savingTest} className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'>{savingTest ? (isFr ? 'Chargement...' : 'Saving...') : (isFr ? 'Enregistrer' : 'Save')}</button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

