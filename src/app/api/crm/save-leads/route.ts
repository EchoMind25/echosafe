import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadStatus } from '@/lib/supabase/types'

interface ProcessedLead {
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  risk_score: number
  risk_flags: string[]
  dnc_status: 'clean' | 'caution' | 'blocked'
}

// ============================================================================
// POST - Save clean leads from a scrub job to the CRM
// ============================================================================

export async function POST(request: Request) {
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

    const { jobId } = await request.json()

    if (!jobId) {
      return NextResponse.json(
        { success: false, message: 'jobId is required' },
        { status: 400 }
      )
    }

    // Get the completed job with processed leads
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('id, status, pending_leads, filename')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Job is not completed yet' },
        { status: 400 }
      )
    }

    const allLeads = (job.pending_leads || []) as ProcessedLead[]
    const cleanLeads = allLeads.filter(l => l.dnc_status === 'clean')

    if (cleanLeads.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No clean leads to save' },
        { status: 400 }
      )
    }

    // Get existing phone numbers to avoid duplicates
    const phoneNumbers = cleanLeads.map(l => l.phone_number)
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('phone_number')
      .eq('user_id', user.id)
      .in('phone_number', phoneNumbers)
      .is('deleted_at', null)

    const existingPhones = new Set(existing?.map(e => e.phone_number) || [])

    // Filter out duplicates
    const newLeads = cleanLeads.filter(l => !existingPhones.has(l.phone_number))

    if (newLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All clean leads already exist in CRM',
        saved: 0,
        skipped: cleanLeads.length,
      })
    }

    // Insert in batches of 500
    const BATCH_SIZE = 500
    let saved = 0
    let errors = 0

    for (let i = 0; i < newLeads.length; i += BATCH_SIZE) {
      const batch = newLeads.slice(i, i + BATCH_SIZE).map(lead => ({
        user_id: user.id,
        phone_number: lead.phone_number,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        email: lead.email || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zip_code: lead.zip_code || null,
        source: `scrub:${job.filename || jobId}`,
        tags: ['scrubbed', 'clean'],
        status: 'new' as LeadStatus,
        risk_score: lead.risk_score,
      }))

      const { error: insertError } = await supabase
        .from('crm_leads')
        .insert(batch)

      if (insertError) {
        console.error('CRM batch insert error:', insertError)
        errors += batch.length
      } else {
        saved += batch.length
      }
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_leads_saved',
      event_data: {
        job_id: jobId,
        saved,
        skipped: existingPhones.size,
        errors,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Saved ${saved} leads to CRM`,
      saved,
      skipped: existingPhones.size,
      errors,
    })

  } catch (error) {
    console.error('CRM save error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
