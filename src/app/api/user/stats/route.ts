import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET /api/user/stats
// Get user's data statistics for the settings page
// ============================================================================

export async function GET() {
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

    // Count leads
    const { count: leadCount, error: leadsError } = await supabase
      .from('crm_leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    if (leadsError) {
      console.error('Error counting leads:', leadsError)
    }

    // Count uploads
    const { count: uploadCount, error: uploadsError } = await supabase
      .from('upload_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (uploadsError) {
      console.error('Error counting uploads:', uploadsError)
    }

    // Count active integrations
    const { count: integrationsCount, error: integrationsError } = await supabase
      .from('crm_integrations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (integrationsError) {
      console.error('Error counting integrations:', integrationsError)
    }

    // Estimate storage (rough calculation based on lead count)
    // Average lead size is approximately 500 bytes
    const estimatedBytes = (leadCount || 0) * 500
    let storageUsed = '0 KB'
    if (estimatedBytes > 1024 * 1024) {
      storageUsed = `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`
    } else if (estimatedBytes > 1024) {
      storageUsed = `${(estimatedBytes / 1024).toFixed(1)} KB`
    } else {
      storageUsed = `${estimatedBytes} B`
    }

    return NextResponse.json({
      leadCount: leadCount || 0,
      uploadCount: uploadCount || 0,
      integrationsCount: integrationsCount || 0,
      storageUsed,
    })

  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
