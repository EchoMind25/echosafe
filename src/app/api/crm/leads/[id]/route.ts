import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET - Get single lead by ID
// ============================================================================

export async function GET(
  _request: NextRequest,
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

    // Get lead
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lead,
    })

  } catch (error) {
    console.error('Get lead error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT - Update lead
// ============================================================================

export async function PUT(
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

    // Verify lead exists and belongs to user
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      address,
      city,
      state,
      zip_code,
      status,
      tags,
      notes,
      next_followup_at,
      last_contact_at,
      contact_count,
    } = body

    // Build update object (only include provided fields)
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (first_name !== undefined) updates.first_name = first_name
    if (last_name !== undefined) updates.last_name = last_name
    if (email !== undefined) updates.email = email
    if (address !== undefined) updates.address = address
    if (city !== undefined) updates.city = city
    if (state !== undefined) updates.state = state
    if (zip_code !== undefined) updates.zip_code = zip_code
    if (status !== undefined) updates.status = status
    if (tags !== undefined) updates.tags = tags
    if (notes !== undefined) updates.notes = notes
    if (next_followup_at !== undefined) updates.next_followup_at = next_followup_at
    if (last_contact_at !== undefined) updates.last_contact_at = last_contact_at
    if (contact_count !== undefined) updates.contact_count = contact_count

    // Update lead
    const { data: lead, error: updateError } = await supabase
      .from('crm_leads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update lead' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_lead_updated',
      event_data: { lead_id: id, fields_updated: Object.keys(updates) },
    })

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    })

  } catch (error) {
    console.error('Update lead error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Soft delete lead (30-day recovery)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
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

    // Verify lead exists and belongs to user
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Soft delete - set deleted_at timestamp
    const { error: deleteError } = await supabase
      .from('crm_leads')
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting lead:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to delete lead' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_lead_deleted',
      event_data: { lead_id: id, type: 'soft_delete' },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead deleted. It can be recovered within 30 days.',
    })

  } catch (error) {
    console.error('Delete lead error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
