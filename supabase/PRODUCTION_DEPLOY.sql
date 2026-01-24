-- ============================================
-- ECHO MIND COMPLIANCE - COMPLETE PRODUCTION SCHEMA
-- Version: 2.0 | Date: January 21, 2026
--
-- DEPLOYMENT INSTRUCTIONS:
-- 1. Create a new Supabase project
-- 2. Go to SQL Editor
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run"
-- 5. Verify with the test queries at the bottom
--
-- This script is IDEMPOTENT - safe to run multiple times
-- ============================================

-- ============================================
-- 1. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 2. USERS TABLE (Synced with Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,

  -- Industry (for AI insights, NOT for profiling)
  industry TEXT NOT NULL DEFAULT 'real-estate-residential',
  industry_custom TEXT,

  -- Subscription
  subscription_tier TEXT DEFAULT 'base',
  subscription_status TEXT DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  subscription_cancelled_at TIMESTAMPTZ,

  -- Pricing
  pricing_tier TEXT,
  legacy_price_lock DECIMAL(10,2),
  legacy_granted_at TIMESTAMPTZ,
  legacy_reason TEXT,
  legacy_grace_until TIMESTAMPTZ,

  -- Coverage
  area_codes JSONB DEFAULT '["801", "385", "435"]'::jsonb,

  -- Metadata (service delivery only)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Usage stats
  total_leads_scrubbed INTEGER DEFAULT 0,
  last_scrub_at TIMESTAMPTZ,

  -- Preferences (user-controlled)
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sync_to_crm_auto": true,
    "include_risky_in_downloads": false,
    "ai_insights_enabled": true,
    "duplicate_check_enabled": true,
    "theme": "system"
  }'::jsonb,

  -- Data deletion tracking (for compliance)
  data_deleted_at TIMESTAMPTZ,
  total_leads_deleted INTEGER DEFAULT 0,

  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_industry ON public.users(industry);

-- Trigger to create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, industry)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'industry', 'real-estate-residential')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. DNC REGISTRY TABLE (Public FTC Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  state TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'ftc',

  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  ftc_release_date DATE,
  record_status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT dnc_registry_phone_unique UNIQUE (phone_number)
);

CREATE INDEX IF NOT EXISTS idx_dnc_phone ON public.dnc_registry(phone_number);
CREATE INDEX IF NOT EXISTS idx_dnc_area_code ON public.dnc_registry(area_code);
CREATE INDEX IF NOT EXISTS idx_dnc_state ON public.dnc_registry(state);
CREATE INDEX IF NOT EXISTS idx_dnc_registered ON public.dnc_registry(registered_at DESC);
CREATE INDEX IF NOT EXISTS idx_dnc_status ON public.dnc_registry(record_status) WHERE record_status = 'active';

-- ============================================
-- 4. DNC DELETED NUMBERS (90-Day Pattern Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_deleted_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  state TEXT,

  original_add_date TIMESTAMPTZ,
  deleted_from_dnc_date DATE DEFAULT CURRENT_DATE,
  times_added_removed INTEGER DEFAULT 1,
  last_pattern_check TIMESTAMPTZ,

  delete_after TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  source TEXT DEFAULT 'ftc',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT dnc_deleted_phone_unique UNIQUE (phone_number)
);

CREATE INDEX IF NOT EXISTS idx_deleted_area_code ON public.dnc_deleted_numbers(area_code);
CREATE INDEX IF NOT EXISTS idx_deleted_expires ON public.dnc_deleted_numbers(delete_after);
CREATE INDEX IF NOT EXISTS idx_deleted_pattern ON public.dnc_deleted_numbers(times_added_removed) WHERE times_added_removed > 1;
CREATE INDEX IF NOT EXISTS idx_deleted_phone ON public.dnc_deleted_numbers(phone_number);

COMMENT ON TABLE public.dnc_deleted_numbers IS 'Tracks phone numbers recently removed from DNC registry for 90-day AI pattern detection.';

-- ============================================
-- 5. LITIGATOR DATABASE (Public Court Records)
-- ============================================
CREATE TABLE IF NOT EXISTS public.litigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  case_count INTEGER DEFAULT 1,
  last_case_date DATE,
  risk_level TEXT DEFAULT 'high',
  notes TEXT,
  source TEXT DEFAULT 'pacer',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_litigators_phone ON public.litigators(phone_number);
CREATE INDEX IF NOT EXISTS idx_litigators_risk ON public.litigators(risk_level);

-- ============================================
-- 6. DNC UPDATE LOG (Track FTC data updates)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code TEXT NOT NULL,
  update_type TEXT NOT NULL,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_removed INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  source_file TEXT,
  ftc_release_date DATE,
  admin_user_id UUID REFERENCES public.users(id),
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dnc_log_area ON public.dnc_update_log(area_code);
CREATE INDEX IF NOT EXISTS idx_dnc_log_status ON public.dnc_update_log(status);
CREATE INDEX IF NOT EXISTS idx_dnc_log_created ON public.dnc_update_log(created_at DESC);

-- ============================================
-- 7. FTC SUBSCRIPTIONS (Area code subscriptions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ftc_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL,
  subscription_status TEXT DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  annual_cost DECIMAL(10,2) DEFAULT 85.00,
  last_update_at TIMESTAMPTZ,
  last_update_record_count INTEGER DEFAULT 0,
  next_update_due TIMESTAMPTZ,
  paid_by UUID REFERENCES public.users(id),
  payment_reference TEXT,
  notes TEXT,
  auto_renew BOOLEAN DEFAULT TRUE,
  renewal_reminder_sent BOOLEAN DEFAULT FALSE,
  renewal_reminder_sent_at TIMESTAMPTZ,
  total_records INTEGER DEFAULT 0,
  last_change_list_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ftc_sub_area ON public.ftc_subscriptions(area_code);
CREATE INDEX IF NOT EXISTS idx_ftc_sub_status ON public.ftc_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_ftc_sub_expires ON public.ftc_subscriptions(expires_at);

-- ============================================
-- 8. FTC CHANGE LISTS (Admin FTC file uploads)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ftc_change_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL CHECK (change_type IN ('additions', 'deletions')),
  ftc_file_date DATE NOT NULL,
  area_codes TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  estimated_completion TIMESTAMPTZ,
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER DEFAULT 0,
  file_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  file_hash TEXT,
  uploaded_by UUID REFERENCES public.users(id),
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ftc_changes_date ON public.ftc_change_lists(ftc_file_date DESC);
CREATE INDEX IF NOT EXISTS idx_ftc_changes_status ON public.ftc_change_lists(status);
CREATE INDEX IF NOT EXISTS idx_ftc_changes_type ON public.ftc_change_lists(change_type);

COMMENT ON TABLE public.ftc_change_lists IS 'Tracks admin uploads of FTC daily change lists (additions and deletions).';

-- ============================================
-- 9. UPLOAD HISTORY TABLE (Service Delivery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  filename TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'processing',

  -- Results
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER,
  clean_leads INTEGER DEFAULT 0,
  dnc_blocked INTEGER DEFAULT 0,
  caution_leads INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,

  -- Scoring
  average_risk_score DECIMAL(5,2),
  compliance_rate DECIMAL(5,2),

  -- Files (auto-deleted after 30 days)
  clean_file_url TEXT,
  full_report_url TEXT,
  risky_file_url TEXT,

  -- Processing
  processing_time_ms INTEGER,
  n8n_job_id TEXT,
  error_message TEXT,
  source TEXT,
  area_codes_used TEXT[],

  -- AI Insights
  ai_insights JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_uploads_user ON public.upload_history(user_id);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON public.upload_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON public.upload_history(status);
CREATE INDEX IF NOT EXISTS idx_uploads_expires ON public.upload_history(expires_at);

-- ============================================
-- 10. CRM LEADS TABLE (User's Private CRM Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES public.upload_history(id) ON DELETE SET NULL,

  -- Lead data
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  source TEXT,

  -- Compliance
  dnc_status BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  last_scrubbed_at TIMESTAMPTZ DEFAULT NOW(),

  -- CRM fields
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  assigned_to TEXT,

  -- Activity
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,

  -- Custom fields
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- External CRM IDs
  external_crm_ids JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT crm_leads_user_phone_unique UNIQUE(user_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_leads_user ON public.crm_leads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.crm_leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.crm_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_tags ON public.crm_leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_risk ON public.crm_leads(risk_score);
CREATE INDEX IF NOT EXISTS idx_leads_deleted ON public.crm_leads(deleted_at) WHERE deleted_at IS NOT NULL;

-- Full-text search: Use trigger-based tsvector (STABLE functions can't be in generated columns)
-- Skip index creation here - will add after triggers are set up

-- ============================================
-- 11. CRM INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  crm_type TEXT NOT NULL,
  crm_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',

  -- Credentials (encrypted at app level)
  credentials JSONB DEFAULT '{}'::jsonb,

  -- Configuration
  field_mapping JSONB DEFAULT '{}'::jsonb,
  sync_settings JSONB DEFAULT '{}'::jsonb,

  -- Status
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT crm_integrations_user_type_unique UNIQUE(user_id, crm_type)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON public.crm_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_status ON public.crm_integrations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.crm_integrations(crm_type);

-- ============================================
-- 12. CRM INTEGRATION LOGS (30-Day Retention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  sync_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  leads_synced INTEGER DEFAULT 0,
  leads_failed INTEGER DEFAULT 0,
  error_message TEXT,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON public.crm_integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created ON public.crm_integration_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_expires ON public.crm_integration_logs(expires_at);

-- ============================================
-- 13. AREA CODE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.area_code_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code TEXT NOT NULL,
  requested_by UUID REFERENCES public.users(id),

  ftc_cost DECIMAL(10,2) DEFAULT 85.00,
  user_contribution DECIMAL(10,2) DEFAULT 0,
  echo_mind_contribution DECIMAL(10,2) DEFAULT 0,
  total_funded DECIMAL(10,2) DEFAULT 0,

  status TEXT DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  records_added INTEGER,

  error_message TEXT,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_expansion_user ON public.area_code_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_expansion_status ON public.area_code_requests(status);
CREATE INDEX IF NOT EXISTS idx_expansion_area ON public.area_code_requests(area_code);

-- ============================================
-- 14. AREA CODE SUBSCRIPTIONS (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.area_code_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active',

  CONSTRAINT area_code_sub_unique UNIQUE(user_id, area_code)
);

CREATE INDEX IF NOT EXISTS idx_ac_sub_user ON public.area_code_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ac_sub_area ON public.area_code_subscriptions(area_code);

-- ============================================
-- 15. USAGE LOGS (Minimal, Abuse Prevention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_usage_user ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON public.usage_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_usage_expires ON public.usage_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_action ON public.usage_logs(action);

-- ============================================
-- 16. ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,

  device_type TEXT,
  platform TEXT,
  user_agent TEXT,
  ip_address TEXT,
  session_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);

-- ============================================
-- 17. ERROR LOGS (Technical Only, No PII)
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  error_type TEXT,
  error_message TEXT,
  stack_trace TEXT,
  endpoint TEXT,
  http_status INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_created ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_expires ON public.error_logs(expires_at);

-- ============================================
-- 18. ADMIN UPLOADS (FTC Data Management)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES public.users(id),

  upload_type TEXT,
  area_codes TEXT[] NOT NULL,
  total_files INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,

  status TEXT DEFAULT 'processing',
  progress JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_uploads_status ON public.admin_uploads(status);
CREATE INDEX IF NOT EXISTS idx_admin_uploads_created ON public.admin_uploads(created_at DESC);

-- ============================================
-- 19. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,

  stripe_payment_intent_id TEXT NOT NULL,
  stripe_invoice_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  description TEXT,
  payment_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ============================================
-- 20. DELETION LOGS (Compliance & Recovery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

  deletion_type TEXT,
  items_deleted INTEGER DEFAULT 0,
  reason TEXT,

  data_snapshot JSONB,

  recoverable_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deletion_logs_user ON public.deletion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_logs_recoverable ON public.deletion_logs(recoverable_until) WHERE NOT recovered;

-- ============================================
-- 21. COMPLIANCE AUDIT LOGS (TCPA 5-Year Retention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Compliance fields (5-year retention)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  user_email TEXT,
  company_name TEXT,

  -- Check details
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  dnc_status TEXT NOT NULL,
  risk_score INTEGER,

  -- Purpose & context
  check_purpose TEXT NOT NULL,
  industry TEXT,
  upload_job_id UUID REFERENCES public.upload_history(id) ON DELETE SET NULL,

  -- Timestamp (critical for 5-year retention)
  checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Result data (compliance evidence)
  result_data JSONB DEFAULT '{}'::jsonb,

  -- Retention metadata
  retention_until DATE NOT NULL,
  is_anonymized BOOLEAN DEFAULT FALSE,

  -- Source tracking
  source TEXT DEFAULT 'web',
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_phone ON public.compliance_audit_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.compliance_audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_checked_at ON public.compliance_audit_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_retention ON public.compliance_audit_logs(retention_until) WHERE NOT is_anonymized;
CREATE INDEX IF NOT EXISTS idx_audit_dnc_status ON public.compliance_audit_logs(dnc_status);
CREATE INDEX IF NOT EXISTS idx_audit_upload_job ON public.compliance_audit_logs(upload_job_id) WHERE upload_job_id IS NOT NULL;
-- Note: For year-based queries, use WHERE checked_at >= '2026-01-01' AND checked_at < '2027-01-01'
-- This uses the idx_audit_checked_at index efficiently

COMMENT ON TABLE public.compliance_audit_logs IS 'TCPA compliance audit trail - 5-year retention per 47 CFR 64.1200';

-- ============================================
-- 22. CORE FUNCTIONS
-- ============================================

-- Check if phone number is on DNC
CREATE OR REPLACE FUNCTION public.check_dnc(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.dnc_registry
    WHERE phone_number = phone
    AND record_status = 'active'
  );
END;
$$;

-- Bulk check DNC (optimized for large batches)
CREATE OR REPLACE FUNCTION public.bulk_check_dnc(phones TEXT[])
RETURNS TABLE(phone_number TEXT, is_dnc BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.phone,
    EXISTS (
      SELECT 1 FROM public.dnc_registry d
      WHERE d.phone_number = p.phone AND d.record_status = 'active'
    ) as is_dnc
  FROM unnest(phones) AS p(phone);
END;
$$;

-- Get risk score for phone number
CREATE OR REPLACE FUNCTION public.get_risk_score(phone_num TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER := 0;
  is_dnc BOOLEAN;
  is_deleted BOOLEAN;
  is_litigator BOOLEAN;
  delete_count INTEGER;
BEGIN
  -- Check federal DNC (60 points)
  SELECT public.check_dnc(phone_num) INTO is_dnc;
  IF is_dnc THEN
    score := score + 60;
  END IF;

  -- Check deleted numbers (20 points base + pattern)
  SELECT
    EXISTS(SELECT 1 FROM public.dnc_deleted_numbers WHERE phone_number = phone_num),
    COALESCE(MAX(times_added_removed), 0)
  INTO is_deleted, delete_count
  FROM public.dnc_deleted_numbers
  WHERE phone_number = phone_num;

  IF is_deleted THEN
    score := score + 20;
    IF delete_count > 1 THEN
      score := score + 15;
    END IF;
  END IF;

  -- Check litigator database (25 points)
  SELECT EXISTS(SELECT 1 FROM public.litigators WHERE phone_number = phone_num) INTO is_litigator;

  IF is_litigator THEN
    score := score + 25;
  END IF;

  RETURN score;
END;
$$;

-- Get user's area codes
CREATE OR REPLACE FUNCTION public.get_user_area_codes(p_user_id UUID)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  codes TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT jsonb_array_elements_text(area_codes)
    FROM public.users WHERE id = p_user_id
  ) INTO codes;
  RETURN COALESCE(codes, ARRAY['801', '385', '435']::TEXT[]);
END;
$$;

-- Check if number was recently removed from DNC
CREATE OR REPLACE FUNCTION public.was_recently_removed_from_dnc(phone_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.dnc_deleted_numbers
    WHERE phone_number = phone_num
    AND deleted_from_dnc_date >= CURRENT_DATE - INTERVAL '90 days'
  );
END;
$$;

-- Get DNC pattern count
CREATE OR REPLACE FUNCTION public.get_dnc_pattern_count(phone_num TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pattern_count INTEGER;
BEGIN
  SELECT times_added_removed INTO pattern_count
  FROM public.dnc_deleted_numbers
  WHERE phone_number = phone_num;
  RETURN COALESCE(pattern_count, 0);
END;
$$;

-- ============================================
-- 23. COMPLIANCE FUNCTIONS
-- ============================================

-- Anonymize compliance logs when user deletes data
CREATE OR REPLACE FUNCTION public.anonymize_compliance_logs(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.compliance_audit_logs
  SET
    user_id = NULL,
    user_email = 'deleted-user-' || SUBSTRING(MD5(user_email) FROM 1 FOR 8) || '@anonymized.local',
    company_name = 'Deleted Account',
    ip_address = NULL,
    user_agent = NULL,
    is_anonymized = TRUE
  WHERE user_id = target_user_id
    AND NOT is_anonymized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Purge expired audit logs (run monthly)
CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.compliance_audit_logs
  WHERE retention_until < CURRENT_DATE;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert compliance log entry
CREATE OR REPLACE FUNCTION public.log_compliance_check(
  p_user_id UUID,
  p_user_email TEXT,
  p_company_name TEXT,
  p_phone_number TEXT,
  p_dnc_status TEXT,
  p_risk_score INTEGER DEFAULT NULL,
  p_check_purpose TEXT DEFAULT 'lead_scrubbing',
  p_industry TEXT DEFAULT NULL,
  p_upload_job_id UUID DEFAULT NULL,
  p_result_data JSONB DEFAULT '{}'::jsonb,
  p_source TEXT DEFAULT 'web',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.compliance_audit_logs (
    user_id, user_email, company_name, phone_number, area_code,
    dnc_status, risk_score, check_purpose, industry, upload_job_id,
    result_data, retention_until, source, ip_address, user_agent
  ) VALUES (
    p_user_id, p_user_email, p_company_name, p_phone_number,
    SUBSTRING(p_phone_number FROM 1 FOR 3),
    p_dnc_status, p_risk_score, p_check_purpose, p_industry, p_upload_job_id,
    p_result_data, (CURRENT_DATE + INTERVAL '5 years')::DATE,
    p_source, p_ip_address, p_user_agent
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 24. USER DATA DELETION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_all_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_count INTEGER;
BEGIN
  -- Get lead count before deletion
  SELECT COUNT(*) INTO lead_count FROM public.crm_leads WHERE user_id = target_user_id;

  -- Anonymize compliance logs (KEEP for 5 years, but detach from user)
  PERFORM public.anonymize_compliance_logs(target_user_id);

  -- Log deletion for compliance
  INSERT INTO public.deletion_logs (user_id, deletion_type, items_deleted, reason)
  VALUES (target_user_id, 'all_data', lead_count, 'User requested complete data deletion');

  -- Delete user's data
  DELETE FROM public.crm_leads WHERE user_id = target_user_id;
  DELETE FROM public.upload_history WHERE user_id = target_user_id;
  DELETE FROM public.crm_integrations WHERE user_id = target_user_id;
  DELETE FROM public.usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.area_code_requests WHERE requested_by = target_user_id;

  -- Update user record
  UPDATE public.users
  SET
    data_deleted_at = NOW(),
    total_leads_deleted = lead_count
  WHERE id = target_user_id;
END;
$$;

-- ============================================
-- 25. CLEANUP FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_numbers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.dnc_deleted_numbers WHERE delete_after <= NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  DELETE FROM public.dnc_deleted_numbers WHERE delete_after < NOW();
  DELETE FROM public.upload_history WHERE expires_at < NOW();
  DELETE FROM public.crm_integration_logs WHERE expires_at < NOW();
  DELETE FROM public.usage_logs WHERE expires_at < NOW();
  DELETE FROM public.error_logs WHERE expires_at < NOW();
  DELETE FROM public.deletion_logs WHERE recoverable_until < NOW() AND NOT recovered;
END;
$$ LANGUAGE plpgsql;

-- Daily privacy cleanup
CREATE OR REPLACE FUNCTION public.daily_privacy_cleanup()
RETURNS void AS $$
BEGIN
  PERFORM public.cleanup_expired_data();

  -- Cleanup cancelled user data (60 days grace)
  DELETE FROM public.crm_leads
  WHERE user_id IN (
    SELECT id FROM public.users
    WHERE subscription_status = 'canceled'
    AND updated_at < NOW() - INTERVAL '60 days'
  );

  RAISE NOTICE 'Privacy cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 26. UPDATE TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.crm_leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.crm_integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.crm_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dnc_registry_updated_at ON public.dnc_registry;
CREATE TRIGGER update_dnc_registry_updated_at
  BEFORE UPDATE ON public.dnc_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dnc_deleted_numbers_updated_at ON public.dnc_deleted_numbers;
CREATE TRIGGER update_dnc_deleted_numbers_updated_at
  BEFORE UPDATE ON public.dnc_deleted_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ftc_change_lists_updated_at ON public.ftc_change_lists;
CREATE TRIGGER update_ftc_change_lists_updated_at
  BEFORE UPDATE ON public.ftc_change_lists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 26b. FULL-TEXT SEARCH FOR CRM LEADS
-- ============================================
-- Add search_vector column (regular column, not generated)
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION public.update_leads_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.first_name, '') || ' ' ||
    COALESCE(NEW.last_name, '') || ' ' ||
    COALESCE(NEW.email, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for search vector
DROP TRIGGER IF EXISTS update_leads_search_vector ON public.crm_leads;
CREATE TRIGGER update_leads_search_vector
  BEFORE INSERT OR UPDATE OF first_name, last_name, email ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_leads_search_vector();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_leads_search ON public.crm_leads USING GIN(search_vector);

-- ============================================
-- 27. GRANT FUNCTION PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.check_dnc(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_check_dnc(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_score(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_area_codes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.was_recently_removed_from_dnc(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dnc_pattern_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_compliance_check TO authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_compliance_logs TO authenticated;

-- ============================================
-- 28. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_code_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.area_code_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dnc_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dnc_deleted_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftc_change_lists ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

-- Upload history policies
DROP POLICY IF EXISTS "Users can view own uploads" ON public.upload_history;
CREATE POLICY "Users can view own uploads"
  ON public.upload_history FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create uploads" ON public.upload_history;
CREATE POLICY "Users can create uploads"
  ON public.upload_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own uploads" ON public.upload_history;
CREATE POLICY "Users can update own uploads"
  ON public.upload_history FOR UPDATE
  USING (user_id = auth.uid());

-- Leads policies
DROP POLICY IF EXISTS "Users can view own leads" ON public.crm_leads;
CREATE POLICY "Users can view own leads"
  ON public.crm_leads FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can manage own leads" ON public.crm_leads;
CREATE POLICY "Users can manage own leads"
  ON public.crm_leads FOR ALL
  USING (user_id = auth.uid());

-- CRM integrations policies
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.crm_integrations;
CREATE POLICY "Users can manage own integrations"
  ON public.crm_integrations FOR ALL
  USING (user_id = auth.uid());

-- CRM sync logs policies
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.crm_integration_logs;
CREATE POLICY "Users can view own sync logs"
  ON public.crm_integration_logs FOR SELECT
  USING (user_id = auth.uid());

-- Area code requests policies
DROP POLICY IF EXISTS "Users can manage own requests" ON public.area_code_requests;
CREATE POLICY "Users can manage own requests"
  ON public.area_code_requests FOR ALL
  USING (requested_by = auth.uid());

-- Area code subscriptions policies
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.area_code_subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.area_code_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- Usage logs policies
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
CREATE POLICY "Users can view own usage"
  ON public.usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- Deletion logs policies
DROP POLICY IF EXISTS "Users can view own deletions" ON public.deletion_logs;
CREATE POLICY "Users can view own deletions"
  ON public.deletion_logs FOR SELECT
  USING (user_id = auth.uid());

-- DNC registry (public read)
DROP POLICY IF EXISTS "DNC registry is publicly readable" ON public.dnc_registry;
CREATE POLICY "DNC registry is publicly readable"
  ON public.dnc_registry FOR SELECT
  TO authenticated
  USING (true);

-- DNC deleted numbers (public read for risk scoring)
DROP POLICY IF EXISTS "Deleted numbers are publicly readable" ON public.dnc_deleted_numbers;
CREATE POLICY "Deleted numbers are publicly readable"
  ON public.dnc_deleted_numbers FOR SELECT
  TO authenticated
  USING (true);

-- Litigators (public read)
DROP POLICY IF EXISTS "Litigators table is publicly readable" ON public.litigators;
CREATE POLICY "Litigators table is publicly readable"
  ON public.litigators FOR SELECT
  TO authenticated
  USING (true);

-- Admin policies for DNC management
DROP POLICY IF EXISTS "Admins can manage DNC registry" ON public.dnc_registry;
CREATE POLICY "Admins can manage DNC registry"
  ON public.dnc_registry FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage deleted numbers" ON public.dnc_deleted_numbers;
CREATE POLICY "Admins can manage deleted numbers"
  ON public.dnc_deleted_numbers FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage litigators" ON public.litigators;
CREATE POLICY "Admins can manage litigators"
  ON public.litigators FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid());

-- Analytics policies
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
CREATE POLICY "Users can create analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Compliance audit logs policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.compliance_audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON public.compliance_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT is_admin FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "System can insert audit logs" ON public.compliance_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.compliance_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- FTC change lists (admin only)
DROP POLICY IF EXISTS "Admins can view change lists" ON public.ftc_change_lists;
CREATE POLICY "Admins can view change lists"
  ON public.ftc_change_lists FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage change lists" ON public.ftc_change_lists;
CREATE POLICY "Admins can manage change lists"
  ON public.ftc_change_lists FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

-- ============================================
-- 29. STORAGE BUCKETS
-- ============================================
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('uploads', 'uploads', false),
    ('results', 'results', false),
    ('admin-uploads', 'admin-uploads', false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
CREATE POLICY "Users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can access own files" ON storage.objects;
CREATE POLICY "Users can access own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('uploads', 'results')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('uploads', 'results')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Admins can manage admin uploads" ON storage.objects;
CREATE POLICY "Admins can manage admin uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'admin-uploads'
    AND (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- ============================================
-- 30. SEED INITIAL FTC SUBSCRIPTIONS (Utah)
-- ============================================
INSERT INTO public.ftc_subscriptions (
  area_code, state, subscription_status, subscribed_at, expires_at, annual_cost, notes
) VALUES
  ('801', 'UT', 'active', NOW(), NOW() + INTERVAL '1 year', 85.00, 'Salt Lake City metro'),
  ('385', 'UT', 'active', NOW(), NOW() + INTERVAL '1 year', 85.00, 'Utah overlay'),
  ('435', 'UT', 'active', NOW(), NOW() + INTERVAL '1 year', 85.00, 'Southern/Rural Utah')
ON CONFLICT (area_code) DO UPDATE SET
  subscription_status = 'active',
  updated_at = NOW();

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================
--
-- VERIFICATION QUERIES (run after deployment):
--
-- 1. Check tables created:
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public' ORDER BY table_name;
--
-- 2. Check functions created:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_schema = 'public' ORDER BY routine_name;
--
-- 3. Verify RLS is enabled:
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public' AND rowsecurity = true;
--
-- 4. Test check_dnc function:
--    SELECT check_dnc('8015551234');
--
-- 5. Test get_risk_score function:
--    SELECT get_risk_score('8015551234');
--
-- NEXT STEPS:
-- 1. Import FTC DNC data for area codes 801, 385, 435
-- 2. Configure Supabase cron for daily_privacy_cleanup()
-- 3. Configure monthly cron for purge_expired_audit_logs()
-- 4. Test auth flow end-to-end
-- ============================================
