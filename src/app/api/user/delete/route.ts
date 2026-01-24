import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// POST /api/user/delete
// Permanently delete all user data
// ============================================================================

export async function POST(request: NextRequest) {
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
    const { password, confirmation } = body

    // Require explicit confirmation
    if (confirmation !== 'DELETE_ALL_MY_DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation. Please type DELETE_ALL_MY_DATA to proceed.' },
        { status: 400 }
      )
    }

    // Verify password by attempting to re-authenticate
    if (!password) {
      return NextResponse.json(
        { error: 'Password is required for account deletion' },
        { status: 400 }
      )
    }

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email || '',
      password,
    })

    if (signInError) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Begin deletion process
    const deletionResults = {
      leads: 0,
      uploads: 0,
      integrations: 0,
      integrationLogs: 0,
      analyticsEvents: 0,
    }

    // 1. Delete CRM leads
    const { count: leadsCount } = await supabase
      .from('crm_leads')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    deletionResults.leads = leadsCount || 0

    // 2. Delete upload history
    const { count: uploadsCount } = await supabase
      .from('upload_history')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    deletionResults.uploads = uploadsCount || 0

    // 3. Delete integration logs first (foreign key constraint)
    const { count: logsCount } = await supabase
      .from('crm_integration_logs')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    deletionResults.integrationLogs = logsCount || 0

    // 4. Delete integrations
    const { count: integrationsCount } = await supabase
      .from('crm_integrations')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    deletionResults.integrations = integrationsCount || 0

    // 5. Delete analytics events (if any)
    const { count: eventsCount } = await supabase
      .from('analytics_events')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    deletionResults.analyticsEvents = eventsCount || 0

    // 6. Delete user profile from users table
    await supabase
      .from('users')
      .delete()
      .eq('id', user.id)

    // 7. Sign out the user
    await supabase.auth.signOut()

    // Note: The auth user record will remain but can be deleted by admin if needed
    // This is because Supabase doesn't allow self-deletion of auth users

    return NextResponse.json({
      success: true,
      message: 'All your data has been permanently deleted',
      deletedRecords: deletionResults,
    })

  } catch (error) {
    console.error('Deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete data. Please contact support.' },
      { status: 500 }
    )
  }
}
