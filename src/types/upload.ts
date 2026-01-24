// ============================================================================
// UPLOAD TYPES
// Types for the DNC scrubbing upload system
// ============================================================================

/**
 * Raw lead data as parsed from file (before normalization)
 */
export interface RawLead {
  phone_number?: string
  phone?: string
  first_name?: string
  firstName?: string
  last_name?: string
  lastName?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  zipCode?: string
  zip?: string
  [key: string]: string | undefined
}

/**
 * Normalized lead data ready for processing
 */
export interface ParsedLead {
  phone_number: string
  first_name: string
  last_name: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
}

/**
 * Lead with processing results from N8N
 */
export interface ProcessedLead extends ParsedLead {
  risk_score: number
  risk_level: 'safe' | 'caution' | 'blocked'
  /** DNC status: 'clean' (safe), 'caution' (risky), 'blocked' (DNC hit), or boolean for legacy */
  dnc_status: 'clean' | 'caution' | 'blocked' | boolean
  risk_flags: string[]
}

/**
 * Duplicate detection result
 */
export interface DuplicateInfo {
  index: number
  phone: string
  normalized: string
  originalIndex: number
}

/**
 * File validation result
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  rowCount: number
  columnNames: string[]
  phoneColumn: string | null
}

/**
 * File parsing result
 */
export interface ParseResult {
  success: boolean
  leads: ParsedLead[]
  errors: ParseError[]
  duplicates: DuplicateInfo[]
  stats: {
    totalRows: number
    validRows: number
    invalidRows: number
    duplicateCount: number
  }
}

/**
 * Individual parse error
 */
export interface ParseError {
  row: number
  field: string
  value: string
  message: string
}

/**
 * Upload options selected by user
 */
export interface UploadOptions {
  removeDuplicates: boolean
  saveToCrm: boolean
  includeRiskyInDownload: boolean
}

/**
 * N8N webhook request payload
 */
export interface N8NWebhookRequest {
  jobId: string
  userId: string
  leads: ParsedLead[]
  options: {
    removeDuplicates: boolean
    saveToCrm: boolean
    includeRiskyInDownload: boolean
  }
  /** Area codes for DNC database targeting */
  areaCodes: string[]
  /** Whether to check for duplicates in N8N workflow */
  checkDuplicates: boolean
  callbackUrl: string
}

/**
 * N8N webhook response
 */
export interface N8NWebhookResponse {
  success: boolean
  job_id: string
  summary: {
    total_leads: number
    duplicates_removed: number
    clean_leads: number
    dnc_blocked: number
    caution_leads: number
    processing_time_ms: number
  }
  results: ProcessedLead[]
  error?: string
}

/**
 * Upload job status
 */
export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

/**
 * Upload job record
 */
export interface UploadJob {
  id: string
  user_id: string
  filename: string
  file_size: number
  total_leads: number
  clean_leads: number
  dnc_blocked: number
  caution_leads: number
  duplicates_removed: number
  processing_time_ms: number
  status: UploadJobStatus
  error_message: string | null
  area_codes_used: string[]
  results: ProcessedLead[] | null
  created_at: string
  updated_at: string
}

/**
 * Upload API request body
 */
export interface UploadApiRequest {
  filename: string
  leads: ParsedLead[]
  options: UploadOptions
}

/**
 * Upload API response
 */
export interface UploadApiResponse {
  success: boolean
  job_id: string
  message: string
  error?: string
}

/**
 * Job status API response
 */
export interface JobStatusResponse {
  status: UploadJobStatus
  upload: UploadJob | null
  error: string | null
}

/**
 * Download file type
 */
export type DownloadFileType = 'clean' | 'full' | 'risky'

/**
 * File preview data for UI
 */
export interface FilePreviewData {
  filename: string
  fileSize: number
  rowCount: number
  columns: string[]
  previewRows: Record<string, string>[]
  duplicateCount: number
  invalidPhoneCount: number
}

/**
 * Upload page state
 */
export interface UploadPageState {
  step: 'select' | 'preview' | 'processing' | 'complete' | 'error'
  file: File | null
  preview: FilePreviewData | null
  parseResult: ParseResult | null
  options: UploadOptions
  jobId: string | null
  error: string | null
}

/**
 * CRM save result
 */
export interface CrmSaveResult {
  success: boolean
  saved: number
  skipped: number
  errors: number
  errorDetails: string[]
}
