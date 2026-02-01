import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Processed lead shape from the edge function
interface ProcessedLead {
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  risk_score: number
  risk_flags: string[]
  dnc_status: 'clean' | 'caution' | 'blocked'
  [key: string]: unknown
}

type ExportFormat = 'csv' | 'json' | 'excel'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeCSVField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function leadsToCSV(leads: ProcessedLead[]): string {
  if (leads.length === 0) return ''

  const headers = [
    'phone_number', 'first_name', 'last_name', 'email',
    'address', 'city', 'state', 'zip_code',
    'dnc_status', 'risk_score', 'risk_flags',
  ]

  const rows = leads.map(lead =>
    headers.map(h => {
      const val = lead[h]
      if (Array.isArray(val)) return escapeCSVField(val.join('; '))
      return escapeCSVField(String(val ?? ''))
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

function leadsToJSON(leads: ProcessedLead[]): string {
  return JSON.stringify(leads, null, 2)
}

function leadsToExcelXML(leads: ProcessedLead[]): string {
  if (leads.length === 0) return ''

  const headers = [
    'phone_number', 'first_name', 'last_name', 'email',
    'address', 'city', 'state', 'zip_code',
    'dnc_status', 'risk_score', 'risk_flags',
  ]

  const escapeXML = (str: string): string =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#E8E8E8" ss:Pattern="Solid"/></Style>
    <Style ss:ID="Safe"><Font ss:Color="#006600"/></Style>
    <Style ss:ID="Caution"><Font ss:Color="#996600"/></Style>
    <Style ss:ID="Blocked"><Font ss:Color="#CC0000"/></Style>
  </Styles>
  <Worksheet ss:Name="Leads">
    <Table>
`

  xml += '      <Row>\n'
  headers.forEach(h => {
    xml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>\n`
  })
  xml += '      </Row>\n'

  leads.forEach(lead => {
    const style = lead.dnc_status === 'clean' ? ' ss:StyleID="Safe"'
      : lead.dnc_status === 'caution' ? ' ss:StyleID="Caution"'
      : lead.dnc_status === 'blocked' ? ' ss:StyleID="Blocked"' : ''

    xml += '      <Row>\n'
    headers.forEach(h => {
      const val = lead[h]
      const str = Array.isArray(val) ? val.join('; ') : String(val ?? '')
      const isNum = h === 'risk_score'
      const cellStyle = h === 'dnc_status' ? style : ''
      xml += `        <Cell${cellStyle}><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXML(str)}</Data></Cell>\n`
    })
    xml += '      </Row>\n'
  })

  xml += `    </Table>
  </Worksheet>
</Workbook>`
  return xml
}

// ============================================================================
// GET - Download job results
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'full'
    const format = (searchParams.get('format') || 'csv') as ExportFormat

    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get upload from database including processed leads
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('id, user_id, filename, status, pending_leads, clean_leads, dnc_blocked, caution_leads')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Job is not completed yet' },
        { status: 400 }
      )
    }

    const allLeads = (job.pending_leads || []) as ProcessedLead[]

    if (allLeads.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No lead data available for this job. The job may have been processed before this feature was available.' },
        { status: 404 }
      )
    }

    // Filter leads by type
    let leads: ProcessedLead[]
    let fileSuffix: string

    switch (type) {
      case 'clean':
        leads = allLeads.filter(l => l.dnc_status === 'clean')
        fileSuffix = '_clean_leads'
        break
      case 'risky':
      case 'dnc':
        leads = allLeads.filter(l => l.dnc_status === 'caution' || l.dnc_status === 'blocked')
        fileSuffix = '_risky_leads'
        break
      case 'full':
      case 'all':
      default:
        leads = allLeads
        fileSuffix = '_full_report'
        break
    }

    // Generate file content
    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
      case 'json':
        content = leadsToJSON(leads)
        mimeType = 'application/json'
        extension = 'json'
        break
      case 'excel':
        content = leadsToExcelXML(leads)
        mimeType = 'application/vnd.ms-excel'
        extension = 'xml'
        break
      case 'csv':
      default:
        content = leadsToCSV(leads)
        mimeType = 'text/csv'
        extension = 'csv'
        break
    }

    const baseFilename = (job.filename || 'leads').replace(/\.[^/.]+$/, '')
    const filename = `${baseFilename}${fileSuffix}.${extension}`

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'results_downloaded',
      event_data: {
        job_id: jobId,
        download_type: type,
        format,
        lead_count: leads.length,
      },
    })

    return new NextResponse(content, {
      headers: {
        'Content-Type': `${mimeType}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
