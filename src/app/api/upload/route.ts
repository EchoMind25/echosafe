import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeDuplicates } from '@/lib/utils/duplicate-detector'
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

    // Extract unique area codes from uploaded leads for DNC database targeting
    const extractedAreaCodes = [...new Set(
      processedLeads
        .map(lead => lead.phone_number?.replace(/\D/g, '').substring(0, 3))
        .filter(code => code && code.length === 3)
    )]

    // Prepare N8N webhook payload
    const webhookPayload: N8NWebhookRequest = {
      jobId: job.id,
      userId: user.id,
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
      options: {
        removeDuplicates: options.removeDuplicates,
        saveToCrm: options.saveToCrm,
        includeRiskyInDownload: options.includeRiskyInDownload,
      },
      // Area codes extracted from uploaded leads for DNC database targeting
      areaCodes: extractedAreaCodes.length > 0 ? extractedAreaCodes : ['801', '385', '435'],
      // Map duplicate check option for N8N workflow
      checkDuplicates: options.removeDuplicates ?? true,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload/${job.id}/callback`,
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
