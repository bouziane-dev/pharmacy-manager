'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Play,
  Search,
  TrendingUp,
  Users
} from 'lucide-react'
import { getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatDate(value, locale) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed)
}

function getSubscriptionLabel(remainingSessions, locale) {
  if (!remainingSessions) {
    return locale === 'fr' ? 'Aucun abonnement' : 'No package'
  }
  if (locale === 'fr') {
    return `${remainingSessions} restante${remainingSessions > 1 ? 's' : ''}`
  }
  return `${remainingSessions} left`
}

function formatCurrency(value) {
  const num = Number(value) || 0
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

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

const listCopy = {
  fr: {
    title: 'InBody',
    subtitle: 'Gestion des tests de composition corporelle',
    searchPlaceholder: 'Rechercher par ID, telephone ou nom',
    addPatient: 'Ajouter un nouveau patient',
    emptyPatients: 'Aucun patient InBody pour le moment.',
    createPatientTitle: 'Nouveau patient InBody',
    createPatientText:
      'Utilisez le numero de telephone comme identifiant principal du patient.',
    cancel: 'Annuler',
    create: 'Creer le patient',
    columns: {
      patientId: 'ID Patient',
      name: 'Nom',
      subscription: 'Abonnement',
      lastTest: 'Dernier test',
    },
    stats: {
      totalPatients: 'Total Patients',
      testsToday: "Tests Aujourd'hui",
      testsMonth: 'Tests ce Mois',
      activeSubscriptions: 'Abonnements Actifs',
      totalPrice: 'Prix Total',
      revenueToday: 'Revenu Aujourd\'hui',
      revenueMonth: 'Revenu ce Mois',
      revenueAllTime: 'Revenu Total',

      testPriceLabel: 'Prix test (sans abo.)',
      staffPerformanceTitle: 'Performance du staff InBody',
      staffPerformanceSubtitle:
        'Nombre de tests realises par membre du staff sur chaque periode.',
      staffName: 'Membre',
      staffRole: 'Role',
      testsWeek: 'Semaine',
      testsYear: 'Annee',
      total: 'Total',
      revenueLabel: 'Rev. est.',
      inactive: 'Inactif',
      noStaffPerformance: 'Aucun test InBody attribue au staff pour le moment.'
    },
    fields: {
      patientId: 'ID Patient (telephone)',
      fullName: 'Nom complet',
      phone: 'Telephone (optionnel)',
      email: 'Email (optionnel)',
      dateOfBirth: 'Date de naissance (optionnel)'
    },
    placeholders: {
      patientId: '0550000000',
      fullName: 'Nom du patient',
      phone: '0550000000',
      email: 'patient@email.com'
    },
    errors: {
      patientId: "L'identifiant patient est obligatoire.",
      fullName: 'Le nom complet est obligatoire.'
    },
    loading: 'Chargement...'
  },
  en: {
    title: 'InBody',
    subtitle: 'Body composition test management',
    searchPlaceholder: 'Search by ID, phone, or name',
    addPatient: 'Add new patient',
    emptyPatients: 'No InBody patients yet.',
    createPatientTitle: 'New InBody patient',
    createPatientText: 'Use the phone number as the patient identifier.',
    cancel: 'Cancel',
    create: 'Create patient',
    columns: {
      patientId: 'Patient ID',
      name: 'Name',
      subscription: 'Package',
      lastTest: 'Last test',
    },
    stats: {
      totalPatients: 'Total Patients',
      testsToday: 'Tests Today',
      testsMonth: 'Tests This Month',
      activeSubscriptions: 'Active Subscriptions',
      totalPrice: 'Total Price',
      revenueToday: 'Revenue Today',
      revenueMonth: 'Revenue This Month',
      revenueAllTime: 'Total Revenue',
      testPriceLabel: 'Single test price',
      staffPerformanceTitle: 'InBody Staff Performance',
      staffPerformanceSubtitle:
        'How many tests each staff member completed for each period.',
      staffName: 'Staff member',
      staffRole: 'Role',
      testsWeek: 'This Week',
      testsYear: 'This Year',
      total: 'Total',
      revenueLabel: 'Est. rev.',
      inactive: 'Inactive',
      noStaffPerformance: 'No staff-linked InBody tests yet.'
    },
    fields: {
      patientId: 'Patient ID (phone)',
      fullName: 'Full name',
      phone: 'Phone (optional)',
      email: 'Email (optional)',
      dateOfBirth: 'Date of birth (optional)'
    },
    placeholders: {
      patientId: '0550000000',
      fullName: 'Patient full name',
      phone: '0550000000',
      email: 'patient@email.com'
    },
    errors: {
      patientId: 'Patient identifier is required.',
      fullName: 'Full name is required.'
    },
    loading: 'Loading...'
  }
}

export default function InBodyManager() {
  const router = useRouter()
  const {
    locale,
    patients,
    currentWorkspace,
    user,
    fetchInBodyOverview,
    fetchInBodySettings,
    updateInBodySettings,
    saveSubscriptionPack,
    deleteSubscriptionPack,
    createPatient,
    createPatientTest,
    fetchStaffLoginUsers
  } = useSession()
  const t = listCopy[locale] || listCopy.en

  const isAdmin = user?.role === 'admin'

  const [search, setSearch] = useState('')
  const [stats, setStats] = useState(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [staffMembers, setStaffMembers] = useState([])
  const [testPrice, setTestPrice] = useState(0)
  const [savingTestPrice, setSavingTestPrice] = useState(false)
  const [packs, setPacks] = useState([])
  const [packName, setPackName] = useState('')
  const [packSessions, setPackSessions] = useState(4)
  const [packPrice, setPackPrice] = useState('')
  const [savingPack, setSavingPack] = useState(false)
  const [quickTestOpen, setQuickTestOpen] = useState(false)
  const [quickTestPhone, setQuickTestPhone] = useState('')
  const [quickTestName, setQuickTestName] = useState('')
  const [quickTestStep, setQuickTestStep] = useState('phone')
  const [quickTestLoading, setQuickTestLoading] = useState(false)
  const [quickTestPatient, setQuickTestPatient] = useState(null)
  const [qtForm, setQtForm] = useState({
    testDate: nowLocalDateTime(),
    notes: '',
    weight: '',
    bodyFat: '',
    muscleMass: '',
    bmi: '',
    bodyWater: ''
  })
  const [qtShowParams, setQtShowParams] = useState(false)
  const [qtOperator, setQtOperator] = useState('')
  const [qtSaving, setQtSaving] = useState(false)
  const [qtError, setQtError] = useState('')

  async function loadOverview() {
    try {
      setIsLoadingStats(true)
      const result = await fetchInBodyOverview()
      setStats(result)
    } catch (_error) {
      setStats(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  async function loadSettings() {
    try {
      const result = await fetchInBodySettings()
      setTestPrice(result?.testPrice ?? 0)
      setPacks(result?.packs || [])
    } catch (_) {}
  }

  useEffect(() => {
    if (!currentWorkspace?.id) return
    void loadOverview()
    if (user?.role === 'admin') void loadSettings()
  }, [currentWorkspace?.id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchStaffLoginUsers()
        if (cancelled) return
        const names = (Array.isArray(rows) ? rows : [])
          .map(item => String(item?.name || '').trim())
          .filter(Boolean)
        setStaffMembers(names)
        const defaultName = user?.name || names[0] || ''
        setQtOperator(defaultName)
      } catch (_error) {
        if (cancelled) return
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fetchStaffLoginUsers, currentWorkspace?.id, user?.name])

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return patients

    return patients.filter(patient =>
      [patient.patientId, patient.phone, patient.fullName, patient.email]
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }, [patients, search])

  const computedActiveSubscriptions = useMemo(
    () =>
      patients.filter(
        patient => Number(patient?.subscription?.remainingSessions || 0) > 0
      ).length,
    [patients]
  )

  const staffPerformance = useMemo(
    () =>
      Array.isArray(stats?.staffPerformance) ? stats.staffPerformance : [],
    [stats]
  )
  const currentStaff = useMemo(
    () => staffPerformance.find(m => m.name === user?.name) || null,
    [staffPerformance, user?.name]
  )

  const statCards = [
    {
      id: 'totalPatients',
      label: t.stats.totalPatients,
      value: stats?.totalPatients ?? patients.length,
      icon: Users,
      accent:
        'from-sky-500/20 to-cyan-500/20 text-sky-700 dark:text-sky-200 border-sky-200/70 dark:border-sky-500/30'
    },
    {
      id: 'testsToday',
      label: t.stats.testsToday,
      value: isLoadingStats ? '...' : stats?.testsToday ?? 0,
      icon: Activity,
      accent:
        'from-emerald-500/20 to-green-500/20 text-emerald-700 dark:text-emerald-200 border-emerald-200/70 dark:border-emerald-500/30'
    },
    {
      id: 'testsThisMonth',
      label: t.stats.testsMonth,
      value: isLoadingStats ? '...' : stats?.testsThisMonth ?? 0,
      icon: CalendarDays,
      accent:
        'from-violet-500/20 to-fuchsia-500/20 text-violet-700 dark:text-violet-200 border-violet-200/70 dark:border-violet-500/30'
    },
    {
      id: 'activeSubscriptions',
      label: t.stats.activeSubscriptions,
      value: stats?.activeSubscriptions ?? computedActiveSubscriptions,
      icon: Activity,
      accent:
        'from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-200 border-amber-200/70 dark:border-amber-500/30'
    }
  ]

  function resetQuickTest() {
    setQuickTestPhone('')
    setQuickTestName('')
    setQuickTestStep('phone')
    setQuickTestPatient(null)
    setQtForm({
      testDate: nowLocalDateTime(),
      notes: '',
      weight: '',
      bodyFat: '',
      muscleMass: '',
      bmi: '',
      bodyWater: ''
    })
    setQtShowParams(false)
    setQtOperator(staffMembers[0] || user?.name || '')
    setQtError('')
    setQuickTestLoading(false)
    setQtSaving(false)
  }

  return (
    <section className='space-y-5'>
      <header className='panel overflow-hidden p-5 sm:p-6'>
        <div className='relative'>
          <div className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/15' />
          <div className='pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/15' />
          <h2 className='text-2xl font-semibold tracking-tight text-[var(--foreground)]'>
            {t.title}
          </h2>
          <p className='mt-1 text-sm text-[var(--muted)]'>{t.subtitle}</p>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {isAdmin ? (
            statCards.map(card => {
              const Icon = card.icon
              return (
                <article
                  key={card.id}
                  className={`rounded-2xl border bg-gradient-to-br p-4 ${card.accent}`}
                >
                  <div className='flex items-start justify-between gap-2'>
                    <p className='text-xs font-semibold uppercase tracking-[0.12em]'>
                      {card.label}
                    </p>
                    <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'>
                      <Icon size={16} />
                    </span>
                  </div>
                  <p className='mt-3 text-3xl font-semibold'>{card.value}</p>
                </article>
              )
            })
          ) : (
            <>
              <article className='rounded-2xl border bg-gradient-to-br from-sky-500/20 to-cyan-500/20 p-4 text-sky-700 dark:text-sky-200 [border-color:rgb(186_230_253/0.7)] dark:[border-color:rgb(59_130_246/0.3)]'>
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{locale === 'fr' ? 'Total Patients' : 'Total Patients'}</p>
                  <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><Users size={16} /></span>
                </div>
                <p className='mt-3 text-3xl font-semibold'>{stats?.totalPatients ?? patients.length}</p>
              </article>
              <article className='rounded-2xl border bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4 text-emerald-700 dark:text-emerald-200 [border-color:rgb(167_243_208/0.7)] dark:[border-color:rgb(52_211_153/0.3)]'>
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{locale === 'fr' ? 'Mes tests aujourd\'hui' : 'My tests today'}</p>
                  <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><Activity size={16} /></span>
                </div>
                <p className='mt-3 text-3xl font-semibold'>{currentStaff?.testsToday ?? 0}</p>
              </article>
              <article className='rounded-2xl border bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-4 text-violet-700 dark:text-violet-200 [border-color:rgb(221_214_254/0.7)] dark:[border-color:rgb(139_92_246/0.3)]'>
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{locale === 'fr' ? 'Mes tests ce mois' : 'My tests this month'}</p>
                  <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><CalendarDays size={16} /></span>
                </div>
                <p className='mt-3 text-3xl font-semibold'>{currentStaff?.testsThisMonth ?? 0}</p>
              </article>
              <article className='rounded-2xl border bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 text-amber-700 dark:text-amber-200 [border-color:rgb(252_211_187/0.7)] dark:[border-color:rgb(245_158_11/0.3)]'>
                <div className='flex items-start justify-between gap-2'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{locale === 'fr' ? 'Mes tests cette annee' : 'My tests this year'}</p>
                  <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><Activity size={16} /></span>
                </div>
                <p className='mt-3 text-3xl font-semibold'>{currentStaff?.testsThisYear ?? 0}</p>
              </article>
            </>
          )}
        </div>

        {isAdmin && (
          <div className='mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
            <article className='rounded-2xl border bg-gradient-to-br from-sky-500/20 to-cyan-500/20 p-4 text-sky-700 dark:text-sky-200 [border-color:rgb(186_230_253/0.7)] dark:[border-color:rgb(59_130_246/0.3)]'>
              <div className='flex items-start justify-between gap-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{t.stats.totalPrice}</p>
                <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><DollarSign size={16} /></span>
              </div>
              <p className='mt-3 text-3xl font-semibold'>{formatCurrency(stats?.financial?.totalPrice)}</p>
            </article>
            <article className='rounded-2xl border bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4 text-emerald-700 dark:text-emerald-200 [border-color:rgb(167_243_208/0.7)] dark:[border-color:rgb(52_211_153/0.3)]'>
              <div className='flex items-start justify-between gap-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{t.stats.revenueToday}</p>
                <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><Activity size={16} /></span>
              </div>
              <p className='mt-3 text-3xl font-semibold'>{formatCurrency(stats?.financial?.revenueToday)}</p>
            </article>
            <article className='rounded-2xl border bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 p-4 text-violet-700 dark:text-violet-200 [border-color:rgb(221_214_254/0.7)] dark:[border-color:rgb(139_92_246/0.3)]'>
              <div className='flex items-start justify-between gap-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{t.stats.revenueMonth}</p>
                <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><TrendingUp size={16} /></span>
              </div>
              <p className='mt-3 text-3xl font-semibold'>{formatCurrency(stats?.financial?.revenueThisMonth)}</p>
            </article>
            <article className='rounded-2xl border bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 text-amber-700 dark:text-amber-200 [border-color:rgb(252_211_187/0.7)] dark:[border-color:rgb(245_158_11/0.3)]'>
              <div className='flex items-start justify-between gap-2'>
                <p className='text-xs font-semibold uppercase tracking-[0.12em]'>{t.stats.revenueAllTime}</p>
                <span className='rounded-lg bg-white/60 p-2 text-current dark:bg-slate-900/35'><BarChart3 size={16} /></span>
              </div>
              <p className='mt-3 text-3xl font-semibold'>{formatCurrency(stats?.financial?.revenueAllTime)}</p>
            </article>
          </div>
        )}
        {isAdmin && (
          <div className='mt-3 flex items-center gap-2 text-sm'>
            <span className='text-[var(--muted)]'>{t.stats.testPriceLabel}</span>
            <input
              type='number'
              min='0'
              step='10'
              value={testPrice}
              onChange={e => setTestPrice(Number(e.target.value) || 0)}
              className='w-24 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
            <button
              onClick={async () => {
                setSavingTestPrice(true)
                try {
                  await updateInBodySettings({ testPrice })
                  await loadOverview()
                } finally {
                  setSavingTestPrice(false)
                }
              }}
              disabled={savingTestPrice}
              className='rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
            >
              {savingTestPrice ? '...' : (locale === 'fr' ? 'Appliquer' : 'Apply')}
            </button>
          </div>
          <div className='mt-4 border-t border-[var(--border)] pt-4'>
            <p className='mb-2 text-xs font-semibold text-[var(--muted)]'>{locale === 'fr' ? 'Abonnements predefinis' : 'Subscription packs'}</p>
            <div className='flex flex-wrap gap-2'>
              {packs.map(p => (
                <span key={p._id} className='inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1.5 text-xs text-[var(--foreground)]'>
                  {p.name}
                  <button onClick={async () => { if (confirm(locale === 'fr' ? 'Supprimer ce pack?' : 'Delete this pack?')) { await deleteSubscriptionPack(p._id); await loadSettings() } }} className='text-red-500 hover:text-red-400'>&times;</button>
                </span>
              ))}
            </div>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              <input value={packName} onChange={e => setPackName(e.target.value)} placeholder={locale === 'fr' ? 'Nom' : 'Name'} className='w-24 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              <input type='number' min='1' max='500' value={packSessions} onChange={e => setPackSessions(Number(e.target.value) || 1)} className='w-16 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              <input type='number' min='0' value={packPrice} onChange={e => setPackPrice(e.target.value)} placeholder='Prix' className='w-20 rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring' />
              <button onClick={async () => {
                setSavingPack(true)
                try {
                  await saveSubscriptionPack({ name: packName.trim(), sessions: packSessions, price: Number(packPrice) || 0 })
                  setPackName('')
                  setPackSessions(4)
                  setPackPrice('')
                  await loadSettings()
                } finally { setSavingPack(false) }
              }} disabled={savingPack || !packName.trim()} className='rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'>
                {savingPack ? '...' : '+'}
              </button>
            </div>
          </div>
        )}
      </header>

      <section className='panel p-5 sm:p-6'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <label className='relative block w-full md:max-w-md'>
            <Search
              size={16}
              className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]'
            />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t.searchPlaceholder}
              className='w-full rounded-xl border border-[var(--border)] bg-transparent py-2.5 pl-10 pr-3 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
            />
          </label>

          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => {
                setQuickTestPhone('')
                setQuickTestName('')
                setQuickTestStep('phone')
                setQuickTestOpen(true)
              }}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#059669,#0284c7)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
            >
              <Play size={16} />
              {locale === 'fr' ? 'Test rapide' : 'Quick test'}
            </button>
          </div>
        </div>

        {filteredPatients.length === 0 ? (
          <p className='mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--muted)]'>
            {t.emptyPatients}
          </p>
        ) : (
          <>
            <div className='mt-5 space-y-3 lg:hidden'>
                   {filteredPatients.map(patient => {
                    const totalSessions = Number(
                      patient?.subscription?.totalSessions || 0
                    )
                    const remainingSessions = Number(
                      patient?.subscription?.remainingSessions || 0
                    )
                    const hasSub = totalSessions > 0 && remainingSessions > 0

                    return (
                  <article
                    key={patient.id}
                    onClick={() => router.push(`/inbody/${patient.id}`)}
                    className={`cursor-pointer rounded-2xl border p-4 transition hover:brightness-95 ${hasSub ? 'border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-600/40 dark:bg-emerald-900/20' : 'border-[var(--border)] bg-[var(--surface-soft)]'}`}
                  >
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {patient.fullName}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>
                      {patient.patientId}
                      {patient.phone ? ` - ${patient.phone}` : ''}
                    </p>
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-xs'>
                      <span className='text-[var(--muted)]'>
                        {formatDate(patient.lastInBodyTestAt, locale)}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className='mt-5 hidden overflow-x-auto lg:block'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                    <th className='px-4 py-3 font-medium'>
                      {t.columns.patientId}
                    </th>
                    <th className='px-4 py-3 font-medium'>{t.columns.name}</th>
                    <th className='px-4 py-3 font-medium'>
                      {t.columns.subscription}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t.columns.lastTest}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => {
                    const totalSessions = Number(
                      patient?.subscription?.totalSessions || 0
                    )
                    const remainingSessions = Number(
                      patient?.subscription?.remainingSessions || 0
                    )
                    const hasSub = totalSessions > 0 && remainingSessions > 0

                    return (
                      <tr
                        key={patient.id}
                        onClick={() => router.push(`/inbody/${patient.id}`)}
                        className={`border-[var(--border)]/70 cursor-pointer border-b align-top transition hover:brightness-95 ${hasSub ? 'bg-emerald-50/70 dark:bg-emerald-900/20' : ''}`}
                      >
                        <td className='px-4 py-3 text-[var(--muted)]'>
                          <p className='font-semibold text-[var(--foreground)]'>
                            {patient.patientId}
                          </p>
                          <p className='text-xs'>{patient.phone || '-'}</p>
                        </td>
                        <td className='px-4 py-3 text-[var(--foreground)]'>
                          <p className='font-medium'>{patient.fullName}</p>
                          <p className='text-xs text-[var(--muted)]'>
                            {patient.email || '-'}
                          </p>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'>
                            {getSubscriptionLabel(remainingSessions, locale)}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-[var(--muted)]'>
                          {formatDate(patient.lastInBodyTestAt, locale)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isAdmin && (
      <section className='panel p-5 sm:p-6'>
        <div className='flex flex-col gap-1'>
          <h3 className='text-lg font-semibold text-[var(--foreground)]'>
            {t.stats.staffPerformanceTitle}
          </h3>
          <p className='text-sm text-[var(--muted)]'>
            {t.stats.staffPerformanceSubtitle}
          </p>
        </div>

        {isLoadingStats ? (
          <p className='mt-5 text-sm text-[var(--muted)]'>{t.loading}</p>
        ) : staffPerformance.length === 0 ? (
          <p className='mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-6 text-sm text-[var(--muted)]'>
            {t.stats.noStaffPerformance}
          </p>
        ) : (
          <>
            <div className='mt-5 grid gap-3 lg:hidden'>
              {staffPerformance.map(member => (
                <article
                  key={member.id}
                  className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <p className='text-sm font-semibold text-[var(--foreground)]'>
                        {member.name}
                      </p>
                    </div>
                    {!member.isActive && (
                      <span className='rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700 dark:bg-slate-700 dark:text-slate-100'>
                        {t.stats.inactive}
                      </span>
                    )}
                  </div>

                  <div className='mt-4 grid grid-cols-2 gap-2 text-sm'>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>
                        {t.stats.testsToday}
                      </p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsToday || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>
                        {t.stats.testsWeek}
                      </p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsThisWeek || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>
                        {t.stats.testsMonth}
                      </p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsThisMonth || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>
                        {t.stats.testsYear}
                      </p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsThisYear || 0}
                      </p>
                    </div>
                  </div>

                  <div className='mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-sm'>
                    <span className='text-[var(--muted)]'>{t.stats.total}</span>
                    <span className='font-semibold text-[var(--foreground)]'>
                      {member.totalTests || 0}
                    </span>
                  </div>

                  <div className='mt-2 flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 px-3 py-2 text-sm'>
                    <span className='text-xs text-[var(--muted)]'>{t.stats.revenueLabel}</span>
                    <span className='font-semibold text-emerald-700 dark:text-emerald-300'>
                      {formatCurrency(member.estimatedRevenue)}
                    </span>
                  </div>
                </article>
              ))}
            </div>

              <div className='mt-5 hidden overflow-x-auto lg:block'>
              <table className='w-full text-left text-sm'>
                <thead>
                  <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                    <th className='px-4 py-3 font-medium'>
                      {t.stats.staffName}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t.stats.testsToday}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t.stats.testsWeek}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t.stats.testsMonth}
                    </th>
                    <th className='px-4 py-3 font-medium'>
                      {t.stats.testsYear}
                    </th>
                    <th className='px-4 py-3 font-medium'>{t.stats.total}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.revenueLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map(member => (
                    <tr
                      key={member.id}
                      className='border-[var(--border)]/70 hover:bg-[var(--surface-soft)]/70 border-b transition'
                    >
                      <td className='px-4 py-3'>
                        <p className='font-medium text-[var(--foreground)]'>
                          {member.name}
                        </p>
                        {!member.isActive && (
                          <p className='text-xs text-[var(--muted)]'>
                            {t.stats.inactive}
                          </p>
                        )}
                      </td>
                      <td className='px-4 py-3 font-semibold text-[var(--foreground)]'>
                        {member.testsToday || 0}
                      </td>
                      <td className='px-4 py-3 font-semibold text-[var(--foreground)]'>
                        {member.testsThisWeek || 0}
                      </td>
                      <td className='px-4 py-3 font-semibold text-[var(--foreground)]'>
                        {member.testsThisMonth || 0}
                      </td>
                      <td className='px-4 py-3 font-semibold text-[var(--foreground)]'>
                        {member.testsThisYear || 0}
                      </td>
                      <td className='px-4 py-3 font-semibold text-[var(--foreground)]'>
                        {member.totalTests || 0}
                      </td>
                      <td className='px-4 py-3 font-semibold text-emerald-700 dark:text-emerald-300'>
                        {formatCurrency(member.estimatedRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
      )}

      {quickTestOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            {quickTestStep === 'phone' ? (
              <>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {locale === 'fr' ? 'Ajouter un test rapide' : 'Quick test'}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {locale === 'fr'
                    ? 'Entrez le numero de telephone du patient.'
                    : 'Enter the patient phone number.'}
                </p>
                <input
                  value={quickTestPhone}
                  onChange={e => setQuickTestPhone(digitsOnly(e.target.value))}
                  placeholder='0550000000'
                  className='mt-4 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
                <div className='mt-5 flex justify-end gap-2'>
                  <button
                    onClick={() => {
                      setQuickTestOpen(false)
                      resetQuickTest()
                    }}
                    className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!quickTestPhone) return
                      setQuickTestLoading(true)
                      const existing = patients.find(
                        p =>
                          p.phone === quickTestPhone ||
                          p.patientId === quickTestPhone
                      )
                      if (existing) {
                        setQuickTestPatient(existing)
                        setQuickTestStep('test')
                        setQuickTestLoading(false)
                      } else {
                        setQuickTestStep('name')
                        setQuickTestLoading(false)
                      }
                    }}
                    disabled={!quickTestPhone || quickTestLoading}
                    className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
                  >
                    {quickTestLoading
                      ? locale === 'fr'
                        ? 'Recherche...'
                        : 'Searching...'
                      : locale === 'fr'
                        ? 'Suivant'
                        : 'Next'}
                  </button>
                </div>
              </>
            ) : quickTestStep === 'name' ? (
              <>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {locale === 'fr' ? 'Nouveau patient' : 'New patient'}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {locale === 'fr'
                    ? 'Patient introuvable. Entrez le nom pour creer un nouveau patient.'
                    : 'Patient not found. Enter the name to create a new patient.'}
                </p>
                <input
                  value={quickTestName}
                  onChange={e => setQuickTestName(e.target.value)}
                  placeholder={locale === 'fr' ? 'Nom complet' : 'Full name'}
                  className='mt-3 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
                <div className='mt-5 flex justify-end gap-2'>
                  <button
                    onClick={() => {
                      setQuickTestStep('phone')
                    }}
                    className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                  >
                    {locale === 'fr' ? 'Retour' : 'Back'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!quickTestName.trim()) return
                      setQuickTestLoading(true)
                      try {
                        const newPatient = await createPatient({
                          patientId: quickTestPhone,
                          fullName: quickTestName.trim(),
                          phone: quickTestPhone
                        })
                        setQuickTestPatient(newPatient)
                        setQuickTestStep('test')
                      } finally {
                        setQuickTestLoading(false)
                      }
                    }}
                    disabled={!quickTestName.trim() || quickTestLoading}
                    className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50'
                  >
                    {quickTestLoading
                      ? locale === 'fr'
                        ? 'Creation...'
                        : 'Creating...'
                      : locale === 'fr'
                        ? 'Creer et continuer'
                        : 'Create & continue'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {locale === 'fr'
                    ? 'Ajouter une seance InBody'
                    : 'Add InBody session'}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {quickTestPatient?.fullName}
                </p>
                <div className='mt-4 space-y-3'>
                  <label className='block text-sm text-[var(--muted)]'>
                    {locale === 'fr' ? 'Date du test' : 'Test date'}
                    <input
                      type='datetime-local'
                      value={qtForm.testDate}
                      onChange={e =>
                        setQtForm(prev => ({
                          ...prev,
                          testDate: e.target.value
                        }))
                      }
                      className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                    />
                  </label>
                  <label className='block text-sm text-[var(--muted)]'>
                    {locale === 'fr' ? 'Operateur' : 'Operator'}
                    <select
                      value={qtOperator}
                      onChange={e => setQtOperator(e.target.value)}
                      className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                    >
                      {staffMembers.length === 0 && (
                        <option value=''>{user?.name || ''}</option>
                      )}
                      {staffMembers.map(name => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className='block text-sm text-[var(--muted)]'>
                    {locale === 'fr'
                      ? 'Notes (optionnelle)'
                      : 'Notes (optional)'}
                    <textarea
                      rows={2}
                      value={qtForm.notes}
                      onChange={e =>
                        setQtForm(prev => ({ ...prev, notes: e.target.value }))
                      }
                      className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                    />
                  </label>
                  <button
                    onClick={() => setQtShowParams(prev => !prev)}
                    className='inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface)]'
                  >
                    {qtShowParams ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                    {locale === 'fr'
                      ? 'Parametres InBody'
                      : 'InBody parameters'}
                  </button>
                  {qtShowParams && (
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='block text-sm text-[var(--muted)]'>
                        {locale === 'fr' ? 'Poids (kg)' : 'Weight (kg)'}
                        <input
                          type='number'
                          step='0.1'
                          value={qtForm.weight}
                          onChange={e =>
                            setQtForm(prev => ({
                              ...prev,
                              weight: e.target.value
                            }))
                          }
                          className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                        />
                      </label>
                      <label className='block text-sm text-[var(--muted)]'>
                        {locale === 'fr' ? 'Masse grasse (%)' : 'Body fat (%)'}
                        <input
                          type='number'
                          step='0.1'
                          value={qtForm.bodyFat}
                          onChange={e =>
                            setQtForm(prev => ({
                              ...prev,
                              bodyFat: e.target.value
                            }))
                          }
                          className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                        />
                      </label>
                      <label className='block text-sm text-[var(--muted)]'>
                        {locale === 'fr'
                          ? 'Masse musculaire (kg)'
                          : 'Muscle mass (kg)'}
                        <input
                          type='number'
                          step='0.1'
                          value={qtForm.muscleMass}
                          onChange={e =>
                            setQtForm(prev => ({
                              ...prev,
                              muscleMass: e.target.value
                            }))
                          }
                          className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                        />
                      </label>
                      <label className='block text-sm text-[var(--muted)]'>
                        IMC
                        <input
                          type='number'
                          step='0.1'
                          value={qtForm.bmi}
                          onChange={e =>
                            setQtForm(prev => ({
                              ...prev,
                              bmi: e.target.value
                            }))
                          }
                          className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                        />
                      </label>
                      <label className='block text-sm text-[var(--muted)] sm:col-span-2'>
                        {locale === 'fr'
                          ? 'Eau corporelle (L)'
                          : 'Body water (L)'}
                        <input
                          type='number'
                          step='0.1'
                          value={qtForm.bodyWater}
                          onChange={e =>
                            setQtForm(prev => ({
                              ...prev,
                              bodyWater: e.target.value
                            }))
                          }
                          className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                        />
                      </label>
                    </div>
                  )}
                </div>
                {qtError && (
                  <p className='mt-3 text-xs text-red-600'>{qtError}</p>
                )}
                <div className='mt-5 flex justify-end gap-2'>
                  <button
                    onClick={() => {
                      setQuickTestOpen(false)
                      resetQuickTest()
                    }}
                    className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                  >
                    {locale === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    onClick={async () => {
                      if (!quickTestPatient) return
                      setQtSaving(true)
                      setQtError('')
                      try {
                        await createPatientTest(quickTestPatient.id, {
                          testedAt: qtForm.testDate
                            ? new Date(qtForm.testDate).toISOString()
                            : undefined,
                          operator: qtOperator || user?.name || '',
                          weight: n(qtForm.weight),
                          bodyFat: n(qtForm.bodyFat),
                          muscleMass: n(qtForm.muscleMass),
                          bmi: n(qtForm.bmi),
                          bodyWater: n(qtForm.bodyWater),
                          notes: qtForm.notes.trim()
                        })
                        await loadOverview()
                        setQuickTestOpen(false)
                        resetQuickTest()
                      } catch (err) {
                        setQtError(
                          err?.message ||
                            (locale === 'fr'
                              ? "Erreur lors de l'enregistrement."
                              : 'Error saving the session.')
                        )
                      } finally {
                        setQtSaving(false)
                      }
                    }}
                    disabled={qtSaving}
                    className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
                  >
                    {qtSaving
                      ? locale === 'fr'
                        ? 'Enregistrement...'
                        : 'Saving...'
                      : locale === 'fr'
                        ? 'Enregistrer'
                        : 'Save'}
                  </button>
                </div>
              </>
            )}
          </article>
        </div>
      )}
    </section>
  )
}
