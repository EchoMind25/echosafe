import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { removeDuplicates } from '@/lib/utils/duplicate-detector'
import type { ParsedLead, UploadOptions, N8NWebhookRequest } from '@/types/upload'

// ============================================================================
// CONSTANTS
// ============================================================================

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://dncscrub.app.n8n.cloud/webhook/86fe5f5e-9ccd-4e3b-a247-971cdd50d529'

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
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/upload/${job.id}/callback`,
    }

    // Send to N8N webhook (async - don't wait for completion)
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    })
      .then(async (response) => {
        if (!response.ok) {
          console.error('N8N webhook error:', response.status, await response.text())
          // Update upload status to failed
          await supabase
            .from('upload_history')
            .update({
              status: 'failed',
              error_message: 'Failed to send to processing service',
            })
            .eq('id', job.id)
        }
        // Status is already 'processing' from initial insert
      })
      .catch(async (error) => {
        console.error('N8N webhook error:', error)
        await supabase
          .from('upload_history')
          .update({
            status: 'failed',
            error_message: 'Failed to connect to processing service',
          })
          .eq('id', job.id)
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
