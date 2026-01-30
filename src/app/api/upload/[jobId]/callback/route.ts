// ============================================================================
// DEPRECATED: This callback endpoint is no longer used by the new flow.
// DNC scrubbing is now handled by the Supabase Edge Function `dnc-scrub`,
// which writes results directly to the database.
// This file is kept for backwards compatibility with any in-flight N8N jobs.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ProcessedLead } from '@/types/upload'
import { generateInsights, type BatchStats } from '@/lib/ai/claude-insights'

// ============================================================================
// TYPES
// ============================================================================

/**
 * New N8N callback payload structure
 * The workflow returns a flat results array with dnc_status on each lead
 */
interface N8NCallbackPayload {
  success: boolean
  job_id: string
  summary: {
    total_leads: number
    clean_leads: number
    caution_leads: number
    dnc_blocked: number
    duplicates_removed: number
    processing_time_ms: number
    compliance_rate?: string
  }
  results: ProcessedLead[]
  error?: string
}

/**
 * Legacy callback payload (for backwards compatibility)
 */
interface LegacyN8NCallbackPayload {
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Log TCPA compliance audit entries for processed leads
 * Required for 5-year retention per 47 CFR § 64.1200
 */
async function logComplianceAudit(
  supabase: ReturnType<typeof createAdminClient>,
  request: NextRequest,
  job: { user_id: string },
  jobId: string,
  userIndustry: string,
  cleanLeads: ProcessedLead[],
  dncLeads: ProcessedLead[],
  riskyLeads: ProcessedLead[]
): Promise<void> {
  try {
    // Fetch user details for compliance logging
    const { data: userData } = await supabase
      .from('users')
      .select('email, company_name, industry')
      .eq('id', job.user_id)
      .single()

    // Calculate 5-year retention date
    const retentionDate = new Date()
    retentionDate.setFullYear(retentionDate.getFullYear() + 5)
    const retentionUntil = retentionDate.toISOString().split('T')[0]

    // Get IP address from request headers
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    // Build compliance logs for ALL leads with their respective statuses
    const complianceLogs: Array<{
      user_id: string
      user_email: string
      company_name: string
      phone_number: string
      area_code: string
      dnc_status: string
      risk_score: number | null
      check_purpose: string
      industry: string
      upload_job_id: string
      result_data: Record<string, unknown>
      retention_until: string
      source: string
      ip_address: string | null
    }> = []

    // Add clean leads (status: 'clean')
    if (cleanLeads && cleanLeads.length > 0) {
      for (const lead of cleanLeads) {
        const phoneDigits = lead.phone_number?.replace(/\D/g, '') || ''
        complianceLogs.push({
          user_id: job.user_id,
          user_email: userData?.email || 'unknown',
          company_name: userData?.company_name || 'Individual',
          phone_number: phoneDigits,
          area_code: phoneDigits.substring(0, 3),
          dnc_status: 'clean',
          risk_score: lead.risk_score ?? null,
          check_purpose: 'lead_scrubbing',
          industry: userData?.industry || userIndustry || 'other',
          upload_job_id: jobId,
          result_data: {
            risk_flags: lead.risk_flags || [],
          },
          retention_until: retentionUntil,
          source: 'web',
          ip_address: ipAddress,
        })
      }
    }

    // Add DNC blocked leads (status: 'blocked')
    if (dncLeads && dncLeads.length > 0) {
      for (const lead of dncLeads) {
        const phoneDigits = lead.phone_number?.replace(/\D/g, '') || ''
        complianceLogs.push({
          user_id: job.user_id,
          user_email: userData?.email || 'unknown',
          company_name: userData?.company_name || 'Individual',
          phone_number: phoneDigits,
          area_code: phoneDigits.substring(0, 3),
          dnc_status: 'blocked',
          risk_score: lead.risk_score ?? null,
          check_purpose: 'lead_scrubbing',
          industry: userData?.industry || userIndustry || 'other',
          upload_job_id: jobId,
          result_data: {
            risk_flags: lead.risk_flags || [],
          },
          retention_until: retentionUntil,
          source: 'web',
          ip_address: ipAddress,
        })
      }
    }

    // Add risky/caution leads (status: 'caution')
    if (riskyLeads && riskyLeads.length > 0) {
      for (const lead of riskyLeads) {
        const phoneDigits = lead.phone_number?.replace(/\D/g, '') || ''
        complianceLogs.push({
          user_id: job.user_id,
          user_email: userData?.email || 'unknown',
          company_name: userData?.company_name || 'Individual',
          phone_number: phoneDigits,
          area_code: phoneDigits.substring(0, 3),
          dnc_status: 'caution',
          risk_score: lead.risk_score ?? null,
          check_purpose: 'lead_scrubbing',
          industry: userData?.industry || userIndustry || 'other',
          upload_job_id: jobId,
          result_data: {
            risk_flags: lead.risk_flags || [],
          },
          retention_until: retentionUntil,
          source: 'web',
          ip_address: ipAddress,
        })
      }
    }

    // Batch insert compliance logs (in chunks of 500 to avoid payload limits)
    if (complianceLogs.length > 0) {
      const BATCH_SIZE = 500
      for (let i = 0; i < complianceLogs.length; i += BATCH_SIZE) {
        const batch = complianceLogs.slice(i, i + BATCH_SIZE)
        const { error: logError } = await supabase
          .from('compliance_audit_logs')
          .insert(batch)

        if (logError) {
          console.error(`Failed to log compliance audit batch ${i / BATCH_SIZE + 1}:`, logError)
        }
      }
      console.log(`Logged ${complianceLogs.length} compliance audit entries for job ${jobId}`)
    }
  } catch (complianceError) {
    // Compliance logging failure should NOT fail the upload
    console.error('Compliance audit logging failed (non-blocking):', complianceError)
  }
}

// ============================================================================
// POST - Receive callback from N8N
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  let jobId: string | null = null
  const supabaseForErrorHandling = createAdminClient()

  try {
    const resolvedParams = await params
    jobId = resolvedParams.jobId

    // Verify webhook secret (required in production)
    const webhookSecret = request.headers.get('x-webhook-secret')
    const expectedSecret = process.env.N8N_WEBHOOK_SECRET

    // In production, webhook secret MUST be configured
    if (process.env.NODE_ENV === 'production' && !expectedSecret) {
      console.error('SECURITY: N8N_WEBHOOK_SECRET not configured in production')
      return NextResponse.json(
        { success: false, message: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Validate secret if configured (always in production, optionally in dev)
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

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

    // Detect payload format (new vs legacy)
    const isNewFormat = 'success' in body && 'summary' in body
    const isLegacyFormat = 'status' in body

    if (isNewFormat) {
      // =====================================================================
      // NEW N8N WORKFLOW FORMAT
      // =====================================================================
      const payload = body as N8NCallbackPayload

      // Verify job ID matches
      if (payload.job_id && payload.job_id !== jobId) {
        return NextResponse.json(
          { success: false, message: 'Job ID mismatch' },
          { status: 400 }
        )
      }

      // Handle failed status
      if (!payload.success) {
        await supabase
          .from('upload_history')
          .update({
            status: 'failed',
            error_message: payload.error || 'Processing failed',
          })
          .eq('id', jobId)

        return NextResponse.json({
          success: true,
          message: 'Job marked as failed',
        })
      }

      // Handle successful completion - categorize leads by dnc_status
      const allLeads = payload.results || []
      const cleanLeads = allLeads.filter(l => l.dnc_status === 'clean')
      const dncLeads = allLeads.filter(l => l.dnc_status === 'blocked')
      const riskyLeads = allLeads.filter(l => l.dnc_status === 'caution')

      // Use summary stats from N8N (more accurate)
      const summary = payload.summary

      // Get user's industry from auth metadata
      const { data: authData } = await supabase.auth.admin.getUserById(job.user_id)
      const userIndustry = authData?.user?.user_metadata?.industry || 'other'

      // Calculate batch stats for AI insights
      const areaCodes = [...new Set(allLeads
        .map(l => l.phone_number?.replace(/\D/g, '').substring(0, 3))
        .filter(Boolean))]

      const batchStats: BatchStats = {
        total: summary.total_leads,
        safe: summary.clean_leads,
        caution: summary.caution_leads,
        blocked: summary.dnc_blocked,
        areaCodes,
        recentlyPorted: allLeads.filter(l => l.risk_flags?.includes('recently_ported')).length,
        litigators: allLeads.filter(l => l.risk_flags?.includes('known_litigator')).length,
        deletedNumbers: allLeads.filter(l => l.risk_flags?.includes('recently_removed_dnc')).length,
        duplicatesRemoved: summary.duplicates_removed,
        averageRiskScore: job.average_risk_score || undefined,
      }

      // Generate AI insights (errors are handled gracefully - upload still succeeds)
      let aiInsights = null
      try {
        aiInsights = await generateInsights(batchStats, userIndustry)
      } catch (error) {
        console.error('AI insights generation failed (non-blocking):', error)
      }

      // Update upload with results from summary (clear pending_leads to save storage)
      await supabase
        .from('upload_history')
        .update({
          status: 'completed',
          clean_leads: summary.clean_leads,
          dnc_blocked: summary.dnc_blocked,
          caution_leads: summary.caution_leads,
          duplicates_removed: summary.duplicates_removed,
          ai_insights: aiInsights,
          pending_leads: null, // Clear stored leads after successful processing
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      // Update user stats
      const { data: currentUser } = await supabase
        .from('users')
        .select('total_leads_scrubbed')
        .eq('id', job.user_id)
        .single()

      const currentTotal = currentUser?.total_leads_scrubbed || 0
      const newTotal = currentTotal + summary.total_leads

      await supabase
        .from('users')
        .update({
          total_leads_scrubbed: newTotal,
          last_scrub_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.user_id)

      // TCPA Compliance audit logging (same as legacy, using categorized leads)
      await logComplianceAudit(supabase, request, job, jobId, userIndustry, cleanLeads, dncLeads, riskyLeads)

      // Log analytics event
      await supabase.from('analytics_events').insert({
        user_id: job.user_id,
        event_type: 'scrub_job_completed',
        event_data: {
          job_id: jobId,
          total_leads: summary.total_leads,
          clean_leads: summary.clean_leads,
          dnc_blocked: summary.dnc_blocked,
          caution_leads: summary.caution_leads,
          processing_time_ms: summary.processing_time_ms,
          compliance_rate: summary.compliance_rate,
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Job completed successfully',
        stats: {
          cleanLeads: summary.clean_leads,
          dncLeads: summary.dnc_blocked,
          riskyLeads: summary.caution_leads,
        },
      })
    }

    // =====================================================================
    // LEGACY N8N FORMAT (backwards compatibility)
    // =====================================================================
    if (isLegacyFormat) {
      const legacyBody = body as LegacyN8NCallbackPayload

      // Verify job ID matches
      if (legacyBody.jobId && legacyBody.jobId !== jobId) {
        return NextResponse.json(
          { success: false, message: 'Job ID mismatch' },
          { status: 400 }
        )
      }

      // Handle failed status
      if (legacyBody.status === 'failed') {
        await supabase
          .from('upload_history')
          .update({
            status: 'failed',
            error_message: legacyBody.error || 'Processing failed',
          })
          .eq('id', jobId)

        return NextResponse.json({
          success: true,
          message: 'Job marked as failed',
        })
      }

      // Handle completed status (legacy format)
      if (legacyBody.status === 'completed' && legacyBody.results) {
        const { cleanLeads, dncLeads, riskyLeads } = legacyBody.results

        // Get user's industry from auth metadata
        const { data: authData } = await supabase.auth.admin.getUserById(job.user_id)
        const userIndustry = authData?.user?.user_metadata?.industry || 'other'

        // Calculate batch stats for AI insights
        const allLeads = [...(cleanLeads || []), ...(dncLeads || []), ...(riskyLeads || [])]
        const areaCodes = [...new Set(allLeads
          .map(l => l.phone_number?.replace(/\D/g, '').substring(0, 3))
          .filter(Boolean))]

        const batchStats: BatchStats = {
          total: job.total_leads || allLeads.length,
          safe: cleanLeads?.length || 0,
          caution: riskyLeads?.length || 0,
          blocked: dncLeads?.length || 0,
          areaCodes,
          recentlyPorted: allLeads.filter(l => l.risk_flags?.includes('recently_ported')).length,
          litigators: allLeads.filter(l => l.risk_flags?.includes('known_litigator')).length,
          deletedNumbers: allLeads.filter(l => l.risk_flags?.includes('recently_removed_dnc')).length,
          duplicatesRemoved: job.duplicates_removed || 0,
          averageRiskScore: job.average_risk_score || undefined,
        }

        // Generate AI insights (errors are handled gracefully - upload still succeeds)
        let aiInsights = null
        try {
          aiInsights = await generateInsights(batchStats, userIndustry)
        } catch (error) {
          console.error('AI insights generation failed (non-blocking):', error)
        }

        // Update upload with results (clear pending_leads to save storage)
        await supabase
          .from('upload_history')
          .update({
            status: 'completed',
            clean_leads: cleanLeads?.length || 0,
            dnc_blocked: dncLeads?.length || 0,
            caution_leads: riskyLeads?.length || 0,
            ai_insights: aiInsights,
            pending_leads: null, // Clear stored leads after successful processing
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId)

        // Update user stats
        const { data: currentUser } = await supabase
          .from('users')
          .select('total_leads_scrubbed')
          .eq('id', job.user_id)
          .single()

        const currentTotal = currentUser?.total_leads_scrubbed || 0
        const newTotal = currentTotal + (job.total_leads || 0)

        await supabase
          .from('users')
          .update({
            total_leads_scrubbed: newTotal,
            last_scrub_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', job.user_id)

        // TCPA Compliance audit logging (uses shared helper)
        await logComplianceAudit(
          supabase,
          request,
          job,
          jobId,
          userIndustry,
          cleanLeads || [],
          dncLeads || [],
          riskyLeads || []
        )

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
    }

    return NextResponse.json(
      { success: false, message: 'Invalid callback payload' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Callback error:', error)

    // CRITICAL FIX: Update job status to 'failed' so user doesn't see perpetual spinner
    if (jobId) {
      try {
        await supabaseForErrorHandling
          .from('upload_history')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown processing error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', jobId)

        console.log(`Job ${jobId} marked as failed due to callback error`)
      } catch (updateError) {
        console.error('Failed to update job status to failed:', updateError)
      }
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
