import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================================
// TYPES
// ============================================================================

interface ExportData {
  exportedAt: string
  user: {
    id: string
    email: string
    fullName: string
    companyName: string | null
    industry: string | null
    createdAt: string
  }
  statistics: {
    totalLeads: number
    totalUploads: number
    totalLeadsScrubbed: number
    activeIntegrations: number
  }
  leads: Array<{
    id: string
    phoneNumber: string
    firstName: string | null
    lastName: string | null
    email: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    riskScore: number | null
    riskLevel: string | null
    dncStatus: boolean
    status: string
    source: string | null
    tags: string[] | null
    notes: string | null
    createdAt: string
    updatedAt: string
  }>
  uploadHistory: Array<{
    id: string
    filename: string
    totalLeads: number
    cleanLeads: number
    dncBlocked: number
    cautionLeads: number
    duplicatesRemoved: number
    complianceRate: number | null
    status: string
    createdAt: string
  }>
  integrations: Array<{
    id: string
    crmType: string
    crmName: string
    status: string
    lastSyncAt: string | null
    createdAt: string
  }>
}

// ============================================================================
// HELPERS
// ============================================================================

function convertToCSV(leads: ExportData['leads']): string {
  if (leads.length === 0) {
    return 'phone_number,first_name,last_name,email,address,city,state,zip_code,risk_score,risk_level,dnc_status,status,source,tags,notes,created_at'
  }

  const headers = [
    'phone_number',
    'first_name',
    'last_name',
    'email',
    'address',
    'city',
    'state',
    'zip_code',
    'risk_score',
    'risk_level',
    'dnc_status',
    'status',
    'source',
    'tags',
    'notes',
    'created_at',
  ]

  const rows = leads.map((lead) => {
    return [
      lead.phoneNumber,
      lead.firstName || '',
      lead.lastName || '',
      lead.email || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.zipCode || '',
      lead.riskScore?.toString() || '',
      lead.riskLevel || '',
      lead.dncStatus ? 'Yes' : 'No',
      lead.status,
      lead.source || '',
      lead.tags?.join(';') || '',
      (lead.notes || '').replace(/"/g, '""'), // Escape quotes for CSV
      lead.createdAt,
    ].map((field) => `"${field}"`).join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

// ============================================================================
// GET /api/user/export?format=csv|json
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

    // Get format from query params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Use "csv" or "json"' },
        { status: 400 }
      )
    }

    // Fetch user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
    }

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
    }

    // Fetch upload history
    const { data: uploads, error: uploadsError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError)
    }

    // Fetch integrations
    const { data: integrations, error: integrationsError } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('user_id', user.id)

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError)
    }

    // Build export data
    const exportData: ExportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email || '',
        fullName: userData?.full_name || user.user_metadata?.full_name || '',
        companyName: userData?.company_name || null,
        industry: user.user_metadata?.industry || null,
        createdAt: userData?.created_at || user.created_at || '',
      },
      statistics: {
        totalLeads: leads?.length || 0,
        totalUploads: uploads?.length || 0,
        totalLeadsScrubbed: userData?.total_leads_scrubbed || 0,
        activeIntegrations: integrations?.filter((i) => i.status === 'active').length || 0,
      },
      leads: (leads || []).map((lead) => ({
        id: lead.id,
        phoneNumber: lead.phone_number,
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zip_code,
        riskScore: lead.risk_score,
        riskLevel: lead.risk_level,
        dncStatus: lead.dnc_status,
        status: lead.status,
        source: lead.source,
        tags: lead.tags,
        notes: lead.notes,
        createdAt: lead.created_at,
        updatedAt: lead.updated_at,
      })),
      uploadHistory: (uploads || []).map((upload) => ({
        id: upload.id,
        filename: upload.filename,
        totalLeads: upload.total_leads,
        cleanLeads: upload.clean_leads,
        dncBlocked: upload.dnc_blocked,
        cautionLeads: upload.caution_leads,
        duplicatesRemoved: upload.duplicates_removed,
        complianceRate: upload.compliance_rate,
        status: upload.status,
        createdAt: upload.created_at,
      })),
      integrations: (integrations || []).map((integration) => ({
        id: integration.id,
        crmType: integration.crm_type,
        crmName: integration.crm_name,
        status: integration.status,
        lastSyncAt: integration.last_sync_at,
        createdAt: integration.created_at,
      })),
    }

    // Return based on format
    if (format === 'csv') {
      const csv = convertToCSV(exportData.leads)
      const filename = `echosafe-leads-export-${new Date().toISOString().split('T')[0]}.csv`

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // JSON format
    const filename = `echosafe-full-export-${new Date().toISOString().split('T')[0]}.json`

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}
