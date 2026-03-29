'use client'

import { useParams } from 'next/navigation'
import AppShell from '@/app/components/AppShell'
import InBodyPatientProfile from '@/app/components/InBodyPatientProfile'
import { getCopy } from '@/app/lib/i18n'
import { useRouteGuard } from '@/app/lib/useRouteGuard'
import { useSession } from '@/app/providers'

export default function InBodyPatientProfilePage() {
  const { user, isLoading, isBlocked } = useRouteGuard({})
  const { patientId } = useParams()
  const { locale } = useSession()
  const t = getCopy(locale)

  if (isLoading || isBlocked || !user) return null

  return (
    <AppShell title={t.pages.inbody}>
      <InBodyPatientProfile patientId={patientId} />
    </AppShell>
  )
}

