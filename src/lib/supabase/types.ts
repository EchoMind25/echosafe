// =============================================================================
// Database Types
// These types define the structure of your Supabase database tables.
//
// NOTE: For production, generate these types from your actual database:
// npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
// =============================================================================

export type Database = {
  public: {
    Tables: {
      dnc_registry: {
        Row: {
          id: number
          phone_number: string
          area_code: string
          state: string | null
          registered_at: string
          source: 'federal' | 'utah_state' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          phone_number: string
          area_code: string
          state?: string | null
          registered_at: string
          source: 'federal' | 'utah_state' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          phone_number?: string
          area_code?: string
          state?: string | null
          registered_at?: string
          source?: 'federal' | 'utah_state' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company: string | null
          phone: string | null
          is_admin: boolean
          subscription_status: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INACTIVE'
          subscription_tier: 'BASE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'FOUNDERS_CLUB'
          pricing_tier: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          legacy_price_lock: number | null
          legacy_grace_until: string | null
          monthly_base_rate: number | null
          area_code_limit: number | null
          founders_club_unlocked_at: string | null
          preferences: Record<string, unknown> | null
          total_leads_scrubbed: number
          last_scrub_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          is_admin?: boolean
          subscription_status?: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INACTIVE'
          subscription_tier?: 'BASE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'FOUNDERS_CLUB'
          pricing_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          legacy_price_lock?: number | null
          legacy_grace_until?: string | null
          monthly_base_rate?: number | null
          area_code_limit?: number | null
          founders_club_unlocked_at?: string | null
          preferences?: Record<string, unknown> | null
          total_leads_scrubbed?: number
          last_scrub_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company?: string | null
          phone?: string | null
          is_admin?: boolean
          subscription_status?: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INACTIVE'
          subscription_tier?: 'BASE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'FOUNDERS_CLUB'
          pricing_tier?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          legacy_price_lock?: number | null
          legacy_grace_until?: string | null
          monthly_base_rate?: number | null
          area_code_limit?: number | null
          founders_club_unlocked_at?: string | null
          preferences?: Record<string, unknown> | null
          total_leads_scrubbed?: number
          last_scrub_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ftc_subscriptions: {
        Row: {
          id: string
          area_code: string
          state: string | null
          subscription_status: string
          expires_at: string
          annual_cost: number
          monthly_cost: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_code: string
          state?: string | null
          subscription_status: string
          expires_at: string
          annual_cost: number
          monthly_cost: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_code?: string
          state?: string | null
          subscription_status?: string
          expires_at?: string
          annual_cost?: number
          monthly_cost?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_uploads: {
        Row: {
          id: string
          area_codes: string[]
          total_files: number
          status: string
          ftc_release_date: string | null
          notify_email: string | null
          notify_on_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_codes: string[]
          total_files: number
          status: string
          ftc_release_date?: string | null
          notify_email?: string | null
          notify_on_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_codes?: string[]
          total_files?: number
          status?: string
          ftc_release_date?: string | null
          notify_email?: string | null
          notify_on_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          id: string
          area_code: string
          unlocks_founders_club: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_code: string
          unlocks_founders_club?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_code?: string
          unlocks_founders_club?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      dnc_update_log: {
        Row: {
          id: string
          action: string
          area_codes: string[] | null
          records_affected: number | null
          performed_by: string | null
          details: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          action: string
          area_codes?: string[] | null
          records_affected?: number | null
          performed_by?: string | null
          details?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          action?: string
          area_codes?: string[] | null
          records_affected?: number | null
          performed_by?: string | null
          details?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: []
      }
      upload_history: {
        Row: {
          id: string
          user_id: string
          filename: string
          total_leads: number
          clean_leads: number
          dnc_blocked: number
          caution_leads: number
          duplicates_removed: number
          status: 'processing' | 'completed' | 'failed'
          processing_time_ms: number | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          total_leads: number
          clean_leads?: number
          dnc_blocked?: number
          caution_leads?: number
          duplicates_removed?: number
          status?: 'processing' | 'completed' | 'failed'
          processing_time_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          total_leads?: number
          clean_leads?: number
          dnc_blocked?: number
          caution_leads?: number
          duplicates_removed?: number
          status?: 'processing' | 'completed' | 'failed'
          processing_time_ms?: number | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          event_data: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          event_data?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          event_data?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: []
      }
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
          dnc_status: 'clean' | 'dnc' | 'risky' | null
          risk_score: number | null
          last_scrubbed_at: string | null
          source_job_id: string | null
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
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
          dnc_status?: 'clean' | 'dnc' | 'risky' | null
          risk_score?: number | null
          last_scrubbed_at?: string | null
          source_job_id?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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
          dnc_status?: 'clean' | 'dnc' | 'risky' | null
          risk_score?: number | null
          last_scrubbed_at?: string | null
          source_job_id?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
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
    }
    Enums: {
      dnc_source_enum: 'federal' | 'utah_state' | 'manual'
      subscription_status_enum: 'TRIALING' | 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'INACTIVE'
      subscription_tier_enum: 'BASE' | 'PROFESSIONAL' | 'ENTERPRISE' | 'FOUNDERS_CLUB'
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
