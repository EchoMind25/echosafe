-- ============================================
-- ADMIN BULK UPLOAD SYSTEM MIGRATION
-- FTC Compliance for DNC Registry Management
-- ============================================

-- ============================================
-- FTC SUBSCRIPTIONS TABLE
-- Tracks active FTC area code subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS ftc_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Area code info
  area_code TEXT NOT NULL UNIQUE,
  state TEXT,

  -- Subscription status
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expiring', 'expired', 'pending')),

  -- Dates
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_update_at TIMESTAMPTZ,
  next_update_due TIMESTAMPTZ,

  -- Cost tracking
  annual_cost DECIMAL(10, 2) DEFAULT 100.00,
  monthly_cost DECIMAL(10, 2) DEFAULT 8.00,

  -- Record counts
  total_records INTEGER DEFAULT 0,
  last_record_count INTEGER DEFAULT 0,

  -- Metadata
  ftc_file_format TEXT DEFAULT 'csv',
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ftc_subscriptions_area_code ON ftc_subscriptions(area_code);
CREATE INDEX idx_ftc_subscriptions_status ON ftc_subscriptions(subscription_status);
CREATE INDEX idx_ftc_subscriptions_expires ON ftc_subscriptions(expires_at);

-- ============================================
-- DNC UPDATE LOG TABLE
-- Audit trail for all DNC registry updates
-- ============================================
CREATE TABLE IF NOT EXISTS dnc_update_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to admin upload
  admin_upload_id UUID REFERENCES admin_uploads(id) ON DELETE SET NULL,

  -- Area code processed
  area_code TEXT NOT NULL,

  -- FTC release info
  ftc_release_date DATE,

  -- Processing stats
  records_processed INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_removed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'partial')),
  error_message TEXT,
  error_details JSONB DEFAULT '[]'::jsonb,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Metadata
  file_path TEXT,
  file_size_bytes INTEGER,
  batch_size INTEGER DEFAULT 1000,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dnc_update_log_area_code ON dnc_update_log(area_code);
CREATE INDEX idx_dnc_update_log_status ON dnc_update_log(status);
CREATE INDEX idx_dnc_update_log_created ON dnc_update_log(created_at DESC);
CREATE INDEX idx_dnc_update_log_admin_upload ON dnc_update_log(admin_upload_id);

-- ============================================
-- ENHANCE ADMIN UPLOADS TABLE
-- Add missing fields for FTC compliance
-- ============================================
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS ftc_release_date DATE;
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS records_per_second DECIMAL(10, 2);
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS files_processed INTEGER DEFAULT 0;
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS notify_email TEXT;
ALTER TABLE admin_uploads ADD COLUMN IF NOT EXISTS notify_on_complete BOOLEAN DEFAULT TRUE;

-- ============================================
-- ENHANCE USERS TABLE FOR PRICING TIERS
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_tier TEXT DEFAULT 'standard'
  CHECK (pricing_tier IN ('standard', 'founders_club', 'team', 'enterprise'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_price_lock DECIMAL(10, 2);

ALTER TABLE users ADD COLUMN IF NOT EXISTS legacy_grace_until TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS founders_club_unlocked_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS area_code_limit INTEGER DEFAULT 5;

ALTER TABLE users ADD COLUMN IF NOT EXISTS team_seat_count INTEGER DEFAULT 1;

ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_base_rate DECIMAL(10, 2) DEFAULT 47.00;

-- ============================================
-- EXPANSION REQUESTS TABLE UPDATES
-- Link to FTC subscriptions for Founder's Club tracking
-- ============================================
ALTER TABLE expansion_requests ADD COLUMN IF NOT EXISTS ftc_subscription_id UUID REFERENCES ftc_subscriptions(id);
ALTER TABLE expansion_requests ADD COLUMN IF NOT EXISTS contribution_amount DECIMAL(10, 2) DEFAULT 100.00;
ALTER TABLE expansion_requests ADD COLUMN IF NOT EXISTS unlocks_founders_club BOOLEAN DEFAULT FALSE;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if subscription is valid for area code
CREATE OR REPLACE FUNCTION check_ftc_subscription(p_area_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ftc_subscriptions
    WHERE area_code = p_area_code
    AND subscription_status = 'active'
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user qualifies for Founder's Club
CREATE OR REPLACE FUNCTION check_founders_club_eligibility(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  completed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO completed_count
  FROM expansion_requests
  WHERE user_id = p_user_id
  AND status = 'completed';

  RETURN completed_count >= 3;
END;
$$ LANGUAGE plpgsql;

-- Function to check legacy grace period
CREATE OR REPLACE FUNCTION check_legacy_grace_period(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND legacy_grace_until IS NOT NULL
    AND legacy_grace_until > NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to update subscription status based on expiry
CREATE OR REPLACE FUNCTION update_subscription_statuses()
RETURNS void AS $$
BEGIN
  -- Mark expired subscriptions
  UPDATE ftc_subscriptions
  SET subscription_status = 'expired',
      updated_at = NOW()
  WHERE expires_at < NOW()
  AND subscription_status != 'expired';

  -- Mark expiring soon (within 30 days)
  UPDATE ftc_subscriptions
  SET subscription_status = 'expiring',
      updated_at = NOW()
  WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '30 days'
  AND subscription_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- FTC Subscriptions - Admin only
ALTER TABLE ftc_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage FTC subscriptions"
  ON ftc_subscriptions FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view FTC subscriptions"
  ON ftc_subscriptions FOR SELECT
  TO authenticated
  USING (true);

-- DNC Update Log - Admin only for write, all authenticated for read
ALTER TABLE dnc_update_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage DNC update logs"
  ON dnc_update_log FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can view DNC update logs"
  ON dnc_update_log FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ftc_subscriptions_updated
  BEFORE UPDATE ON ftc_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA: Utah Area Codes
-- ============================================
INSERT INTO ftc_subscriptions (area_code, state, subscription_status, expires_at, annual_cost, notes)
VALUES
  ('801', 'UT', 'active', NOW() + INTERVAL '1 year', 100.00, 'Salt Lake City metro'),
  ('385', 'UT', 'active', NOW() + INTERVAL '1 year', 100.00, 'Salt Lake City overlay'),
  ('435', 'UT', 'active', NOW() + INTERVAL '1 year', 100.00, 'Rural Utah')
ON CONFLICT (area_code) DO NOTHING;
