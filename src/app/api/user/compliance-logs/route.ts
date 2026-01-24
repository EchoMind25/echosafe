import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// GET /api/user/compliance-logs
// Get user's compliance audit logs (TCPA 5-year retention)
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Check if format=csv is requested
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    // Fetch compliance logs for this user (most recent 100)
    const { data: logs, error: logsError } = await supabase
      .from('compliance_audit_logs')
      .select('id, phone_number, dnc_status, risk_score, checked_at, upload_job_id, check_purpose, area_code, result_data')
      .eq('user_id', user.id)
      .order('checked_at', { ascending: false })
      .limit(100)

    if (logsError) {
      console.error('Error fetching compliance logs:', logsError)
      return NextResponse.json(
        { error: 'Failed to fetch compliance logs' },
        { status: 500 }
      )
    }

    // If CSV format requested, convert to CSV
    if (format === 'csv') {
      const csvRows = [
        // Header row
        ['Date', 'Phone Number', 'Area Code', 'DNC Status', 'Risk Score', 'Check Purpose', 'Upload Job ID'].join(','),
        // Data rows
        ...(logs || []).map(log => [
          new Date(log.checked_at).toISOString(),
          log.phone_number,
          log.area_code,
          log.dnc_status,
          log.risk_score ?? '',
          log.check_purpose,
          log.upload_job_id ?? ''
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="compliance-audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    // Return JSON by default
    return NextResponse.json(logs || [])

  } catch (error) {
    console.error('Compliance logs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance logs' },
      { status: 500 }
    )
  }
}
