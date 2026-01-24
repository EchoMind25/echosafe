import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/integrations/encryption'
import { testCrmConnection } from '@/lib/integrations/sync-engine'
import type { CrmType } from '@/types'

// ============================================================================
// FEATURE FLAG: CRM Integrations Coming Soon
// Set to false to enable CRM integrations
// ============================================================================
const CRM_INTEGRATIONS_COMING_SOON = true

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

// ============================================================================
// GET - List user's integrations
// ============================================================================

export async function GET(_request: NextRequest) {
  // Coming Soon - return empty list
  if (CRM_INTEGRATIONS_COMING_SOON) {
    return NextResponse.json({
      success: true,
      data: [],
      comingSoon: true,
      message: 'CRM integrations coming soon! Your internal CRM is fully available.',
    })
  }
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

    // Fetch integrations
    const { data: integrations, error } = await fromTable(supabase, 'crm_integrations')
      .select(`
        id,
        crm_type,
        crm_name,
        status,
        sync_settings,
        last_sync_at,
        last_error,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching integrations:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch integrations' },
        { status: 500 }
      )
    }

    // Get sync stats for each integration
    const integrationsWithStats = await Promise.all(
      (integrations || []).map(async (integration: { id: string }) => {
        const { data: logs, count } = await fromTable(supabase, 'crm_integration_logs')
          .select('status', { count: 'exact' })
          .eq('integration_id', integration.id)

        const successCount = logs?.filter((l: { status: string }) => l.status === 'success').length || 0
        const failedCount = logs?.filter((l: { status: string }) => l.status === 'failed').length || 0

        return {
          ...integration,
          stats: {
            totalSynced: count || 0,
            successful: successCount,
            failed: failedCount,
          },
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: integrationsWithStats,
    })

  } catch (error) {
    console.error('Integrations fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create integration (API key based CRMs like Lofty)
// ============================================================================

export async function POST(request: NextRequest) {
  // Coming Soon - block all new integrations
  if (CRM_INTEGRATIONS_COMING_SOON) {
    return NextResponse.json({
      success: false,
      comingSoon: true,
      message: 'CRM integrations are coming soon! Your internal CRM is fully available in the meantime.',
    }, { status: 403 })
  }

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
    const { crm_type, api_key, team_id, sync_settings } = body

    // Validate CRM type (uppercase to match CrmType enum)
    const normalizedCrmType = crm_type?.toUpperCase() as CrmType
    const validCrmTypes: CrmType[] = ['LOFTY', 'KVCORE']
    if (!crm_type || !validCrmTypes.includes(normalizedCrmType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid CRM type for API key authentication' },
        { status: 400 }
      )
    }

    // Validate API key
    if (!api_key || api_key.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Valid API key is required' },
        { status: 400 }
      )
    }

    // Check for existing integration
    const { data: existing } = await fromTable(supabase, 'crm_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('crm_type', normalizedCrmType)
      .single()

    if (existing) {
      return NextResponse.json(
        { success: false, message: `You already have a ${crm_type} integration connected` },
        { status: 409 }
      )
    }

    // Encrypt credentials
    const credentials = encrypt(JSON.stringify({
      api_key,
      team_id: team_id || undefined,
    }))

    // Test connection before saving
    const connectionTest = await testCrmConnection(normalizedCrmType, credentials)
    if (!connectionTest.success) {
      return NextResponse.json(
        { success: false, message: connectionTest.error || 'Failed to connect to CRM' },
        { status: 400 }
      )
    }

    // Default sync settings
    const defaultSyncSettings = {
      auto_sync: true,
      sync_frequency: 'immediate',
      sync_risky: false,
      ...sync_settings,
    }

    // Create integration
    const { data: integration, error: createError } = await fromTable(supabase, 'crm_integrations')
      .insert({
        user_id: user.id,
        crm_type: normalizedCrmType,
        crm_name: normalizedCrmType,
        credentials,
        sync_settings: defaultSyncSettings,
        status: 'ACTIVE',
      })
      .select(`
        id,
        crm_type,
        crm_name,
        status,
        sync_settings,
        created_at
      `)
      .single()

    if (createError) {
      console.error('Error creating integration:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create integration' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_integration_connected',
      event_data: { crm_type: normalizedCrmType, integration_id: integration.id },
    })

    return NextResponse.json({
      success: true,
      data: integration,
      message: `${normalizedCrmType} connected successfully`,
    }, { status: 201 })

  } catch (error) {
    console.error('Create integration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
