import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processAutoSync, type SyncLeadInput } from '@/lib/integrations/sync-engine'

// ============================================================================
// POST - Handle lead created webhook (triggers CRM auto-sync)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (optional but recommended for production)
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { user_id, lead, source = 'scrub' } = body

    // Validate required fields
    if (!user_id || !lead) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: user_id, lead' },
        { status: 400 }
      )
    }

    // Validate lead has required fields
    if (!lead.id || !lead.phone_number) {
      return NextResponse.json(
        { success: false, message: 'Lead must have id and phone_number' },
        { status: 400 }
      )
    }

    // Convert lead to SyncLeadInput format
    const syncLead: SyncLeadInput = {
      id: lead.id,
      phone_number: lead.phone_number,
      first_name: lead.first_name || lead.firstName || null,
      last_name: lead.last_name || lead.lastName || null,
      email: lead.email || null,
      address: lead.address || null,
      city: lead.city || null,
      state: lead.state || null,
      zip_code: lead.zip_code || lead.zipCode || null,
      risk_score: lead.risk_score ?? lead.riskScore ?? null,
      tags: lead.tags || [],
      notes: lead.notes || null,
      source: source === 'scrub' ? 'Echo Mind Scrub' : lead.source || 'Echo Mind',
    }

    // Process auto-sync to all configured integrations
    const result = await processAutoSync(user_id, syncLead)

    // Log the webhook processing
    const supabase = await createClient()
    await supabase.from('analytics_events').insert({
      user_id,
      event_type: 'webhook_lead_created',
      event_data: {
        lead_id: lead.id,
        source,
        synced: result.synced,
        integrations: result.integrations,
        errors: result.errors,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        processed: true,
        synced: result.synced,
        integrations: result.integrations,
        errors: result.errors.length > 0 ? result.errors : undefined,
      },
      message: result.synced
        ? `Lead synced to: ${result.integrations.join(', ')}`
        : 'Lead processed (no active integrations)',
    })

  } catch (error) {
    console.error('Lead created webhook error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}

// ============================================================================
// Batch endpoint for multiple leads
// ============================================================================

export async function PUT(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook secret' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { user_id, leads, source = 'scrub' } = body

    if (!user_id || !leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: user_id, leads (array)' },
        { status: 400 }
      )
    }

    const results = {
      processed: 0,
      synced: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each lead
    for (const lead of leads) {
      if (!lead.id || !lead.phone_number) {
        results.failed++
        continue
      }

      const syncLead: SyncLeadInput = {
        id: lead.id,
        phone_number: lead.phone_number,
        first_name: lead.first_name || lead.firstName || null,
        last_name: lead.last_name || lead.lastName || null,
        email: lead.email || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zip_code: lead.zip_code || lead.zipCode || null,
        risk_score: lead.risk_score ?? lead.riskScore ?? null,
        tags: lead.tags || [],
        notes: lead.notes || null,
        source: source === 'scrub' ? 'Echo Mind Scrub' : lead.source || 'Echo Mind',
      }

      try {
        const result = await processAutoSync(user_id, syncLead)
        results.processed++
        if (result.synced) {
          results.synced++
        }
        if (result.errors.length > 0) {
          results.errors.push(...result.errors)
        }
      } catch (error) {
        results.failed++
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Lead ${lead.id}: ${message}`)
      }

      // Small delay to avoid overwhelming CRM APIs
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Processed ${results.processed} leads, synced ${results.synced}`,
    })

  } catch (error) {
    console.error('Batch lead webhook error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
