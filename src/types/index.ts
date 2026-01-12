// ============================================================================
// ECHO MIND COMPLIANCE - TYPE DEFINITIONS
// Portable types for core entities
// ============================================================================

// ============================================================================
// USER TYPES
// ============================================================================

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | 'PAUSED'
export type SubscriptionTier = 'BASE' | 'UTAH_ELITE' | 'TEAM'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  company?: string
  subscriptionStatus: SubscriptionStatus
  subscriptionTier: SubscriptionTier
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  trialEndsAt?: Date
  preferences: UserPreferences
  totalLeadsScrubbed: number
  lastScrubAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  email_notifications: boolean
  auto_sync_crm: boolean
  include_risky_in_download: boolean
  default_area_codes: string[]
}

// ============================================================================
// SCRUBBING TYPES
// ============================================================================

export type UploadStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type RiskLevel = 'SAFE' | 'CAUTION' | 'BLOCKED'

export interface ScrubRequest {
  file: File
  userId: string
  areaCodes: string[]
  includeRisky?: boolean
}

export interface ScrubResponse {
  success: boolean
  jobId: string
  status: UploadStatus
  progressUrl: string
  duplicatesFound: number
}

export interface ScrubResult {
  success: boolean
  summary: ScrubSummary
  cleanLeads: Lead[]
  riskyLeads: Lead[]
  blockedLeads: Lead[]
  downloadUrls: {
    clean: string
    fullReport: string
    risky?: string
  }
}

export interface ScrubSummary {
  totalUploaded: number
  duplicatesRemoved: number
  cleanLeads: number
  dncBlocked: number
  cautionLeads: number
  processingTimeMs: number
  scrubbedAt: Date
  averageRiskScore?: number
  complianceRate?: number
}

export interface Lead {
  phoneNumber: string
  firstName?: string
  lastName?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  riskScore: number
  riskLevel: RiskLevel
  dncStatus: boolean
  riskFactors?: RiskFactors
}

export interface RiskFactors {
  dncMatch: boolean
  phoneType: 'mobile' | 'landline' | 'voip' | 'unknown'
  areaCodeMismatch: boolean
  recentViolations: number
  repeatedRegistrations: number
}

// ============================================================================
// UPLOAD HISTORY TYPES
// ============================================================================

export interface UploadHistory {
  id: string
  userId: string
  filename: string
  fileSize?: number
  totalLeads: number
  cleanLeads: number
  dncBlocked: number
  cautionLeads: number
  duplicatesRemoved: number
  averageRiskScore?: number
  complianceRate?: number
  cleanFileUrl?: string
  fullReportUrl?: string
  riskyFileUrl?: string
  processingTimeMs?: number
  status: UploadStatus
  errorMessage?: string
  source?: string
  areaCodesUsed: string[]
  createdAt: Date
}

// ============================================================================
// CRM TYPES
// ============================================================================

export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NURTURING' | 'CONVERTED' | 'DEAD'

export interface CrmLead {
  id: string
  userId: string
  phoneNumber: string
  firstName?: string
  lastName?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  riskScore?: number
  riskLevel?: RiskLevel
  dncStatus: boolean
  lastScrubbed?: Date
  status: LeadStatus
  source?: string
  tags: string[]
  notes?: string
  assignedTo?: string
  lastContactAt?: Date
  nextFollowupAt?: Date
  contactCount: number
  customFields: Record<string, any>
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface CreateCrmLeadInput {
  phoneNumber: string
  firstName?: string
  lastName?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  source?: string
  tags?: string[]
  notes?: string
}

export interface UpdateCrmLeadInput {
  firstName?: string
  lastName?: string
  email?: string
  address?: string
  status?: LeadStatus
  tags?: string[]
  notes?: string
  nextFollowupAt?: Date
}

// ============================================================================
// CRM INTEGRATION TYPES
// ============================================================================

export type CrmType = 'FOLLOWUPBOSS' | 'LOFTY' | 'KVCORE'
export type IntegrationStatus = 'ACTIVE' | 'PAUSED' | 'ERROR'
export type SyncType = 'MANUAL' | 'AUTO'
export type SyncStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED'

export interface CrmIntegration {
  id: string
  userId: string
  crmType: CrmType
  crmName: string
  credentials: CrmCredentials
  fieldMapping: FieldMapping
  syncSettings: SyncSettings
  status: IntegrationStatus
  lastSyncAt?: Date
  lastError?: string
  createdAt: Date
  updatedAt: Date
}

export interface CrmCredentials {
  apiKey?: string
  oauthToken?: string
  refreshToken?: string
  [key: string]: any
}

export interface FieldMapping {
  phone_number: string
  first_name: string
  last_name: string
  email: string
  address: string
  custom_fields: Record<string, string>
}

export interface SyncSettings {
  auto_sync: boolean
  sync_risky: boolean
  sync_frequency: 'immediate' | 'hourly' | 'daily'
}

export interface CrmIntegrationLog {
  id: string
  integrationId: string
  userId: string
  syncType: SyncType
  leadsSynced: number
  leadsFailed: number
  status: SyncStatus
  errorMessage?: string
  startedAt: Date
  completedAt?: Date
  durationMs?: number
}

// ============================================================================
// AREA CODE TYPES
// ============================================================================

export type AreaCodeStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING'
export type RequestStatus = 'PENDING' | 'FUNDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface AreaCodeSubscription {
  id: string
  userId: string
  areaCode: string
  subscribedAt: Date
  expiresAt?: Date
  status: AreaCodeStatus
}

export interface AreaCodeRequest {
  id: string
  areaCode: string
  requestedBy?: string
  ftcCost: number
  userContribution: number
  echoMindContribution: number
  totalFunded: number
  status: RequestStatus
  progressPercentage: number
  recordsAdded?: number
  completedAt?: Date
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateAreaCodeRequestInput {
  areaCode: string
  userContribution: number
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export type PaymentStatus = 'SUCCEEDED' | 'PENDING' | 'FAILED' | 'REFUNDED'
export type PaymentType = 'SUBSCRIPTION' | 'AREA_CODE' | 'ONE_TIME'

export interface Payment {
  id: string
  userId: string
  stripePaymentIntentId: string
  stripeInvoiceId?: string
  amount: number
  currency: string
  status: PaymentStatus
  description?: string
  paymentType: PaymentType
  metadata: Record<string, any>
  createdAt: Date
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  meta?: {
    page?: number
    limit?: number
    total?: number
    timestamp?: string
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface LeadFilters {
  status?: LeadStatus[]
  riskLevel?: RiskLevel[]
  dateFrom?: Date
  dateTo?: Date
  search?: string
  tags?: string[]
}

export interface UploadFilters {
  status?: UploadStatus[]
  dateFrom?: Date
  dateTo?: Date
  minComplianceRate?: number
  maxComplianceRate?: number
}
