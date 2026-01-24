import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Database row type for upload_history
interface UploadHistoryRow {
  id: string
  user_id: string
  filename: string
  file_size: number | null
  total_leads: number
  processed_leads: number | null
  clean_leads: number
  dnc_blocked: number
  caution_leads: number
  duplicates_removed: number
  average_risk_score: number | null
  compliance_rate: number | null
  clean_file_url: string | null
  full_report_url: string | null
  risky_file_url: string | null
  processing_time_ms: number | null
  n8n_job_id: string | null
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  source: string | null
  area_codes_used: string[] | null
  created_at: string
}

// ============================================================================
// GET - Poll job status
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get upload from database
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single() as unknown as { data: UploadHistoryRow | null; error: Error | null }

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    // Calculate progress percentage
    const processedLeads = job.processed_leads || 0
    const progress = job.total_leads > 0
      ? Math.round((processedLeads / job.total_leads) * 100)
      : 0

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        filename: job.filename,
        totalLeads: job.total_leads,
        processedLeads: processedLeads,
        cleanLeads: job.clean_leads,
        dncLeads: job.dnc_blocked,
        riskyLeads: job.caution_leads,
        progress,
        cleanFileUrl: job.clean_file_url,
        fullReportUrl: job.full_report_url,
        riskyFileUrl: job.risky_file_url,
        errorMessage: job.error_message,
        createdAt: job.created_at,
      },
    })

  } catch (error) {
    console.error('Poll job error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
