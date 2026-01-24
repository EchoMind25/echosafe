import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FtcChangeListInsert, FtcChangeType, FtcChangeListStatus } from '@/lib/supabase/types'

/**
 * GET /api/admin/ftc-change-lists
 * List FTC change lists with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const changeType = searchParams.get('change_type')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = supabase
      .from('ftc_change_lists')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (changeType && ['additions', 'deletions'].includes(changeType)) {
      query = query.eq('change_type', changeType as FtcChangeType)
    }

    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      query = query.eq('status', status as FtcChangeListStatus)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching change lists:', error)
      return NextResponse.json({ error: 'Failed to fetch change lists' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/ftc-change-lists
 * Create a new FTC change list record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      change_type,
      ftc_file_date,
      area_codes,
      file_name,
      file_size_bytes,
      file_hash,
    } = body

    // Validate required fields
    if (!change_type || !['additions', 'deletions'].includes(change_type)) {
      return NextResponse.json(
        { error: 'Invalid change_type. Must be "additions" or "deletions"' },
        { status: 400 }
      )
    }

    if (!ftc_file_date) {
      return NextResponse.json(
        { error: 'ftc_file_date is required' },
        { status: 400 }
      )
    }

    if (!area_codes || !Array.isArray(area_codes) || area_codes.length === 0) {
      return NextResponse.json(
        { error: 'area_codes must be a non-empty array' },
        { status: 400 }
      )
    }

    // Check for duplicate upload (same file hash)
    if (file_hash) {
      const { data: existing } = await supabase
        .from('ftc_change_lists')
        .select('id')
        .eq('file_hash', file_hash)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'This file has already been uploaded', duplicate_id: existing.id },
          { status: 409 }
        )
      }
    }

    // Validate area codes against active subscriptions
    const { data: subscriptions } = await supabase
      .from('ftc_subscriptions')
      .select('area_code')
      .eq('subscription_status', 'active')
      .in('area_code', area_codes)

    const validAreaCodes = new Set(subscriptions?.map((s: { area_code: string }) => s.area_code) || [])
    const invalidCodes = area_codes.filter((code: string) => !validAreaCodes.has(code))

    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { error: `Invalid or inactive area codes: ${invalidCodes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create change list record
    const insertData: FtcChangeListInsert = {
      change_type,
      ftc_file_date,
      area_codes,
      status: 'pending',
      file_name,
      file_size_bytes,
      file_hash,
      uploaded_by: user.id,
    }

    const { data: changeList, error: insertError } = await supabase
      .from('ftc_change_lists')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating change list:', insertError)
      return NextResponse.json({ error: 'Failed to create change list' }, { status: 500 })
    }

    return NextResponse.json({ data: changeList }, { status: 201 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
