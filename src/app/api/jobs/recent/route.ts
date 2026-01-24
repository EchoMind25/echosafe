import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET - Fetch recent scrub jobs for the current user
// ============================================================================

export async function GET() {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch recent uploads
    const { data: jobs, error: jobsError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    // Calculate stats
    const completedJobs = jobs?.filter(j => j.status === 'completed') || []
    const totalScrubbed = completedJobs.reduce((sum, j) => sum + (j.total_leads || 0), 0)
    const cleanLeads = completedJobs.reduce((sum, j) => sum + (j.clean_leads || 0), 0)
    const complianceRate = totalScrubbed > 0
      ? Math.round((cleanLeads / totalScrubbed) * 100)
      : 100

    // Format jobs for response
    const formattedJobs = (jobs || []).map(job => ({
      id: job.id,
      filename: job.filename,
      status: job.status,
      totalLeads: job.total_leads,
      cleanLeads: job.clean_leads,
      dncLeads: job.dnc_blocked,
      riskyLeads: job.caution_leads,
      createdAt: job.created_at,
    }))

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      stats: {
        totalScrubbed,
        cleanLeads,
        complianceRate,
      },
    })

  } catch (error) {
    console.error('Recent jobs error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
