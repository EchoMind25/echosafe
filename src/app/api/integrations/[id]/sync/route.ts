import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { manualSync } from '@/lib/integrations/sync-engine'

// ============================================================================
// POST - Trigger manual sync for an integration
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check integration exists and belongs to user
    const { data: integration, error: fetchError } = await supabase
      .from('crm_integrations')
      .select('id, crm_type, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json(
        { success: false, message: 'Integration not found' },
        { status: 404 }
      )
    }

    if (integration.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Integration is not active. Please reactivate it first.' },
        { status: 400 }
      )
    }

    // Parse optional lead IDs from request body
    let leadIds: string[] | undefined
    try {
      const body = await request.json()
      leadIds = body.lead_ids
    } catch {
      // No body or invalid JSON - sync all leads
    }

    // Perform manual sync
    const result = await manualSync(id, user.id, leadIds)

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_manual_sync',
      event_data: {
        integration_id: id,
        crm_type: integration.crm_type,
        leads_synced: result.successful,
        leads_failed: result.failed,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        totalProcessed: result.totalProcessed,
        successful: result.successful,
        failed: result.failed,
        skipped: result.skipped,
      },
      message: result.failed === 0
        ? `Successfully synced ${result.successful} leads to ${integration.crm_type}`
        : `Synced ${result.successful} leads, ${result.failed} failed`,
    })

  } catch (error) {
    console.error('Manual sync error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    )
  }
}
