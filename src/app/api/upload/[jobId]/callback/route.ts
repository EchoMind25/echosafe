import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProcessedLead } from '@/types/upload'

// ============================================================================
// TYPES
// ============================================================================

interface N8NCallbackPayload {
  jobId: string
  status: 'completed' | 'failed'
  results?: {
    cleanLeads: ProcessedLead[]
    dncLeads: ProcessedLead[]
    riskyLeads: ProcessedLead[]
  }
  error?: string
  executionId?: string
}

// ============================================================================
// POST - Receive callback from N8N
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    // Verify webhook secret (optional but recommended)
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.N8N_WEBHOOK_SECRET && webhookSecret !== process.env.N8N_WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: N8NCallbackPayload = await request.json()

    // Use admin client for callback (no user session)
    const supabase = createAdminClient()

    // Get upload from database
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify job ID matches
    if (body.jobId && body.jobId !== jobId) {
      return NextResponse.json(
        { success: false, message: 'Job ID mismatch' },
        { status: 400 }
      )
    }

    // Handle failed status
    if (body.status === 'failed') {
      await supabase
        .from('upload_history')
        .update({
          status: 'failed',
          error_message: body.error || 'Processing failed',
        })
        .eq('id', jobId)

      return NextResponse.json({
        success: true,
        message: 'Job marked as failed',
      })
    }

    // Handle completed status
    if (body.status === 'completed' && body.results) {
      const { cleanLeads, dncLeads, riskyLeads } = body.results

      // Update upload with results
      await supabase
        .from('upload_history')
        .update({
          status: 'completed',
          clean_leads: cleanLeads?.length || 0,
          dnc_blocked: dncLeads?.length || 0,
          caution_leads: riskyLeads?.length || 0,
        })
        .eq('id', jobId)

      // Update user stats
      await supabase
        .from('users')
        .update({
          total_leads_scrubbed: job.total_leads,
          last_scrub_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.user_id)

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: job.user_id,
        event_type: 'scrub_job_completed',
        event_data: {
          job_id: jobId,
          total_leads: job.total_leads,
          clean_leads: cleanLeads?.length || 0,
          dnc_leads: dncLeads?.length || 0,
          risky_leads: riskyLeads?.length || 0,
        },
      })

      // Handle CRM save if requested
      const jobOptions = job.options as Record<string, unknown>
      if (jobOptions?.saveTocrm && cleanLeads && cleanLeads.length > 0) {
        // TODO: Implement CRM save functionality
        console.log('CRM save requested for', cleanLeads.length, 'leads')
      }

      return NextResponse.json({
        success: true,
        message: 'Job completed successfully',
        stats: {
          cleanLeads: cleanLeads?.length || 0,
          dncLeads: dncLeads?.length || 0,
          riskyLeads: riskyLeads?.length || 0,
        },
      })
    }

    return NextResponse.json(
      { success: false, message: 'Invalid callback payload' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
