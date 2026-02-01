import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeDuplicates } from '@/lib/utils/duplicate-detector'
import { getTrialStatusDirect, updateTrialUsageDirect } from '@/lib/trial/server'
import { canUserUploadLeads } from '@/lib/trial'
import type { ParsedLead, UploadOptions, DncScrubRequest } from '@/types/upload'

// Allow enough time for the edge function invocation to complete
export const maxDuration = 60

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

    // Create upload record in database (store leads for retry capability)
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
        // Store leads temporarily for retry functionality
        pending_leads: processedLeads,
        retry_count: 0,
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

    // Prepare Edge Function payload
    const scrubPayload: DncScrubRequest = {
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
    }

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

    // Invoke Supabase Edge Function and increment trial usage AFTER the
    // response is sent. after() keeps the serverless function alive so
    // the invocation actually completes (fire-and-forget promises are
    // killed on Vercel once the response is returned).
    const userId = user.id
    const leadCount = processedLeads.length
    const jobId = job.id
    const isOnTrial = trialStatus?.isOnTrial ?? false

    after(async () => {
      try {
        const adminClient = createAdminClient()
        const { error } = await adminClient.functions.invoke('DNC-scrub', {
          body: scrubPayload,
        })

        if (error) {
          console.error('Edge Function invocation error:', error)
          const fallbackAdmin = createAdminClient()
          await fallbackAdmin
            .from('upload_history')
            .update({
              status: 'failed',
              error_message: `Edge Function invocation failed: ${error.message}`,
            })
            .eq('id', jobId)
          return
        }

        // Only increment trial usage after a successful invocation
        if (isOnTrial) {
          await updateTrialUsageDirect(userId, leadCount)
        }
      } catch (err) {
        console.error('Edge Function invocation error:', err)
        try {
          const fallbackAdmin = createAdminClient()
          await fallbackAdmin
            .from('upload_history')
            .update({
              status: 'failed',
              error_message: 'Failed to invoke processing service',
            })
            .eq('id', jobId)
        } catch (updateErr) {
          console.error('Failed to mark job as failed:', updateErr)
        }
      }
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
