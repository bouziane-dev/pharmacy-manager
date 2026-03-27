import { notFound, redirect } from 'next/navigation'

const RESERVED_SEGMENTS = new Set([
  'auth',
  'dashboard',
  'orders',
  'agenda',
  'users',
  'subscription',
  'superadmin',
  'admin',
  'onboarding',
  'invitations',
  'api'
])

function normalizeSlug(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  if (!normalized) return null
  if (!/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(normalized)) return null
  return normalized
}

export default function PharmacySlugEntryPage({ params }) {
  const slug = normalizeSlug(params?.pharmacySlug)
  if (!slug || RESERVED_SEGMENTS.has(slug)) {
    notFound()
  }

  const query = new URLSearchParams({ pharmacy: slug }).toString()
  redirect(`/auth?${query}`)
}
