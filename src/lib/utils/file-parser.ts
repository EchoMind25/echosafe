// ============================================================================
// FILE PARSER UTILITY
// Parses CSV and Excel files into normalized lead data
// ============================================================================

import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { safeNormalizePhone, isValidPhone } from './phone-normalize'
import { findDuplicates, getDuplicateStats } from './duplicate-detector'
import type {
  RawLead,
  ParsedLead,
  ParseResult,
  ParseError,
  ValidationResult,
  FilePreviewData,
} from '@/types/upload'

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum file size in bytes (50MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/** Accepted file extensions */
export const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.txt']

/** Accepted MIME types */
export const ACCEPTED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

/** Common phone column names to look for */
const PHONE_COLUMN_NAMES = [
  'phone_number',
  'phone',
  'phonenumber',
  'phone_num',
  'telephone',
  'tel',
  'mobile',
  'cell',
  'cellphone',
  'cell_phone',
  'contact_phone',
  'primary_phone',
]

/** Column name mappings for normalization */
const COLUMN_MAPPINGS: Record<string, string> = {
  // Phone
  phone: 'phone_number',
  phonenumber: 'phone_number',
  phone_num: 'phone_number',
  telephone: 'phone_number',
  tel: 'phone_number',
  mobile: 'phone_number',
  cell: 'phone_number',
  cellphone: 'phone_number',
  cell_phone: 'phone_number',
  contact_phone: 'phone_number',
  primary_phone: 'phone_number',

  // First name
  firstname: 'first_name',
  fname: 'first_name',
  first: 'first_name',
  given_name: 'first_name',

  // Last name
  lastname: 'last_name',
  lname: 'last_name',
  last: 'last_name',
  surname: 'last_name',
  family_name: 'last_name',

  // Email
  email_address: 'email',
  emailaddress: 'email',
  e_mail: 'email',

  // Address
  street: 'address',
  street_address: 'address',
  address1: 'address',
  address_1: 'address',

  // Zip
  zip: 'zip_code',
  zipcode: 'zip_code',
  postal_code: 'zip_code',
  postalcode: 'zip_code',
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validates file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    }
  }

  // Check extension
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File format not supported. Please upload CSV or Excel files.`,
    }
  }

  return { valid: true }
}

/**
 * Finds the phone column in parsed data
 */
function findPhoneColumn(columns: string[]): string | null {
  const lowerColumns = columns.map((c) => c.toLowerCase().replace(/\s+/g, '_'))

  for (const name of PHONE_COLUMN_NAMES) {
    const index = lowerColumns.indexOf(name)
    if (index !== -1) {
      return columns[index]
    }
  }

  return null
}

/**
 * Validates the structure of parsed file data
 */
export function validateFileStructure(data: Record<string, unknown>[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if data is empty
  if (!data || data.length === 0) {
    return {
      isValid: false,
      errors: ['File is empty or invalid.'],
      warnings: [],
      rowCount: 0,
      columnNames: [],
      phoneColumn: null,
    }
  }

  // Get column names from first row
  const columnNames = Object.keys(data[0])

  if (columnNames.length === 0) {
    return {
      isValid: false,
      errors: ['File has no columns.'],
      warnings: [],
      rowCount: 0,
      columnNames: [],
      phoneColumn: null,
    }
  }

  // Find phone column
  const phoneColumn = findPhoneColumn(columnNames)

  if (!phoneColumn) {
    errors.push(
      'File must contain a phone number column. Expected: "phone_number", "phone", "telephone", or similar.'
    )
  }

  // Check for empty rows
  const emptyRows = data.filter((row) => {
    return Object.values(row).every((v) => !v || String(v).trim() === '')
  })

  if (emptyRows.length > 0) {
    warnings.push(`${emptyRows.length} empty rows will be skipped.`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: data.length,
    columnNames,
    phoneColumn,
  }
}

// ============================================================================
// PARSING
// ============================================================================

/**
 * Parses a CSV file
 */
async function parseCSV(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const criticalErrors = results.errors.filter((e) => e.type === 'FieldMismatch')
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`))
            return
          }
        }
        resolve(results.data)
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`))
      },
    })
  })
}

/**
 * Parses an Excel file
 */
async function parseExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })

        // Get first sheet
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
          defval: '',
          raw: false,
        })

        resolve(jsonData)
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Normalizes column names in a row
 */
function normalizeColumnNames(row: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {}

  Object.entries(row).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase().replace(/\s+/g, '_')
    const mappedKey = COLUMN_MAPPINGS[lowerKey] || lowerKey
    normalized[mappedKey] = value?.toString().trim() || ''
  })

  return normalized
}

/**
 * Converts a raw row to a ParsedLead
 */
function rowToParsedLead(
  row: Record<string, string>,
  index: number
): { lead: ParsedLead | null; error: ParseError | null } {
  const normalized = normalizeColumnNames(row)

  // Get phone number
  const phone = normalized.phone_number || ''

  if (!phone) {
    return {
      lead: null,
      error: {
        row: index + 1,
        field: 'phone_number',
        value: '',
        message: 'Missing phone number',
      },
    }
  }

  // Normalize phone
  const phoneResult = safeNormalizePhone(phone)

  if (!phoneResult.success) {
    return {
      lead: null,
      error: {
        row: index + 1,
        field: 'phone_number',
        value: phone,
        message: phoneResult.error || 'Invalid phone number',
      },
    }
  }

  return {
    lead: {
      phone_number: phoneResult.normalized,
      first_name: normalized.first_name || '',
      last_name: normalized.last_name || '',
      email: normalized.email || '',
      address: normalized.address || '',
      city: normalized.city || '',
      state: normalized.state || '',
      zip_code: normalized.zip_code || '',
    },
    error: null,
  }
}

/**
 * Main function to parse a file into leads
 */
export async function parseFile(file: File): Promise<ParseResult> {
  // Validate file first
  const validation = validateFile(file)
  if (!validation.valid) {
    return {
      success: false,
      leads: [],
      errors: [
        {
          row: 0,
          field: 'file',
          value: file.name,
          message: validation.error || 'Invalid file',
        },
      ],
      duplicates: [],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateCount: 0,
      },
    }
  }

  try {
    // Parse file based on type
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    let rawData: Record<string, string>[]

    if (extension === '.csv' || extension === '.txt') {
      rawData = await parseCSV(file)
    } else {
      rawData = await parseExcel(file)
    }

    // Validate structure
    const structureValidation = validateFileStructure(rawData)
    if (!structureValidation.isValid) {
      return {
        success: false,
        leads: [],
        errors: structureValidation.errors.map((msg) => ({
          row: 0,
          field: 'structure',
          value: '',
          message: msg,
        })),
        duplicates: [],
        stats: {
          totalRows: rawData.length,
          validRows: 0,
          invalidRows: rawData.length,
          duplicateCount: 0,
        },
      }
    }

    // Convert rows to leads
    const leads: ParsedLead[] = []
    const errors: ParseError[] = []

    rawData.forEach((row, index) => {
      const result = rowToParsedLead(row, index)
      if (result.lead) {
        leads.push(result.lead)
      }
      if (result.error) {
        errors.push(result.error)
      }
    })

    // Find duplicates
    const duplicates = findDuplicates(leads)

    return {
      success: true,
      leads,
      errors,
      duplicates,
      stats: {
        totalRows: rawData.length,
        validRows: leads.length,
        invalidRows: errors.length,
        duplicateCount: duplicates.length,
      },
    }
  } catch (error) {
    return {
      success: false,
      leads: [],
      errors: [
        {
          row: 0,
          field: 'parse',
          value: file.name,
          message: error instanceof Error ? error.message : 'Failed to parse file',
        },
      ],
      duplicates: [],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateCount: 0,
      },
    }
  }
}

/**
 * Gets a preview of file data for display
 */
export async function getFilePreview(file: File, maxRows: number = 5): Promise<FilePreviewData> {
  const validation = validateFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Parse file
  const extension = '.' + file.name.split('.').pop()?.toLowerCase()
  let rawData: Record<string, string>[]

  if (extension === '.csv' || extension === '.txt') {
    rawData = await parseCSV(file)
  } else {
    rawData = await parseExcel(file)
  }

  // Count invalid phones
  let invalidPhoneCount = 0
  rawData.forEach((row) => {
    const normalized = normalizeColumnNames(row)
    const phone = normalized.phone_number
    if (phone && !isValidPhone(phone)) {
      invalidPhoneCount++
    }
  })

  // Get duplicate stats
  const normalizedData = rawData.map((row) => normalizeColumnNames(row))
  const duplicateStats = getDuplicateStats(normalizedData)

  // Get columns
  const columns = rawData.length > 0 ? Object.keys(rawData[0]) : []

  // Get preview rows
  const previewRows = rawData.slice(0, maxRows)

  return {
    filename: file.name,
    fileSize: file.size,
    rowCount: rawData.length,
    columns,
    previewRows,
    duplicateCount: duplicateStats.totalDuplicates,
    invalidPhoneCount,
  }
}

/**
 * Converts leads to CSV string
 */
export function leadsToCSV(leads: ParsedLead[], includeRiskData: boolean = false): string {
  if (leads.length === 0) {
    return ''
  }

  // Define headers
  let headers = [
    'phone_number',
    'first_name',
    'last_name',
    'email',
    'address',
    'city',
    'state',
    'zip_code',
  ]

  if (includeRiskData) {
    headers = [...headers, 'risk_score', 'risk_level', 'dnc_status']
  }

  // Create CSV content
  const rows = leads.map((lead) => {
    const values = headers.map((header) => {
      const value = (lead as Record<string, unknown>)[header]
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = value?.toString() || ''
      if (stringValue.includes(',') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
    return values.join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Creates a downloadable CSV file blob
 */
export function createCSVBlob(csvContent: string): Blob {
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
}

/**
 * Triggers a file download in the browser
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
