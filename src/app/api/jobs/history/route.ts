import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET - Fetch all upload history with pagination
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = (page - 1) * limit

    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch total count
    const { count } = await supabase
      .from('upload_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Fetch paginated uploads
    const { data: jobs, error: jobsError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    // Format jobs for response
    const formattedJobs = (jobs || []).map(job => ({
      id: job.id,
      filename: job.filename,
      fileSize: job.file_size,
      status: job.status,
      totalLeads: job.total_leads,
      cleanLeads: job.clean_leads,
      dncBlocked: job.dnc_blocked,
      cautionLeads: job.caution_leads,
      duplicatesRemoved: job.duplicates_removed,
      averageRiskScore: job.average_risk_score,
      complianceRate: job.compliance_rate,
      processingTimeMs: job.processing_time_ms,
      cleanFileUrl: job.clean_file_url,
      fullReportUrl: job.full_report_url,
      riskyFileUrl: job.risky_file_url,
      source: job.source,
      areaCodesUsed: job.area_codes_used,
      errorMessage: job.error_message,
      createdAt: job.created_at,
    }))

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Delete a specific job or all history
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const deleteAll = searchParams.get('all') === 'true'

    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (deleteAll) {
      // Delete all user's history
      const { error: deleteError } = await supabase
        .from('upload_history')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting all history:', deleteError)
        return NextResponse.json(
          { success: false, message: 'Failed to delete history' },
          { status: 500 }
        )
      }

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'history_deleted_all',
        event_data: {},
      })

      return NextResponse.json({
        success: true,
        message: 'All history deleted successfully',
      })

    } else if (jobId) {
      // Delete specific job
      const { error: deleteError } = await supabase
        .from('upload_history')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (deleteError) {
        console.error('Error deleting job:', deleteError)
        return NextResponse.json(
          { success: false, message: 'Failed to delete job' },
          { status: 500 }
        )
      }

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_type: 'history_deleted',
        event_data: { job_id: jobId },
      })

      return NextResponse.json({
        success: true,
        message: 'Job deleted successfully',
      })

    } else {
      return NextResponse.json(
        { success: false, message: 'Either jobId or all=true is required' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Delete history error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
