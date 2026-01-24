-- ============================================================================
-- COMPLIANCE ACKNOWLEDGMENT TRACKING
-- Purpose: Track user acknowledgment of legal responsibilities and disclaimers
-- NEVER delete records from this table - required for legal defense
-- ============================================================================

-- Add compliance acknowledgment tracking to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compliance_acknowledgment_signed_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compliance_acknowledgment_ip INET;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compliance_acknowledgment_user_agent TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS compliance_acknowledgment_version TEXT DEFAULT '1.0';

-- Create compliance acknowledgment history table
CREATE TABLE IF NOT EXISTS compliance_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What they agreed to
  acknowledgment_version TEXT NOT NULL DEFAULT '1.0',
  acknowledgment_text TEXT NOT NULL,
  checkboxes_accepted JSONB NOT NULL,
  confirmation_text TEXT NOT NULL, -- "I AGREE"

  -- When and where
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_compliance_acks_user ON compliance_acknowledgments(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_acks_signed ON compliance_acknowledgments(signed_at DESC);

-- Function to record acknowledgment
CREATE OR REPLACE FUNCTION record_compliance_acknowledgment(
  p_user_id UUID,
  p_acknowledgment_text TEXT,
  p_checkboxes_accepted JSONB,
  p_confirmation_text TEXT,
  p_ip_address INET,
  p_user_agent TEXT
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert into history
  INSERT INTO compliance_acknowledgments (
    user_id,
    acknowledgment_text,
    checkboxes_accepted,
    confirmation_text,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_acknowledgment_text,
    p_checkboxes_accepted,
    p_confirmation_text,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO new_id;

  -- Update user profile
  UPDATE profiles SET
    compliance_acknowledgment_signed_at = NOW(),
    compliance_acknowledgment_ip = p_ip_address,
    compliance_acknowledgment_user_agent = p_user_agent,
    compliance_acknowledgment_version = '1.0'
  WHERE id = p_user_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE compliance_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Users can view their own acknowledgments
CREATE POLICY "Users can view own acknowledgments"
  ON compliance_acknowledgments FOR SELECT
  USING (user_id = auth.uid());

-- System can insert acknowledgments (via authenticated users)
CREATE POLICY "Authenticated users can insert acknowledgments"
  ON compliance_acknowledgments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE compliance_acknowledgments IS
  'Legal documentation of user acknowledgment of responsibilities and disclaimers. NEVER delete - required for legal defense.';

-- ============================================================================
-- HIGH-RISK USAGE DETECTION FUNCTION
-- Identifies users with concerning usage patterns for proactive warnings
-- ============================================================================

CREATE OR REPLACE FUNCTION get_high_risk_usage_patterns()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  checks_last_24h INTEGER,
  dnc_rate DECIMAL,
  litigator_matches INTEGER,
  recent_ported INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.email,
    COUNT(*)::INTEGER as checks_last_24h,
    (AVG(CASE WHEN cal.dnc_status = 'blocked' THEN 1 ELSE 0 END) * 100)::DECIMAL as dnc_rate,
    COUNT(CASE WHEN cal.result_data->>'litigator_match' = 'true' THEN 1 END)::INTEGER as litigator_matches,
    COUNT(CASE WHEN cal.result_data->>'recently_ported' = 'true' THEN 1 END)::INTEGER as recent_ported
  FROM compliance_audit_logs cal
  JOIN profiles p ON cal.user_id = p.id
  WHERE cal.checked_at > NOW() - INTERVAL '24 hours'
  GROUP BY p.id, p.email
  HAVING
    COUNT(*) > 1000 -- More than 1000 checks/day
    OR AVG(CASE WHEN cal.dnc_status = 'blocked' THEN 1 ELSE 0 END) > 0.5 -- >50% DNC rate
    OR COUNT(CASE WHEN cal.result_data->>'litigator_match' = 'true' THEN 1 END) > 5; -- 5+ litigators
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (for admin use)
GRANT EXECUTE ON FUNCTION get_high_risk_usage_patterns() TO authenticated;
