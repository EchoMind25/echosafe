// ============================================================================
// EXPORT UTILITIES FOR UPLOAD HISTORY
// Supports CSV, JSON, and Excel formats
// ============================================================================

export interface HistoryJob {
  id: string
  filename: string
  fileSize?: number | null
  status: string
  totalLeads: number
  cleanLeads: number
  dncBlocked: number
  cautionLeads: number
  duplicatesRemoved: number
  averageRiskScore?: number | null
  complianceRate?: number | null
  processingTimeMs?: number | null
  source?: string | null
  areaCodesUsed?: string[] | null
  createdAt: string
}

export type ExportFormat = 'csv' | 'json' | 'excel'

/**
 * Escape CSV field values properly
 */
function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Format processing time
 */
function formatProcessingTime(ms: number | null | undefined): string {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

/**
 * Get CSV headers for history export
 */
function getHistoryCSVHeaders(): string[] {
  return [
    'Job ID',
    'Filename',
    'Status',
    'Total Leads',
    'Clean Leads',
    'DNC Blocked',
    'Caution Leads',
    'Duplicates Removed',
    'Compliance Rate (%)',
    'Avg Risk Score',
    'Processing Time',
    'File Size',
    'Source',
    'Area Codes',
    'Date',
  ]
}

/**
 * Convert a single history job to CSV row
 */
function historyToCSVRow(job: HistoryJob): string[] {
  return [
    job.id,
    job.filename,
    job.status,
    job.totalLeads.toString(),
    job.cleanLeads.toString(),
    job.dncBlocked.toString(),
    job.cautionLeads.toString(),
    job.duplicatesRemoved.toString(),
    job.complianceRate ? `${job.complianceRate}%` : '-',
    job.averageRiskScore?.toString() || '-',
    formatProcessingTime(job.processingTimeMs),
    formatFileSize(job.fileSize),
    job.source || '-',
    (job.areaCodesUsed || []).join(', ') || '-',
    new Date(job.createdAt).toLocaleString(),
  ]
}

/**
 * Export history to CSV format
 */
export function exportHistoryToCSV(jobs: HistoryJob[]): string {
  const headers = getHistoryCSVHeaders()
  const headerRow = headers.map(escapeCSVField).join(',')

  const dataRows = jobs.map(job => {
    const row = historyToCSVRow(job)
    return row.map(escapeCSVField).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Export history to JSON format (prettified)
 */
export function exportHistoryToJSON(jobs: HistoryJob[]): string {
  const exportData = jobs.map(job => ({
    id: job.id,
    filename: job.filename,
    status: job.status,
    stats: {
      totalLeads: job.totalLeads,
      cleanLeads: job.cleanLeads,
      dncBlocked: job.dncBlocked,
      cautionLeads: job.cautionLeads,
      duplicatesRemoved: job.duplicatesRemoved,
      complianceRate: job.complianceRate,
      averageRiskScore: job.averageRiskScore,
    },
    processingTimeMs: job.processingTimeMs,
    fileSize: job.fileSize,
    source: job.source,
    areaCodesUsed: job.areaCodesUsed,
    createdAt: job.createdAt,
  }))

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export history to Excel-compatible XML format
 * This creates a simple Excel XML that can be opened in Excel/Google Sheets
 */
export function exportHistoryToExcel(jobs: HistoryJob[]): string {
  const headers = getHistoryCSVHeaders()

  // Excel XML header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#CCCCCC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Success">
      <Font ss:Color="#006600"/>
    </Style>
    <Style ss:ID="Warning">
      <Font ss:Color="#996600"/>
    </Style>
    <Style ss:ID="Error">
      <Font ss:Color="#CC0000"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Upload History">
    <Table>
`

  // Header row
  xml += '      <Row>\n'
  headers.forEach(header => {
    xml += `        <Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXML(header)}</Data></Cell>\n`
  })
  xml += '      </Row>\n'

  // Data rows
  jobs.forEach(job => {
    const row = historyToCSVRow(job)
    const statusStyle = job.status === 'completed' ? 'Success' : job.status === 'failed' ? 'Error' : 'Warning'

    xml += '      <Row>\n'
    row.forEach((cell, index) => {
      // Apply status style to status column
      const style = index === 2 ? ` ss:StyleID="${statusStyle}"` : ''
      // Check if it's a number
      const isNumber = !isNaN(Number(cell)) && cell !== '-' && cell !== ''
      const type = isNumber ? 'Number' : 'String'
      xml += `        <Cell${style}><Data ss:Type="${type}">${escapeXML(cell)}</Data></Cell>\n`
    })
    xml += '      </Row>\n'
  })

  xml += `    </Table>
  </Worksheet>
</Workbook>`

  return xml
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Download a file with the given content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Export history in the specified format
 */
export function exportHistory(jobs: HistoryJob[], format: ExportFormat, filenameBase: string = 'upload_history'): void {
  const timestamp = new Date().toISOString().slice(0, 10)

  switch (format) {
    case 'csv': {
      const content = exportHistoryToCSV(jobs)
      downloadFile(content, `${filenameBase}_${timestamp}.csv`, 'text/csv;charset=utf-8;')
      break
    }
    case 'json': {
      const content = exportHistoryToJSON(jobs)
      downloadFile(content, `${filenameBase}_${timestamp}.json`, 'application/json;charset=utf-8;')
      break
    }
    case 'excel': {
      const content = exportHistoryToExcel(jobs)
      downloadFile(content, `${filenameBase}_${timestamp}.xml`, 'application/vnd.ms-excel;charset=utf-8;')
      break
    }
  }
}
