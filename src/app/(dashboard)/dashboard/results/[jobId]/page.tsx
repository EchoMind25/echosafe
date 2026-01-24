import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ResultsDisplay from './ResultsDisplay'
import ProcessingDisplay from './ProcessingDisplay'
import type { UploadHistory } from '@/types/database'

interface PageProps {
  params: Promise<{
    jobId: string
  }>
}

export default async function ResultsPage({ params }: PageProps) {
  const { jobId } = await params
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Fetch the job - server-side
  const { data: job, error } = await supabase
    .from('upload_history')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single<UploadHistory>()

  if (error || !job) {
    notFound()
  }

  // If still processing, show processing display with polling
  if (job.status === 'processing') {
    return (
      <ProcessingDisplay
        jobId={job.id}
        initialFilename={job.filename}
        initialTotalLeads={job.total_leads}
      />
    )
  }

  // If failed, show error state
  if (job.status === 'failed') {
    return (
      <ProcessingDisplay
        jobId={job.id}
        initialFilename={job.filename}
        initialTotalLeads={job.total_leads}
      />
    )
  }

  // Pass data to client component for interactivity
  return <ResultsDisplay job={job} />
}
