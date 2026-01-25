import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ParsedLead, N8NWebhookRequest } from '@/types/upload'

// ============================================================================
// CONSTANTS
// ============================================================================

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dncscrub.app.n8n.cloud/webhook/86fe5f5e-9ccd-4e3b-a247-971cdd50d529'
const N8N_TIMEOUT_MS = 30000
const MAX_RETRIES = 3

// ============================================================================
// POST - Retry a failed job
// ============================================================================

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const resolvedParams = await params
    const jobId = resolvedParams.jobId

    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the failed job
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id) // Security: only allow retry of own jobs
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job can be retried
    if (job.status !== 'failed') {
      return NextResponse.json(
        { success: false, message: 'Only failed jobs can be retried' },
        { status: 400 }
      )
    }

    // Check retry limit
    const retryCount = job.retry_count || 0
    if (retryCount >= MAX_RETRIES) {
      return NextResponse.json(
        { success: false, message: `Maximum retry attempts (${MAX_RETRIES}) reached. Please upload the file again.` },
        { status: 400 }
      )
    }

    // Check if leads are available for retry
    const pendingLeads = job.pending_leads as ParsedLead[] | null
    if (!pendingLeads || pendingLeads.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead data not available for retry. Please upload the file again.' },
        { status: 400 }
      )
    }

    // Reset job status and increment retry count
    const { error: updateError } = await supabase
      .from('upload_history')
      .update({
        status: 'processing',
        error_message: null,
        retry_count: retryCount + 1,
        last_retry_at: new Date().toISOString(),
        clean_leads: 0,
        dnc_blocked: 0,
        caution_leads: 0,
      })
      .eq('id', jobId)

    if (updateError) {
      console.error('Error updating job for retry:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to initiate retry' },
        { status: 500 }
      )
    }

    // Prepare N8N webhook payload
    const webhookPayload: N8NWebhookRequest = {
      job_id: jobId,
      user_id: user.id,
      leads: pendingLeads.map(lead => ({
        phone_number: lead.phone_number,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip_code: lead.zip_code,
      })),
      check_duplicates: false, // Already processed duplicates
      timestamp: Date.now(),
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://echosafe.app'}/api/upload/${jobId}/callback`,
    }

    // Send to N8N webhook (async)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
      signal: controller.signal,
    })
      .then(async (response) => {
        clearTimeout(timeoutId)
        if (!response.ok) {
          console.error('N8N webhook error on retry:', response.status, await response.text())
          const adminClient = createAdminClient()
          await adminClient
            .from('upload_history')
            .update({
              status: 'failed',
              error_message: `Processing service returned error: ${response.status}`,
            })
            .eq('id', jobId)
        }
      })
      .catch(async (error) => {
        clearTimeout(timeoutId)
        const errorMessage = error.name === 'AbortError'
          ? 'Processing service timeout - job may still complete'
          : 'Failed to connect to processing service'
        console.error('N8N webhook error on retry:', error)
        const adminClient = createAdminClient()
        await adminClient
          .from('upload_history')
          .update({
            status: error.name === 'AbortError' ? 'processing' : 'failed',
            error_message: errorMessage,
          })
          .eq('id', jobId)
      })

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'scrub_job_retried',
      event_data: {
        job_id: jobId,
        retry_count: retryCount + 1,
        total_leads: pendingLeads.length,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Retry initiated',
      retryCount: retryCount + 1,
    })

  } catch (error) {
    console.error('Retry error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
