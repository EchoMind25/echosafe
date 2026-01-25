-- ============================================
-- ECHO MIND COMPLIANCE - FULL PRODUCTION SCHEMA
-- Version: 1.7 | Date: January 25, 2026
--
-- IDEMPOTENT: This script can be safely re-run on existing databases.
-- All operations use IF NOT EXISTS, OR REPLACE, or DO blocks.
--
-- DEPLOYMENT ORDER:
-- 1. Schema version tracking
-- 2. Extensions
-- 3. Helper functions
-- 4. Tables (without indexes)
-- 5. Add missing columns to existing tables
-- 6. Create indexes
-- 7. Functions
-- 8. RLS policies
-- 9. Service role policies
-- 10. Storage buckets
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
  IF NOT EXISTS (SELECT 1 FROM public.schema_versions WHERE version = '1.7') THEN
    INSERT INTO public.schema_versions (version, description)
    VALUES ('1.7', 'Added trial abuse prevention with usage limits (7-day trial, 1000 leads, 5 uploads)');
  END IF;
END $$;

-- ============================================
-- 2. EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA public;

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Idempotent column addition function
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

-- Idempotent constraint addition
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
EXCEPTION WHEN undefined_table THEN
  -- Table doesn't exist yet, skip
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Safe index creation that checks if column exists
CREATE OR REPLACE FUNCTION public.create_index_if_column_exists(
  _index_name TEXT,
  _table TEXT,
  _column TEXT,
  _desc BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
DECLARE
  _sql TEXT;
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = _table
      AND column_name = _column
  ) THEN
    -- Check if index already exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname = _index_name
    ) THEN
      IF _desc THEN
        _sql := format('CREATE INDEX %I ON public.%I(%I DESC)', _index_name, _table, _column);
      ELSE
        _sql := format('CREATE INDEX %I ON public.%I(%I)', _index_name, _table, _column);
      END IF;
      EXECUTE _sql;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. USERS TABLE (Synced with Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,
  industry TEXT NOT NULL DEFAULT 'real-estate-residential',
  industry_custom TEXT,
  subscription_tier TEXT DEFAULT 'base',
  subscription_status TEXT DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  -- Trial abuse prevention fields (7-day trial with usage limits)
  trial_started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  trial_leads_used INTEGER DEFAULT 0,
  trial_uploads_count INTEGER DEFAULT 0,
  -- Subscription fields
  subscription_cancelled_at TIMESTAMPTZ,
  pricing_tier TEXT,
  legacy_price_lock DECIMAL(10,2),
  legacy_granted_at TIMESTAMPTZ,
  legacy_reason TEXT,
  legacy_grace_until TIMESTAMPTZ,
  area_codes JSONB DEFAULT '["801", "385", "435"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  total_leads_scrubbed INTEGER DEFAULT 0,
  last_scrub_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sync_to_crm_auto": true,
    "include_risky_in_downloads": false,
    "ai_insights_enabled": true,
    "duplicate_check_enabled": true
  }'::jsonb,
  data_deleted_at TIMESTAMPTZ,
  total_leads_deleted INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT FALSE,
  theme_preference TEXT DEFAULT 'system'
);

-- Trigger to create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    industry,
    -- Trial abuse prevention: Initialize trial fields on signup
    subscription_status,
    trial_started_at,
    trial_ends_at,
    trial_leads_used,
    trial_uploads_count
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'industry', 'real-estate-residential'),
    -- Trial starts immediately with 7-day duration and usage limits
    'trialing',
    NOW(),
    NOW() + INTERVAL '7 days',
    0,
    0
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
-- 5. DNC REGISTRY TABLE (Public Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.dnc_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  state TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'ftc',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  ftc_release_date DATE,
  record_status TEXT DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dnc_registry_phone_unique'
  ) THEN
    ALTER TABLE public.dnc_registry ADD CONSTRAINT dnc_registry_phone_unique UNIQUE (phone_number);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 6. DNC DELETED NUMBERS (90-Day Tracking)
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'dnc_deleted_phone_unique'
  ) THEN
    ALTER TABLE public.dnc_deleted_numbers ADD CONSTRAINT dnc_deleted_phone_unique UNIQUE (phone_number);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 7. LITIGATOR DATABASE (Public Court Records)
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

-- ============================================
-- 8. DNC UPDATE LOG (Track FTC data updates)
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

-- ============================================
-- 9. FTC SUBSCRIPTIONS (Area code subscriptions)
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

-- ============================================
-- 10. UPLOAD HISTORY TABLE (Service Delivery)
-- ============================================
CREATE TABLE IF NOT EXISTS public.upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'processing',
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER,
  clean_leads INTEGER DEFAULT 0,
  dnc_blocked INTEGER DEFAULT 0,
  caution_leads INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  average_risk_score DECIMAL(5,2),
  compliance_rate DECIMAL(5,2),
  clean_file_url TEXT,
  full_report_url TEXT,
  risky_file_url TEXT,
  processing_time_ms INTEGER,
  n8n_job_id TEXT,
  error_message TEXT,
  source TEXT,
  area_codes_used TEXT[],
  ai_insights JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================
-- 11. CRM LEADS TABLE (User's CRM Data)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES public.upload_history(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  source TEXT,
  dnc_status BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low',
  last_scrubbed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  assigned_to TEXT,
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  external_crm_ids JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_user_phone_unique'
  ) THEN
    ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_user_phone_unique UNIQUE(user_id, phone_number);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 12. CRM INTEGRATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL,
  crm_name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  credentials JSONB DEFAULT '{}'::jsonb,
  field_mapping JSONB DEFAULT '{}'::jsonb,
  sync_settings JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'crm_integrations_user_type_unique'
  ) THEN
    ALTER TABLE public.crm_integrations ADD CONSTRAINT crm_integrations_user_type_unique UNIQUE(user_id, crm_type);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 13. CRM INTEGRATION LOGS (30-Day Retention)
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

-- ============================================
-- 14. AREA CODE REQUESTS
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

-- ============================================
-- 15. AREA CODE SUBSCRIPTIONS (per-user)
-- ============================================
CREATE TABLE IF NOT EXISTS public.area_code_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'area_code_sub_unique'
  ) THEN
    ALTER TABLE public.area_code_subscriptions ADD CONSTRAINT area_code_sub_unique UNIQUE(user_id, area_code);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 16. USAGE LOGS (Minimal, Abuse Prevention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

-- ============================================
-- 17. ANALYTICS EVENTS
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

-- ============================================
-- 18. ERROR LOGS (Technical Only, No PII)
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

-- ============================================
-- 19. ADMIN UPLOADS (FTC Data Management)
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

-- ============================================
-- 20. PAYMENTS
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

-- ============================================
-- 21. DELETION LOGS (Compliance & Recovery)
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

-- ============================================
-- 22. FTC CHANGE LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ftc_change_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_type TEXT NOT NULL,
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

-- Add check constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ftc_change_lists_change_type_check'
  ) THEN
    ALTER TABLE public.ftc_change_lists ADD CONSTRAINT ftc_change_lists_change_type_check
      CHECK (change_type IN ('additions', 'deletions'));
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 23. COMPLIANCE AUDIT LOGS (TCPA 5-Year Retention)
-- ============================================
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  upload_job_id UUID REFERENCES public.upload_history(id) ON DELETE SET NULL,
  user_email TEXT,
  company_name TEXT,
  phone_number TEXT NOT NULL,
  area_code TEXT,
  dnc_status TEXT NOT NULL,
  risk_score INTEGER,
  check_purpose TEXT,
  industry TEXT,
  source TEXT,
  ip_address TEXT,
  user_agent TEXT,
  retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 years'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 24. ADD MISSING COLUMNS TO EXISTING TABLES
-- This section ensures all columns exist before creating indexes
-- ============================================

-- Users table columns
SELECT public.add_column_if_not_exists('users', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('users', 'updated_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('users', 'theme_preference', 'TEXT', '''system''');
SELECT public.add_column_if_not_exists('users', 'is_admin', 'BOOLEAN', 'FALSE');
-- Trial abuse prevention columns (7-day trial with 1000 leads / 5 uploads limit)
SELECT public.add_column_if_not_exists('users', 'trial_started_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('users', 'trial_leads_used', 'INTEGER', '0');
SELECT public.add_column_if_not_exists('users', 'trial_uploads_count', 'INTEGER', '0');

-- DNC registry columns
SELECT public.add_column_if_not_exists('dnc_registry', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('dnc_registry', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- DNC deleted numbers columns
SELECT public.add_column_if_not_exists('dnc_deleted_numbers', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('dnc_deleted_numbers', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- Litigators columns
SELECT public.add_column_if_not_exists('litigators', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('litigators', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- DNC update log columns
SELECT public.add_column_if_not_exists('dnc_update_log', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- FTC subscriptions columns
SELECT public.add_column_if_not_exists('ftc_subscriptions', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('ftc_subscriptions', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- Upload history columns
SELECT public.add_column_if_not_exists('upload_history', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('upload_history', 'ai_insights', 'JSONB', '''{}''::jsonb');
SELECT public.add_column_if_not_exists('upload_history', 'expires_at', 'TIMESTAMPTZ', '(NOW() + INTERVAL ''30 days'')');

-- CRM leads columns
SELECT public.add_column_if_not_exists('crm_leads', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('crm_leads', 'updated_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('crm_leads', 'deleted_at', 'TIMESTAMPTZ', 'NULL');

-- CRM integrations columns
SELECT public.add_column_if_not_exists('crm_integrations', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('crm_integrations', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- CRM integration logs columns
SELECT public.add_column_if_not_exists('crm_integration_logs', 'started_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('crm_integration_logs', 'expires_at', 'TIMESTAMPTZ', '(NOW() + INTERVAL ''30 days'')');

-- Area code requests columns
SELECT public.add_column_if_not_exists('area_code_requests', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('area_code_requests', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- Usage logs columns
SELECT public.add_column_if_not_exists('usage_logs', 'timestamp', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('usage_logs', 'expires_at', 'TIMESTAMPTZ', '(NOW() + INTERVAL ''90 days'')');

-- Analytics events columns
SELECT public.add_column_if_not_exists('analytics_events', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- Error logs columns
SELECT public.add_column_if_not_exists('error_logs', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('error_logs', 'expires_at', 'TIMESTAMPTZ', '(NOW() + INTERVAL ''30 days'')');

-- Admin uploads columns
SELECT public.add_column_if_not_exists('admin_uploads', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- Payments columns
SELECT public.add_column_if_not_exists('payments', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- Deletion logs columns
SELECT public.add_column_if_not_exists('deletion_logs', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- FTC change lists columns
SELECT public.add_column_if_not_exists('ftc_change_lists', 'created_at', 'TIMESTAMPTZ', 'NOW()');
SELECT public.add_column_if_not_exists('ftc_change_lists', 'updated_at', 'TIMESTAMPTZ', 'NOW()');

-- Compliance audit logs columns
SELECT public.add_column_if_not_exists('compliance_audit_logs', 'created_at', 'TIMESTAMPTZ', 'NOW()');

-- ============================================
-- 25. CREATE INDEXES (After columns exist)
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_industry ON public.users(industry);

-- DNC registry indexes
CREATE INDEX IF NOT EXISTS idx_dnc_phone ON public.dnc_registry(phone_number);
CREATE INDEX IF NOT EXISTS idx_dnc_area_code ON public.dnc_registry(area_code);
CREATE INDEX IF NOT EXISTS idx_dnc_state ON public.dnc_registry(state);
SELECT public.create_index_if_column_exists('idx_dnc_registered', 'dnc_registry', 'registered_at', true);

-- DNC deleted numbers indexes
CREATE INDEX IF NOT EXISTS idx_deleted_area_code ON public.dnc_deleted_numbers(area_code);
CREATE INDEX IF NOT EXISTS idx_deleted_expires ON public.dnc_deleted_numbers(delete_after);

-- Litigators indexes
CREATE INDEX IF NOT EXISTS idx_litigators_phone ON public.litigators(phone_number);
CREATE INDEX IF NOT EXISTS idx_litigators_risk ON public.litigators(risk_level);

-- DNC update log indexes
CREATE INDEX IF NOT EXISTS idx_dnc_log_area ON public.dnc_update_log(area_code);
CREATE INDEX IF NOT EXISTS idx_dnc_log_status ON public.dnc_update_log(status);
SELECT public.create_index_if_column_exists('idx_dnc_log_created', 'dnc_update_log', 'created_at', true);

-- FTC subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_ftc_sub_area ON public.ftc_subscriptions(area_code);
CREATE INDEX IF NOT EXISTS idx_ftc_sub_status ON public.ftc_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_ftc_sub_expires ON public.ftc_subscriptions(expires_at);

-- Upload history indexes
CREATE INDEX IF NOT EXISTS idx_uploads_user ON public.upload_history(user_id);
SELECT public.create_index_if_column_exists('idx_uploads_created', 'upload_history', 'created_at', true);
CREATE INDEX IF NOT EXISTS idx_uploads_status ON public.upload_history(status);
CREATE INDEX IF NOT EXISTS idx_uploads_expires ON public.upload_history(expires_at);

-- CRM leads indexes
SELECT public.create_index_if_column_exists('idx_leads_user', 'crm_leads', 'user_id', false);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.crm_leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.crm_leads(status);
SELECT public.create_index_if_column_exists('idx_leads_created', 'crm_leads', 'created_at', true);
CREATE INDEX IF NOT EXISTS idx_leads_risk ON public.crm_leads(risk_score);
CREATE INDEX IF NOT EXISTS idx_leads_upload_job ON public.crm_leads(upload_job_id);

-- CRM integrations indexes
CREATE INDEX IF NOT EXISTS idx_integrations_user ON public.crm_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON public.crm_integrations(crm_type);

-- CRM integration logs indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration ON public.crm_integration_logs(integration_id);
SELECT public.create_index_if_column_exists('idx_sync_logs_created', 'crm_integration_logs', 'started_at', true);
CREATE INDEX IF NOT EXISTS idx_sync_logs_expires ON public.crm_integration_logs(expires_at);

-- Area code requests indexes
CREATE INDEX IF NOT EXISTS idx_expansion_user ON public.area_code_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_expansion_status ON public.area_code_requests(status);
CREATE INDEX IF NOT EXISTS idx_expansion_area ON public.area_code_requests(area_code);

-- Area code subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_ac_sub_user ON public.area_code_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_ac_sub_area ON public.area_code_subscriptions(area_code);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_usage_user ON public.usage_logs(user_id);
SELECT public.create_index_if_column_exists('idx_usage_timestamp', 'usage_logs', 'timestamp', true);
CREATE INDEX IF NOT EXISTS idx_usage_expires ON public.usage_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_usage_action ON public.usage_logs(action);

-- Analytics events indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
SELECT public.create_index_if_column_exists('idx_analytics_created', 'analytics_events', 'created_at', true);

-- Error logs indexes
CREATE INDEX IF NOT EXISTS idx_error_type ON public.error_logs(error_type);
SELECT public.create_index_if_column_exists('idx_error_created', 'error_logs', 'created_at', true);
CREATE INDEX IF NOT EXISTS idx_error_expires ON public.error_logs(expires_at);

-- Admin uploads indexes
CREATE INDEX IF NOT EXISTS idx_admin_uploads_status ON public.admin_uploads(status);
SELECT public.create_index_if_column_exists('idx_admin_uploads_created', 'admin_uploads', 'created_at', true);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe ON public.payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Deletion logs indexes
CREATE INDEX IF NOT EXISTS idx_deletion_logs_user ON public.deletion_logs(user_id);

-- FTC change lists indexes
CREATE INDEX IF NOT EXISTS idx_ftc_change_lists_status ON public.ftc_change_lists(status);
CREATE INDEX IF NOT EXISTS idx_ftc_change_lists_date ON public.ftc_change_lists(ftc_file_date);

-- Compliance audit logs indexes
CREATE INDEX IF NOT EXISTS idx_compliance_user ON public.compliance_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_upload ON public.compliance_audit_logs(upload_job_id);
CREATE INDEX IF NOT EXISTS idx_compliance_phone ON public.compliance_audit_logs(phone_number);
SELECT public.create_index_if_column_exists('idx_compliance_created', 'compliance_audit_logs', 'created_at', true);
CREATE INDEX IF NOT EXISTS idx_compliance_retention ON public.compliance_audit_logs(retention_until);

-- ============================================
-- 26. PRIVACY FUNCTIONS
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
  SELECT public.check_dnc(phone_num) INTO is_dnc;
  IF is_dnc THEN
    score := score + 60;
  END IF;

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
  SELECT COUNT(*) INTO lead_count FROM public.crm_leads WHERE user_id = target_user_id;

  INSERT INTO public.deletion_logs (user_id, deletion_type, items_deleted, reason)
  VALUES (target_user_id, 'all_data', lead_count, 'User requested complete data deletion');

  DELETE FROM public.crm_leads WHERE user_id = target_user_id;
  DELETE FROM public.upload_history WHERE user_id = target_user_id;
  DELETE FROM public.crm_integrations WHERE user_id = target_user_id;
  DELETE FROM public.usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.area_code_requests WHERE requested_by = target_user_id;

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
  DELETE FROM public.dnc_deleted_numbers WHERE delete_after < NOW();
  DELETE FROM public.upload_history WHERE expires_at < NOW();
  DELETE FROM public.crm_integration_logs WHERE expires_at < NOW();
  DELETE FROM public.usage_logs WHERE expires_at < NOW();
  DELETE FROM public.error_logs WHERE expires_at < NOW();
  DELETE FROM public.deletion_logs WHERE recoverable_until < NOW() AND NOT recovered;
  DELETE FROM public.compliance_audit_logs WHERE retention_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIAL ABUSE PREVENTION FUNCTIONS
-- 7-day trial with 1000 leads / 5 uploads limit
-- ============================================

-- Check trial status and return detailed info
CREATE OR REPLACE FUNCTION public.get_trial_status(p_user_id UUID)
RETURNS TABLE(
  is_on_trial BOOLEAN,
  is_trial_active BOOLEAN,
  trial_expired BOOLEAN,
  leads_limit_reached BOOLEAN,
  uploads_limit_reached BOOLEAN,
  trial_leads_used INTEGER,
  trial_leads_remaining INTEGER,
  trial_uploads_count INTEGER,
  trial_uploads_remaining INTEGER,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  days_remaining INTEGER,
  subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_is_on_trial BOOLEAN;
  v_is_trial_active BOOLEAN;
  v_trial_expired BOOLEAN;
  v_leads_limit_reached BOOLEAN;
  v_uploads_limit_reached BOOLEAN;
  v_leads_remaining INTEGER;
  v_uploads_remaining INTEGER;
  v_days_remaining INTEGER;
BEGIN
  -- Constants for trial limits
  -- 1000 leads total OR 5 uploads (whichever comes first)

  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

  IF v_user IS NULL THEN
    RETURN;
  END IF;

  -- Check if user is on trial
  v_is_on_trial := v_user.subscription_status = 'trialing';

  -- Check if trial has expired (time-based)
  v_trial_expired := v_user.trial_ends_at <= NOW();

  -- Check if leads limit reached (1000 leads)
  v_leads_limit_reached := COALESCE(v_user.trial_leads_used, 0) >= 1000;

  -- Check if uploads limit reached (5 uploads)
  v_uploads_limit_reached := COALESCE(v_user.trial_uploads_count, 0) >= 5;

  -- Trial is active only if on trial AND not expired AND within limits
  v_is_trial_active := v_is_on_trial
    AND NOT v_trial_expired
    AND NOT v_leads_limit_reached
    AND NOT v_uploads_limit_reached;

  -- Calculate remaining
  v_leads_remaining := GREATEST(0, 1000 - COALESCE(v_user.trial_leads_used, 0));
  v_uploads_remaining := GREATEST(0, 5 - COALESCE(v_user.trial_uploads_count, 0));
  v_days_remaining := GREATEST(0, EXTRACT(DAY FROM (v_user.trial_ends_at - NOW()))::INTEGER);

  RETURN QUERY SELECT
    v_is_on_trial,
    v_is_trial_active,
    v_trial_expired,
    v_leads_limit_reached,
    v_uploads_limit_reached,
    COALESCE(v_user.trial_leads_used, 0),
    v_leads_remaining,
    COALESCE(v_user.trial_uploads_count, 0),
    v_uploads_remaining,
    v_user.trial_started_at,
    v_user.trial_ends_at,
    v_days_remaining,
    v_user.subscription_status;
END;
$$;

-- Check if user can upload (returns false if trial limits exceeded)
CREATE OR REPLACE FUNCTION public.can_user_upload(p_user_id UUID, p_lead_count INTEGER)
RETURNS TABLE(
  can_upload BOOLEAN,
  reason TEXT,
  leads_would_use INTEGER,
  leads_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_can_upload BOOLEAN;
  v_reason TEXT;
  v_leads_remaining INTEGER;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

  IF v_user IS NULL THEN
    RETURN QUERY SELECT FALSE, 'User not found'::TEXT, 0, 0;
    RETURN;
  END IF;

  -- If user is not on trial (active subscriber), always allow
  IF v_user.subscription_status = 'active' THEN
    RETURN QUERY SELECT TRUE, 'Active subscription'::TEXT, p_lead_count, 999999;
    RETURN;
  END IF;

  -- If user is not on trial at all (canceled, past_due, etc.), deny
  IF v_user.subscription_status != 'trialing' THEN
    RETURN QUERY SELECT FALSE, 'Subscription required'::TEXT, p_lead_count, 0;
    RETURN;
  END IF;

  -- Check trial time limit (7 days)
  IF v_user.trial_ends_at <= NOW() THEN
    RETURN QUERY SELECT FALSE, 'Trial period has expired. Subscribe to continue.'::TEXT, p_lead_count, 0;
    RETURN;
  END IF;

  -- Check uploads limit (5 uploads)
  IF COALESCE(v_user.trial_uploads_count, 0) >= 5 THEN
    RETURN QUERY SELECT FALSE, 'Trial upload limit reached (5 uploads). Subscribe to continue.'::TEXT, p_lead_count, 0;
    RETURN;
  END IF;

  -- Calculate leads remaining
  v_leads_remaining := 1000 - COALESCE(v_user.trial_leads_used, 0);

  -- Check leads limit (1000 leads total)
  IF v_leads_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 'Trial lead limit reached (1,000 leads). Subscribe to continue.'::TEXT, p_lead_count, 0;
    RETURN;
  END IF;

  -- Check if this upload would exceed the leads limit
  IF p_lead_count > v_leads_remaining THEN
    RETURN QUERY SELECT
      FALSE,
      format('This upload has %s leads but you only have %s trial leads remaining. Subscribe for unlimited uploads.', p_lead_count, v_leads_remaining)::TEXT,
      p_lead_count,
      v_leads_remaining;
    RETURN;
  END IF;

  -- All checks passed
  RETURN QUERY SELECT TRUE, 'OK'::TEXT, p_lead_count, v_leads_remaining;
END;
$$;

-- Increment trial usage after successful upload
CREATE OR REPLACE FUNCTION public.increment_trial_usage(
  p_user_id UUID,
  p_leads_processed INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE id = p_user_id;

  IF v_user IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Only increment for trialing users
  IF v_user.subscription_status != 'trialing' THEN
    RETURN TRUE; -- Active subscribers don't track trial usage
  END IF;

  -- Increment both counters
  UPDATE public.users
  SET
    trial_leads_used = COALESCE(trial_leads_used, 0) + p_leads_processed,
    trial_uploads_count = COALESCE(trial_uploads_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers (only if updated_at column exists)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_leads_updated_at ON public.crm_leads;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_leads' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_integrations_updated_at ON public.crm_integrations;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'crm_integrations' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON public.crm_integrations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS update_dnc_registry_updated_at ON public.dnc_registry;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'dnc_registry' AND column_name = 'updated_at') THEN
    CREATE TRIGGER update_dnc_registry_updated_at BEFORE UPDATE ON public.dnc_registry FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Grant permissions to functions
GRANT EXECUTE ON FUNCTION public.check_dnc(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_check_dnc(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_risk_score(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_area_codes(UUID) TO authenticated;
-- Trial abuse prevention functions
GRANT EXECUTE ON FUNCTION public.get_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_upload(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_trial_usage(UUID, INTEGER) TO authenticated, service_role;

-- ============================================
-- 27. ROW LEVEL SECURITY (RLS)
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

-- ============================================
-- USERS POLICIES
-- ============================================
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
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
CREATE POLICY "Service role full access to users"
  ON public.users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- UPLOAD HISTORY POLICIES
-- ============================================
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

DROP POLICY IF EXISTS "Users can delete own uploads" ON public.upload_history;
CREATE POLICY "Users can delete own uploads"
  ON public.upload_history FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to upload_history" ON public.upload_history;
CREATE POLICY "Service role full access to upload_history"
  ON public.upload_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CRM LEADS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own leads" ON public.crm_leads;
CREATE POLICY "Users can view own leads"
  ON public.crm_leads FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own leads" ON public.crm_leads;
CREATE POLICY "Users can manage own leads"
  ON public.crm_leads FOR ALL
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to crm_leads" ON public.crm_leads;
CREATE POLICY "Service role full access to crm_leads"
  ON public.crm_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- CRM INTEGRATIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can manage own integrations" ON public.crm_integrations;
CREATE POLICY "Users can manage own integrations"
  ON public.crm_integrations FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- CRM SYNC LOGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own sync logs" ON public.crm_integration_logs;
CREATE POLICY "Users can view own sync logs"
  ON public.crm_integration_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- AREA CODE REQUESTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can manage own requests" ON public.area_code_requests;
CREATE POLICY "Users can manage own requests"
  ON public.area_code_requests FOR ALL
  USING (requested_by = auth.uid());

-- ============================================
-- AREA CODE SUBSCRIPTIONS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can manage own subscriptions" ON public.area_code_subscriptions;
CREATE POLICY "Users can manage own subscriptions"
  ON public.area_code_subscriptions FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- USAGE LOGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_logs;
CREATE POLICY "Users can view own usage"
  ON public.usage_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create usage logs" ON public.usage_logs;
CREATE POLICY "Users can create usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to usage_logs" ON public.usage_logs;
CREATE POLICY "Service role full access to usage_logs"
  ON public.usage_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- DELETION LOGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own deletions" ON public.deletion_logs;
CREATE POLICY "Users can view own deletions"
  ON public.deletion_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- DNC REGISTRY POLICIES
-- ============================================
DROP POLICY IF EXISTS "DNC registry is publicly readable" ON public.dnc_registry;
CREATE POLICY "DNC registry is publicly readable"
  ON public.dnc_registry FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage DNC registry" ON public.dnc_registry;
CREATE POLICY "Admins can manage DNC registry"
  ON public.dnc_registry FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

DROP POLICY IF EXISTS "Service role full access to dnc_registry" ON public.dnc_registry;
CREATE POLICY "Service role full access to dnc_registry"
  ON public.dnc_registry FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- DNC DELETED NUMBERS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Deleted numbers are publicly readable" ON public.dnc_deleted_numbers;
CREATE POLICY "Deleted numbers are publicly readable"
  ON public.dnc_deleted_numbers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage deleted numbers" ON public.dnc_deleted_numbers;
CREATE POLICY "Admins can manage deleted numbers"
  ON public.dnc_deleted_numbers FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

DROP POLICY IF EXISTS "Service role full access to dnc_deleted_numbers" ON public.dnc_deleted_numbers;
CREATE POLICY "Service role full access to dnc_deleted_numbers"
  ON public.dnc_deleted_numbers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- LITIGATORS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Litigators table is publicly readable" ON public.litigators;
CREATE POLICY "Litigators table is publicly readable"
  ON public.litigators FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage litigators" ON public.litigators;
CREATE POLICY "Admins can manage litigators"
  ON public.litigators FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true));

DROP POLICY IF EXISTS "Service role full access to litigators" ON public.litigators;
CREATE POLICY "Service role full access to litigators"
  ON public.litigators FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to payments" ON public.payments;
CREATE POLICY "Service role full access to payments"
  ON public.payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- ANALYTICS EVENTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
CREATE POLICY "Users can create analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_events;
CREATE POLICY "Users can view own analytics"
  ON public.analytics_events FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to analytics_events" ON public.analytics_events;
CREATE POLICY "Service role full access to analytics_events"
  ON public.analytics_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- COMPLIANCE AUDIT LOGS POLICIES
-- ============================================
DROP POLICY IF EXISTS "Users can view own compliance logs" ON public.compliance_audit_logs;
CREATE POLICY "Users can view own compliance logs"
  ON public.compliance_audit_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access to compliance_audit_logs" ON public.compliance_audit_logs;
CREATE POLICY "Service role full access to compliance_audit_logs"
  ON public.compliance_audit_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 28. GRANTS FOR AUTHENTICATED USERS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.upload_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_integrations TO authenticated;
GRANT SELECT ON public.crm_integration_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.area_code_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.area_code_subscriptions TO authenticated;
GRANT SELECT, INSERT ON public.usage_logs TO authenticated;
GRANT SELECT ON public.deletion_logs TO authenticated;
GRANT SELECT ON public.dnc_registry TO authenticated;
GRANT SELECT ON public.dnc_deleted_numbers TO authenticated;
GRANT SELECT ON public.litigators TO authenticated;
GRANT SELECT ON public.payments TO authenticated;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT SELECT ON public.compliance_audit_logs TO authenticated;

-- ============================================
-- 29. GRANTS FOR SERVICE ROLE (Full access)
-- ============================================
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.upload_history TO service_role;
GRANT ALL ON public.crm_leads TO service_role;
GRANT ALL ON public.crm_integrations TO service_role;
GRANT ALL ON public.crm_integration_logs TO service_role;
GRANT ALL ON public.area_code_requests TO service_role;
GRANT ALL ON public.area_code_subscriptions TO service_role;
GRANT ALL ON public.usage_logs TO service_role;
GRANT ALL ON public.deletion_logs TO service_role;
GRANT ALL ON public.dnc_registry TO service_role;
GRANT ALL ON public.dnc_deleted_numbers TO service_role;
GRANT ALL ON public.litigators TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.analytics_events TO service_role;
GRANT ALL ON public.compliance_audit_logs TO service_role;
GRANT ALL ON public.error_logs TO service_role;
GRANT ALL ON public.admin_uploads TO service_role;
GRANT ALL ON public.ftc_subscriptions TO service_role;
GRANT ALL ON public.dnc_update_log TO service_role;
GRANT ALL ON public.ftc_change_lists TO service_role;

-- ============================================
-- 30. STORAGE BUCKETS
-- ============================================

DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES
    ('uploads', 'uploads', false),
    ('results', 'results', false),
    ('admin-uploads', 'admin-uploads', false)
  ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN undefined_table THEN
  -- storage.buckets might not exist in some Supabase setups
  NULL;
END $$;

-- Storage policies (wrapped in exception handlers)
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;
  CREATE POLICY "Users can upload files"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'uploads'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can access own files" ON storage.objects;
  CREATE POLICY "Users can access own files"
    ON storage.objects FOR SELECT
    USING (
      bucket_id IN ('uploads', 'results')
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
  CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
      bucket_id IN ('uploads', 'results')
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can manage admin uploads" ON storage.objects;
  CREATE POLICY "Admins can manage admin uploads"
    ON storage.objects FOR ALL
    USING (
      bucket_id = 'admin-uploads'
      AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.is_admin = true)
    );
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Service role full access to storage" ON storage.objects;
  CREATE POLICY "Service role full access to storage"
    ON storage.objects FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================
-- DEPLOYMENT COMPLETE - VERSION 1.7
-- ============================================
-- This script is IDEMPOTENT - safe to re-run on existing databases.
--
-- Changes in v1.7:
-- - Added trial abuse prevention with usage limits:
--   * 7-day trial period (changed from 14 days)
--   * 1,000 leads total limit during trial
--   * 5 uploads limit during trial
--   * Either limit triggers subscription requirement
-- - Added trial tracking columns to users table:
--   * trial_started_at, trial_leads_used, trial_uploads_count
-- - Added trial checking functions:
--   * get_trial_status() - returns detailed trial info
--   * can_user_upload() - checks if upload is allowed
--   * increment_trial_usage() - updates usage counters
-- - Updated handle_new_user trigger to initialize trial fields
--
-- Changes in v1.6:
-- - Added defensive column additions BEFORE index creation
-- - Added create_index_if_column_exists() helper function
-- - Fixed admin policy subqueries to avoid recursion
-- - Wrapped storage operations in exception handlers
-- - Removed constraint CHECK for ftc_change_lists (added separately)
--
-- To check schema version:
--   SELECT * FROM public.schema_versions ORDER BY applied_at DESC;
-- ============================================
