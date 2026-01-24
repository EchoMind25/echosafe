import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { FtcChangeListUpdate } from '@/lib/supabase/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/ftc-change-lists/[id]
 * Get a specific FTC change list by ID
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Fetch change list
    const { data, error } = await supabase
      .from('ftc_change_lists')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Change list not found' }, { status: 404 })
      }
      console.error('Error fetching change list:', error)
      return NextResponse.json({ error: 'Failed to fetch change list' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/ftc-change-lists/[id]
 * Update a specific FTC change list (status, progress, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Validate status if provided
    if (body.status && !['pending', 'processing', 'completed', 'failed'].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Build update object with only allowed fields
    const updateData: FtcChangeListUpdate = {}

    const allowedFields = [
      'status',
      'total_records',
      'processed_records',
      'failed_records',
      'skipped_records',
      'progress_percent',
      'current_batch',
      'total_batches',
      'file_url',
      'error_message',
      'error_details',
      'retry_count',
      'last_retry_at',
      'processing_started_at',
      'processing_completed_at',
      'processing_duration_ms',
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (updateData as Record<string, unknown>)[field] = body[field]
      }
    }

    // Update change list
    const { data, error } = await supabase
      .from('ftc_change_lists')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Change list not found' }, { status: 404 })
      }
      console.error('Error updating change list:', error)
      return NextResponse.json({ error: 'Failed to update change list' }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/ftc-change-lists/[id]
 * Delete a specific FTC change list
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Check if change list is currently processing
    const { data: existing } = await supabase
      .from('ftc_change_lists')
      .select('status')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Change list not found' }, { status: 404 })
    }

    if (existing.status === 'processing') {
      return NextResponse.json(
        { error: 'Cannot delete a change list that is currently processing' },
        { status: 400 }
      )
    }

    // Delete change list
    const { error } = await supabase
      .from('ftc_change_lists')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting change list:', error)
      return NextResponse.json({ error: 'Failed to delete change list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/ftc-change-lists/[id]
 * Trigger reprocessing of a failed change list
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
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

    // Fetch the change list
    const { data: changeList, error: fetchError } = await supabase
      .from('ftc_change_lists')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !changeList) {
      return NextResponse.json({ error: 'Change list not found' }, { status: 404 })
    }

    // Can only retry failed or completed lists
    if (!['failed', 'completed'].includes(changeList.status)) {
      return NextResponse.json(
        { error: 'Can only retry failed or completed change lists' },
        { status: 400 }
      )
    }

    // Reset status and increment retry count
    const { data, error: updateError } = await supabase
      .from('ftc_change_lists')
      .update({
        status: 'pending',
        processed_records: 0,
        failed_records: 0,
        skipped_records: 0,
        progress_percent: 0,
        current_batch: 0,
        error_message: null,
        error_details: null,
        retry_count: (changeList.retry_count || 0) + 1,
        last_retry_at: new Date().toISOString(),
        processing_started_at: null,
        processing_completed_at: null,
        processing_duration_ms: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error resetting change list:', updateError)
      return NextResponse.json({ error: 'Failed to reset change list' }, { status: 500 })
    }

    // Invoke edge function to reprocess
    const { error: fnError } = await supabase.functions.invoke('process-ftc-change-list', {
      body: {
        change_list_id: id,
        change_type: changeList.change_type,
        is_retry: true,
      },
    })

    if (fnError) {
      console.warn('Edge function may be processing in background:', fnError)
    }

    return NextResponse.json({ data, message: 'Reprocessing initiated' })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
