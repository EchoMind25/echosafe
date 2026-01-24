// Types matching the actual Supabase database schema

export interface UploadHistory {
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
  ai_insights: AiInsightsResult | null
  created_at: string
}

/** AI-generated compliance insights stored in upload_history */
export interface AiInsightsResult {
  warnings: string[]
  recommendations: string[]
  compliance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  compliance_score: number
  summary: string
  industry_tips: string[]
  risk_analysis: string
  generated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  phone_number: string | null
  company_name: string | null
  subscription_status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'paused'
  subscription_tier: 'base' | 'utah_elite' | 'team'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string | null
  preferences: UserPreferences
  total_leads_scrubbed: number
  last_scrub_at: string | null
  last_login_at: string | null
  login_count: number
  pricing_tier: string | null
  legacy_price_lock: number | null
  legacy_granted_at: string | null
  legacy_reason: string | null
  legacy_grace_until: string | null
  subscription_cancelled_at: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  auto_sync_crm: boolean
  default_area_codes: string[]
  email_notifications: boolean
  include_risky_in_download: boolean
  theme: 'light' | 'dark'
}

export interface CrmLead {
  id: string
  user_id: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  risk_score: number | null
  risk_level: 'safe' | 'caution' | 'blocked' | null
  dnc_status: boolean
  last_scrubbed_at: string | null
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'converted' | 'dead'
  source: string | null
  tags: string[] | null
  notes: string | null
  assigned_to: string | null
  last_contact_at: string | null
  next_followup_at: string | null
  contact_count: number
  custom_fields: Record<string, unknown>
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface CrmIntegration {
  id: string
  user_id: string
  crm_type: 'followupboss' | 'lofty' | 'kvcore'
  crm_name: string
  credentials: Record<string, unknown>
  field_mapping: FieldMapping
  sync_settings: SyncSettings
  status: 'active' | 'paused' | 'error'
  last_sync_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

export interface FieldMapping {
  email: string
  address: string
  last_name: string
  first_name: string
  phone_number: string
  custom_fields: Record<string, string>
}

export interface SyncSettings {
  auto_sync: boolean
  sync_risky: boolean
  sync_frequency: 'immediate' | 'hourly' | 'daily'
}

export interface CrmIntegrationLog {
  id: string
  integration_id: string
  user_id: string
  sync_type: 'manual' | 'auto'
  leads_synced: number
  leads_failed: number
  status: 'success' | 'partial' | 'failed'
  error_message: string | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
}

export interface AreaCodeSubscription {
  id: string
  user_id: string
  area_code: string
  subscribed_at: string
  expires_at: string | null
  status: 'active' | 'expired' | 'pending'
}

export interface AreaCodeRequest {
  id: string
  area_code: string
  requested_by: string | null
  ftc_cost: number
  user_contribution: number
  echo_mind_contribution: number
  total_funded: number
  status: 'pending' | 'funding' | 'processing' | 'completed' | 'failed'
  progress_percentage: number
  records_added: number | null
  completed_at: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface FtcSubscription {
  id: string
  area_code: string
  state: string
  subscription_status: string
  subscribed_at: string
  expires_at: string
  annual_cost: number
  last_update_at: string | null
  last_update_record_count: number
  next_update_due: string | null
  paid_by: string | null
  payment_reference: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DncRegistry {
  id: string
  phone_number: string
  area_code: string
  registered_at: string | null
  source: 'ftc' | 'state' | 'internal' | null
  metadata: Record<string, unknown>
  state: string | null
  last_updated: string
  ftc_release_date: string | null
  record_status: string
  created_at: string
  updated_at: string
}

export interface DncUpdateLog {
  id: string
  area_code: string
  update_type: string
  records_added: number
  records_updated: number
  records_removed: number
  total_records: number
  status: string
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  source_file: string | null
  ftc_release_date: string | null
  admin_user_id: string | null
  error_message: string | null
  error_count: number
  created_at: string
}

export interface AdminUpload {
  id: string
  area_codes: string[]
  total_files: number
  status: string
  progress: Record<string, unknown>
  total_records: number
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  user_id: string | null
  event_type: string
  event_data: Record<string, unknown>
  device_type: string | null
  platform: string | null
  user_agent: string | null
  ip_address: string | null
  session_id: string | null
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  stripe_payment_intent_id: string
  stripe_invoice_id: string | null
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  description: string | null
  payment_type: 'subscription' | 'area_code' | 'one_time'
  metadata: Record<string, unknown>
  created_at: string
}

// =============================================================================
// FTC Change List System Types (PRD v1.2)
// =============================================================================

/**
 * DNC Deleted Numbers - 90-day retention for AI pattern detection
 * Numbers that appear/disappear from DNC repeatedly indicate suspicious patterns
 */
export interface DncDeletedNumber {
  id: string
  phone_number: string
  area_code: string
  state: string | null
  deleted_from_dnc_date: string
  original_add_date: string | null
  /** Number of times this phone has been added/removed from DNC. Values >2 indicate suspicious pattern */
  times_added_removed: number
  last_pattern_check: string | null
  /** Automatic cleanup date - records are deleted after 90 days */
  delete_after: string
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * FTC Change Lists - Track admin uploads of FTC daily change lists
 * Supports both additions (new DNC numbers) and deletions (removed numbers)
 */
export interface FtcChangeList {
  id: string
  /** Type of FTC change list: 'additions' or 'deletions' */
  change_type: 'additions' | 'deletions'
  ftc_file_date: string
  area_codes: string[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_records: number
  processed_records: number
  failed_records: number
  skipped_records: number
  /** Processing progress 0-100% */
  progress_percent: number
  estimated_completion: string | null
  current_batch: number
  total_batches: number
  file_url: string | null
  file_name: string | null
  file_size_bytes: number | null
  /** MD5/SHA hash to detect duplicate uploads */
  file_hash: string | null
  uploaded_by: string | null
  error_message: string | null
  error_details: Record<string, unknown> | null
  retry_count: number
  last_retry_at: string | null
  processing_started_at: string | null
  processing_completed_at: string | null
  processing_duration_ms: number | null
  created_at: string
  updated_at: string
}

/**
 * Enhanced FTC Subscription (PRD v1.2)
 * Adds auto_renew, renewal alerts, and change list tracking
 */
export interface FtcSubscriptionEnhanced extends FtcSubscription {
  auto_renew: boolean
  renewal_reminder_sent: boolean
  renewal_reminder_sent_at: string | null
  total_records: number
  last_change_list_id: string | null
}
