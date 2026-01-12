-- ============================================================================
-- ECHO MIND COMPLIANCE - COMPLETE SUPABASE DATABASE SCHEMA
-- Version: 1.1
-- Date: January 10, 2026
--
-- INSTRUCTIONS:
-- 1. Create a new Supabase project at https://supabase.com
-- 2. Go to SQL Editor in the Supabase Dashboard
-- 3. Copy and paste this entire file
-- 4. Run the query
-- 5. Verify all tables are created under the "public" schema
--
-- CHANGELOG:
-- v1.1 - Updated handle_new_user() to sync company_name from metadata
--
-- NOTES:
-- - This creates all tables, indexes, triggers, and RLS policies
-- - The DNC registry table is ready for manual data import
-- - User accounts sync automatically from auth.users via trigger
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fuzzy text search (for future search features)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

-- User subscription status
CREATE TYPE subscription_status_enum AS ENUM (
  'active',
  'trialing',
  'canceled',
  'past_due',
  'paused'
);

-- User subscription tier
CREATE TYPE subscription_tier_enum AS ENUM (
  'base',
  'utah_elite',
  'team'
);

-- Upload/job status
CREATE TYPE upload_status_enum AS ENUM (
  'processing',
  'completed',
  'failed'
);

-- Risk level
CREATE TYPE risk_level_enum AS ENUM (
  'safe',
  'caution',
  'blocked'
);

-- CRM lead status
CREATE TYPE lead_status_enum AS ENUM (
  'new',
  'contacted',
  'qualified',
  'nurturing',
  'converted',
  'dead'
);

-- CRM integration type
CREATE TYPE crm_type_enum AS ENUM (
  'followupboss',
  'lofty',
  'kvcore'
);

-- Integration status
CREATE TYPE integration_status_enum AS ENUM (
  'active',
  'paused',
  'error'
);

-- Sync type
CREATE TYPE sync_type_enum AS ENUM (
  'manual',
  'auto'
);

-- Sync status
CREATE TYPE sync_status_enum AS ENUM (
  'success',
  'partial',
  'failed'
);

-- Area code subscription status
CREATE TYPE area_code_status_enum AS ENUM (
  'active',
  'expired',
  'pending'
);

-- Area code request status
CREATE TYPE request_status_enum AS ENUM (
  'pending',
  'funding',
  'processing',
  'completed',
  'failed'
);

-- Payment status
CREATE TYPE payment_status_enum AS ENUM (
  'succeeded',
  'pending',
  'failed',
  'refunded'
);

-- Payment type
CREATE TYPE payment_type_enum AS ENUM (
  'subscription',
  'area_code',
  'one_time'
);

-- DNC source
CREATE TYPE dnc_source_enum AS ENUM (
  'federal',
  'utah_state',
  'manual'
);

-- Device type for analytics
CREATE TYPE device_type_enum AS ENUM (
  'mobile',
  'tablet',
  'desktop'
);

-- Platform for analytics
CREATE TYPE platform_enum AS ENUM (
  'web',
  'ios',
  'android',
  'google_sheets'
);

-- ============================================================================
-- TABLE: users
-- User profiles synced with Supabase auth.users
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  company_name TEXT,

  -- Subscription
  subscription_status subscription_status_enum DEFAULT 'trialing',
  subscription_tier subscription_tier_enum DEFAULT 'base',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,

  -- Preferences (JSON for flexibility)
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "auto_sync_crm": true,
    "include_risky_in_download": false,
    "default_area_codes": []
  }'::jsonb,

  -- Usage Tracking
  total_leads_scrubbed INTEGER DEFAULT 0,
  last_scrub_at TIMESTAMPTZ,

  -- Security
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: area_code_subscriptions
-- Tracks which area codes each user has access to
-- ============================================================================

CREATE TABLE area_code_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL = permanent (never expires)
  status area_code_status_enum DEFAULT 'active',

  -- Ensure unique subscription per user/area_code combo
  UNIQUE(user_id, area_code)
);

-- Indexes
CREATE INDEX idx_area_code_subs_user ON area_code_subscriptions(user_id);
CREATE INDEX idx_area_code_subs_code ON area_code_subscriptions(area_code);
CREATE INDEX idx_area_code_subs_status ON area_code_subscriptions(status);

-- RLS Policies
ALTER TABLE area_code_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own area code subscriptions"
  ON area_code_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to area code subscriptions"
  ON area_code_subscriptions FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: dnc_registry
-- Do Not Call registry - optimized for fast phone number lookups
-- This table will be manually populated with DNC data
-- ============================================================================

CREATE TABLE dnc_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Phone data (stored as TEXT to preserve leading zeros)
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,

  -- DNC metadata
  registered_at TIMESTAMPTZ NOT NULL,
  source dnc_source_enum NOT NULL,

  -- Optional metadata (JSON for flexibility)
  -- Can include: name, address, registration_type, etc.
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRITICAL INDEXES for fast lookups (N8N queries by phone number)
-- Primary lookup index - unique constraint on phone_number
CREATE UNIQUE INDEX idx_dnc_phone ON dnc_registry(phone_number);

-- Area code index for filtering by region
CREATE INDEX idx_dnc_area_code ON dnc_registry(area_code);

-- Source index for filtering by DNC type
CREATE INDEX idx_dnc_source ON dnc_registry(source);

-- Date index for finding recently registered numbers
CREATE INDEX idx_dnc_registered_at ON dnc_registry(registered_at DESC);

-- Composite index for area code + phone lookups (covers common query patterns)
CREATE INDEX idx_dnc_area_phone ON dnc_registry(area_code, phone_number);

-- Trigram index for fuzzy phone search (future feature)
CREATE INDEX idx_dnc_phone_trgm ON dnc_registry USING gin (phone_number gin_trgm_ops);

-- RLS Policies
ALTER TABLE dnc_registry ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read DNC registry (needed for lookups)
CREATE POLICY "Public read access to DNC registry"
  ON dnc_registry FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to read DNC registry
CREATE POLICY "Authenticated read access to DNC registry"
  ON dnc_registry FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update/delete (for bulk imports)
CREATE POLICY "Service role full access to DNC registry"
  ON dnc_registry FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: upload_history
-- Tracks all scrubbing jobs and results
-- ============================================================================

CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Upload Details
  filename TEXT NOT NULL,
  file_size INTEGER, -- bytes
  total_leads INTEGER NOT NULL,

  -- Results
  clean_leads INTEGER NOT NULL DEFAULT 0,
  dnc_blocked INTEGER NOT NULL DEFAULT 0,
  caution_leads INTEGER NOT NULL DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,

  -- Risk Scoring
  average_risk_score DECIMAL(5,2),
  compliance_rate DECIMAL(5,2), -- percentage clean

  -- Download URLs (stored in Supabase Storage)
  clean_file_url TEXT,
  full_report_url TEXT,
  risky_file_url TEXT,

  -- Processing
  processing_time_ms INTEGER,
  n8n_job_id TEXT,
  status upload_status_enum DEFAULT 'processing',
  error_message TEXT,

  -- Metadata
  source TEXT, -- 'web', 'google_sheets', 'api'
  area_codes_used TEXT[], -- array of area codes checked

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_upload_user ON upload_history(user_id);
CREATE INDEX idx_upload_created ON upload_history(created_at DESC);
CREATE INDEX idx_upload_status ON upload_history(status);
CREATE INDEX idx_upload_n8n_job ON upload_history(n8n_job_id);

-- RLS Policies
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upload history"
  ON upload_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own upload history"
  ON upload_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to upload history"
  ON upload_history FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: crm_leads
-- Built-in CRM for permanent lead storage
-- ============================================================================

CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Lead Information
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Risk & Compliance
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level risk_level_enum,
  dnc_status BOOLEAN DEFAULT FALSE,
  last_scrubbed_at TIMESTAMPTZ,

  -- CRM Fields
  status lead_status_enum DEFAULT 'new',
  source TEXT, -- where lead came from
  tags TEXT[], -- array of tags
  notes TEXT,
  assigned_to TEXT, -- for team accounts (future)

  -- Activity Tracking
  last_contact_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,

  -- Metadata
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- soft delete
);

-- Indexes
CREATE INDEX idx_crm_user ON crm_leads(user_id);
CREATE INDEX idx_crm_phone ON crm_leads(phone_number);
CREATE INDEX idx_crm_status ON crm_leads(status);
CREATE INDEX idx_crm_risk_level ON crm_leads(risk_level);
CREATE INDEX idx_crm_created ON crm_leads(created_at DESC);
CREATE INDEX idx_crm_deleted ON crm_leads(deleted_at);
CREATE INDEX idx_crm_next_followup ON crm_leads(next_followup_at);
CREATE INDEX idx_crm_user_phone ON crm_leads(user_id, phone_number);

-- Trigram index for fuzzy name search
CREATE INDEX idx_crm_first_name_trgm ON crm_leads USING gin (first_name gin_trgm_ops);
CREATE INDEX idx_crm_last_name_trgm ON crm_leads USING gin (last_name gin_trgm_ops);

-- RLS Policies
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CRM leads"
  ON crm_leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own CRM leads"
  ON crm_leads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM leads"
  ON crm_leads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM leads"
  ON crm_leads FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to CRM leads"
  ON crm_leads FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: crm_integrations
-- CRM connections (Follow Up Boss, Lofty, Kvcore)
-- ============================================================================

CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Integration Details
  crm_type crm_type_enum NOT NULL,
  crm_name TEXT NOT NULL, -- user-friendly name

  -- Credentials (store encrypted in production)
  credentials JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Field Mapping
  field_mapping JSONB NOT NULL DEFAULT '{
    "phone_number": "phone",
    "first_name": "firstName",
    "last_name": "lastName",
    "email": "email",
    "address": "address",
    "custom_fields": {}
  }'::jsonb,

  -- Sync Settings
  sync_settings JSONB DEFAULT '{
    "auto_sync": true,
    "sync_risky": false,
    "sync_frequency": "immediate"
  }'::jsonb,

  -- Status
  status integration_status_enum DEFAULT 'active',
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One integration per CRM type per user
  UNIQUE(user_id, crm_type)
);

-- Indexes
CREATE INDEX idx_crm_int_user ON crm_integrations(user_id);
CREATE INDEX idx_crm_int_type ON crm_integrations(crm_type);
CREATE INDEX idx_crm_int_status ON crm_integrations(status);

-- RLS Policies
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CRM integrations"
  ON crm_integrations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own CRM integrations"
  ON crm_integrations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM integrations"
  ON crm_integrations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM integrations"
  ON crm_integrations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to CRM integrations"
  ON crm_integrations FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: crm_integration_logs
-- CRM sync history and audit trail
-- ============================================================================

CREATE TABLE crm_integration_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID NOT NULL REFERENCES crm_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Sync Details
  sync_type sync_type_enum NOT NULL,
  leads_synced INTEGER NOT NULL DEFAULT 0,
  leads_failed INTEGER DEFAULT 0,

  -- Status
  status sync_status_enum NOT NULL,
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Indexes
CREATE INDEX idx_crm_logs_integration ON crm_integration_logs(integration_id);
CREATE INDEX idx_crm_logs_user ON crm_integration_logs(user_id);
CREATE INDEX idx_crm_logs_started ON crm_integration_logs(started_at DESC);
CREATE INDEX idx_crm_logs_status ON crm_integration_logs(status);

-- RLS Policies
ALTER TABLE crm_integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own CRM integration logs"
  ON crm_integration_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to CRM integration logs"
  ON crm_integration_logs FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: area_code_requests
-- Cooperative funding requests for new area codes
-- ============================================================================

CREATE TABLE area_code_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area_code TEXT NOT NULL,

  -- Requester (NULL if requested by system)
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Funding
  ftc_cost DECIMAL(10,2) NOT NULL, -- cost to acquire data from FTC
  user_contribution DECIMAL(10,2) NOT NULL, -- typically 50%
  echo_mind_contribution DECIMAL(10,2) NOT NULL, -- typically 50%
  total_funded DECIMAL(10,2) DEFAULT 0,

  -- Status
  status request_status_enum DEFAULT 'pending',
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,

  -- Completion
  records_added INTEGER,
  completed_at TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_area_requests_code ON area_code_requests(area_code);
CREATE INDEX idx_area_requests_status ON area_code_requests(status);
CREATE INDEX idx_area_requests_requester ON area_code_requests(requested_by);
CREATE INDEX idx_area_requests_created ON area_code_requests(created_at DESC);

-- RLS Policies
ALTER TABLE area_code_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can view area code requests (for transparency)
CREATE POLICY "Public read access to area code requests"
  ON area_code_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create area code requests"
  ON area_code_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Service role full access to area code requests"
  ON area_code_requests FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: payments
-- Stripe transaction records
-- ============================================================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe Details
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT,

  -- Payment Info
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status payment_status_enum NOT NULL,

  -- Description
  description TEXT,
  payment_type payment_type_enum NOT NULL,

  -- Metadata (for additional Stripe data)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_stripe_invoice ON payments(stripe_invoice_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_type ON payments(payment_type);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to payments"
  ON payments FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TABLE: analytics_events
-- Usage tracking and analytics
-- ============================================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Event Details
  event_type TEXT NOT NULL, -- 'scrub_completed', 'crm_sync', 'login', etc.
  event_data JSONB DEFAULT '{}'::jsonb,

  -- Context
  device_type device_type_enum,
  platform platform_enum,
  user_agent TEXT,
  ip_address INET,

  -- Session tracking
  session_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_platform ON analytics_events(platform);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);

-- RLS Policies
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role full access to analytics"
  ON analytics_events FOR ALL
  TO service_role
  USING (true);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Function to handle new user creation (syncs auth.users -> public.users)
-- v1.1: Now includes company_name from user metadata
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    company_name,
    subscription_status,
    subscription_tier,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'company',
    'trialing',
    'base',
    NOW() + INTERVAL '14 days' -- 14-day free trial
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update user's last_scrub_at and total_leads_scrubbed
CREATE OR REPLACE FUNCTION update_user_scrub_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.users
    SET
      last_scrub_at = NOW(),
      total_leads_scrubbed = total_leads_scrubbed + COALESCE(NEW.total_leads, 0)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user's last_login_at and login_count
CREATE OR REPLACE FUNCTION update_user_login_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'login' THEN
    UPDATE public.users
    SET
      last_login_at = NOW(),
      login_count = login_count + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: Update updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update updated_at on dnc_registry table
CREATE TRIGGER update_dnc_registry_updated_at
  BEFORE UPDATE ON dnc_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update updated_at on crm_leads table
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update updated_at on crm_integrations table
CREATE TRIGGER update_crm_integrations_updated_at
  BEFORE UPDATE ON crm_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update updated_at on area_code_requests table
CREATE TRIGGER update_area_code_requests_updated_at
  BEFORE UPDATE ON area_code_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Update user scrub stats when upload completes
CREATE TRIGGER on_upload_completed
  AFTER INSERT OR UPDATE ON upload_history
  FOR EACH ROW EXECUTE FUNCTION update_user_scrub_stats();

-- Trigger: Update user login stats when login event is recorded
CREATE TRIGGER on_user_login
  AFTER INSERT ON analytics_events
  FOR EACH ROW EXECUTE FUNCTION update_user_login_stats();

-- ============================================================================
-- SEED DATA: Default Utah Area Codes
-- These are available to all Utah Elite members
-- ============================================================================

-- Note: You'll manually insert DNC data after schema creation
-- These are just the area codes that will be available

-- Insert default area code availability (optional - can be done manually)
-- INSERT INTO area_code_requests (area_code, ftc_cost, user_contribution, echo_mind_contribution, status, progress_percentage)
-- VALUES
--   ('801', 0, 0, 0, 'completed', 100),  -- Salt Lake City area
--   ('385', 0, 0, 0, 'completed', 100),  -- Salt Lake City overlay
--   ('435', 0, 0, 0, 'completed', 100);  -- Rural Utah

-- ============================================================================
-- HELPER VIEWS (Optional)
-- ============================================================================

-- View: User dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
  u.id as user_id,
  u.total_leads_scrubbed,
  u.last_scrub_at,
  u.subscription_status,
  u.subscription_tier,
  (
    SELECT COUNT(*)
    FROM upload_history uh
    WHERE uh.user_id = u.id
  ) as total_uploads,
  (
    SELECT COUNT(*)
    FROM crm_leads cl
    WHERE cl.user_id = u.id AND cl.deleted_at IS NULL
  ) as total_crm_leads,
  (
    SELECT COUNT(*)
    FROM crm_integrations ci
    WHERE ci.user_id = u.id AND ci.status = 'active'
  ) as active_integrations
FROM users u;

-- View: Recent uploads with user info
CREATE OR REPLACE VIEW recent_uploads AS
SELECT
  uh.*,
  u.email as user_email,
  u.full_name as user_name
FROM upload_history uh
JOIN users u ON u.id = uh.user_id
ORDER BY uh.created_at DESC
LIMIT 100;

-- ============================================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ============================================================================

-- Function: Check if phone number is on DNC registry
CREATE OR REPLACE FUNCTION check_dnc(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM dnc_registry
    WHERE phone_number = phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Bulk check multiple phone numbers against DNC
CREATE OR REPLACE FUNCTION bulk_check_dnc(phones TEXT[])
RETURNS TABLE (
  phone_number TEXT,
  is_dnc BOOLEAN,
  dnc_source dnc_source_enum,
  registered_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.phone,
    (d.id IS NOT NULL) as is_dnc,
    d.source as dnc_source,
    d.registered_at
  FROM unnest(phones) p(phone)
  LEFT JOIN dnc_registry d ON d.phone_number = p.phone;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's area code access
CREATE OR REPLACE FUNCTION get_user_area_codes(uid UUID)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT area_code
    FROM area_code_subscriptions
    WHERE user_id = uid
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant usage on custom types to authenticated users
GRANT USAGE ON TYPE subscription_status_enum TO authenticated;
GRANT USAGE ON TYPE subscription_tier_enum TO authenticated;
GRANT USAGE ON TYPE upload_status_enum TO authenticated;
GRANT USAGE ON TYPE risk_level_enum TO authenticated;
GRANT USAGE ON TYPE lead_status_enum TO authenticated;
GRANT USAGE ON TYPE crm_type_enum TO authenticated;
GRANT USAGE ON TYPE integration_status_enum TO authenticated;
GRANT USAGE ON TYPE sync_type_enum TO authenticated;
GRANT USAGE ON TYPE sync_status_enum TO authenticated;
GRANT USAGE ON TYPE area_code_status_enum TO authenticated;
GRANT USAGE ON TYPE request_status_enum TO authenticated;
GRANT USAGE ON TYPE payment_status_enum TO authenticated;
GRANT USAGE ON TYPE payment_type_enum TO authenticated;
GRANT USAGE ON TYPE dnc_source_enum TO authenticated;
GRANT USAGE ON TYPE device_type_enum TO authenticated;
GRANT USAGE ON TYPE platform_enum TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION check_dnc(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_check_dnc(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_area_codes(UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Uncomment and run these to verify the schema was created correctly:

-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM pg_indexes WHERE schemaname = 'public';
-- SELECT * FROM pg_policies;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
