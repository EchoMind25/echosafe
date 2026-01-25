// =============================================================================
// Database Types
// These types define the structure of your Supabase database tables.
//
// NOTE: For production, generate these types from your actual database:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
// =============================================================================

// Enum types matching the database
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'inactive'
export type SubscriptionTier = 'base' | 'professional' | 'enterprise' | 'founders_club'
export type DncSource = 'ftc' | 'state' | 'internal'
export type UploadStatus = 'processing' | 'completed' | 'failed'
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
export type AreaCodeStatus = 'active' | 'expired' | 'cancelled'
export type IntegrationStatus = 'active' | 'paused' | 'error' | 'disconnected'
export type CrmType = 'followupboss' | 'lofty' | 'kvcore' | 'other'
export type SyncType = 'manual' | 'auto' | 'webhook'
export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'archived'
export type RiskLevel = 'low' | 'medium' | 'high'
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded'
export type PaymentType = 'subscription' | 'one_time' | 'area_code_unlock'
export type DeviceType = 'desktop' | 'mobile' | 'tablet'
export type Platform = 'web' | 'ios' | 'android'

// FTC Change List types
export type FtcChangeType = 'additions' | 'deletions'
export type FtcChangeListStatus = 'pending' | 'processing' | 'completed' | 'failed'

export type Database = {
  public: {
    Tables: {
      // =========================================================================
      // DNC DELETED NUMBERS (90-day retention for AI pattern detection)
      // =========================================================================
      dnc_deleted_numbers: {
        Row: {
          id: string
          phone_number: string
          area_code: string
          state: string | null
          deleted_from_dnc_date: string
          original_add_date: string | null
          times_added_removed: number
          last_pattern_check: string | null
          delete_after: string
          source: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phone_number: string
          area_code: string
          state?: string | null
          deleted_from_dnc_date?: string
          original_add_date?: string | null
          times_added_removed?: number
          last_pattern_check?: string | null
          delete_after?: string
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone_number?: string
          area_code?: string
          state?: string | null
          deleted_from_dnc_date?: string
          original_add_date?: string | null
          times_added_removed?: number
          last_pattern_check?: string | null
          delete_after?: string
          source?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // FTC CHANGE LISTS (Track admin uploads of daily FTC change lists)
      // =========================================================================
      ftc_change_lists: {
        Row: {
          id: string
          change_type: FtcChangeType
          ftc_file_date: string
          area_codes: string[]
          status: FtcChangeListStatus
          total_records: number
          processed_records: number
          failed_records: number
          skipped_records: number
          progress_percent: number
          estimated_completion: string | null
          current_batch: number
          total_batches: number
          file_url: string | null
          file_name: string | null
          file_size_bytes: number | null
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
        Insert: {
          id?: string
          change_type: FtcChangeType
          ftc_file_date: string
          area_codes: string[]
          status?: FtcChangeListStatus
          total_records?: number
          processed_records?: number
          failed_records?: number
          skipped_records?: number
          progress_percent?: number
          estimated_completion?: string | null
          current_batch?: number
          total_batches?: number
          file_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_hash?: string | null
          uploaded_by?: string | null
          error_message?: string | null
          error_details?: Record<string, unknown> | null
          retry_count?: number
          last_retry_at?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          change_type?: FtcChangeType
          ftc_file_date?: string
          area_codes?: string[]
          status?: FtcChangeListStatus
          total_records?: number
          processed_records?: number
          failed_records?: number
          skipped_records?: number
          progress_percent?: number
          estimated_completion?: string | null
          current_batch?: number
          total_batches?: number
          file_url?: string | null
          file_name?: string | null
          file_size_bytes?: number | null
          file_hash?: string | null
          uploaded_by?: string | null
          error_message?: string | null
          error_details?: Record<string, unknown> | null
          retry_count?: number
          last_retry_at?: string | null
          processing_started_at?: string | null
          processing_completed_at?: string | null
          processing_duration_ms?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // USERS
      // =========================================================================
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          phone_number: string | null
          company_name: string | null
          industry: string
          industry_custom: string | null
          subscription_status: SubscriptionStatus
          subscription_tier: SubscriptionTier
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          trial_leads_used: number
          trial_uploads_count: number
          preferences: Record<string, unknown> | null
          total_leads_scrubbed: number
          last_scrub_at: string | null
          last_login_at: string | null
          login_count: number
          created_at: string
          updated_at: string
          pricing_tier: string | null
          legacy_price_lock: number | null
          legacy_granted_at: string | null
          legacy_reason: string | null
          subscription_cancelled_at: string | null
          legacy_grace_until: string | null
          is_admin: boolean
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone_number?: string | null
          company_name?: string | null
          industry?: string
          industry_custom?: string | null
          subscription_status?: SubscriptionStatus
          subscription_tier?: SubscriptionTier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_leads_used?: number
          trial_uploads_count?: number
          preferences?: Record<string, unknown> | null
          total_leads_scrubbed?: number
          last_scrub_at?: string | null
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
          pricing_tier?: string | null
          legacy_price_lock?: number | null
          legacy_granted_at?: string | null
          legacy_reason?: string | null
          subscription_cancelled_at?: string | null
          legacy_grace_until?: string | null
          is_admin?: boolean
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone_number?: string | null
          company_name?: string | null
          industry?: string
          industry_custom?: string | null
          subscription_status?: SubscriptionStatus
          subscription_tier?: SubscriptionTier
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          trial_leads_used?: number
          trial_uploads_count?: number
          preferences?: Record<string, unknown> | null
          total_leads_scrubbed?: number
          last_scrub_at?: string | null
          last_login_at?: string | null
          login_count?: number
          created_at?: string
          updated_at?: string
          pricing_tier?: string | null
          legacy_price_lock?: number | null
          legacy_granted_at?: string | null
          legacy_reason?: string | null
          subscription_cancelled_at?: string | null
          legacy_grace_until?: string | null
          is_admin?: boolean
        }
        Relationships: []
      }

      // =========================================================================
      // DNC REGISTRY
      // =========================================================================
      dnc_registry: {
        Row: {
          id: string
          phone_number: string
          area_code: string
          registered_at: string | null
          source: DncSource | null
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
          state: string | null
          last_updated: string
          ftc_release_date: string | null
          record_status: string
        }
        Insert: {
          id?: string
          phone_number: string
          area_code: string
          registered_at?: string | null
          source?: DncSource | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          state?: string | null
          last_updated?: string
          ftc_release_date?: string | null
          record_status?: string
        }
        Update: {
          id?: string
          phone_number?: string
          area_code?: string
          registered_at?: string | null
          source?: DncSource | null
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          state?: string | null
          last_updated?: string
          ftc_release_date?: string | null
          record_status?: string
        }
        Relationships: []
      }

      // =========================================================================
      // DNC UPDATE LOG
      // =========================================================================
      dnc_update_log: {
        Row: {
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
        Insert: {
          id?: string
          area_code: string
          update_type: string
          records_added?: number
          records_updated?: number
          records_removed?: number
          total_records?: number
          status?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          source_file?: string | null
          ftc_release_date?: string | null
          admin_user_id?: string | null
          error_message?: string | null
          error_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          area_code?: string
          update_type?: string
          records_added?: number
          records_updated?: number
          records_removed?: number
          total_records?: number
          status?: string
          started_at?: string
          completed_at?: string | null
          duration_seconds?: number | null
          source_file?: string | null
          ftc_release_date?: string | null
          admin_user_id?: string | null
          error_message?: string | null
          error_count?: number
          created_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // FTC SUBSCRIPTIONS (Enhanced for PRD v1.2)
      // =========================================================================
      ftc_subscriptions: {
        Row: {
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
          // New fields for PRD v1.2
          auto_renew: boolean
          renewal_reminder_sent: boolean
          renewal_reminder_sent_at: string | null
          total_records: number
          last_change_list_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_code: string
          state: string
          subscription_status?: string
          subscribed_at: string
          expires_at: string
          annual_cost?: number
          last_update_at?: string | null
          last_update_record_count?: number
          next_update_due?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          notes?: string | null
          // New fields for PRD v1.2
          auto_renew?: boolean
          renewal_reminder_sent?: boolean
          renewal_reminder_sent_at?: string | null
          total_records?: number
          last_change_list_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_code?: string
          state?: string
          subscription_status?: string
          subscribed_at?: string
          expires_at?: string
          annual_cost?: number
          last_update_at?: string | null
          last_update_record_count?: number
          next_update_due?: string | null
          paid_by?: string | null
          payment_reference?: string | null
          notes?: string | null
          // New fields for PRD v1.2
          auto_renew?: boolean
          renewal_reminder_sent?: boolean
          renewal_reminder_sent_at?: string | null
          total_records?: number
          last_change_list_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // ADMIN UPLOADS
      // =========================================================================
      admin_uploads: {
        Row: {
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
        Insert: {
          id?: string
          area_codes: string[]
          total_files: number
          status?: string
          progress?: Record<string, unknown>
          total_records?: number
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          area_codes?: string[]
          total_files?: number
          status?: string
          progress?: Record<string, unknown>
          total_records?: number
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // UPLOAD HISTORY
      // =========================================================================
      upload_history: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_size: number | null
          total_leads: number
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
          status: UploadStatus
          error_message: string | null
          source: string | null
          area_codes_used: string[] | null
          created_at: string
          processed_leads: number | null
          // Retry functionality fields
          pending_leads: unknown[] | null
          retry_count: number | null
          last_retry_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_size?: number | null
          total_leads: number
          clean_leads?: number
          dnc_blocked?: number
          caution_leads?: number
          duplicates_removed?: number
          average_risk_score?: number | null
          compliance_rate?: number | null
          clean_file_url?: string | null
          full_report_url?: string | null
          risky_file_url?: string | null
          processing_time_ms?: number | null
          n8n_job_id?: string | null
          status?: UploadStatus
          error_message?: string | null
          source?: string | null
          area_codes_used?: string[] | null
          created_at?: string
          processed_leads?: number | null
          // Retry functionality fields
          pending_leads?: unknown[] | null
          retry_count?: number | null
          last_retry_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_size?: number | null
          total_leads?: number
          clean_leads?: number
          dnc_blocked?: number
          caution_leads?: number
          duplicates_removed?: number
          average_risk_score?: number | null
          compliance_rate?: number | null
          clean_file_url?: string | null
          full_report_url?: string | null
          risky_file_url?: string | null
          processing_time_ms?: number | null
          n8n_job_id?: string | null
          status?: UploadStatus
          error_message?: string | null
          source?: string | null
          area_codes_used?: string[] | null
          created_at?: string
          processed_leads?: number | null
          // Retry functionality fields
          pending_leads?: unknown[] | null
          retry_count?: number | null
          last_retry_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }

      // =========================================================================
      // ANALYTICS EVENTS
      // =========================================================================
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Record<string, unknown>
          device_type: DeviceType | null
          platform: Platform | null
          user_agent: string | null
          ip_address: string | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Record<string, unknown>
          device_type?: DeviceType | null
          platform?: Platform | null
          user_agent?: string | null
          ip_address?: string | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Record<string, unknown>
          device_type?: DeviceType | null
          platform?: Platform | null
          user_agent?: string | null
          ip_address?: string | null
          session_id?: string | null
          created_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // CRM LEADS
      // =========================================================================
      crm_leads: {
        Row: {
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
          risk_level: RiskLevel | null
          dnc_status: boolean
          last_scrubbed_at: string | null
          status: LeadStatus
          source: string | null
          tags: string[] | null
          notes: string | null
          assigned_to: string | null
          last_contact_at: string | null
          next_followup_at: string | null
          contact_count: number
          custom_fields: Record<string, unknown>
          external_crm_ids: Record<string, unknown>
          upload_job_id: string | null
          search_vector: string | null // Generated tsvector column for full-text search
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          risk_score?: number | null
          risk_level?: RiskLevel | null
          dnc_status?: boolean
          last_scrubbed_at?: string | null
          status?: LeadStatus
          source?: string | null
          tags?: string[] | null
          notes?: string | null
          assigned_to?: string | null
          last_contact_at?: string | null
          next_followup_at?: string | null
          contact_count?: number
          custom_fields?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          risk_score?: number | null
          risk_level?: RiskLevel | null
          dnc_status?: boolean
          last_scrubbed_at?: string | null
          status?: LeadStatus
          source?: string | null
          tags?: string[] | null
          notes?: string | null
          assigned_to?: string | null
          last_contact_at?: string | null
          next_followup_at?: string | null
          contact_count?: number
          custom_fields?: Record<string, unknown>
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }

      // =========================================================================
      // CRM INTEGRATIONS
      // =========================================================================
      crm_integrations: {
        Row: {
          id: string
          user_id: string
          crm_type: CrmType
          crm_name: string
          credentials: Record<string, unknown>
          field_mapping: Record<string, unknown>
          sync_settings: Record<string, unknown> | null
          status: IntegrationStatus
          last_sync_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          crm_type: CrmType
          crm_name: string
          credentials?: Record<string, unknown>
          field_mapping?: Record<string, unknown>
          sync_settings?: Record<string, unknown> | null
          status?: IntegrationStatus
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          crm_type?: CrmType
          crm_name?: string
          credentials?: Record<string, unknown>
          field_mapping?: Record<string, unknown>
          sync_settings?: Record<string, unknown> | null
          status?: IntegrationStatus
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // CRM INTEGRATION LOGS
      // =========================================================================
      crm_integration_logs: {
        Row: {
          id: string
          integration_id: string
          user_id: string
          sync_type: SyncType
          leads_synced: number
          leads_failed: number
          status: SyncStatus
          error_message: string | null
          started_at: string
          completed_at: string | null
          duration_ms: number | null
        }
        Insert: {
          id?: string
          integration_id: string
          user_id: string
          sync_type: SyncType
          leads_synced?: number
          leads_failed?: number
          status: SyncStatus
          error_message?: string | null
          started_at: string
          completed_at?: string | null
          duration_ms?: number | null
        }
        Update: {
          id?: string
          integration_id?: string
          user_id?: string
          sync_type?: SyncType
          leads_synced?: number
          leads_failed?: number
          status?: SyncStatus
          error_message?: string | null
          started_at?: string
          completed_at?: string | null
          duration_ms?: number | null
        }
        Relationships: []
      }

      // =========================================================================
      // AREA CODE REQUESTS
      // =========================================================================
      area_code_requests: {
        Row: {
          id: string
          area_code: string
          requested_by: string | null
          ftc_cost: number
          user_contribution: number
          echo_mind_contribution: number
          total_funded: number
          status: RequestStatus
          progress_percentage: number
          records_added: number | null
          completed_at: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_code: string
          requested_by?: string | null
          ftc_cost: number
          user_contribution: number
          echo_mind_contribution: number
          total_funded?: number
          status?: RequestStatus
          progress_percentage?: number
          records_added?: number | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_code?: string
          requested_by?: string | null
          ftc_cost?: number
          user_contribution?: number
          echo_mind_contribution?: number
          total_funded?: number
          status?: RequestStatus
          progress_percentage?: number
          records_added?: number | null
          completed_at?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // AREA CODE SUBSCRIPTIONS
      // =========================================================================
      area_code_subscriptions: {
        Row: {
          id: string
          user_id: string
          area_code: string
          subscribed_at: string
          expires_at: string | null
          status: AreaCodeStatus
        }
        Insert: {
          id?: string
          user_id: string
          area_code: string
          subscribed_at?: string
          expires_at?: string | null
          status?: AreaCodeStatus
        }
        Update: {
          id?: string
          user_id?: string
          area_code?: string
          subscribed_at?: string
          expires_at?: string | null
          status?: AreaCodeStatus
        }
        Relationships: []
      }

      // =========================================================================
      // PAYMENTS
      // =========================================================================
      payments: {
        Row: {
          id: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_invoice_id: string | null
          amount: number
          currency: string
          status: PaymentStatus
          description: string | null
          payment_type: PaymentType
          metadata: Record<string, unknown>
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_payment_intent_id: string
          stripe_invoice_id?: string | null
          amount: number
          currency?: string
          status: PaymentStatus
          description?: string | null
          payment_type: PaymentType
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_payment_intent_id?: string
          stripe_invoice_id?: string | null
          amount?: number
          currency?: string
          status?: PaymentStatus
          description?: string | null
          payment_type?: PaymentType
          metadata?: Record<string, unknown>
          created_at?: string
        }
        Relationships: []
      }

      // =========================================================================
      // COMPLIANCE AUDIT LOGS (5-year retention per 47 CFR § 64.1200)
      // =========================================================================
      compliance_audit_logs: {
        Row: {
          id: string
          user_id: string
          user_email: string
          company_name: string
          phone_number: string
          area_code: string
          dnc_status: string
          risk_score: number | null
          check_purpose: string
          industry: string
          upload_job_id: string | null
          result_data: Record<string, unknown>
          retention_until: string
          is_anonymized: boolean
          source: string
          ip_address: string | null
          user_agent: string | null
          checked_at: string
          checked_year: number // Generated column for year partitioning
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          company_name: string
          phone_number: string
          area_code: string
          dnc_status: string
          risk_score?: number | null
          check_purpose: string
          industry: string
          upload_job_id?: string | null
          result_data?: Record<string, unknown>
          retention_until: string
          source: string
          ip_address?: string | null
          checked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          company_name?: string
          phone_number?: string
          area_code?: string
          dnc_status?: string
          risk_score?: number | null
          check_purpose?: string
          industry?: string
          upload_job_id?: string | null
          result_data?: Record<string, unknown>
          retention_until?: string
          source?: string
          ip_address?: string | null
          checked_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_dnc: {
        Args: { phone: string }
        Returns: boolean
      }
      bulk_check_dnc: {
        Args: { phones: string[] }
        Returns: { phone_number: string; is_dnc: boolean }[]
      }
      get_user_area_codes: {
        Args: { user_id: string }
        Returns: string[]
      }
      // Trial management functions
      get_trial_status: {
        Args: { p_user_id: string }
        Returns: {
          is_on_trial: boolean
          is_trial_active: boolean
          trial_expired: boolean
          leads_limit_reached: boolean
          uploads_limit_reached: boolean
          trial_leads_used: number
          trial_leads_remaining: number
          trial_uploads_count: number
          trial_uploads_remaining: number
          trial_started_at: string | null
          trial_ends_at: string | null
          days_remaining: number
          subscription_status: string
        }
      }
      can_user_upload: {
        Args: { p_user_id: string; p_lead_count: number }
        Returns: {
          can_upload: boolean
          reason: string | null
          leads_would_use: number
          leads_remaining: number
        }
      }
      increment_trial_usage: {
        Args: { p_user_id: string; p_leads_processed: number }
        Returns: boolean
      }
      // FTC Change List System functions (PRD v1.2)
      was_recently_removed_from_dnc: {
        Args: { phone_num: string }
        Returns: boolean
      }
      get_dnc_pattern_count: {
        Args: { phone_num: string }
        Returns: number
      }
      cleanup_old_deleted_numbers: {
        Args: Record<string, never>
        Returns: number
      }
      process_dnc_deletion: {
        Args: { phone_num: string; p_area_code: string; p_state?: string }
        Returns: boolean
      }
    }
    Enums: {
      dnc_source_enum: DncSource
      subscription_status_enum: SubscriptionStatus
      subscription_tier_enum: SubscriptionTier
      upload_status_enum: UploadStatus
      request_status_enum: RequestStatus
      area_code_status_enum: AreaCodeStatus
      integration_status_enum: IntegrationStatus
      crm_type_enum: CrmType
      sync_type_enum: SyncType
      sync_status_enum: SyncStatus
      lead_status_enum: LeadStatus
      risk_level_enum: RiskLevel
      payment_status_enum: PaymentStatus
      payment_type_enum: PaymentType
      device_type_enum: DeviceType
      platform_enum: Platform
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helper for table rows
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

// Type helper for insert operations
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

// Type helper for update operations
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Convenience type exports
export type User = Tables<'users'>
export type DncRegistry = Tables<'dnc_registry'>
export type DncUpdateLog = Tables<'dnc_update_log'>
export type FtcSubscription = Tables<'ftc_subscriptions'>
export type AdminUpload = Tables<'admin_uploads'>
export type UploadHistory = Tables<'upload_history'>
export type AnalyticsEvent = Tables<'analytics_events'>
export type CrmLead = Tables<'crm_leads'>
export type CrmIntegration = Tables<'crm_integrations'>
export type CrmIntegrationLog = Tables<'crm_integration_logs'>
export type AreaCodeRequest = Tables<'area_code_requests'>
export type AreaCodeSubscription = Tables<'area_code_subscriptions'>
export type Payment = Tables<'payments'>

// New types for FTC Change List System (PRD v1.2)
export type DncDeletedNumber = Tables<'dnc_deleted_numbers'>
export type FtcChangeList = Tables<'ftc_change_lists'>

// Compliance Audit Log type (47 CFR § 64.1200)
export type ComplianceAuditLog = Tables<'compliance_audit_logs'>

// Insert/Update types for new tables
export type DncDeletedNumberInsert = TablesInsert<'dnc_deleted_numbers'>
export type DncDeletedNumberUpdate = TablesUpdate<'dnc_deleted_numbers'>
export type FtcChangeListInsert = TablesInsert<'ftc_change_lists'>
export type FtcChangeListUpdate = TablesUpdate<'ftc_change_lists'>
export type ComplianceAuditLogInsert = TablesInsert<'compliance_audit_logs'>
export type ComplianceAuditLogUpdate = TablesUpdate<'compliance_audit_logs'>
