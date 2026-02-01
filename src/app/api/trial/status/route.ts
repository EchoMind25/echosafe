import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTrialStatusDirect } from '@/lib/trial/server'

// ============================================================================
// GET - Get current user's trial status
// ============================================================================

export async function GET() {
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

    // Check admin status (use admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    // Get trial status
    const trialStatus = await getTrialStatusDirect(user.id)

    if (!trialStatus) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch trial status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: trialStatus,
      isAdmin,
    })

  } catch (error) {
    console.error('Trial status error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
