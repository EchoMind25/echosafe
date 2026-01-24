-- ============================================
-- ECHO MIND COMPLIANCE - FULL PRODUCTION SCHEMA
-- Version: 1.4 | Date: January 23, 2026
--
-- IDEMPOTENT: This script can be safely re-run on existing databases.
-- All operations use IF NOT EXISTS, OR REPLACE, or DO blocks.
--
-- DEPLOYMENT ORDER:
-- 1. Schema version tracking
-- 2. Extensions
-- 3. Users table + trigger
-- 4. DNC registry table
-- 5. DNC deleted numbers table
-- 6. Litigators table
-- 7. Upload jobs table
-- 8. Leads table
-- 9. CRM integrations table
-- 10. CRM sync logs table
-- 11. Expansion requests table
-- 12. Usage logs table
-- 13. Error logs table
-- 14. Admin uploads table
-- 15. Deletion logs table
-- 16. Functions
-- 17. RLS policies
-- 18. Storage buckets
-- ============================================

-- ============================================
-- 1. SCHEMA VERSION TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS public.schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record this migration (idempotent via unique check)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.schema_versions WHERE version = '1.4') THEN
    INSERT INTO public.schema_versions (version, description)
    VALUES ('1.4', 'Full production schema with idempotent patterns');
  END IF;
END $$;

-- ============================================
-- 2. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public; -- For fuzzy text search

-- ============================================
-- HELPER: Idempotent column addition function
-- ============================================
CREATE OR REPLACE FUNCTION public.add_column_if_not_exists(
  _table TEXT,
  _column TEXT,
  _type TEXT,
  _default TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  _sql TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = _table
      AND column_name = _column
  ) THEN
    _sql := format('ALTER TABLE public.%I ADD COLUMN %I %s', _table, _column, _type);
    IF _default IS NOT NULL THEN
      _sql := _sql || ' DEFAULT ' || _default;
    END IF;
    EXECUTE _sql;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER: Idempotent constraint addition
-- ============================================
CREATE OR REPLACE FUNCTION public.add_constraint_if_not_exists(
  _table TEXT,
  _constraint TEXT,
  _definition TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = _constraint
      AND conrelid = ('public.' || _table)::regclass
  ) THEN
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', _table, _constraint, _definition);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. USERS TABLE (Synced with Supabase Auth)
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
    "duplicate_check_enabled": true
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
-- 3. DNC REGISTRY TABLE (Public Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_registry (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 4. DNC DELETED NUMBERS (90-Day Tracking)
-- Already created in previous migration, add IF NOT EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_deleted_numbers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

-- ============================================
-- 5. LITIGATOR DATABASE (Public Court Records)
-- ============================================
CREATE TABLE IF NOT EXISTS public.litigators (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 8. UPLOAD HISTORY TABLE (Service Delivery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.upload_history (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 9. CRM LEADS TABLE (User's CRM Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_leads_search ON public.crm_leads USING GIN(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '')
  )
);

-- ============================================
-- 10. CRM INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 11. CRM INTEGRATION LOGS (30-Day Retention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_integration_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 12. AREA CODE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.area_code_requests (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 13. AREA CODE SUBSCRIPTIONS (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.area_code_subscriptions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 14. USAGE LOGS (Minimal, Abuse Prevention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 15. ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 16. ERROR LOGS (Technical Only, No PII)
-- ============================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

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
-- 17. ADMIN UPLOADS (FTC Data Management)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_uploads (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 18. PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 19. DELETION LOGS (Compliance & Recovery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.deletion_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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
-- 20. FTC CHANGE LISTS (already in previous migration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.ftc_change_lists (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  change_type TEXT NOT NULL CHECK (change_type IN ('additions', 'deletions')),
  ftc_file_date DATE NOT NULL,
  area_codes TEXT[] NOT NULL,
  status TEXT DEFAULT 'pending',
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,
  progress_percent INTEGER DEFAULT 0,
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

-- ============================================
-- 21. PRIVACY FUNCTIONS
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

-- User data deletion (complete removal)
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

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Cleanup deleted numbers (90 days)
  DELETE FROM public.dnc_deleted_numbers WHERE delete_after < NOW();

  -- Cleanup old uploads (30 days)
  DELETE FROM public.upload_history WHERE expires_at < NOW();

  -- Cleanup old sync logs (30 days)
  DELETE FROM public.crm_integration_logs WHERE expires_at < NOW();

  -- Cleanup old usage logs (90 days)
  DELETE FROM public.usage_logs WHERE expires_at < NOW();

  -- Cleanup old error logs (30 days)
  DELETE FROM public.error_logs WHERE expires_at < NOW();

  -- Cleanup expired deletion logs (30 days)
  DELETE FROM public.deletion_logs WHERE recoverable_until < NOW() AND NOT recovered;
END;
$$ LANGUAGE plpgsql;

-- Update timestamps trigger
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.check_dnc(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_check_dnc(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_score(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_area_codes(UUID) TO authenticated;

-- ============================================
-- 22. ROW LEVEL SECURITY (RLS)
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

-- ============================================
-- 23. STORAGE BUCKETS
-- ============================================

-- Create storage buckets (ignore if they exist)
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
-- 24. IDEMPOTENT SCHEMA UPDATES SECTION
-- ============================================
-- Use this section to add new columns or modify existing schema.
-- These patterns are safe to re-run without causing errors.

-- Example: Add new columns to existing tables (safe to re-run)
-- SELECT public.add_column_if_not_exists('users', 'new_column', 'TEXT', '''default_value''');
-- SELECT public.add_column_if_not_exists('users', 'new_boolean', 'BOOLEAN', 'FALSE');
-- SELECT public.add_column_if_not_exists('users', 'new_jsonb', 'JSONB', '''{}''::jsonb');

-- Example: Add constraints (safe to re-run)
-- SELECT public.add_constraint_if_not_exists('users', 'users_email_check', 'CHECK (email ~* ''^.+@.+\..+$'')');

-- Add theme_preference column if it doesn't exist (from migration 20260121100000)
SELECT public.add_column_if_not_exists('users', 'theme_preference', 'TEXT', '''system''');

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================
-- This script is IDEMPOTENT - safe to re-run on existing databases.
--
-- What this means:
-- - Tables: Created only if they don't exist
-- - Indexes: Created only if they don't exist
-- - Functions: Replaced if they exist (CREATE OR REPLACE)
-- - Triggers: Dropped and recreated (DROP IF EXISTS + CREATE)
-- - Policies: Dropped and recreated (DROP POLICY IF EXISTS + CREATE)
-- - Storage: Uses ON CONFLICT DO NOTHING
-- - Columns: Use add_column_if_not_exists() helper
-- - Constraints: Use add_constraint_if_not_exists() helper
--
-- To add new columns in future updates:
--   SELECT public.add_column_if_not_exists('table_name', 'column_name', 'TYPE', 'DEFAULT');
--
-- To check schema version:
--   SELECT * FROM public.schema_versions ORDER BY applied_at DESC;
--
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Import test DNC data for area code 801
-- 3. Test signup flow end-to-end
-- 4. Verify RLS policies with test user
-- ============================================
