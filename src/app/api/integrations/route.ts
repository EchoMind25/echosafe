import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/integrations/encryption'
import { testCrmConnection } from '@/lib/integrations/sync-engine'
import type { CrmType } from '@/types'

// ============================================================================
// GET - List user's integrations
// ============================================================================

export async function GET(request: NextRequest) {
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
    const { data: integrations, error } = await supabase
      .from('crm_integrations')
      .select(`
        id,
        crm_type,
        status,
        sync_settings,
        last_sync_at,
        last_error,
        consecutive_failures,
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
      (integrations || []).map(async (integration) => {
        const { data: logs, count } = await supabase
          .from('crm_sync_logs')
          .select('status', { count: 'exact' })
          .eq('integration_id', integration.id)

        const successCount = logs?.filter(l => l.status === 'SUCCESS').length || 0
        const failedCount = logs?.filter(l => l.status === 'FAILED').length || 0

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

    // Validate CRM type
    const validCrmTypes: CrmType[] = ['LOFTY', 'KVCORE']
    if (!crm_type || !validCrmTypes.includes(crm_type)) {
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
    const { data: existing } = await supabase
      .from('crm_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('crm_type', crm_type)
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
    const connectionTest = await testCrmConnection(crm_type, credentials)
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
      sync_clean_only: true,
      max_risk_score: 20,
      ...sync_settings,
    }

    // Create integration
    const { data: integration, error: createError } = await supabase
      .from('crm_integrations')
      .insert({
        user_id: user.id,
        crm_type,
        credentials,
        sync_settings: defaultSyncSettings,
        status: 'ACTIVE',
        consecutive_failures: 0,
      })
      .select(`
        id,
        crm_type,
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
      event_data: { crm_type, integration_id: integration.id },
    })

    return NextResponse.json({
      success: true,
      data: integration,
      message: `${crm_type} connected successfully`,
    }, { status: 201 })

  } catch (error) {
    console.error('Create integration error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
