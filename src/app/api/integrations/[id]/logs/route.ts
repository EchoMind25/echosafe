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
// GET - Fetch sync logs for an integration
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
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

    // Check integration exists and belongs to user
    const { data: integration, error: fetchError } = await fromTable(supabase, 'crm_integrations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !integration) {
      return NextResponse.json(
        { success: false, message: 'Integration not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const offset = (page - 1) * limit

    // Build query - using crm_integration_logs (the actual table name)
    let query = fromTable(supabase, 'crm_integration_logs')
      .select('*', { count: 'exact' })
      .eq('integration_id', id)
      .order('started_at', { ascending: false })

    // Apply status filter
    if (status) {
      const statuses = status.split(',')
      query = query.in('status', statuses)
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

    return NextResponse.json({
      success: true,
      data: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })

  } catch (error) {
    console.error('Fetch sync logs error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
