// ============================================================================
// CSV EXPORT UTILITIES
// Streaming CSV generation for large datasets
// ============================================================================

import type { CrmLead } from '@/types'

/**
 * Escape CSV field values properly
 */
function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Generate CSV headers for CRM leads
 */
function getLeadCSVHeaders(): string[] {
  return [
    'ID',
    'First Name',
    'Last Name',
    'Phone Number',
    'Email',
    'Address',
    'City',
    'State',
    'Zip Code',
    'Status',
    'Risk Score',
    'Risk Level',
    'DNC Status',
    'Source',
    'Tags',
    'Notes',
    'Contact Count',
    'Last Contact',
    'Next Followup',
    'Created At',
    'Updated At',
  ]
}

/**
 * Convert a single lead to CSV row
 */
function leadToCSVRow(lead: CrmLead): string[] {
  return [
    lead.id,
    lead.firstName || '',
    lead.lastName || '',
    lead.phoneNumber,
    lead.email || '',
    lead.address || '',
    lead.city || '',
    lead.state || '',
    lead.zipCode || '',
    lead.status,
    lead.riskScore?.toString() || '',
    lead.riskLevel || '',
    lead.dncStatus ? 'Yes' : 'No',
    lead.source || '',
    (lead.tags || []).join('; '),
    lead.notes || '',
    lead.contactCount.toString(),
    lead.lastContactAt ? new Date(lead.lastContactAt).toISOString() : '',
    lead.nextFollowupAt ? new Date(lead.nextFollowupAt).toISOString() : '',
    new Date(lead.createdAt).toISOString(),
    new Date(lead.updatedAt).toISOString(),
  ]
}

/**
 * Generate CSV content from leads array
 * For small datasets (under 1000 leads)
 */
export function leadsToCSV(leads: CrmLead[]): string {
  const headers = getLeadCSVHeaders()
  const headerRow = headers.map(escapeCSVField).join(',')

  const dataRows = leads.map(lead => {
    const row = leadToCSVRow(lead)
    return row.map(escapeCSVField).join(',')
  })

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Create a streaming CSV generator for large datasets
 * Returns an async generator that yields chunks
 */
export async function* streamLeadsToCSV(
  fetchLeads: (offset: number, limit: number) => Promise<CrmLead[]>,
  batchSize: number = 500
): AsyncGenerator<string, void, unknown> {
  // Yield headers first
  const headers = getLeadCSVHeaders()
  yield headers.map(escapeCSVField).join(',') + '\n'

  let offset = 0
  let hasMore = true

  while (hasMore) {
    const leads = await fetchLeads(offset, batchSize)

    if (leads.length === 0) {
      hasMore = false
      break
    }

    // Yield each row
    for (const lead of leads) {
      const row = leadToCSVRow(lead)
      yield row.map(escapeCSVField).join(',') + '\n'
    }

    offset += batchSize

    // If we got fewer than batchSize, we're done
    if (leads.length < batchSize) {
      hasMore = false
    }
  }
}

/**
 * Create a ReadableStream for CSV download
 * Useful for large exports
 */
export function createCSVStream(
  fetchLeads: (offset: number, limit: number) => Promise<CrmLead[]>,
  batchSize: number = 500
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const generator = streamLeadsToCSV(fetchLeads, batchSize)

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await generator.next()

      if (done) {
        controller.close()
      } else {
        controller.enqueue(encoder.encode(value))
      }
    },
  })
}

/**
 * Simple CSV export for client-side download
 * Creates a blob and triggers download
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  URL.revokeObjectURL(url)
}
