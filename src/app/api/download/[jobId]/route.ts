import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Database row type for upload_history
interface UploadHistoryRow {
  id: string
  user_id: string
  filename: string
  file_size: number | null
  total_leads: number
  processed_leads: number | null
  clean_leads: number
  dnc_blocked: number
  caution_leads: number
  duplicates_removed: number
  average_risk_score: number | null
  compliance_rate: number | null
  clean_file_url: string | null
  full_report_url: string | null
  risky_file_url: string | null
  processing_time_ms: number | null
  n8n_job_id: string | null
  status: 'processing' | 'completed' | 'failed'
  error_message: string | null
  source: string | null
  area_codes_used: string[] | null
  created_at: string
}

type ExportFormat = 'csv' | 'json' | 'excel'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const data: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    data.push(row)
  }

  return data
}

/**
 * Convert data to JSON format
 */
function convertToJSON(data: Record<string, string>[]): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Convert data to Excel XML format
 */
function convertToExcelXML(data: Record<string, string>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])

  // Escape XML special characters
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8E8E8" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Safe">
      <Font ss:Color="#006600"/>
    </Style>
    <Style ss:ID="Caution">
      <Font ss:Color="#996600"/>
    </Style>
    <Style ss:ID="Blocked">
      <Font ss:Color="#CC0000"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Leads">
    <Table>
`

  // Header row
  xml += '      <Row>\n'
  headers.forEach(header => {
    xml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(header)}</Data></Cell>\n`
  })
  xml += '      </Row>\n'

  // Data rows
  data.forEach(row => {
    const riskLevel = row['risk_level'] || row['status'] || ''
    let style = ''
    if (riskLevel.toLowerCase() === 'safe' || riskLevel.toLowerCase() === 'clean') {
      style = ' ss:StyleID="Safe"'
    } else if (riskLevel.toLowerCase() === 'caution') {
      style = ' ss:StyleID="Caution"'
    } else if (riskLevel.toLowerCase() === 'blocked' || riskLevel.toLowerCase() === 'dnc') {
      style = ' ss:StyleID="Blocked"'
    }

    xml += '      <Row>\n'
    headers.forEach(header => {
      const value = row[header] || ''
      const isNumber = !isNaN(Number(value)) && value !== ''
      const type = isNumber ? 'Number' : 'String'
      const cellStyle = header === 'risk_level' || header === 'status' ? style : ''
      xml += `        <Cell${cellStyle}><Data ss:Type="${type}">${escapeXML(value)}</Data></Cell>\n`
    })
    xml += '      </Row>\n'
  })

  xml += `    </Table>
  </Worksheet>
</Workbook>`

  return xml
}

// ============================================================================
// GET - Download job results in multiple formats
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
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

    // Get upload from database
    const { data: job, error: jobError } = await supabase
      .from('upload_history')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single() as unknown as { data: UploadHistoryRow | null; error: Error | null }

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, message: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job is completed
    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, message: 'Job is not completed yet' },
        { status: 400 }
      )
    }

    // Determine which file URL to use based on type
    let fileUrl: string | null = null
    let baseFilename = (job.filename || 'leads').replace(/\.[^/.]+$/, '')

    switch (type) {
      case 'clean':
        fileUrl = job.clean_file_url
        baseFilename += '_clean_leads'
        break
      case 'dnc':
      case 'risky':
        fileUrl = job.risky_file_url
        baseFilename += '_risky_leads'
        break
      case 'full':
      case 'all':
      default:
        fileUrl = job.full_report_url
        baseFilename += '_full_report'
        break
    }

    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: `No ${type} file available for this job` },
        { status: 404 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'results_downloaded',
      event_data: {
        job_id: jobId,
        download_type: type,
        format,
      },
    })

    // For CSV format, just redirect to the file URL
    if (format === 'csv') {
      return NextResponse.redirect(fileUrl)
    }

    // For other formats, fetch the CSV and convert
    try {
      const csvResponse = await fetch(fileUrl)
      if (!csvResponse.ok) {
        throw new Error('Failed to fetch file')
      }

      const csvText = await csvResponse.text()
      const data = parseCSV(csvText)

      let content: string
      let mimeType: string
      let extension: string

      if (format === 'json') {
        content = convertToJSON(data)
        mimeType = 'application/json'
        extension = 'json'
      } else {
        // Excel XML format
        content = convertToExcelXML(data)
        mimeType = 'application/vnd.ms-excel'
        extension = 'xml'
      }

      const filename = `${baseFilename}.${extension}`

      return new NextResponse(content, {
        headers: {
          'Content-Type': `${mimeType}; charset=utf-8`,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (fetchError) {
      console.error('Error fetching/converting file:', fetchError)
      // Fallback to redirect for CSV
      return NextResponse.redirect(fileUrl)
    }

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
