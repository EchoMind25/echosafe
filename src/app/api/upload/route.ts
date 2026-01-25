import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeDuplicates } from '@/lib/utils/duplicate-detector'
import { getTrialStatusDirect, updateTrialUsageDirect } from '@/lib/trial/server'
import { canUserUploadLeads } from '@/lib/trial'
import type { ParsedLead, UploadOptions, N8NWebhookRequest } from '@/types/upload'

// ============================================================================
// CONSTANTS
// ============================================================================

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dncscrub.app.n8n.cloud/webhook/86fe5f5e-9ccd-4e3b-a247-971cdd50d529'
const N8N_TIMEOUT_MS = 30000 // 30 second timeout for initial webhook response

// ============================================================================
// POST - Start scrubbing job
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json()
    const { leads, options, filename } = body as {
      leads: ParsedLead[]
      options: UploadOptions
      filename: string
    }

    // Validate input
    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No leads provided' },
        { status: 400 }
      )
    }

    if (!filename) {
      return NextResponse.json(
        { success: false, message: 'Filename is required' },
        { status: 400 }
      )
    }

    // =========================================================================
    // TRIAL ABUSE PREVENTION CHECK
    // Check if user can upload based on trial limits (7 days, 1000 leads, 5 uploads)
    // =========================================================================
    const trialStatus = await getTrialStatusDirect(user.id)

    if (trialStatus) {
      const uploadCheck = canUserUploadLeads(trialStatus, leads.length)

      if (!uploadCheck.canUpload) {
        return NextResponse.json(
          {
            success: false,
            message: uploadCheck.reason,
            error: 'TRIAL_LIMIT_EXCEEDED',
            trialStatus: {
              isOnTrial: trialStatus.isOnTrial,
              trialExpired: trialStatus.trialExpired,
              leadsLimitReached: trialStatus.leadsLimitReached,
              uploadsLimitReached: trialStatus.uploadsLimitReached,
              trialLeadsRemaining: trialStatus.trialLeadsRemaining,
              trialUploadsRemaining: trialStatus.trialUploadsRemaining,
              daysRemaining: trialStatus.daysRemaining,
            },
          },
          { status: 403 }
        )
      }
    }

    // Process leads - remove duplicates if requested
    let processedLeads = leads
    let duplicatesRemoved = 0

    if (options.removeDuplicates) {
      const result = removeDuplicates(leads)
      processedLeads = result.unique
      duplicatesRemoved = result.removed.length
    }

    // Create upload record in database
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .insert({
        user_id: user.id,
        filename,
        status: 'processing',
        total_leads: processedLeads.length,
        clean_leads: 0,
        dnc_blocked: 0,
        caution_leads: 0,
        duplicates_removed: duplicatesRemoved,
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return NextResponse.json(
        { success: false, message: 'Failed to create scrubbing job' },
        { status: 500 }
      )
    }

    // Prepare N8N webhook payload - PRIVACY FIRST: minimum data only
    const webhookPayload: N8NWebhookRequest = {
      job_id: job.id,
      user_id: user.id,
      leads: processedLeads.map(lead => ({
        phone_number: lead.phone_number,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip_code: lead.zip_code,
      })),
      check_duplicates: options.removeDuplicates ?? true,
      timestamp: Date.now(),
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://echosafe.app'}/api/upload/${job.id}/callback`,
    }

    // Send to N8N webhook (async - don't wait for completion)
    // Use AbortController for timeout and admin client for async updates
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)
    const jobId = job.id // Capture for async callback

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
          console.error('N8N webhook error:', response.status, await response.text())
          // Use admin client for async callback (original client may be closed)
          const adminClient = createAdminClient()
          await adminClient
            .from('upload_history')
            .update({
              status: 'failed',
              error_message: `Processing service returned error: ${response.status}`,
            })
            .eq('id', jobId)
        }
        // Status is already 'processing' from initial insert
      })
      .catch(async (error) => {
        clearTimeout(timeoutId)
        const errorMessage = error.name === 'AbortError'
          ? 'Processing service timeout - job may still complete'
          : 'Failed to connect to processing service'
        console.error('N8N webhook error:', error)
        // Use admin client for async callback
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
      event_type: 'scrub_job_started',
      event_data: {
        job_id: job.id,
        filename,
        total_leads: processedLeads.length,
        duplicates_removed: duplicatesRemoved,
        options,
      },
    })

    // =========================================================================
    // INCREMENT TRIAL USAGE
    // Track this upload against trial limits (for trialing users only)
    // =========================================================================
    if (trialStatus?.isOnTrial) {
      await updateTrialUsageDirect(user.id, processedLeads.length)
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Scrubbing job started',
      stats: {
        totalLeads: processedLeads.length,
        duplicatesRemoved,
      },
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
