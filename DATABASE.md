# ECHO MIND COMPLIANCE - DATABASE SCHEMA
**Version:** 2.0 | **Date:** January 21, 2026 | **Privacy-First Edition + TCPA Compliance**

> **DEPLOYMENT:** See `supabase/PRODUCTION_DEPLOY.sql` for the complete, copy-paste ready SQL script.

---

## DATABASE PHILOSOPHY

**Privacy-First Principles:**
1. Store ONLY what's necessary for service delivery
2. No user behavior profiling or pattern tracking
3. User controls ALL data deletion
4. Minimal retention periods
5. No cross-user analytics capabilities

**Anti-Patterns (What We DON'T Build):**
- Historical trend tables
- User behavior analytics
- Cross-user comparison data
- Conversion tracking tables
- Performance prediction models

---

## TABLE NAMING CONVENTIONS

| Table | Purpose |
|-------|---------|
| `users` | User profiles synced with Supabase Auth |
| `upload_history` | Upload job records and results |
| `crm_leads` | User's private CRM lead data |
| `crm_integrations` | Third-party CRM connections |
| `crm_integration_logs` | CRM sync history (30-day retention) |
| `dnc_registry` | Federal DNC phone numbers |
| `dnc_deleted_numbers` | Recently removed DNC (90-day retention) |
| `litigators` | Known TCPA litigators |
| `compliance_audit_logs` | TCPA compliance audit (5-year retention) |

---

## COMPLETE SUPABASE SCHEMA

```sql
-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search only

-- ============================================
-- USERS TABLE (Synced with Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone_number TEXT,
  avatar_url TEXT,

  -- Industry (for AI insights, NOT for profiling)
  industry TEXT NOT NULL DEFAULT 'real-estate-residential',
  industry_custom TEXT, -- If they selected "Other"

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

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_industry ON users(industry); -- For aggregate stats only

-- Trigger to create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
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
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DNC REGISTRY TABLE (Public Data)
-- ============================================
CREATE TABLE dnc_registry (
  phone_number TEXT PRIMARY KEY,
  area_code TEXT NOT NULL,
  state TEXT,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'ftc', -- 'ftc', 'state', 'manual'
  
  -- Metadata
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_dnc_area_code ON dnc_registry(area_code);
CREATE INDEX idx_dnc_state ON dnc_registry(state);
CREATE INDEX idx_dnc_date_added ON dnc_registry(date_added DESC);
CREATE INDEX idx_dnc_active ON dnc_registry(is_active) WHERE is_active = TRUE;

-- ============================================
-- DNC DELETED NUMBERS (90-Day Tracking)
-- ============================================
-- Numbers removed from DNC registry
-- Tracked for 90 days to detect patterns
CREATE TABLE dnc_deleted_numbers (
  phone_number TEXT PRIMARY KEY,
  area_code TEXT NOT NULL,
  
  -- Tracking (public data only)
  original_add_date TIMESTAMPTZ,
  deletion_date TIMESTAMPTZ DEFAULT NOW(),
  times_added_removed INTEGER DEFAULT 1, -- Pattern detection
  
  -- Auto-cleanup after 90 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  
  -- Source
  source TEXT DEFAULT 'ftc'
);

CREATE INDEX idx_deleted_area_code ON dnc_deleted_numbers(area_code);
CREATE INDEX idx_deleted_expires ON dnc_deleted_numbers(expires_at);
CREATE INDEX idx_deleted_pattern ON dnc_deleted_numbers(times_added_removed) WHERE times_added_removed > 1;

-- Auto-cleanup expired deleted numbers
CREATE OR REPLACE FUNCTION cleanup_expired_deleted_numbers()
RETURNS void AS $$
BEGIN
  DELETE FROM dnc_deleted_numbers
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- LITIGATOR DATABASE (Public Court Records)
-- ============================================
-- PACER data (public information)
CREATE TABLE litigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  case_count INTEGER DEFAULT 1,
  last_case_date DATE,
  risk_level TEXT DEFAULT 'high', -- 'high', 'extreme'
  notes TEXT,
  source TEXT DEFAULT 'pacer', -- 'pacer', 'ftc', 'manual'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_litigators_phone ON litigators(phone_number);
CREATE INDEX idx_litigators_risk ON litigators(risk_level);

-- ============================================
-- UPLOAD HISTORY TABLE (Service Delivery)
-- ============================================
-- Stores upload metadata, NOT lead content
CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Job info
  filename TEXT NOT NULL,
  file_size INTEGER,
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'

  -- Results (counts only, no lead data)
  total_leads INTEGER DEFAULT 0,
  processed_leads INTEGER,
  clean_leads INTEGER DEFAULT 0,
  dnc_blocked INTEGER DEFAULT 0,
  caution_leads INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,

  -- Scoring
  average_risk_score DECIMAL(5,2),
  compliance_rate DECIMAL(5,2),

  -- File storage (temporary - auto-deleted after 30 days)
  clean_file_url TEXT,
  full_report_url TEXT,
  risky_file_url TEXT,

  -- Processing
  processing_time_ms INTEGER,
  n8n_job_id TEXT,
  error_message TEXT,
  source TEXT,
  area_codes_used TEXT[],

  -- AI insights (stored ONLY for display, not analysis)
  ai_insights JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Auto-cleanup after 30 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_uploads_user ON upload_history(user_id);
CREATE INDEX idx_uploads_created ON upload_history(created_at DESC);
CREATE INDEX idx_uploads_status ON upload_history(status);
CREATE INDEX idx_uploads_expires ON upload_history(expires_at);

-- ============================================
-- CRM LEADS TABLE (User's Private CRM Data)
-- ============================================
-- User's private lead storage
-- User controls ALL data and deletion
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES upload_history(id) ON DELETE SET NULL,

  -- Lead data (user's private information)
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  source TEXT, -- User-defined source tracking

  -- Compliance (snapshot at time of scrub)
  dnc_status BOOLEAN DEFAULT FALSE,
  risk_score INTEGER DEFAULT 0,
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  last_scrubbed_at TIMESTAMPTZ DEFAULT NOW(),

  -- CRM fields (user-controlled)
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost', 'archived'
  tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- User-defined tags
  notes TEXT, -- Private notes
  assigned_to TEXT,

  -- Activity
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,

  -- Custom fields
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- External CRM IDs (for sync purposes only)
  external_crm_ids JSONB DEFAULT '{}'::jsonb, -- {followupboss: "123", lofty: "456"}

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete (30-day recovery)
  deleted_at TIMESTAMPTZ,

  -- Unique constraint per user
  CONSTRAINT crm_leads_user_phone_unique UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_leads_user ON crm_leads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_phone ON crm_leads(phone_number);
CREATE INDEX idx_leads_status ON crm_leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_tags ON crm_leads USING GIN(tags);
CREATE INDEX idx_leads_created ON crm_leads(created_at DESC);
CREATE INDEX idx_leads_deleted ON crm_leads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_leads_risk ON crm_leads(risk_score);

-- Full-text search (user's own leads only)
CREATE INDEX idx_leads_search ON crm_leads USING GIN(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '')
  )
);

-- ============================================
-- CRM INTEGRATIONS (User's Private Connections)
-- ============================================
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Integration details
  crm_provider TEXT NOT NULL, -- 'followupboss', 'lofty', 'zapier'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- OAuth tokens (encrypted at app level)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- API keys (encrypted at app level)
  api_key TEXT,
  api_secret TEXT,
  
  -- Configuration (user-defined field mappings)
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Sync settings
  sync_mode TEXT DEFAULT 'realtime', -- 'realtime', 'manual', 'off'
  sync_frequency TEXT DEFAULT 'immediate',
  last_sync_at TIMESTAMPTZ,
  
  -- Status
  sync_status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Stats (for user visibility only, not analytics)
  total_synced INTEGER DEFAULT 0,
  last_sync_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, crm_provider)
);

CREATE INDEX idx_integrations_user ON crm_integrations(user_id);
CREATE INDEX idx_integrations_active ON crm_integrations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_integrations_provider ON crm_integrations(crm_provider);

-- ============================================
-- CRM SYNC LOGS (30-Day Retention for Debugging)
-- ============================================
-- NOT used for analytics, only debugging
CREATE TABLE crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Sync details
  sync_direction TEXT DEFAULT 'outbound', -- 'outbound', 'inbound'
  status TEXT, -- 'success', 'failed', 'skipped'
  error_message TEXT,
  
  -- Data (for debugging only, not analysis)
  payload JSONB,
  response JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  
  -- Auto-cleanup after 30 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_sync_logs_integration ON crm_sync_logs(integration_id);
CREATE INDEX idx_sync_logs_created ON crm_sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_status ON crm_sync_logs(status);
CREATE INDEX idx_sync_logs_expires ON crm_sync_logs(expires_at);

-- Auto-cleanup old sync logs
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM crm_sync_logs
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- AREA CODE EXPANSION REQUESTS
-- ============================================
CREATE TABLE expansion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request details
  requested_area_codes TEXT[] NOT NULL,
  state TEXT,
  reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'completed', 'cancelled'
  
  -- Pricing
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  paid_at TIMESTAMPTZ,
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_expansion_user ON expansion_requests(user_id);
CREATE INDEX idx_expansion_status ON expansion_requests(status);

-- ============================================
-- USAGE LOGS (Minimal, Abuse Prevention Only)
-- ============================================
-- ONLY for fair-use enforcement and abuse detection
-- NO detailed tracking or profiling
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Minimal tracking
  action TEXT, -- 'upload', 'download', 'delete_data'
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- NO lead details
  -- NO file contents
  -- NO user behavior patterns
  -- ONLY count for abuse detection
  
  -- Auto-cleanup after 90 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days')
);

CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_timestamp ON usage_logs(timestamp DESC);
CREATE INDEX idx_usage_expires ON usage_logs(expires_at);
CREATE INDEX idx_usage_action ON usage_logs(action);

-- Auto-cleanup old usage logs
CREATE OR REPLACE FUNCTION cleanup_old_usage_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM usage_logs
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ERROR LOGS (Technical Only, No PII)
-- ============================================
-- For debugging and service improvement
-- NO user identification, NO personal data
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error details (NO PII)
  error_type TEXT, -- 'dnc_check_failed', 'api_timeout', etc
  error_message TEXT,
  stack_trace TEXT,
  
  -- Context (technical only)
  endpoint TEXT,
  http_status INTEGER,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auto-cleanup after 30 days
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- NO user_id
  -- NO identifying information
  -- ONLY technical debugging data
);

CREATE INDEX idx_error_type ON error_logs(error_type);
CREATE INDEX idx_error_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_expires ON error_logs(expires_at);

-- Auto-cleanup old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM error_logs
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADMIN UPLOADS (FTC Data Management)
-- ============================================
CREATE TABLE admin_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id),
  
  -- Upload info
  upload_type TEXT, -- 'additions', 'deletions'
  area_codes TEXT[] NOT NULL,
  total_files INTEGER,
  total_records INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  progress JSONB DEFAULT '{}'::jsonb, -- {801: 45, 385: 78, ...}
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_uploads_status ON admin_uploads(status);
CREATE INDEX idx_admin_uploads_created ON admin_uploads(created_at DESC);
CREATE INDEX idx_admin_uploads_type ON admin_uploads(upload_type);

-- ============================================
-- DELETION LOGS (Compliance & Recovery)
-- ============================================
-- Audit trail for data deletions
-- 30-day recovery period
CREATE TABLE deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Deletion details
  deletion_type TEXT, -- 'single_lead', 'bulk_leads', 'all_data'
  items_deleted INTEGER,
  reason TEXT, -- User-provided reason (optional)
  
  -- Data snapshot (for recovery, encrypted)
  data_snapshot JSONB,
  
  -- Recovery
  recoverable_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deletion_logs_user ON deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_recoverable ON deletion_logs(recoverable_until) WHERE NOT recovered;
CREATE INDEX idx_deletion_logs_created ON deletion_logs(created_at DESC);

-- ============================================
-- COMPLIANCE AUDIT LOGS (TCPA 5-Year Retention)
-- ============================================
-- Federal compliance audit trail per TCPA 47 CFR § 64.1200
-- Records ALL DNC checks for 5 years
-- Supports user data deletion while preserving anonymized records
CREATE TABLE compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Compliance fields (5-year retention)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Nullable for anonymization
  user_email TEXT, -- Cached for compliance (survives user deletion)
  company_name TEXT, -- Cached company name

  -- Check details
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  dnc_status TEXT NOT NULL, -- 'clean', 'blocked', 'caution'
  risk_score INTEGER,

  -- Purpose & context
  check_purpose TEXT NOT NULL, -- 'lead_scrubbing', 'compliance_verification'
  industry TEXT, -- Cached industry (real-estate, solar, etc.)
  upload_job_id UUID REFERENCES upload_jobs(id) ON DELETE SET NULL,

  -- Timestamp (critical for 5-year retention)
  checked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Result data (compliance evidence)
  result_data JSONB DEFAULT '{}'::jsonb, -- risk_flags, warnings, etc.

  -- Retention metadata
  retention_until DATE NOT NULL, -- checked_at + 5 years
  is_anonymized BOOLEAN DEFAULT FALSE,

  -- Source tracking
  source TEXT DEFAULT 'web', -- 'web', 'api', 'google-sheets'
  ip_address INET, -- For fraud prevention
  user_agent TEXT
);

-- Indexes for compliance queries
CREATE INDEX idx_audit_phone ON compliance_audit_logs(phone_number);
CREATE INDEX idx_audit_user ON compliance_audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_checked_at ON compliance_audit_logs(checked_at DESC);
CREATE INDEX idx_audit_retention ON compliance_audit_logs(retention_until) WHERE NOT is_anonymized;
CREATE INDEX idx_audit_year ON compliance_audit_logs(EXTRACT(YEAR FROM checked_at));
CREATE INDEX idx_audit_dnc_status ON compliance_audit_logs(dnc_status);
CREATE INDEX idx_audit_upload_job ON compliance_audit_logs(upload_job_id) WHERE upload_job_id IS NOT NULL;

-- RLS: Users can view their own audit logs, admins can view all
ALTER TABLE compliance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON compliance_audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR (SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON compliance_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Any authenticated user can create logs

-- Function to anonymize logs when user deletes data
CREATE OR REPLACE FUNCTION anonymize_compliance_logs(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE compliance_audit_logs
  SET
    user_id = NULL, -- Detach from user account
    user_email = 'deleted-user-' || SUBSTRING(MD5(user_email) FROM 1 FOR 8) || '@anonymized.local',
    company_name = 'Deleted Account',
    ip_address = NULL,
    user_agent = NULL,
    is_anonymized = TRUE
  WHERE user_id = target_user_id
    AND NOT is_anonymized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Monthly purge of logs after 5-year retention (run via Supabase cron)
CREATE OR REPLACE FUNCTION purge_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM compliance_audit_logs
  WHERE retention_until < CURRENT_DATE;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to insert compliance log
CREATE OR REPLACE FUNCTION log_compliance_check(
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
  INSERT INTO compliance_audit_logs (
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
-- SCHEDULED CLEANUP JOBS
-- ============================================
-- Run daily to cleanup expired data
-- Ensures privacy commitments are enforced

-- Daily cleanup job (run via pg_cron or external scheduler)
CREATE OR REPLACE FUNCTION daily_privacy_cleanup()
RETURNS void AS $$
BEGIN
  -- Cleanup deleted numbers (90 days)
  PERFORM cleanup_expired_deleted_numbers();
  
  -- Cleanup old uploads (30 days)
  PERFORM cleanup_old_uploads();
  
  -- Cleanup old sync logs (30 days)
  PERFORM cleanup_old_sync_logs();
  
  -- Cleanup old usage logs (90 days)
  PERFORM cleanup_old_usage_logs();
  
  -- Cleanup old error logs (30 days)
  PERFORM cleanup_old_error_logs();
  
  -- Cleanup expired deletion logs (30 days)
  DELETE FROM deletion_logs
  WHERE recoverable_until < NOW()
    AND NOT recovered;
    
  -- Cleanup cancelled user data (60 days grace)
  DELETE FROM leads
  WHERE user_id IN (
    SELECT id FROM users 
    WHERE subscription_status = 'cancelled'
    AND updated_at < NOW() - INTERVAL '60 days'
  );
  
  RAISE NOTICE 'Privacy cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PRIVACY FUNCTIONS
-- ============================================

-- Check if phone number is on DNC (public data)
CREATE OR REPLACE FUNCTION check_dnc(phone_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM dnc_registry 
    WHERE phone_number = phone_num 
    AND is_active = TRUE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_dnc(TEXT) TO anon, authenticated;

-- Get risk score for phone number (public data only)
CREATE OR REPLACE FUNCTION get_risk_score(phone_num TEXT)
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
  is_dnc := check_dnc(phone_num);
  IF is_dnc THEN
    score := score + 60;
  END IF;
  
  -- Check deleted numbers (20 points base + pattern)
  SELECT EXISTS(
    SELECT 1 FROM dnc_deleted_numbers 
    WHERE phone_number = phone_num
  ), COALESCE(MAX(times_added_removed), 0)
  INTO is_deleted, delete_count
  FROM dnc_deleted_numbers
  WHERE phone_number = phone_num;
  
  IF is_deleted THEN
    score := score + 20;
    IF delete_count > 1 THEN
      score := score + 15; -- Pattern of add/remove
    END IF;
  END IF;
  
  -- Check litigator database (25 points)
  SELECT EXISTS(
    SELECT 1 FROM litigators WHERE phone_number = phone_num
  ) INTO is_litigator;
  
  IF is_litigator THEN
    score := score + 25;
  END IF;
  
  RETURN score;
END;
$$;

GRANT EXECUTE ON FUNCTION get_risk_score(TEXT) TO authenticated;

-- User data deletion (complete removal)
CREATE OR REPLACE FUNCTION delete_all_user_data(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log deletion for compliance
  INSERT INTO deletion_logs (user_id, deletion_type, items_deleted, reason)
  VALUES (
    target_user_id, 
    'all_data',
    (SELECT COUNT(*) FROM leads WHERE user_id = target_user_id),
    'User requested complete data deletion'
  );
  
  -- Delete user's data in order (respecting foreign keys)
  DELETE FROM leads WHERE user_id = target_user_id;
  DELETE FROM upload_jobs WHERE user_id = target_user_id;
  DELETE FROM crm_integrations WHERE user_id = target_user_id;
  DELETE FROM usage_logs WHERE user_id = target_user_id;
  DELETE FROM expansion_requests WHERE user_id = target_user_id;
  
  -- Update user record (keep for subscription but mark deleted)
  UPDATE users
  SET 
    data_deleted_at = NOW(),
    total_leads_deleted = (SELECT COUNT(*) FROM leads WHERE user_id = target_user_id)
  WHERE id = target_user_id;
  
  RAISE NOTICE 'All data deleted for user %', target_user_id;
END;
$$;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expansion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Upload jobs policies
CREATE POLICY "Users can view own uploads"
  ON upload_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create uploads"
  ON upload_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Leads policies (user owns ALL their data)
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can manage own leads"
  ON leads FOR ALL
  USING (user_id = auth.uid());

-- CRM integrations policies
CREATE POLICY "Users can manage own integrations"
  ON crm_integrations FOR ALL
  USING (user_id = auth.uid());

-- CRM sync logs (read-only for users)
CREATE POLICY "Users can view own sync logs"
  ON crm_sync_logs FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM crm_integrations WHERE user_id = auth.uid()
    )
  );

-- Expansion requests policies
CREATE POLICY "Users can manage own requests"
  ON expansion_requests FOR ALL
  USING (user_id = auth.uid());

-- Usage logs (read-only for users)
CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- Deletion logs (read-only for users)
CREATE POLICY "Users can view own deletions"
  ON deletion_logs FOR SELECT
  USING (user_id = auth.uid());

-- DNC registry is publicly readable (public data)
ALTER TABLE dnc_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DNC registry is publicly readable"
  ON dnc_registry FOR SELECT
  TO authenticated
  USING (true);

-- Deleted numbers are publicly readable (public data)
ALTER TABLE dnc_deleted_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deleted numbers are publicly readable"
  ON dnc_deleted_numbers FOR SELECT
  TO authenticated
  USING (true);

-- Litigators table is publicly readable (public court data)
ALTER TABLE litigators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Litigators table is publicly readable"
  ON litigators FOR SELECT
  TO authenticated
  USING (true);

-- Admin-only policies
CREATE POLICY "Admins can manage DNC registry"
  ON dnc_registry FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage deleted numbers"
  ON dnc_deleted_numbers FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage litigators"
  ON litigators FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('uploads', 'uploads', false),
  ('results', 'results', false),
  ('admin-uploads', 'admin-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can access own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('uploads', 'results')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id IN ('uploads', 'results')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage admin uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'admin-uploads'
    AND (SELECT is_admin FROM users WHERE id = auth.uid())
  );

-- Storage lifecycle policies (set via Supabase dashboard)
-- uploads: Delete after 30 days
-- results: Delete after 30 days
-- admin-uploads: Keep indefinitely

-- ============================================
-- PRIVACY COMPLIANCE VIEWS
-- ============================================

-- Admin view: Aggregate usage stats (NO PII)
CREATE VIEW aggregate_usage_stats AS
SELECT 
  DATE_TRUNC('day', timestamp) as date,
  action,
  COUNT(*) as count
FROM usage_logs
GROUP BY DATE_TRUNC('day', timestamp), action
ORDER BY date DESC;

-- Admin view: Industry distribution (NO user identification)
CREATE VIEW industry_distribution AS
SELECT 
  industry,
  COUNT(*) as user_count,
  subscription_status,
  COUNT(*) as status_count
FROM users
GROUP BY industry, subscription_status
ORDER BY user_count DESC;

-- Admin view: Area code coverage (NO user identification)
CREATE VIEW area_code_coverage AS
SELECT 
  JSONB_ARRAY_ELEMENTS_TEXT(area_codes) as area_code,
  COUNT(*) as users_with_code
FROM users
GROUP BY area_code
ORDER BY users_with_code DESC;

-- Grant access to admins only
GRANT SELECT ON aggregate_usage_stats TO authenticated;
GRANT SELECT ON industry_distribution TO authenticated;
GRANT SELECT ON area_code_coverage TO authenticated;

CREATE POLICY "Only admins can view stats"
  ON aggregate_usage_stats FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Only admins can view industry stats"
  ON industry_distribution FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Only admins can view coverage stats"
  ON area_code_coverage FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- ============================================
-- MONITORING & ALERTS
-- ============================================

-- Function to check privacy compliance
CREATE OR REPLACE FUNCTION check_privacy_compliance()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Check 1: Old upload jobs cleaned up
  RETURN QUERY
  SELECT 
    'Old uploads cleanup'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Found ' || COUNT(*) || ' expired uploads not cleaned'
  FROM upload_jobs
  WHERE expires_at < NOW();
  
  -- Check 2: Old sync logs cleaned up
  RETURN QUERY
  SELECT 
    'Old sync logs cleanup'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Found ' || COUNT(*) || ' expired sync logs not cleaned'
  FROM crm_sync_logs
  WHERE expires_at < NOW();
  
  -- Check 3: Cancelled user data cleaned up
  RETURN QUERY
  SELECT 
    'Cancelled user cleanup'::TEXT,
    CASE 
      WHEN COUNT(*) = 0 THEN 'PASS'::TEXT
      ELSE 'FAIL'::TEXT
    END,
    'Found ' || COUNT(*) || ' cancelled users with old data'
  FROM users u
  JOIN leads l ON l.user_id = u.id
  WHERE u.subscription_status = 'cancelled'
    AND u.updated_at < NOW() - INTERVAL '60 days';
    
END;
$$ LANGUAGE plpgsql;

```

---

## PRIVACY GUARANTEES

**What We Store:**
1. User account info (email, name, industry)
2. User's leads (private to user, user controls deletion)
3. Upload jobs (30-day auto-cleanup)
4. Minimal usage logs (90-day auto-cleanup, abuse prevention only)
5. Error logs (30-day auto-cleanup, no PII)
6. **Compliance audit logs (5-year retention per TCPA 47 CFR § 64.1200)**

**What We DON'T Store:**
1. ❌ Historical user behavior patterns
2. ❌ Cross-user analytics or comparisons
3. ❌ Lead conversion outcomes over time
4. ❌ AI analysis results (displayed once, not stored)
5. ❌ Detailed tracking or profiling data

**Auto-Cleanup Schedule:**
- Upload jobs: 30 days
- Sync logs: 30 days
- Usage logs: 90 days
- Error logs: 30 days
- Deleted numbers: 90 days
- Cancelled user data: 60 days
- Deletion recovery: 30 days
- **Compliance audit logs: 5 years** (federal requirement)

**Compliance Audit Logs (TCPA Requirement):**
- Records ALL DNC checks performed by users
- Retained for 5 years per TCPA 47 CFR § 64.1200
- When user deletes data: logs are ANONYMIZED (not deleted)
- Anonymized logs preserve compliance evidence without PII
- Monthly purge job removes logs after 5-year retention period

**User Controls:**
- Delete individual leads (30-day recovery)
- Delete all data (immediate, permanent - compliance logs anonymized)
- Export all data (CSV/JSON)
- Cancel subscription (60-day grace for data)
- Pause/disable integrations
- Request complete account deletion
- View own compliance audit history

---

**Document:** Database Schema
**Version:** 1.4 (Privacy-First Edition + TCPA Compliance)
**For:** Claude Opus 4.5 (Cursor AI)
**See Also:** CORE_REFERENCE.md, CORE_PRD.md, TECH_ARCHITECTURE.md
