import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ResultsDisplay from './ResultsDisplay'
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

  // If still processing, show loading state
  if (job.status === 'processing') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your leads...</p>
          <p className="text-sm text-gray-500 mt-2">This usually takes 10-30 seconds</p>
        </div>
      </div>
    )
  }

  // Pass data to client component for interactivity
  return <ResultsDisplay job={job} />
}
