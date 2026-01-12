import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET - Fetch all sync logs across all integrations for the user
// ============================================================================

export async function GET(request: NextRequest) {
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
    const { data: integrations } = await supabase
      .from('crm_integrations')
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

    const integrationIds = integrations.map(i => i.id)

    // Build query for logs
    let query = supabase
      .from('crm_sync_logs')
      .select('*, crm_integrations!inner(crm_type)', { count: 'exact' })
      .in('integration_id', integrationIds)
      .order('synced_at', { ascending: false })

    // Apply status filter
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
    }

    // Apply CRM type filter
    if (crmType) {
      const filteredIntegrations = integrations.filter(i => i.crm_type === crmType)
      if (filteredIntegrations.length > 0) {
        query = query.in('integration_id', filteredIntegrations.map(i => i.id))
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
      query = query.gte('synced_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('synced_at', dateTo)
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

    // Map logs to include crm_type at top level
    const logsWithCrmType = (logs || []).map(log => ({
      ...log,
      crm_type: log.crm_integrations?.crm_type,
      crm_integrations: undefined,
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
