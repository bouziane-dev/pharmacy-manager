'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  CalendarCheck,
  CheckCircle2,
  ClipboardPlus,
  Eye,
  FileUp,
  Pencil,
  PhoneCall,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react'
import { getCopy, getIntlLocale } from '@/app/lib/i18n'
import { useSession } from '@/app/providers'

const caisses = ['CNAS', 'CASNOS']
const renewalFrequencies = ['30', '60', '90', 'custom']
const taskTypeOptions = ['patient_appel', 'patient_convoque', 'ordonnance', 'autres']

const emptyPatientForm = {
  fullName: '',
  phone: '',
  caisse: 'CNAS',
  insuredNumber: '',
  birthYear: '',
  useFullBirthDate: false,
  dateOfBirth: '',
  address: '',
  notes: ''
}

const emptyTreatmentForm = {
  productName: '',
  dosage: '',
  frequency: '',
  frequencyQty: '',
  frequencyTimes: '',
  frequencyPeriod: 'day',
  quantity: '',
  renewalFrequency: '30',
  customRenewalDays: '',
  lastDeliveryDate: '',
  notes: ''
}

const emptyTaskForm = {
  type: 'patient_appel',
  customTypeLabel: '',
  comment: ''
}

const emptyBulkImport = {
  text: '',
  fileName: '',
  patients: [],
  errors: []
}

const insuredNumberKeys = [
  'insurednumber',
  'insuredno',
  'assurancenumber',
  'assuranceno',
  'assure',
  'numeroassure',
  'numassure',
  'numeroassurance',
  'numassurance'
]

const renewalStatusStyles = {
  a_jour:
    'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200',
  renouvellement_possible:
    'border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200',
  renouvellement_possible_contact:
    'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200',
  a_contacter:
    'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200',
  en_retard:
    'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-200'
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeHeader(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function isBlankRow(row) {
  return row.every(cell => normalizeText(cell) === '')
}

function parseDelimitedLine(line) {
  const delimiter = [';', '\t', '|', ','].find(item => line.includes(item)) || ','
  const cells = []
  let current = ''
  let quoted = false

  for (const char of line) {
    if (char === '"') {
      quoted = !quoted
    } else if (char === delimiter && !quoted) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current.trim())
  return cells
}

function parseTextRows(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      if (/[;,\t|]/.test(line)) return parseDelimitedLine(line)
      const phoneMatch = line.match(/(?:\+?\d[\d\s().-]{5,}\d)/)
      if (!phoneMatch) return [line]
      const phone = phoneMatch[0]
      const name = line.replace(phone, '').replace(/\s*[-:]\s*$/, '').trim()
      return [name, phone]
    })
}

function valueFromObject(row, keys) {
  const entry = Object.entries(row || {}).find(([key]) =>
    keys.includes(normalizeHeader(key))
  )
  return entry ? entry[1] : ''
}

function mapObjectToPatient(row) {
  return {
    fullName: valueFromObject(row, ['name', 'fullname', 'patient', 'nom', 'nomcomplet']),
    phone: valueFromObject(row, ['phone', 'tel', 'telephone', 'mobile']),
    caisse: valueFromObject(row, ['caisse', 'fund', 'insurancefund', 'assurance']),
    insuredNumber: valueFromObject(row, insuredNumberKeys),
    birthYear: valueFromObject(row, ['birthyear', 'anneenaissance', 'year']),
    dateOfBirth: valueFromObject(row, ['dateofbirth', 'dob', 'datedenaissance']),
    address: valueFromObject(row, ['address', 'adresse']),
    notes: valueFromObject(row, ['notes', 'note', 'comment', 'commentaire'])
  }
}

function headerIndex(headers, keys) {
  return headers.findIndex(header => keys.includes(normalizeHeader(header)))
}

function mapArrayToPatient(row, headers) {
  if (headers) {
    const read = keys => {
      const index = headerIndex(headers, keys)
      return index >= 0 ? row[index] : ''
    }
    return {
      fullName: read(['name', 'fullname', 'patient', 'nom', 'nomcomplet']),
      phone: read(['phone', 'tel', 'telephone', 'mobile']),
      caisse: read(['caisse', 'fund', 'insurancefund', 'assurance']),
      insuredNumber: read(insuredNumberKeys),
      birthYear: read(['birthyear', 'anneenaissance', 'year']),
      dateOfBirth: read(['dateofbirth', 'dob', 'datedenaissance']),
      address: read(['address', 'adresse']),
      notes: read(['notes', 'note', 'comment', 'commentaire'])
    }
  }

  return {
    fullName: row[0],
    phone: row[1],
    caisse: row[2],
    insuredNumber: row[3],
    birthYear: row[4],
    address: row[5],
    notes: row[6]
  }
}

function looksLikeHeader(row) {
  const headers = row.map(normalizeHeader)
  return headers.some(header =>
    ['name', 'fullname', 'patient', 'nom', 'nomcomplet', 'phone', 'telephone', 'tel'].includes(header)
  )
}

function rowsToPatients(rows, t) {
  const dataRows = rows.filter(row => Array.isArray(row) && !isBlankRow(row))
  const headers = dataRows.length > 0 && looksLikeHeader(dataRows[0]) ? dataRows[0] : null
  const bodyRows = headers ? dataRows.slice(1) : dataRows
  const errors = []
  const patients = []

  bodyRows.forEach((row, index) => {
    const patient = mapArrayToPatient(row, headers)
    const payload = normalizePatientPayload({
      ...emptyPatientForm,
      ...patient,
      useFullBirthDate: Boolean(patient.dateOfBirth)
    })

    if (!payload.fullName) {
      errors.push(t.bulkImport.rowError(index + 1 + (headers ? 1 : 0), t.bulkImport.missingName))
      return
    }
    if (!payload.phone) {
      errors.push(t.bulkImport.rowError(index + 1 + (headers ? 1 : 0), t.bulkImport.missingPhone))
      return
    }
    patients.push(payload)
  })

  return { patients, errors }
}

function objectsToPatients(items, t) {
  return rowsToPatients(
    items.map(item => {
      const patient = mapObjectToPatient(item)
      return [
        patient.fullName,
        patient.phone,
        patient.caisse,
        patient.insuredNumber,
        patient.birthYear,
        patient.address,
        patient.notes
      ]
    }),
    t
  )
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(dateValue, days) {
  if (!dateValue) return ''
  const parsed = new Date(`${dateValue}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  parsed.setDate(parsed.getDate() + Number(days || 0))
  return parsed.toISOString().slice(0, 10)
}

function daysBetweenToday(dateValue) {
  if (!dateValue) return null
  const target = new Date(`${String(dateValue).slice(0, 10)}T00:00:00`)
  const today = new Date(`${todayDateOnly()}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

function getRenewalDaysFromForm(form) {
  if (form.renewalFrequency === 'custom') {
    const customDays = Number(form.customRenewalDays || 0)
    return Number.isFinite(customDays) && customDays > 0 ? customDays : 30
  }
  return Number(form.renewalFrequency || 30)
}

function getEstimatedNextDate(form) {
  if (!form.lastDeliveryDate) return ''
  return addDays(form.lastDeliveryDate, getRenewalDaysFromForm(form))
}

function calculateAge(patient) {
  const currentYear = Number(todayDateOnly().slice(0, 4))
  const birthYear = Number(patient?.birthYear || String(patient?.dateOfBirth || '').slice(0, 4))
  if (!Number.isFinite(birthYear) || birthYear <= 0 || birthYear > currentYear) return null
  return currentYear - birthYear
}

function formatDate(value, locale) {
  if (!value) return '-'
  const parsed = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(parsed)
}

function formatDateTime(value, locale) {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

function toPatientForm(patient) {
  if (!patient) return emptyPatientForm
  const dateOfBirth = patient.dateOfBirth || ''
  return {
    fullName: patient.fullName || '',
    phone: patient.phone || '',
    caisse: patient.caisse || 'CNAS',
    insuredNumber: patient.insuredNumber || '',
    birthYear: patient.birthYear || (dateOfBirth ? dateOfBirth.slice(0, 4) : ''),
    useFullBirthDate: Boolean(dateOfBirth),
    dateOfBirth,
    address: patient.address || '',
    notes: patient.notes || ''
  }
}

function toTreatmentForm(treatment) {
  if (!treatment) return emptyTreatmentForm
  return {
    productName: treatment.productName || '',
    dosage: treatment.dosage || '',
    frequency: treatment.frequency || '',
    frequencyQty: treatment.frequencyQty || '',
    frequencyTimes: treatment.frequencyTimes ?? '',
    frequencyPeriod: treatment.frequencyPeriod || 'day',
    quantity: treatment.quantity || '',
    renewalFrequency: treatment.renewalFrequency || '30',
    customRenewalDays: treatment.customRenewalDays ?? '',
    lastDeliveryDate: treatment.lastDeliveryDate || '',
    notes: treatment.notes || ''
  }
}

function normalizePatientPayload(form) {
  return {
    fullName: normalizeText(form.fullName),
    phone: digitsOnly(form.phone),
    caisse: caisses.includes(form.caisse) ? form.caisse : 'CNAS',
    insuredNumber: normalizeText(form.insuredNumber),
    birthYear: form.birthYear === '' ? null : Number(form.birthYear),
    dateOfBirth: form.useFullBirthDate ? normalizeText(form.dateOfBirth) : '',
    address: normalizeText(form.address),
    notes: normalizeText(form.notes)
  }
}

function normalizeTreatmentPayload(form) {
  const renewalFrequency = renewalFrequencies.includes(form.renewalFrequency)
    ? form.renewalFrequency
    : '30'

  return {
    productName: normalizeText(form.productName),
    dosage: normalizeText(form.dosage),
    frequency: '',
    frequencyQty: normalizeText(form.frequencyQty),
    frequencyTimes: form.frequencyTimes === '' ? null : Number(form.frequencyTimes),
    frequencyPeriod: ['day', 'week', 'month'].includes(form.frequencyPeriod)
      ? form.frequencyPeriod
      : '',
    quantity: normalizeText(form.quantity),
    renewalFrequency,
    customRenewalDays:
      renewalFrequency === 'custom'
        ? Number(form.customRenewalDays || 0)
        : null,
    lastDeliveryDate: normalizeText(form.lastDeliveryDate),
    nextRenewalDate: getEstimatedNextDate(form),
    notes: normalizeText(form.notes)
  }
}

function getStatusLabel(status, t) {
  return status === 'inactive' ? t.status.inactive : t.status.active
}

function getFrequencyLabel(value, customDays, t) {
  if (value === 'custom')
    return customDays ? t.days(customDays) : t.treatmentForm.custom
  return t.days(value)
}

function getRenewalStatusLabel(renewalStatus, t) {
  return (
    t.renewalStatus[renewalStatus?.key] ||
    renewalStatus?.label ||
    t.renewalStatus.a_jour
  )
}

function getHistoryLabel(type, t) {
  return t.history[type] || type
}

function getFrequencyPeriodLabel(value, t) {
  if (value === 'week') return t.periods.week
  if (value === 'month') return t.periods.month
  return t.periods.day
}

function getTreatmentFrequencyText(treatment, t) {
  const period = getFrequencyPeriodLabel(treatment.frequencyPeriod, t)
  if (treatment.frequencyQty && treatment.frequencyTimes) {
    return t.posologySchedule(treatment.frequencyQty, treatment.frequencyTimes, period)
  }
  if (treatment.frequencyQty) return treatment.frequencyQty
  if (treatment.frequencyTimes) return t.timesPer(treatment.frequencyTimes, period)
  return treatment.frequency || ''
}

function getRenewalTimingText(treatment, t) {
  const days = daysBetweenToday(treatment.nextRenewalDate)
  if (days === null) return t.panel.noRenewalDate
  if (days === 0) return t.panel.dueToday
  if (days > 0) return t.panel.daysRemaining(days)
  return t.panel.overdueBy(Math.abs(days))
}

export default function ChronicPatientsManager() {
  const {
    locale,
    currentWorkspace,
    chronicPatients,
    fetchChronicPatients,
    createChronicPatient,
    updateChronicPatient,
    archiveChronicPatient,
    deleteChronicPatient,
    addChronicTreatment,
    updateChronicTreatment,
    deleteChronicTreatment,
    recordChronicDelivery,
    markChronicPatientContacted,
    createTask,
    showConfirmToast
  } = useSession()
  const t = getCopy(locale).chronicPatientsView

  const [search, setSearch] = useState('')
  const [listMode, setListMode] = useState('active')
  const [renewalFilter, setRenewalFilter] = useState('all')
  const [caisseFilter, setCaisseFilter] = useState('all')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [patientModalMode, setPatientModalMode] = useState('')
  const [patientForm, setPatientForm] = useState(emptyPatientForm)
  const [patientErrors, setPatientErrors] = useState({})
  const [isSavingPatient, setIsSavingPatient] = useState(false)
  const [treatmentModal, setTreatmentModal] = useState({
    mode: '',
    treatmentId: ''
  })
  const [treatmentForm, setTreatmentForm] = useState(emptyTreatmentForm)
  const [treatmentErrors, setTreatmentErrors] = useState({})
  const [busyKey, setBusyKey] = useState('')
  const [deliveryDraftByTreatment, setDeliveryDraftByTreatment] = useState({})
  const [contactNote, setContactNote] = useState('')
  const [notesDraft, setNotesDraft] = useState('')
  const [taskModalPatientId, setTaskModalPatientId] = useState('')
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [taskErrors, setTaskErrors] = useState({})
  const [bulkImportOpen, setBulkImportOpen] = useState(false)
  const [bulkImport, setBulkImport] = useState(emptyBulkImport)
  const [isBulkImporting, setIsBulkImporting] = useState(false)

  useEffect(() => {
    if (!currentWorkspace?.id) return
    void fetchChronicPatients()
  }, [currentWorkspace?.id])

  const selectedPatient = useMemo(
    () =>
      chronicPatients.find(patient => patient.id === selectedPatientId) || null,
    [chronicPatients, selectedPatientId]
  )

  useEffect(() => {
    setNotesDraft('')
    setContactNote('')
  }, [selectedPatient?.id])

  const activePatients = useMemo(
    () => chronicPatients.filter(patient => patient.status !== 'inactive'),
    [chronicPatients]
  )

  const selectedPatientNotes = useMemo(
    () =>
      (selectedPatient?.history || [])
        .filter(item => item.type === 'note')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [selectedPatient?.history]
  )

  const archivedPatients = useMemo(
    () => chronicPatients.filter(patient => patient.status === 'inactive'),
    [chronicPatients]
  )

  const stats = useMemo(() => {
    return activePatients.reduce(
      (acc, patient) => {
        const key = patient.renewalStatus?.key || 'a_jour'
        acc.total += 1
        if (key === 'en_retard') acc.enRetard += 1
        if (
          [
            'a_contacter',
            'renouvellement_possible_contact',
            'en_retard'
          ].includes(key)
        ) {
          acc.aContacter += 1
        }
        if (
          [
            'renouvellement_possible',
            'renouvellement_possible_contact'
          ].includes(key)
        ) {
          acc.renouvellementPossible += 1
        }
        return acc
      },
      { total: 0, aContacter: 0, renouvellementPossible: 0, enRetard: 0 }
    )
  }, [activePatients])

  const patientsToContact = useMemo(
    () =>
      activePatients.filter(
        patient =>
          patient.status !== 'inactive' &&
          [
            'a_contacter',
            'renouvellement_possible_contact',
            'en_retard'
          ].includes(patient.renewalStatus?.key)
      ),
    [activePatients]
  )

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase()

    const source = listMode === 'archived' ? archivedPatients : activePatients

    return source.filter(patient => {
      const renewalKey = patient.renewalStatus?.key || 'a_jour'
      if (renewalFilter === 'contact' && ![
        'a_contacter',
        'renouvellement_possible_contact',
        'en_retard'
      ].includes(renewalKey)) return false
      if (renewalFilter === 'possible' && ![
        'renouvellement_possible',
        'renouvellement_possible_contact'
      ].includes(renewalKey)) return false
      if (renewalFilter === 'late' && renewalKey !== 'en_retard') return false
      if (caisseFilter !== 'all' && patient.caisse !== caisseFilter)
        return false
      if (!query) return true

      return [patient.fullName, patient.phone, patient.insuredNumber]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [activePatients, archivedPatients, caisseFilter, listMode, renewalFilter, search])

  function openCreatePatient() {
    setPatientModalMode('create')
    setPatientForm(emptyPatientForm)
    setPatientErrors({})
  }

  function openEditPatient(patient) {
    setPatientModalMode('edit')
    setPatientForm(toPatientForm(patient))
    setPatientErrors({})
  }

  function closePatientModal() {
    setPatientModalMode('')
    setPatientErrors({})
    setPatientForm(emptyPatientForm)
  }

  async function savePatient(event) {
    event.preventDefault()
    const payload = normalizePatientPayload(patientForm)
    const errors = {}
    if (!payload.fullName) errors.fullName = t.validation.fullNameRequired
    if (!payload.phone) errors.phone = t.validation.phoneRequired
    if (
      payload.birthYear !== null &&
      (!Number.isFinite(payload.birthYear) ||
        payload.birthYear < 1900 ||
        payload.birthYear > 2200)
    ) {
      errors.age = t.validation.birthYearInvalid
    }
    setPatientErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setIsSavingPatient(true)
      const patient =
        patientModalMode === 'edit' && selectedPatient
          ? await updateChronicPatient(selectedPatient.id, payload)
          : await createChronicPatient(payload)
      setSelectedPatientId(patient.id)
      closePatientModal()
    } finally {
      setIsSavingPatient(false)
    }
  }

  function openAddTreatment() {
    if (!selectedPatient) return
    setTreatmentModal({ mode: 'create', treatmentId: '' })
    setTreatmentForm(emptyTreatmentForm)
    setTreatmentErrors({})
  }

  function openEditTreatment(treatment) {
    setTreatmentModal({ mode: 'edit', treatmentId: treatment.id })
    setTreatmentForm(toTreatmentForm(treatment))
    setTreatmentErrors({})
  }

  function closeTreatmentModal() {
    setTreatmentModal({ mode: '', treatmentId: '' })
    setTreatmentForm(emptyTreatmentForm)
    setTreatmentErrors({})
  }

  async function saveTreatment(event) {
    event.preventDefault()
    if (!selectedPatient) return
    const payload = normalizeTreatmentPayload(treatmentForm)
    const errors = {}
    if (!payload.productName) errors.productName = t.validation.productRequired
    if (!payload.lastDeliveryDate) {
      errors.lastDeliveryDate = t.validation.lastDeliveryRequired
    }
    if (
      payload.renewalFrequency === 'custom' &&
      (!Number.isFinite(payload.customRenewalDays) ||
        payload.customRenewalDays <= 0)
    ) {
      errors.customRenewalDays = t.validation.customDaysRequired
    }
    setTreatmentErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setBusyKey('save-treatment')
      if (treatmentModal.mode === 'edit') {
        await updateChronicTreatment(
          selectedPatient.id,
          treatmentModal.treatmentId,
          payload
        )
      } else {
        await addChronicTreatment(selectedPatient.id, payload)
      }
      closeTreatmentModal()
    } finally {
      setBusyKey('')
    }
  }

  function confirmDeleteTreatment(treatment) {
    if (!selectedPatient) return
    showConfirmToast({
      title: t.confirm.deleteTreatmentTitle,
      message: `${treatment.productName}\n${t.confirm.deleteTreatmentMessage}`,
      confirmLabel: t.confirm.delete,
      cancelLabel: t.confirm.cancel,
      onConfirm: () => {
        void deleteChronicTreatment(selectedPatient.id, treatment.id)
      }
    })
  }

  function confirmArchivePatient(patient) {
    showConfirmToast({
      title: t.confirm.archivePatientTitle,
      message: t.confirm.archivePatientMessage,
      confirmLabel: t.confirm.archive,
      cancelLabel: t.confirm.cancel,
      onConfirm: () => {
        void (async () => {
          await archiveChronicPatient(patient.id)
          setSelectedPatientId('')
          setListMode('active')
          setRenewalFilter('all')
        })().catch(() => {})
      }
    })
  }

  function confirmDeletePatient(patient) {
    showConfirmToast({
      title: t.confirm.deletePatientTitle,
      message: `${patient.fullName}\n${t.confirm.deletePatientMessage}`,
      confirmLabel: t.actions.deletePatient,
      cancelLabel: t.confirm.cancel,
      onConfirm: () => {
        showConfirmToast({
          title: t.confirm.deletePatientSecondTitle,
          message: t.confirm.deletePatientSecondMessage(patient.fullName),
          confirmLabel: t.confirm.deletePatientFinal,
          cancelLabel: t.confirm.cancel,
          onConfirm: () => {
            void (async () => {
              try {
                setBusyKey(`delete-${patient.id}`)
                await deleteChronicPatient(patient.id)
                if (selectedPatientId === patient.id) {
                  setSelectedPatientId('')
                }
              } finally {
                setBusyKey('')
              }
            })().catch(() => {})
          }
        })
      }
    })
  }

  async function handleRecordDelivery(treatment) {
    if (!selectedPatient) return
    const draft = deliveryDraftByTreatment[treatment.id] || {}
    try {
      setBusyKey(`delivery-${treatment.id}`)
      await recordChronicDelivery(selectedPatient.id, treatment.id, {
        deliveredAt: draft.deliveredAt || todayDateOnly(),
        note: draft.note || ''
      })
      setDeliveryDraftByTreatment(prev => ({ ...prev, [treatment.id]: {} }))
    } finally {
      setBusyKey('')
    }
  }

  async function handleMarkContacted() {
    if (!selectedPatient) return
    try {
      setBusyKey('contact')
      await markChronicPatientContacted(selectedPatient.id, {
        note: contactNote,
        contactedAt: todayDateOnly()
      })
      setContactNote('')
    } finally {
      setBusyKey('')
    }
  }

  async function handleSaveNotes() {
    if (!selectedPatient) return
    try {
      setBusyKey('notes')
      const savedPatient = await updateChronicPatient(selectedPatient.id, {
        appendNote: notesDraft
      })
      if (savedPatient?.id) {
        setSelectedPatientId(savedPatient.id)
      }
      setNotesDraft('')
    } finally {
      setBusyKey('')
    }
  }

  function openTaskModal(patient) {
    setTaskModalPatientId(patient.id)
    setTaskForm({
      type: 'patient_appel',
      customTypeLabel: '',
      comment: t.taskComment(patient.fullName)
    })
    setTaskErrors({})
  }

  function closeTaskModal() {
    setTaskModalPatientId('')
    setTaskForm(emptyTaskForm)
    setTaskErrors({})
  }

  function closeBulkImport() {
    setBulkImportOpen(false)
    setBulkImport(emptyBulkImport)
  }

  function applyBulkParseResult(result, fileName = '') {
    setBulkImport(prev => ({
      ...prev,
      fileName,
      patients: result.patients,
      errors:
        result.patients.length === 0 && result.errors.length === 0
          ? [t.bulkImport.noRows]
          : result.errors
    }))
  }

  function parseBulkText(text) {
    const trimmed = normalizeText(text)
    if (!trimmed) {
      applyBulkParseResult({ patients: [], errors: [t.bulkImport.noRows] })
      return
    }

    try {
      const parsed = JSON.parse(trimmed)
      const items = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.patients)
          ? parsed.patients
          : Array.isArray(parsed?.rows)
            ? parsed.rows
            : null
      if (items) {
        applyBulkParseResult(
          Array.isArray(items[0]) ? rowsToPatients(items, t) : objectsToPatients(items, t)
        )
        return
      }
    } catch {
      // Not JSON; parse as pasted rows instead.
    }

    applyBulkParseResult(rowsToPatients(parseTextRows(text), t))
  }

  async function handleBulkFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    try {
      if (['xlsx', 'xls'].includes(extension)) {
        const XLSX = await import('xlsx')
        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' })
        applyBulkParseResult(rowsToPatients(rows, t), file.name)
        return
      }

      const text = await file.text()
      if (extension === 'json') {
        const parsed = JSON.parse(text)
        const items = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.patients)
            ? parsed.patients
            : Array.isArray(parsed?.rows)
              ? parsed.rows
              : []
        applyBulkParseResult(
          Array.isArray(items[0]) ? rowsToPatients(items, t) : objectsToPatients(items, t),
          file.name
        )
        return
      }

      if (['csv', 'tsv', 'txt'].includes(extension)) {
        applyBulkParseResult(rowsToPatients(parseTextRows(text), t), file.name)
        return
      }

      applyBulkParseResult({ patients: [], errors: [t.bulkImport.unsupportedFile] }, file.name)
    } catch {
      applyBulkParseResult({ patients: [], errors: [t.bulkImport.fileReadError] }, file.name)
    }
  }

  async function handleBulkImport() {
    if (bulkImport.patients.length === 0) return
    let created = 0
    const errors = []

    try {
      setIsBulkImporting(true)
      for (const patient of bulkImport.patients) {
        try {
          await createChronicPatient(patient)
          created += 1
        } catch (error) {
          errors.push(error.message || t.bulkImport.failedImport)
        }
      }

      setBulkImport(prev => ({
        ...prev,
        patients: errors.length ? prev.patients.slice(created) : [],
        errors: [t.bulkImport.imported(created, prev.patients.length), ...errors]
      }))

      if (errors.length === 0) closeBulkImport()
    } finally {
      setIsBulkImporting(false)
    }
  }

  async function handleCreateRelatedTask(event) {
    event.preventDefault()
    const patient = chronicPatients.find(item => item.id === taskModalPatientId)
    if (!patient) return

    const errors = {}
    if (taskForm.type === 'autres' && !normalizeText(taskForm.customTypeLabel)) {
      errors.customTypeLabel = t.validation.customNameRequired
    }
    setTaskErrors(errors)
    if (Object.keys(errors).length > 0) return

    try {
      setBusyKey(`task-${patient.id}`)
      await createTask({
        type: taskForm.type,
        customTypeLabel: taskForm.type === 'autres' ? taskForm.customTypeLabel : '',
        patientName: patient.fullName,
        phone: patient.phone,
        linkedChronicPatientId: patient.id,
        comment:
          normalizeText(taskForm.comment) ||
          t.taskComment(patient.fullName)
      })
      closeTaskModal()
    } finally {
      setBusyKey('')
    }
  }

  const statCards = [
    {
      key: 'total',
      label: t.stats.total,
      value: stats.total,
      icon: CheckCircle2,
      tone: 'border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200'
    },
    {
      key: 'contact',
      label: t.stats.contact,
      value: stats.aContacter,
      icon: PhoneCall,
      tone: 'border-amber-200/80 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200'
    },
    {
      key: 'possible',
      label: t.stats.possible,
      value: stats.renouvellementPossible,
      icon: CalendarCheck,
      tone: 'border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200'
    },
    {
      key: 'late',
      label: t.stats.late,
      value: stats.enRetard,
      icon: Archive,
      tone: 'border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200'
    }
  ]

  const resetFilters = () => {
    setSearch('')
    setRenewalFilter('all')
    setCaisseFilter('all')
  }

  const currentSourceCount =
    listMode === 'archived' ? archivedPatients.length : activePatients.length

  return (
    <section className='space-y-5'>
      <header className='panel overflow-hidden p-5 sm:p-6'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
          <div>
            <h2 className='mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]'>
              {t.title}
            </h2>
            <p className='mt-1 max-w-3xl text-sm leading-6 text-[var(--muted)]'>
              {t.description}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              onClick={() => setBulkImportOpen(true)}
              className='inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              <FileUp size={16} />
              {t.bulkImport.openButton}
            </button>
            <button
              type='button'
              onClick={openCreatePatient}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,#059669,#0284c7)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(2,132,199,0.22)] transition hover:brightness-110'
            >
              <Plus size={16} />
              {t.addPatient}
            </button>
          </div>
        </div>

        <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <article
                key={card.key}
                onClick={() => {
                  setListMode('active')
                  setRenewalFilter(card.key === 'total' ? 'all' : card.key)
                }}
                className={`cursor-pointer rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${
                  listMode === 'active' &&
                  renewalFilter === (card.key === 'total' ? 'all' : card.key)
                    ? 'ring-2 ring-emerald-400/60'
                    : ''
                } ${card.tone}`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em]'>
                    {card.label}
                  </p>
                  <span className='rounded-lg bg-white/65 p-2 text-current dark:bg-slate-900/35'>
                    <Icon size={16} />
                  </span>
                </div>
                <p className='mt-3 text-3xl font-semibold'>{card.value}</p>
              </article>
            )
          })}
        </div>
      </header>

      <section className='panel p-4 sm:p-5'>
        <div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto] lg:items-end'>
          <label className='relative block'>
            <span className='sr-only'>{t.searchSr}</span>
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

          <label className='text-sm text-[var(--muted)]'>
            {t.filters.insuranceFund}
            <select
              value={caisseFilter}
              onChange={event => setCaisseFilter(event.target.value)}
              className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
            >
              <option value='all'>{t.filters.all}</option>
              <option value='CNAS'>CNAS</option>
              <option value='CASNOS'>CASNOS</option>
            </select>
          </label>

          <button
            type='button'
            onClick={resetFilters}
            className='rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            {t.filters.reset}
          </button>
          <button
            type='button'
            onClick={() => {
              setListMode(prev => (prev === 'archived' ? 'active' : 'archived'))
              setRenewalFilter('all')
              setSelectedPatientId('')
            }}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              listMode === 'archived'
                ? 'border-slate-400 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-soft)]'
            }`}
          >
            {listMode === 'archived'
              ? t.filters.activePatients
              : `${t.filters.archivedPatients} (${archivedPatients.length})`}
          </button>
        </div>
        <div className='mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]'>
          <span>{t.listCount(filteredPatients.length, currentSourceCount)}</span>
          {(search || renewalFilter !== 'all' || caisseFilter !== 'all') && (
            <button
              type='button'
              onClick={resetFilters}
              className='font-semibold text-emerald-700 transition hover:text-emerald-600 dark:text-emerald-300'
            >
              {t.empty.clearFilters}
            </button>
          )}
        </div>
      </section>

      {listMode === 'active' && patientsToContact.length === 0 && activePatients.length > 0 && (
        <article className='panel border-emerald-200/80 px-5 py-4 text-sm font-semibold text-emerald-800 dark:border-emerald-500/25 dark:text-emerald-200'>
          {t.empty.noContactToday}
        </article>
      )}

      {activePatients.length === 0 && listMode === 'active' ? (
        <article className='panel px-6 py-12 text-center'>
          <p className='text-lg font-semibold text-[var(--foreground)]'>
            {t.empty.noPatientsTitle}
          </p>
          <p className='mt-2 text-sm text-[var(--muted)]'>
            {t.empty.noPatientsDescription}
          </p>
          <div className='mt-5 flex flex-wrap justify-center gap-2'>
            <button
              type='button'
              onClick={() => setBulkImportOpen(true)}
              className='inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
            >
              <FileUp size={16} />
              {t.bulkImport.openButton}
            </button>
            <button
              type='button'
              onClick={openCreatePatient}
              className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              <Plus size={16} />
              {t.addPatient}
            </button>
          </div>
        </article>
      ) : filteredPatients.length === 0 ? (
        <article className='panel px-6 py-10 text-center text-sm text-[var(--muted)]'>
          <p>{t.empty.noFilteredPatients}</p>
          <button
            type='button'
            onClick={() => {
              resetFilters()
            }}
            className='mt-4 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
          >
            {t.empty.clearFilters}
          </button>
        </article>
      ) : (
        <section className='panel overflow-hidden'>
          <div className='hidden overflow-x-auto lg:block'>
            <table className='w-full min-w-[780px] table-fixed text-left text-sm'>
              <thead>
                <tr className='border-b border-[var(--border)] text-[var(--muted)]'>
                  <th className='px-4 py-3 font-medium'>{t.table.patient}</th>
                  <th className='px-4 py-3 font-medium'>{t.table.insuranceFund}</th>
                  <th className='px-4 py-3 font-medium'>
                    {t.table.renewalStatus}
                  </th>
                  <th className='px-4 py-3 text-right font-medium'>
                    {t.table.actions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map(patient => (
                  <tr
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`cursor-pointer border-[var(--border)]/70 border-b align-top transition hover:bg-[var(--surface-soft)]/70 ${
                      selectedPatientId === patient.id ? 'bg-emerald-50/70 dark:bg-emerald-500/10' : ''
                    }`}
                  >
                    <td className='px-4 py-3'>
                      <p className='font-semibold text-[var(--foreground)]'>
                        {patient.fullName}
                      </p>
                      <p className='text-xs text-[var(--muted)]'>
                        {patient.phone}
                      </p>
                      {patient.insuredNumber && (
                        <p className='text-xs text-[var(--muted)]'>
                          {t.table.insuredNo}: {patient.insuredNumber}
                        </p>
                      )}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)]'>
                        {patient.caisse || 'CNAS'}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${renewalStatusStyles[patient.renewalStatus?.key] || renewalStatusStyles.a_jour}`}
                      >
                        {getRenewalStatusLabel(patient.renewalStatus, t)}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='flex flex-wrap justify-end gap-2'>
                        <button
                          type='button'
                          onClick={event => {
                            event.stopPropagation()
                            setSelectedPatientId(patient.id)
                          }}
                          className='inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                        >
                          <Eye size={14} />
                          {t.actions.details}
                        </button>
                        <button
                          type='button'
                          disabled={busyKey === `task-${patient.id}`}
                          onClick={event => {
                            event.stopPropagation()
                            openTaskModal(patient)
                          }}
                          className='inline-flex items-center gap-1 rounded-lg border border-sky-300/70 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-200'
                        >
                          <ClipboardPlus size={14} />
                          {t.actions.createTask}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className='grid gap-3 p-4 lg:hidden'>
            {filteredPatients.map(patient => (
              <article
                key={patient.id}
                className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-[var(--foreground)]'>
                      {patient.fullName}
                    </p>
                    <p className='text-xs text-[var(--muted)]'>
                      {patient.phone}
                    </p>
                  </div>
                  <span className='rounded-full border border-[var(--border)] px-2.5 py-1 text-xs font-semibold'>
                    {patient.caisse || 'CNAS'}
                  </span>
                </div>
                <div className='mt-3 flex flex-wrap gap-2'>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${renewalStatusStyles[patient.renewalStatus?.key] || renewalStatusStyles.a_jour}`}
                  >
                    {getRenewalStatusLabel(patient.renewalStatus, t)}
                  </span>
                  <span className='rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold text-[var(--muted)] dark:bg-slate-900/35'>
                    {getStatusLabel(patient.status, t)}
                  </span>
                </div>
                <div className='mt-3 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => setSelectedPatientId(patient.id)}
                    className='inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)]'
                  >
                    <Eye size={14} />
                    {t.actions.details}
                  </button>
                  <button
                    type='button'
                    onClick={() => openTaskModal(patient)}
                    className='inline-flex items-center gap-1 rounded-lg border border-sky-300/70 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-200'
                  >
                    <ClipboardPlus size={14} />
                    {t.actions.createTask}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedPatient && (
        <div className='fixed inset-0 z-[75] flex justify-end bg-slate-950/45 backdrop-blur-sm'>
          <aside className='h-full w-full overflow-y-auto border-l border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl sm:max-w-3xl sm:p-6'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]'>
                  {t.panel.record}
                </p>
                <h3 className='mt-1 text-2xl font-semibold text-[var(--foreground)]'>
                  {selectedPatient.fullName}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {selectedPatient.phone} - {selectedPatient.caisse || 'CNAS'}
                  {selectedPatient.insuredNumber
                    ? ` - ${t.table.insuredNo} ${selectedPatient.insuredNumber}`
                    : ''}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setSelectedPatientId('')}
                className='rounded-xl border border-[var(--border)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]'
              >
                <X size={18} />
              </button>
            </div>

            <div className='mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
              <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'>
                <p className='text-xs text-[var(--muted)]'>{t.panel.renewal}</p>
                <p className='mt-1 text-sm font-semibold text-[var(--foreground)]'>
                  {getRenewalStatusLabel(selectedPatient.renewalStatus, t)}
                </p>
              </div>
              <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'>
                <p className='text-xs text-[var(--muted)]'>{t.panel.status}</p>
                <p className='mt-1 text-sm font-semibold text-[var(--foreground)]'>
                  {getStatusLabel(selectedPatient.status, t)}
                </p>
              </div>
              <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'>
                <p className='text-xs text-[var(--muted)]'>{t.panel.birthAge}</p>
                <p className='mt-1 text-sm font-semibold text-[var(--foreground)]'>
                  {selectedPatient.dateOfBirth
                    ? formatDate(selectedPatient.dateOfBirth, locale)
                    : selectedPatient.birthYear
                      ? selectedPatient.birthYear
                      : '-'}
                  {calculateAge(selectedPatient)
                    ? ` - ${calculateAge(selectedPatient)} ${t.panel.years}`
                    : ''}
                </p>
              </div>
              <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3'>
                <p className='text-xs text-[var(--muted)]'>{t.panel.address}</p>
                <p className='mt-1 truncate text-sm font-semibold text-[var(--foreground)]'>
                  {selectedPatient.address || '-'}
                </p>
              </div>
            </div>

            <div className='mt-5 flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => openEditPatient(selectedPatient)}
                className='inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
              >
                <Pencil size={15} />
                {t.actions.editPatient}
              </button>
              <button
                type='button'
                disabled={busyKey === 'contact'}
                onClick={() => void handleMarkContacted()}
                className='inline-flex items-center gap-2 rounded-xl border border-emerald-300/70 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-200'
              >
                <PhoneCall size={15} />
                {t.actions.markContacted}
              </button>
              <button
                type='button'
                disabled={busyKey === `task-${selectedPatient.id}`}
                onClick={() => openTaskModal(selectedPatient)}
                className='inline-flex items-center gap-2 rounded-xl border border-sky-300/70 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-200'
              >
                <ClipboardPlus size={15} />
                {t.actions.createTask}
              </button>
              <button
                type='button'
                onClick={() => confirmArchivePatient(selectedPatient)}
                className='inline-flex items-center gap-2 rounded-xl border border-rose-300/70 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
              >
                <Archive size={15} />
                {t.actions.archive}
              </button>
                <button
                  type='button'
                  disabled={busyKey === `delete-${selectedPatient.id}`}
                  onClick={() => confirmDeletePatient(selectedPatient)}
                  className='inline-flex items-center justify-center rounded-xl border border-red-300/80 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-500/35 dark:bg-red-500/10 dark:text-red-200'
                >
                  <Trash2 size={15} />
                </button>
            </div>

            <label className='mt-4 block text-sm text-[var(--muted)]'>
              {t.panel.quickContactNote}
              <input
                value={contactNote}
                onChange={event => setContactNote(event.target.value)}
                placeholder={t.panel.quickContactPlaceholder}
                className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
              />
            </label>

            <section className='mt-6'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <h4 className='text-lg font-semibold text-[var(--foreground)]'>
                  {t.panel.regularTreatments}
                </h4>
                <button
                  type='button'
                  onClick={openAddTreatment}
                  className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
                >
                  <Plus size={15} />
                  {t.actions.addTreatment}
                </button>
              </div>

              {selectedPatient.treatments?.length ? (
                <div className='mt-3 space-y-3'>
                  {selectedPatient.treatments.map(treatment => {
                    const draft = deliveryDraftByTreatment[treatment.id] || {}
                    const scheduleText = getTreatmentFrequencyText(treatment, t)
                    const posologyItems = [
                      { label: t.panel.dosage, value: treatment.dosage },
                      {
                        label: t.panel.schedule,
                        value: scheduleText
                      },
                      !scheduleText && {
                        label: t.panel.doseQuantity,
                        value: treatment.frequencyQty
                      },
                      { label: t.panel.usualQuantity, value: treatment.quantity }
                    ].filter(item => item && item.value)
                    const timingText = getRenewalTimingText(treatment, t)
                    return (
                      <article
                        key={treatment.id}
                        className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'
                      >
                        <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
                          <div className='min-w-0 flex-1'>
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='text-base font-semibold text-[var(--foreground)]'>
                                {treatment.productName}
                              </p>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${renewalStatusStyles[treatment.renewalStatus?.key] || renewalStatusStyles.a_jour}`}
                              >
                                {getRenewalStatusLabel(treatment.renewalStatus, t)}
                              </span>
                              <span className='rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground)]'>
                                {timingText}
                              </span>
                            </div>

                            <div className='mt-3 grid gap-2 sm:grid-cols-2'>
                              <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2'>
                                <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                                  {t.panel.posology}
                                </p>
                                {posologyItems.length ? (
                                  <div className='mt-2 flex flex-wrap gap-2'>
                                    {posologyItems.map(item => (
                                      <span
                                        key={item.label}
                                        className='rounded-lg bg-[var(--surface-soft)] px-2.5 py-1 text-xs text-[var(--foreground)]'
                                      >
                                        <span className='font-semibold'>{item.label}:</span>{' '}
                                        {item.value}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className='mt-2 text-sm text-[var(--muted)]'>
                                    {t.panel.noDetails}
                                  </p>
                                )}
                              </div>

                              <div className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2'>
                                <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                                  {t.panel.renewal}
                                </p>
                                <dl className='mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs'>
                                  <dt className='text-[var(--muted)]'>{t.panel.renewal}</dt>
                                  <dd className='font-semibold text-[var(--foreground)]'>
                                    {getFrequencyLabel(
                                      treatment.renewalFrequency,
                                      treatment.customRenewalDays,
                                      t
                                    )}
                                  </dd>
                                  <dt className='text-[var(--muted)]'>{t.panel.lastDelivery}</dt>
                                  <dd className='font-semibold text-[var(--foreground)]'>
                                    {formatDate(treatment.lastDeliveryDate, locale)}
                                  </dd>
                                  <dt className='text-[var(--muted)]'>{t.panel.next}</dt>
                                  <dd className='font-semibold text-[var(--foreground)]'>
                                    {formatDate(treatment.nextRenewalDate, locale)}
                                  </dd>
                                </dl>
                              </div>
                            </div>
                            {treatment.notes && (
                              <p className='mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]'>
                                {treatment.notes}
                              </p>
                            )}
                          </div>
                          <div className='flex flex-wrap gap-2'>
                            <button
                              type='button'
                              onClick={() => openEditTreatment(treatment)}
                              className='rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)]'
                            >
                              {t.actions.edit}
                            </button>
                            <button
                              type='button'
                              onClick={() => confirmDeleteTreatment(treatment)}
                              className='rounded-lg border border-rose-300/70 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-200'
                            >
                              {t.actions.delete}
                            </button>
                          </div>
                        </div>

                        <div className='mt-4 grid gap-2 lg:grid-cols-[150px_minmax(0,1fr)_auto]'>
                          <input
                            type='date'
                            value={draft.deliveredAt || todayDateOnly()}
                            onChange={event =>
                              setDeliveryDraftByTreatment(prev => ({
                                ...prev,
                                [treatment.id]: {
                                  ...(prev[treatment.id] || {}),
                                  deliveredAt: event.target.value
                                }
                              }))
                            }
                            className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]'
                          />
                          <input
                            value={draft.note || ''}
                            onChange={event =>
                              setDeliveryDraftByTreatment(prev => ({
                                ...prev,
                                [treatment.id]: {
                                  ...(prev[treatment.id] || {}),
                                  note: event.target.value
                                }
                              }))
                            }
                            placeholder={t.panel.optionalDeliveryNote}
                            className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)]'
                          />
                          <button
                            type='button'
                            disabled={busyKey === `delivery-${treatment.id}`}
                            onClick={() => void handleRecordDelivery(treatment)}
                            className='inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60'
                          >
                            <CalendarCheck size={15} />
                            {t.actions.delivered}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <p className='mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] px-4 py-8 text-center text-sm text-[var(--muted)]'>
                  {t.empty.noTreatments}
                </p>
              )}
            </section>

            <section className='mt-6'>
              <article className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h4 className='text-base font-semibold text-[var(--foreground)]'>
                    {t.panel.notesTitle}
                  </h4>
                  <button
                    type='button'
                    disabled={busyKey === 'notes' || !normalizeText(notesDraft)}
                    onClick={() => void handleSaveNotes()}
                    className='rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
                  >
                    {t.panel.addNote}
                  </button>
                </div>
                <textarea
                  value={notesDraft}
                  onChange={event => setNotesDraft(event.target.value)}
                  rows={3}
                  placeholder={t.panel.notesPlaceholder}
                  className='mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                <div className='mt-4'>
                  <p className='text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]'>
                    {t.panel.noteListTitle}
                  </p>
                  {selectedPatientNotes.length > 0 ? (
                    <div className='mt-2 space-y-2'>
                      {selectedPatientNotes.map(note => (
                        <article
                          key={note.id}
                          className='rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2'
                        >
                          <p className='whitespace-pre-wrap text-sm text-[var(--foreground)]'>
                            {note.text}
                          </p>
                          <p className='mt-1 text-xs text-[var(--muted)]'>
                            {note.authorName || '-'} - {formatDateTime(note.createdAt, locale)}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className='mt-2 rounded-xl border border-dashed border-[var(--border)] px-3 py-4 text-center text-sm text-[var(--muted)]'>
                      {t.panel.noNotes}
                    </p>
                  )}
                </div>
              </article>

            </section>
          </aside>
        </div>
      )}

      {bulkImportOpen && (
        <div className='fixed inset-0 z-[89] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <div className='max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {t.bulkImport.title}
                </h3>
                <p className='mt-1 max-w-2xl text-sm leading-6 text-[var(--muted)]'>
                  {t.bulkImport.description}
                </p>
              </div>
              <button type='button' onClick={closeBulkImport} className='rounded-lg p-2'>
                <X size={18} />
              </button>
            </div>

            <div className='mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]'>
              <div className='space-y-3'>
                <label className='block rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]'>
                  <span className='font-semibold text-[var(--foreground)]'>
                    {t.bulkImport.fileLabel}
                  </span>
                  <span className='mt-1 block text-xs'>{t.bulkImport.fileHint}</span>
                  <span className='mt-2 block rounded-lg bg-[var(--surface)] px-3 py-2 text-xs leading-5 text-[var(--muted)]'>
                    {t.bulkImport.acceptedHeaders}
                  </span>
                  <input
                    type='file'
                    accept='.xlsx,.xls,.json,.csv,.tsv,.txt,text/plain,application/json'
                    onChange={event => void handleBulkFileChange(event)}
                    className='mt-3 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white'
                  />
                  {bulkImport.fileName && (
                    <span className='mt-2 block text-xs text-[var(--foreground)]'>
                      {bulkImport.fileName}
                    </span>
                  )}
                </label>

                <label className='block text-sm text-[var(--muted)]'>
                  {t.bulkImport.pasteLabel}
                  <textarea
                    value={bulkImport.text}
                    onChange={event =>
                      setBulkImport(prev => ({
                        ...prev,
                        text: event.target.value,
                        fileName: '',
                        patients: [],
                        errors: []
                      }))
                    }
                    rows={9}
                    placeholder={t.bulkImport.pastePlaceholder}
                    className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                  />
                </label>

                <button
                  type='button'
                  onClick={() => parseBulkText(bulkImport.text)}
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]'
                >
                  <FileUp size={15} />
                  {t.bulkImport.parseButton}
                </button>
              </div>

              <div className='rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4'>
                <div className='flex items-center justify-between gap-3'>
                  <h4 className='text-base font-semibold text-[var(--foreground)]'>
                    {t.bulkImport.previewTitle}
                  </h4>
                  <span className='text-xs font-semibold text-[var(--muted)]'>
                    {t.bulkImport.previewCount(bulkImport.patients.length)}
                  </span>
                </div>

                {bulkImport.patients.length > 0 ? (
                  <div className='mt-3 max-h-64 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]'>
                    <table className='w-full min-w-[620px] text-left text-xs'>
                      <thead className='border-b border-[var(--border)] text-[var(--muted)]'>
                        <tr>
                          <th className='px-3 py-2 font-medium'>{t.bulkImport.columns.name}</th>
                          <th className='px-3 py-2 font-medium'>{t.bulkImport.columns.phone}</th>
                          <th className='px-3 py-2 font-medium'>
                            {t.bulkImport.columns.insuranceFund}
                          </th>
                          <th className='px-3 py-2 font-medium'>
                            {t.bulkImport.columns.insuredNumber}
                          </th>
                          <th className='px-3 py-2 font-medium'>
                            {t.bulkImport.columns.birthYear}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkImport.patients.slice(0, 50).map((patient, index) => (
                          <tr key={`${patient.phone}-${index}`} className='border-b border-[var(--border)]/60'>
                            <td className='px-3 py-2 font-medium text-[var(--foreground)]'>
                              {patient.fullName}
                            </td>
                            <td className='px-3 py-2 text-[var(--muted)]'>{patient.phone}</td>
                            <td className='px-3 py-2 text-[var(--muted)]'>{patient.caisse}</td>
                            <td className='px-3 py-2 text-[var(--muted)]'>
                              {patient.insuredNumber || '-'}
                            </td>
                            <td className='px-3 py-2 text-[var(--muted)]'>
                              {patient.birthYear || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className='mt-3 rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]'>
                    {t.bulkImport.noPreview}
                  </p>
                )}

                {bulkImport.errors.length > 0 && (
                  <div className='mt-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'>
                    <p className='font-semibold'>{t.bulkImport.errorsTitle}</p>
                    <ul className='mt-1 space-y-1'>
                      {bulkImport.errors.slice(0, 8).map((error, index) => (
                        <li key={`${error}-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                type='button'
                onClick={closeBulkImport}
                className='rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]'
              >
                {t.actions.cancel}
              </button>
              <button
                type='button'
                disabled={isBulkImporting || bulkImport.patients.length === 0}
                onClick={() => void handleBulkImport()}
                className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
              >
                {isBulkImporting ? '...' : t.bulkImport.importButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {patientModalMode && (
        <div className='fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <form
            onSubmit={savePatient}
            className='max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {patientModalMode === 'edit'
                    ? t.patientForm.editTitle
                    : t.patientForm.addTitle}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {t.patientForm.description}
                </p>
              </div>
              <button
                type='button'
                onClick={closePatientModal}
                className='rounded-lg p-2'
              >
                <X size={18} />
              </button>
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <label className='text-sm text-[var(--muted)]'>
                {t.patientForm.fullName}
                <input
                  value={patientForm.fullName}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      fullName: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                {patientErrors.fullName && (
                  <p className='mt-1 text-xs text-red-600'>
                    {patientErrors.fullName}
                  </p>
                )}
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.patientForm.phone}
                <input
                  value={patientForm.phone}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      phone: digitsOnly(event.target.value)
                    }))
                  }
                  inputMode='numeric'
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                {patientErrors.phone && (
                  <p className='mt-1 text-xs text-red-600'>
                    {patientErrors.phone}
                  </p>
                )}
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.patientForm.insuranceFund}
                <select
                  value={patientForm.caisse}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      caisse: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                >
                  <option value='CNAS'>CNAS</option>
                  <option value='CASNOS'>CASNOS</option>
                </select>
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.patientForm.insuredNumber}
                <input
                  value={patientForm.insuredNumber}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      insuredNumber: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.patientForm.birthYear}
                <input
                  value={patientForm.birthYear}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      birthYear: event.target.value.replace(/\D/g, '').slice(0, 4)
                    }))
                  }
                  type='number'
                  min='1900'
                  max='2200'
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                {(patientErrors.birthYear || patientErrors.age) && (
                  <p className='mt-1 text-xs text-red-600'>
                    {patientErrors.birthYear || patientErrors.age}
                  </p>
                )}
              </label>
              <label className='flex items-end gap-2 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm text-[var(--muted)]'>
                <input
                  type='checkbox'
                  checked={patientForm.useFullBirthDate}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      useFullBirthDate: event.target.checked,
                      dateOfBirth: event.target.checked ? prev.dateOfBirth : ''
                    }))
                  }
                  className='h-4 w-4'
                />
                {t.patientForm.addFullDate}
              </label>
              <label
                className={`text-sm text-[var(--muted)] ${
                  patientForm.useFullBirthDate ? '' : 'hidden'
                }`}
              >
                {t.patientForm.dateOfBirth}
                <input
                  value={patientForm.dateOfBirth}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      dateOfBirth: event.target.value,
                      birthYear: event.target.value
                        ? event.target.value.slice(0, 4)
                        : prev.birthYear
                    }))
                  }
                  type='date'
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                {t.patientForm.address}
                <input
                  value={patientForm.address}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      address: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                {t.patientForm.notes}
                <textarea
                  value={patientForm.notes}
                  onChange={event =>
                    setPatientForm(prev => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                  rows={4}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                type='button'
                onClick={closePatientModal}
                className='rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]'
              >
                {t.actions.cancel}
              </button>
              <button
                type='submit'
                disabled={isSavingPatient}
                className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
              >
                {isSavingPatient ? '...' : t.actions.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {taskModalPatientId && (
        <div className='fixed inset-0 z-[91] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <form
            onSubmit={handleCreateRelatedTask}
            className='w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'
          >
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                  {t.taskModal.title}
                </h3>
                <p className='mt-1 text-sm text-[var(--muted)]'>
                  {t.taskModal.description}
                </p>
              </div>
              <button type='button' onClick={closeTaskModal} className='rounded-lg p-2'>
                <X size={18} />
              </button>
            </div>

            <div className='mt-4 grid gap-3'>
              <label className='text-sm text-[var(--muted)]'>
                {t.taskModal.type}
                <select
                  value={taskForm.type}
                  onChange={event =>
                    setTaskForm(prev => ({
                      ...prev,
                      type: event.target.value,
                      customTypeLabel:
                        event.target.value === 'autres' ? prev.customTypeLabel : ''
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                >
                  {taskTypeOptions.map(option => (
                    <option key={option} value={option}>
                      {t.taskTypes[option]}
                    </option>
                  ))}
                </select>
              </label>

              {taskForm.type === 'autres' && (
                <label className='text-sm text-[var(--muted)]'>
                  {t.taskModal.customName}
                  <input
                    value={taskForm.customTypeLabel}
                    onChange={event =>
                      setTaskForm(prev => ({
                        ...prev,
                        customTypeLabel: event.target.value
                      }))
                    }
                    className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                  />
                  {taskErrors.customTypeLabel && (
                    <p className='mt-1 text-xs text-red-600'>
                      {taskErrors.customTypeLabel}
                    </p>
                  )}
                </label>
              )}

              <label className='text-sm text-[var(--muted)]'>
                {t.taskModal.comment}
                <textarea
                  value={taskForm.comment}
                  onChange={event =>
                    setTaskForm(prev => ({ ...prev, comment: event.target.value }))
                  }
                  rows={4}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                type='button'
                onClick={closeTaskModal}
                className='rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]'
              >
                {t.actions.cancel}
              </button>
              <button
                type='submit'
                disabled={busyKey === `task-${taskModalPatientId}`}
                className='rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60'
              >
                {t.actions.createTask}
              </button>
            </div>
          </form>
        </div>
      )}

      {treatmentModal.mode && (
        <div className='fixed inset-0 z-[92] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm'>
          <form
            onSubmit={saveTreatment}
            className='max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl'
          >
            <div className='flex items-start justify-between gap-3'>
              <h3 className='text-lg font-semibold text-[var(--foreground)]'>
                {treatmentModal.mode === 'edit'
                  ? t.treatmentForm.editTitle
                  : t.treatmentForm.addTitle}
              </h3>
              <button
                type='button'
                onClick={closeTreatmentModal}
                className='rounded-lg p-2'
              >
                <X size={18} />
              </button>
            </div>

            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
              <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                {t.treatmentForm.product}
                <input
                  value={treatmentForm.productName}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      productName: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                {treatmentErrors.productName && (
                  <p className='mt-1 text-xs text-red-600'>
                    {treatmentErrors.productName}
                  </p>
                )}
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.dosage}
                <input
                  value={treatmentForm.dosage}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      dosage: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.quantityPerDose}
                <input
                  value={treatmentForm.frequencyQty}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      frequencyQty: event.target.value
                    }))
                  }
                  placeholder={t.treatmentForm.quantityPerDosePlaceholder}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.times}
                <input
                  type='number'
                  min='0'
                  max='50'
                  step='0.5'
                  value={treatmentForm.frequencyTimes}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      frequencyTimes: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.per}
                <select
                  value={treatmentForm.frequencyPeriod}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      frequencyPeriod: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                >
                  <option value='day'>{t.periods.day}</option>
                  <option value='week'>{t.periods.week}</option>
                  <option value='month'>{t.periods.month}</option>
                </select>
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.usualQuantity}
                <input
                  value={treatmentForm.quantity}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      quantity: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.renewal}
                <select
                  value={treatmentForm.renewalFrequency}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      renewalFrequency: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                >
                  <option value='30'>{t.days(30)}</option>
                  <option value='60'>{t.days(60)}</option>
                  <option value='90'>{t.days(90)}</option>
                  <option value='custom'>{t.treatmentForm.custom}</option>
                </select>
              </label>
              {treatmentForm.renewalFrequency === 'custom' && (
                <label className='text-sm text-[var(--muted)]'>
                  {t.treatmentForm.numberOfDays}
                  <input
                    type='number'
                    min='1'
                    max='365'
                    value={treatmentForm.customRenewalDays}
                    onChange={event =>
                      setTreatmentForm(prev => ({
                        ...prev,
                        customRenewalDays: event.target.value
                      }))
                    }
                    className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                  />
                  {treatmentErrors.customRenewalDays && (
                    <p className='mt-1 text-xs text-red-600'>
                      {treatmentErrors.customRenewalDays}
                    </p>
                  )}
                </label>
              )}
              <label className='text-sm text-[var(--muted)]'>
                {t.treatmentForm.lastDoseDelivery}
                <input
                  type='date'
                  value={treatmentForm.lastDeliveryDate}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      lastDeliveryDate: event.target.value
                    }))
                  }
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
                {treatmentErrors.lastDeliveryDate && (
                  <p className='mt-1 text-xs text-red-600'>
                    {treatmentErrors.lastDeliveryDate}
                  </p>
                )}
              </label>
              <div className='rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5 text-sm'>
                <p className='text-xs text-[var(--muted)]'>
                  {t.treatmentForm.estimatedNext}
                </p>
                <p className='mt-1 font-semibold text-[var(--foreground)]'>
                  {formatDate(getEstimatedNextDate(treatmentForm), locale)}
                </p>
              </div>
              <label className='text-sm text-[var(--muted)] sm:col-span-2'>
                {t.treatmentForm.notes}
                <textarea
                  value={treatmentForm.notes}
                  onChange={event =>
                    setTreatmentForm(prev => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                  rows={4}
                  className='mt-1 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm text-[var(--foreground)]'
                />
              </label>
            </div>

            <div className='mt-5 flex justify-end gap-2'>
              <button
                type='button'
                onClick={closeTreatmentModal}
                className='rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]'
              >
                {t.actions.cancel}
              </button>
              <button
                type='submit'
                disabled={busyKey === 'save-treatment'}
                className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60'
              >
                {busyKey === 'save-treatment' ? '...' : t.actions.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

