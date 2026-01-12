import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// DELETE - Permanently delete lead (no recovery)
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

    // Verify lead exists and belongs to user (including soft-deleted)
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id, deleted_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Lead not found' },
        { status: 404 }
      )
    }

    // Permanently delete
    const { error: deleteError } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error permanently deleting lead:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to permanently delete lead' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_lead_deleted',
      event_data: { lead_id: id, type: 'permanent_delete' },
    })

    return NextResponse.json({
      success: true,
      message: 'Lead permanently deleted.',
    })

  } catch (error) {
    console.error('Permanent delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
