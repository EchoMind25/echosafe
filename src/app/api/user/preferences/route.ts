import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET /api/user/preferences
// Get user preferences
// ============================================================================

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching preferences:', userError)
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: userData?.preferences ?? {},
    })

  } catch (error) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/user/preferences
// Update user preferences (partial update)
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate theme value if provided
    if (body.theme !== undefined && !['light', 'dark', 'system'].includes(body.theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value. Must be "light", "dark", or "system"' },
        { status: 400 }
      )
    }

    // Get current preferences
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching current preferences:', fetchError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    // Merge new preferences with existing ones
    const currentPreferences = userData?.preferences ?? {}
    const updatedPreferences = {
      ...currentPreferences,
      ...body,
    }

    // Update preferences
    const { error: updateError } = await supabase
      .from('users')
      .update({
        preferences: updatedPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating preferences:', updateError)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedPreferences,
    })

  } catch (error) {
    console.error('Preferences update error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}
