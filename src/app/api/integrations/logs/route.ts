import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// FEATURE FLAG: CRM Integrations Coming Soon
// ============================================================================
const CRM_INTEGRATIONS_COMING_SOON = true

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

// ============================================================================
// GET - Fetch all sync logs across all integrations for the user
// ============================================================================

export async function GET(request: NextRequest) {
  // Coming Soon - return empty logs
  if (CRM_INTEGRATIONS_COMING_SOON) {
    return NextResponse.json({
      success: true,
      data: [],
      comingSoon: true,
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      message: 'CRM integrations are coming soon!',
    })
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const crmType = searchParams.get('crm_type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const offset = (page - 1) * limit

    // Get user's integrations first
    const { data: integrations } = await fromTable(supabase, 'crm_integrations')
      .select('id, crm_type')
      .eq('user_id', user.id)

    if (!integrations || integrations.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      })
    }

    const integrationIds = integrations.map((i: { id: string }) => i.id)

    // Build query for logs - using crm_integration_logs (actual table name)
    let query = fromTable(supabase, 'crm_integration_logs')
      .select('*', { count: 'exact' })
      .in('integration_id', integrationIds)
      .order('started_at', { ascending: false })

    // Apply status filter
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    // Apply CRM type filter
    if (crmType) {
      const filteredIntegrations = integrations.filter((i: { crm_type: string }) => i.crm_type === crmType)
      if (filteredIntegrations.length > 0) {
        query = query.in('integration_id', filteredIntegrations.map((i: { id: string }) => i.id))
      } else {
        // No integrations of this type - return empty
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        })
      }
    }

    // Apply date range filters
    if (dateFrom) {
      query = query.gte('started_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('started_at', dateTo)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error: logsError, count } = await query

    if (logsError) {
      console.error('Error fetching sync logs:', logsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch sync logs' },
        { status: 500 }
      )
    }

    // Map logs to include crm_type from integrations lookup
    const integrationMap = new Map(integrations.map((i: { id: string; crm_type: string }) => [i.id, i.crm_type]))
    const logsWithCrmType = (logs || []).map((log: { integration_id: string }) => ({
      ...log,
      crm_type: integrationMap.get(log.integration_id),
    }))

    return NextResponse.json({
      success: true,
      data: logsWithCrmType,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Fetch all sync logs error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
