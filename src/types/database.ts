export interface UploadHistory {
  id: string
  user_id: string
  filename: string | null
  file_size: number | null
  total_leads: number
  processed_leads: number | null
  clean_leads: number
  dnc_blocked: number
  caution_leads: number
  duplicates_removed: number
  invalid_numbers: number | null
  status: 'processing' | 'completed' | 'failed'
  processing_time_ms: number | null
  error_message: string | null
  area_codes_used: string[] | null
  results: any | null
  source: string | null
  created_at: string
  updated_at: string | null
}

export interface User {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  company_name: string | null
  subscription_status: string
  subscription_tier: string
  pricing_tier: string | null
  legacy_price_lock: number | null
  created_at: string
}