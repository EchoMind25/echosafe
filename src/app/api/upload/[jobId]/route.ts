import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    // Calculate progress percentage
    const progress = job.total_leads > 0
      ? Math.round((job.processed_leads / job.total_leads) * 100)
      : 0

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        filename: job.filename,
        totalLeads: job.total_leads,
        processedLeads: job.processed_leads,
        cleanLeads: job.clean_leads,
        dncLeads: job.dnc_leads,
        riskyLeads: job.risky_leads,
        progress,
        results: job.results,
        errorMessage: job.error_message,
        startedAt: job.started_at,
        completedAt: job.completed_at,
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
