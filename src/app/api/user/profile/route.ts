import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ensureUserExists } from '@/lib/supabase/admin'

// ============================================================================
// PATCH /api/user/profile
// Update user profile information
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { fullName, companyName, industry } = body

    // Update user metadata in auth
    const { error: updateAuthError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        company_name: companyName,
        industry,
      },
    })

    if (updateAuthError) {
      console.error('Error updating auth metadata:', updateAuthError)
    }

    // Ensure user record exists (fallback for missing trigger)
    await ensureUserExists(user.id, user.email || '', {
      full_name: fullName || user.user_metadata?.full_name,
      industry: industry || user.user_metadata?.industry,
    })

    // Update users table
    const { error: updateUserError } = await supabase
      .from('users')
      .update({
        full_name: fullName,
        company_name: companyName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateUserError) {
      console.error('Error updating user:', updateUserError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
