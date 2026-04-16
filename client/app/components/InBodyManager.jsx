'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  CalendarDays,
  Eye,
  Plus,
  Search,
  Trash2,
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

function getSubscriptionLabel(totalSessions, locale) {
  if (!totalSessions) {
    return locale === 'fr' ? 'Aucun abonnement' : 'No package'
  }
  if (locale === 'fr') {
    return `${totalSessions} seance${totalSessions > 1 ? 's' : ''}`
  }
  return `${totalSessions} session${totalSessions > 1 ? 's' : ''}`
}

function getRemainingChipClass(remainingSessions) {
  if (remainingSessions <= 0) {
    return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
  }
  if (remainingSessions <= 2) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
  }
  return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
}

function normalizePatientForm(form) {
  const patientId = digitsOnly(form.patientId || form.phone)
  const phone = digitsOnly(form.phone || form.patientId)

  return {
    patientId,
    fullName: String(form.fullName || '').trim(),
    phone,
    email: String(form.email || '').trim(),
    dateOfBirth: String(form.dateOfBirth || '').trim()
  }
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
      remaining: 'Sessions restantes',
      lastTest: 'Dernier test',
      actions: 'Actions'
    },
    stats: {
      totalPatients: 'Total Patients',
      testsToday: "Tests Aujourd'hui",
      testsMonth: 'Tests ce Mois',
      activeSubscriptions: 'Abonnements Actifs',
      staffPerformanceTitle: 'Performance du staff InBody',
      staffPerformanceSubtitle:
        'Nombre de tests realises par membre du staff sur chaque periode.',
      staffName: 'Membre',
      staffRole: 'Role',
      testsWeek: 'Semaine',
      testsYear: 'Annee',
      total: 'Total',
      inactive: 'Inactif',
      noStaffPerformance:
        "Aucun test InBody attribue au staff pour le moment."
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
    actions: {
      viewProfile: 'Voir le profil',
      delete: 'Supprimer'
    },
    errors: {
      patientId: "L'identifiant patient est obligatoire.",
      fullName: 'Le nom complet est obligatoire.'
    },
    deleteConfirmTitle: 'Supprimer ce patient ?',
    deleteConfirmText:
      'Cette action supprimera aussi tout son historique InBody.',
    deleteConfirmButton: 'Supprimer',
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
      remaining: 'Remaining sessions',
      lastTest: 'Last test',
      actions: 'Actions'
    },
    stats: {
      totalPatients: 'Total Patients',
      testsToday: 'Tests Today',
      testsMonth: 'Tests This Month',
      activeSubscriptions: 'Active Subscriptions',
      staffPerformanceTitle: 'InBody Staff Performance',
      staffPerformanceSubtitle:
        'How many tests each staff member completed for each period.',
      staffName: 'Staff member',
      staffRole: 'Role',
      testsWeek: 'This Week',
      testsYear: 'This Year',
      total: 'Total',
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
    actions: {
      viewProfile: 'View profile',
      delete: 'Delete'
    },
    errors: {
      patientId: 'Patient identifier is required.',
      fullName: 'Full name is required.'
    },
    deleteConfirmTitle: 'Delete this patient?',
    deleteConfirmText: 'This will also remove all linked InBody tests.',
    deleteConfirmButton: 'Delete',
    loading: 'Loading...'
  }
}

export default function InBodyManager() {
  const {
    locale,
    patients,
    currentWorkspace,
    fetchInBodyOverview,
    createPatient,
    deletePatient,
    showConfirmToast
  } = useSession()
  const t = listCopy[locale] || listCopy.en

  const [search, setSearch] = useState('')
  const [stats, setStats] = useState(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false)
  const [deletingPatientId, setDeletingPatientId] = useState('')
  const [formErrors, setFormErrors] = useState({})
  const [patientForm, setPatientForm] = useState({
    patientId: '',
    fullName: '',
    phone: '',
    email: '',
    dateOfBirth: ''
  })

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

  useEffect(() => {
    if (!currentWorkspace?.id) return
    void loadOverview()
  }, [currentWorkspace?.id])

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
    () => (Array.isArray(stats?.staffPerformance) ? stats.staffPerformance : []),
    [stats]
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

  function resetFormState() {
    setPatientForm({
      patientId: '',
      fullName: '',
      phone: '',
      email: '',
      dateOfBirth: ''
    })
    setFormErrors({})
  }

  async function handleCreatePatient() {
    const payload = normalizePatientForm(patientForm)
    const nextErrors = {}

    if (!payload.patientId) {
      nextErrors.patientId = t.errors.patientId
    }
    if (!payload.fullName) {
      nextErrors.fullName = t.errors.fullName
    }

    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmittingPatient(true)
      await createPatient(payload)
      await loadOverview()
      setIsCreateModalOpen(false)
      resetFormState()
    } finally {
      setIsSubmittingPatient(false)
    }
  }

  function confirmDeletePatient(patient) {
    showConfirmToast({
      title: t.deleteConfirmTitle,
      message: `${patient.fullName}\n${t.deleteConfirmText}`,
      confirmLabel: locale === 'fr' ? 'OK, supprimer' : 'OK, delete',
      cancelLabel: t.cancel,
      onConfirm: async () => {
        try {
          setDeletingPatientId(patient.id)
          await deletePatient(patient.id)
          await loadOverview()
        } finally {
          setDeletingPatientId('')
        }
      }
    })
  }

  return (
    <section className='space-y-5'>
      <header className='panel overflow-hidden p-5 sm:p-6'>
        <div className='relative'>
          <div className='pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl dark:bg-cyan-500/15' />
          <div className='pointer-events-none absolute -left-24 -bottom-24 h-56 w-56 rounded-full bg-emerald-300/25 blur-3xl dark:bg-emerald-500/15' />
          <h2 className='text-2xl font-semibold tracking-tight text-[var(--foreground)]'>
            {t.title}
          </h2>
          <p className='mt-1 text-sm text-[var(--muted)]'>{t.subtitle}</p>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {statCards.map(card => {
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
          })}
        </div>
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

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#059669,#0284c7)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
          >
            <Plus size={16} />
            {t.addPatient}
          </button>
        </div>

        {filteredPatients.length === 0 ? (
          <p className='mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--muted)]'>
            {t.emptyPatients}
          </p>
        ) : (
          <>
            <div className='mt-5 space-y-3 lg:hidden'>
              {filteredPatients.map(patient => {
                const totalSessions = Number(patient?.subscription?.totalSessions || 0)
                const remainingSessions = Number(
                  patient?.subscription?.remainingSessions || 0
                )

                return (
                  <article
                    key={patient.id}
                    className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                  >
                    <p className='text-sm font-semibold text-[var(--foreground)]'>
                      {patient.fullName}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>
                      {patient.patientId}
                      {patient.phone ? ` - ${patient.phone}` : ''}
                    </p>
                    <div className='mt-3 flex flex-wrap items-center gap-2 text-xs'>
                      <span className='rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'>
                        {getSubscriptionLabel(totalSessions, locale)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 font-semibold ${getRemainingChipClass(remainingSessions)}`}
                      >
                        {remainingSessions}
                      </span>
                      <span className='text-[var(--muted)]'>
                        {formatDate(patient.lastInBodyTestAt, locale)}
                      </span>
                    </div>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <Link
                        href={`/inbody/${patient.id}`}
                        className='inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                      >
                        <Eye size={17} />
                        {t.actions.viewProfile}
                      </Link>
                      <button
                        onClick={() => confirmDeletePatient(patient)}
                        disabled={deletingPatientId === patient.id}
                        className='inline-flex items-center gap-1 rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                      >
                        <Trash2 size={14} />
                        {t.actions.delete}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className='mt-5 hidden overflow-x-auto lg:block'>
              <table className='w-full min-w-[920px] table-fixed text-left text-sm'>
                <thead>
                  <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                    <th className='px-4 py-3 font-medium'>{t.columns.patientId}</th>
                    <th className='px-4 py-3 font-medium'>{t.columns.name}</th>
                    <th className='px-4 py-3 font-medium'>{t.columns.subscription}</th>
                    <th className='px-4 py-3 font-medium'>{t.columns.remaining}</th>
                    <th className='px-4 py-3 font-medium'>{t.columns.lastTest}</th>
                    <th className='px-4 py-3 text-right font-medium'>{t.columns.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map(patient => {
                    const totalSessions = Number(patient?.subscription?.totalSessions || 0)
                    const remainingSessions = Number(
                      patient?.subscription?.remainingSessions || 0
                    )

                    return (
                      <tr
                        key={patient.id}
                        className='border-b border-[var(--border)]/70 align-top transition hover:bg-[var(--surface-soft)]/70'
                      >
                        <td className='px-4 py-3 text-[var(--muted)]'>
                          <p className='font-semibold text-[var(--foreground)]'>
                            {patient.patientId}
                          </p>
                          <p className='text-xs'>{patient.phone || '-'}</p>
                        </td>
                        <td className='px-4 py-3 text-[var(--foreground)]'>
                          <p className='font-medium'>{patient.fullName}</p>
                          <p className='text-xs text-[var(--muted)]'>{patient.email || '-'}</p>
                        </td>
                        <td className='px-4 py-3'>
                          <span className='inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200'>
                            {getSubscriptionLabel(totalSessions, locale)}
                          </span>
                        </td>
                        <td className='px-4 py-3'>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRemainingChipClass(remainingSessions)}`}
                          >
                            {remainingSessions}
                          </span>
                        </td>
                        <td className='px-4 py-3 text-[var(--muted)]'>
                          {formatDate(patient.lastInBodyTestAt, locale)}
                        </td>
                        <td className='px-4 py-3'>
                          <div className='flex justify-end gap-2'>
                            <Link
                              href={`/inbody/${patient.id}`}
                              className='inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                            >
                              <Eye size={17} />
                              {t.actions.viewProfile}
                            </Link>
                            <button
                              onClick={() => confirmDeletePatient(patient)}
                              disabled={deletingPatientId === patient.id}
                              className='inline-flex items-center gap-1 rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                            >
                              <Trash2 size={14} />
                              {t.actions.delete}
                            </button>
                          </div>
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
                      <p className='text-xs uppercase tracking-[0.12em] text-[var(--muted)]'>
                        {member.role}
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
                      <p className='text-xs text-[var(--muted)]'>{t.stats.testsToday}</p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsToday || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>{t.stats.testsWeek}</p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsThisWeek || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>{t.stats.testsMonth}</p>
                      <p className='mt-1 text-lg font-semibold text-[var(--foreground)]'>
                        {member.testsThisMonth || 0}
                      </p>
                    </div>
                    <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3'>
                      <p className='text-xs text-[var(--muted)]'>{t.stats.testsYear}</p>
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
                </article>
              ))}
            </div>

            <div className='mt-5 hidden overflow-x-auto lg:block'>
              <table className='w-full min-w-[860px] table-fixed text-left text-sm'>
                <thead>
                  <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                    <th className='px-4 py-3 font-medium'>{t.stats.staffName}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.staffRole}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.testsToday}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.testsWeek}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.testsMonth}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.testsYear}</th>
                    <th className='px-4 py-3 font-medium'>{t.stats.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPerformance.map(member => (
                    <tr
                      key={member.id}
                      className='border-b border-[var(--border)]/70 transition hover:bg-[var(--surface-soft)]/70'
                    >
                      <td className='px-4 py-3'>
                        <p className='font-medium text-[var(--foreground)]'>{member.name}</p>
                        {!member.isActive && (
                          <p className='text-xs text-[var(--muted)]'>
                            {t.stats.inactive}
                          </p>
                        )}
                      </td>
                      <td className='px-4 py-3 text-[var(--muted)]'>{member.role}</td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isCreateModalOpen && (
        <div className='fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <article className='w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <h3 className='text-lg font-semibold text-[var(--foreground)]'>
              {t.createPatientTitle}
            </h3>
            <p className='mt-1 text-sm text-[var(--muted)]'>{t.createPatientText}</p>

            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <label className='text-sm text-[var(--muted)] sm:col-span-1'>
                {t.fields.patientId}
                <input
                  value={patientForm.patientId}
                  onChange={event => {
                    const nextValue = digitsOnly(event.target.value)
                    setPatientForm(prev => ({
                      ...prev,
                      patientId: nextValue,
                      phone: prev.phone || nextValue
                    }))
                    if (nextValue) {
                      setFormErrors(prev => ({ ...prev, patientId: '' }))
                    }
                  }}
                  placeholder={t.placeholders.patientId}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
                {formErrors.patientId && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.patientId}</p>
                )}
              </label>

              <label className='text-sm text-[var(--muted)] sm:col-span-1'>
                {t.fields.fullName}
                <input
                  value={patientForm.fullName}
                  onChange={event => {
                    const nextValue = event.target.value
                    setPatientForm(prev => ({ ...prev, fullName: nextValue }))
                    if (nextValue.trim()) {
                      setFormErrors(prev => ({ ...prev, fullName: '' }))
                    }
                  }}
                  placeholder={t.placeholders.fullName}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
                {formErrors.fullName && (
                  <p className='mt-1 text-xs text-red-600'>{formErrors.fullName}</p>
                )}
              </label>

              <label className='text-sm text-[var(--muted)]'>
                {t.fields.phone}
                <input
                  value={patientForm.phone}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      phone: digitsOnly(event.target.value)
                    }))
                  }
                  placeholder={t.placeholders.phone}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
              </label>

              <label className='text-sm text-[var(--muted)]'>
                {t.fields.email}
                <input
                  type='email'
                  value={patientForm.email}
                  onChange={event =>
                    setPatientForm(prev => ({ ...prev, email: event.target.value }))
                  }
                  placeholder={t.placeholders.email}
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
              </label>

              <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                {t.fields.dateOfBirth}
                <input
                  type='date'
                  value={patientForm.dateOfBirth}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      dateOfBirth: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] outline-none ring-emerald-400/40 focus:ring'
                />
              </label>
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetFormState()
                }}
                className='rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                {t.cancel}
              </button>
              <button
                onClick={() => void handleCreatePatient()}
                disabled={isSubmittingPatient}
                className='rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
              >
                {isSubmittingPatient ? t.loading : t.create}
              </button>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

