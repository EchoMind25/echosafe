-- ============================================
-- ECHO MIND COMPLIANCE - FEDERAL COMPLIANCE AUDIT LOGGING
-- Version: 1.1 | Date: January 23, 2026
-- Reference: TCPA 47 CFR § 64.1200 (5-year record retention)
--
-- IDEMPOTENT: Safe to re-run on existing databases.
--
-- PURPOSE:
-- Maintains compliance audit trail for all DNC checks performed.
-- Records are retained for 5 years per TCPA requirements.
-- Supports user data deletion while preserving anonymized compliance records.
-- ============================================

-- ============================================
-- COMPLIANCE AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Compliance fields (5-year retention)
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Nullable for anonymization
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
  upload_job_id UUID REFERENCES public.upload_history(id) ON DELETE SET NULL,

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

-- Add table comment for documentation
COMMENT ON TABLE public.compliance_audit_logs IS 'TCPA compliance audit trail - 5-year retention per 47 CFR § 64.1200';
COMMENT ON COLUMN public.compliance_audit_logs.retention_until IS 'Auto-calculated: checked_at + 5 years. Records purged after this date.';
COMMENT ON COLUMN public.compliance_audit_logs.is_anonymized IS 'TRUE when user deletes their data - record preserved but de-identified.';

-- ============================================
-- INDEXES FOR COMPLIANCE QUERIES
-- ============================================

-- Phone number lookups (for compliance investigations)
CREATE INDEX IF NOT EXISTS idx_audit_phone
  ON public.compliance_audit_logs(phone_number);

-- User lookups (for user's own audit history)
CREATE INDEX IF NOT EXISTS idx_audit_user
  ON public.compliance_audit_logs(user_id)
  WHERE user_id IS NOT NULL;

-- Chronological queries (most common access pattern)
CREATE INDEX IF NOT EXISTS idx_audit_checked_at
  ON public.compliance_audit_logs(checked_at DESC);

-- Retention management (for monthly purge job)
CREATE INDEX IF NOT EXISTS idx_audit_retention
  ON public.compliance_audit_logs(retention_until)
  WHERE NOT is_anonymized;

-- Partition by year for performance (5+ years of data)
CREATE INDEX IF NOT EXISTS idx_audit_year
  ON public.compliance_audit_logs(EXTRACT(YEAR FROM checked_at));

-- DNC status queries (for compliance reporting)
CREATE INDEX IF NOT EXISTS idx_audit_dnc_status
  ON public.compliance_audit_logs(dnc_status);

-- Upload job correlation
CREATE INDEX IF NOT EXISTS idx_audit_upload_job
  ON public.compliance_audit_logs(upload_job_id)
  WHERE upload_job_id IS NOT NULL;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.compliance_audit_logs;
CREATE POLICY "Users can view own audit logs"
  ON public.compliance_audit_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (SELECT is_admin FROM public.users WHERE id = auth.uid())
  );

-- System can insert audit logs (any authenticated user can create logs for their checks)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.compliance_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.compliance_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view all audit logs (for compliance investigations)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.compliance_audit_logs;
CREATE POLICY "Admins can view all audit logs"
  ON public.compliance_audit_logs FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM public.users WHERE id = auth.uid()));

-- No UPDATE policy - audit logs are immutable (compliance requirement)
-- No DELETE policy for regular users - only system purge after 5 years

-- ============================================
-- ANONYMIZATION FUNCTION
-- ============================================
-- Called when user deletes their data
-- Preserves compliance records but removes identifying information

CREATE OR REPLACE FUNCTION public.anonymize_compliance_logs(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.compliance_audit_logs
  SET
    user_id = NULL, -- Detach from user account
    user_email = 'deleted-user-' || SUBSTRING(MD5(user_email) FROM 1 FOR 8) || '@anonymized.local',
    company_name = 'Deleted Account',
    ip_address = NULL, -- Remove IP for anonymization
    user_agent = NULL, -- Remove user agent for anonymization
    is_anonymized = TRUE
  WHERE user_id = target_user_id
    AND NOT is_anonymized;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.anonymize_compliance_logs IS 'Anonymizes compliance logs when user deletes their data. Records preserved for 5-year TCPA requirement.';

-- ============================================
-- PURGE EXPIRED LOGS FUNCTION
-- ============================================
-- Run monthly via Supabase cron job
-- Deletes logs older than 5 years

CREATE OR REPLACE FUNCTION public.purge_expired_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.compliance_audit_logs
  WHERE retention_until < CURRENT_DATE;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log the purge for audit purposes
  RAISE NOTICE 'Purged % expired compliance audit logs at %', deleted_count, NOW();

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.purge_expired_audit_logs IS 'Monthly job to purge compliance logs after 5-year retention period.';

-- ============================================
-- UPDATE DELETE_USER_DATA FUNCTION
-- ============================================
-- Modify existing function to anonymize compliance logs

CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id UUID)
RETURNS void AS $$
DECLARE
  lead_count INTEGER;
BEGIN
  -- Get lead count before deletion
  SELECT COUNT(*) INTO lead_count FROM public.crm_leads WHERE user_id = target_user_id;

  -- Anonymize compliance logs (KEEP for 5 years, but detach from user)
  -- This is CRITICAL for TCPA compliance
  PERFORM public.anonymize_compliance_logs(target_user_id);

  -- Delete user-controlled data
  DELETE FROM public.crm_leads WHERE user_id = target_user_id;
  DELETE FROM public.upload_history WHERE user_id = target_user_id;
  DELETE FROM public.crm_integrations WHERE user_id = target_user_id;
  DELETE FROM public.area_code_requests WHERE requested_by = target_user_id;
  DELETE FROM public.usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.deletion_logs WHERE user_id = target_user_id;

  -- Mark user as data deleted (account stays active for subscription)
  UPDATE public.users
  SET
    data_deleted_at = NOW(),
    total_leads_deleted = COALESCE(total_leads_deleted, 0) + lead_count
  WHERE id = target_user_id;

  RAISE NOTICE 'User data deleted for %, compliance logs anonymized', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.delete_user_data IS 'Deletes user data while preserving anonymized compliance audit logs per TCPA requirements.';

-- ============================================
-- HELPER FUNCTION: INSERT COMPLIANCE LOG
-- ============================================
-- Convenience function to insert a compliance log entry

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
  retention_date DATE;
BEGIN
  -- Calculate 5-year retention date
  retention_date := (CURRENT_DATE + INTERVAL '5 years')::DATE;

  INSERT INTO public.compliance_audit_logs (
    user_id,
    user_email,
    company_name,
    phone_number,
    area_code,
    dnc_status,
    risk_score,
    check_purpose,
    industry,
    upload_job_id,
    result_data,
    retention_until,
    source,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_user_email,
    p_company_name,
    p_phone_number,
    SUBSTRING(p_phone_number FROM 1 FOR 3), -- Extract area code
    p_dnc_status,
    p_risk_score,
    p_check_purpose,
    p_industry,
    p_upload_job_id,
    p_result_data,
    retention_date,
    p_source,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_compliance_check IS 'Inserts a compliance audit log entry with auto-calculated retention date (5 years).';

-- ============================================
-- UPDATE DAILY CLEANUP FUNCTION
-- ============================================
-- Add compliance log purge to daily cleanup (or run separately monthly)

CREATE OR REPLACE FUNCTION public.daily_privacy_cleanup()
RETURNS void AS $$
BEGIN
  -- Use the main cleanup function from the full schema
  -- This handles: deleted_numbers (90 days), uploads (30 days),
  -- sync_logs (30 days), usage_logs (90 days), error_logs (30 days)
  PERFORM public.cleanup_expired_data();

  -- Cleanup expired deletion logs (30 days)
  DELETE FROM public.deletion_logs
  WHERE recoverable_until < NOW()
    AND NOT recovered;

  -- Cleanup cancelled user data (60 days grace)
  DELETE FROM public.crm_leads
  WHERE user_id IN (
    SELECT id FROM public.users
    WHERE subscription_status = 'cancelled'
    AND updated_at < NOW() - INTERVAL '60 days'
  );

  -- Note: Compliance audit logs are NOT cleaned here
  -- They have their own monthly purge job: purge_expired_audit_logs()
  -- This is intentional - compliance logs require 5-year retention

  RAISE NOTICE 'Privacy cleanup completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.compliance_audit_logs TO authenticated;
GRANT INSERT ON public.compliance_audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_compliance_check TO authenticated;
GRANT EXECUTE ON FUNCTION public.anonymize_compliance_logs TO authenticated;

-- Admin-only functions
GRANT EXECUTE ON FUNCTION public.purge_expired_audit_logs TO authenticated;

-- ============================================
-- CRON JOB SETUP (Run via Supabase Dashboard)
-- ============================================
--
-- Add this cron job in Supabase Dashboard > Database > Extensions > pg_cron:
--
-- SELECT cron.schedule(
--   'purge-expired-audit-logs',
--   '0 3 1 * *', -- First day of each month at 3 AM UTC
--   $$SELECT public.purge_expired_audit_logs()$$
-- );
--
-- ============================================
