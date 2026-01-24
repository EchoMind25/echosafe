import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/integrations/encryption'
import { testCrmConnection } from '@/lib/integrations/sync-engine'

// ============================================================================
// FEATURE FLAG: CRM Integrations Coming Soon
// ============================================================================
const CRM_INTEGRATIONS_COMING_SOON = true

const comingSoonResponse = () => NextResponse.json({
  success: false,
  comingSoon: true,
  message: 'CRM integrations are coming soon! Your internal CRM is fully available.',
}, { status: 403 })

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

// ============================================================================
// GET - Get single integration details
// ============================================================================

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (CRM_INTEGRATIONS_COMING_SOON) return comingSoonResponse()

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

    // Fetch integration
    const { data: integration, error } = await fromTable(supabase, 'crm_integrations')
      .select(`
        id,
        crm_type,
        status,
        sync_settings,
        last_sync_at,
        last_error,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !integration) {
      return NextResponse.json(
        { success: false, message: 'Integration not found' },
        { status: 404 }
      )
    }

    // Get sync stats from crm_integration_logs
    const { count: totalSynced } = await fromTable(supabase, 'crm_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', id)

    const { count: successCount } = await fromTable(supabase, 'crm_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', id)
      .eq('status', 'success')

    const { count: failedCount } = await fromTable(supabase, 'crm_integration_logs')
      .select('*', { count: 'exact', head: true })
      .eq('integration_id', id)
      .eq('status', 'failed')

    return NextResponse.json({
      success: true,
      data: {
        ...integration,
        stats: {
          totalSynced: totalSynced || 0,
          successful: successCount || 0,
          failed: failedCount || 0,
        },
      },
    })

  } catch (error) {
    console.error('Get integration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update integration settings
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (CRM_INTEGRATIONS_COMING_SOON) return comingSoonResponse()

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
    const { data: existing, error: fetchError } = await fromTable(supabase, 'crm_integrations')
      .select('id, crm_type, credentials')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, message: 'Integration not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { sync_settings, status, api_key } = body

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    // Update sync settings if provided
    if (sync_settings) {
      updates.sync_settings = sync_settings
    }

    // Update status if provided
    if (status && ['active', 'paused'].includes(status.toLowerCase())) {
      updates.status = status.toLowerCase()
      // Clear error when reactivating
      if (status.toLowerCase() === 'active') {
        updates.last_error = null
      }
    }

    // Update API key if provided (for Lofty/KVCORE)
    if (api_key && ['lofty', 'kvcore'].includes(existing.crm_type?.toLowerCase())) {
      const credentials = encrypt(JSON.stringify({ api_key }))

      // Test new credentials
      const connectionTest = await testCrmConnection(existing.crm_type, credentials)
      if (!connectionTest.success) {
        return NextResponse.json(
          { success: false, message: connectionTest.error || 'Invalid API key' },
          { status: 400 }
        )
      }

      updates.credentials = credentials
    }

    // Update integration
    const { data: integration, error: updateError } = await fromTable(supabase, 'crm_integrations')
      .update(updates)
      .eq('id', id)
      .select(`
        id,
        crm_type,
        status,
        sync_settings,
        last_sync_at,
        created_at,
        updated_at
      `)
      .single()

    if (updateError) {
      console.error('Error updating integration:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update integration' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_integration_updated',
      event_data: { integration_id: id, updates: Object.keys(updates) },
    })

    return NextResponse.json({
      success: true,
      data: integration,
      message: 'Integration updated successfully',
    })

  } catch (error) {
    console.error('Update integration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Disconnect integration
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (CRM_INTEGRATIONS_COMING_SOON) return comingSoonResponse()

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
    const { data: existing, error: fetchError } = await fromTable(supabase, 'crm_integrations')
      .select('id, crm_type')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json(
        { success: false, message: 'Integration not found' },
        { status: 404 }
      )
    }

    // Delete integration (this will cascade delete sync logs due to FK)
    const { error: deleteError } = await fromTable(supabase, 'crm_integrations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting integration:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to disconnect integration' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_integration_disconnected',
      event_data: { crm_type: existing.crm_type },
    })

    return NextResponse.json({
      success: true,
      message: `${existing.crm_type} disconnected successfully`,
    })

  } catch (error) {
    console.error('Delete integration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
