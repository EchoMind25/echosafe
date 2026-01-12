import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadsToCSV } from '@/lib/utils/file-parser'
import type { ProcessedLead } from '@/types/upload'

// ============================================================================
// GET - Download job results as CSV
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'

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

    // Check if job is completed
    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Job is not completed yet' },
        { status: 400 }
      )
    }

    // Get results
    const results = job.results as {
      cleanLeads: ProcessedLead[]
      dncLeads: ProcessedLead[]
      riskyLeads: ProcessedLead[]
    } | null

    if (!results) {
      return NextResponse.json(
        { success: false, message: 'No results available' },
        { status: 400 }
      )
    }

    // Determine which leads to include
    let leads: ProcessedLead[] = []
    let filename = job.filename.replace(/\.[^/.]+$/, '')

    switch (type) {
      case 'clean':
        leads = results.cleanLeads || []
        filename += '_clean_leads.csv'
        break
      case 'dnc':
        leads = results.dncLeads || []
        filename += '_dnc_leads.csv'
        break
      case 'risky':
        leads = results.riskyLeads || []
        filename += '_risky_leads.csv'
        break
      case 'all':
      default:
        leads = [
          ...(results.cleanLeads || []).map(l => ({ ...l, _status: 'clean' })),
          ...(results.dncLeads || []).map(l => ({ ...l, _status: 'dnc' })),
          ...(results.riskyLeads || []).map(l => ({ ...l, _status: 'risky' })),
        ]
        filename += '_all_results.csv'
        break
    }

    // Generate CSV
    const includeRiskData = type === 'all' || type === 'dnc' || type === 'risky'
    const csvContent = leadsToCSV(leads, includeRiskData)

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'results_downloaded',
      event_data: {
        job_id: jobId,
        download_type: type,
        lead_count: leads.length,
      },
    })

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
