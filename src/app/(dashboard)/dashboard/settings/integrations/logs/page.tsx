'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================================
// SYNC LOGS - COMING SOON (Phase 2)
// Redirects to integrations page for now
// ============================================================================

export default function SyncLogsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to integrations page since logs are Phase 2
    router.replace('/dashboard/settings/integrations')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="text-slate-500">Redirecting...</p>
    </div>
  )
}
