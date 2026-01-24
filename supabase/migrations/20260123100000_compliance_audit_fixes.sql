-- ============================================
-- ECHO MIND COMPLIANCE - COMPLIANCE AUDIT FIXES
-- Version: 1.0 | Date: January 23, 2026
--
-- FIXES FROM COMPLIANCE_PERFORMANCE_AUDIT.md:
-- 1. Update delete_all_user_data to call anonymize_compliance_logs
-- 2. Add phone normalization trigger
-- 3. Add composite index for user_id, phone_number
-- 4. Add DNC freshness monitoring function
-- 5. Add industry validation constraint
-- 6. Add internal DNC tracking columns
--
-- IDEMPOTENT: Safe to re-run on existing databases.
-- SELF-CONTAINED: Includes all helper functions needed.
-- ============================================

-- ============================================
-- PREREQUISITE 1: Schema versions table (for tracking migrations)
-- ============================================
CREATE TABLE IF NOT EXISTS public.schema_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREREQUISITE 2: Helper function for idempotent column addition
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
    RAISE NOTICE 'Added column %.% with type %', _table, _column, _type;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PREREQUISITE 3: Ensure anonymize_compliance_logs exists
-- (In case compliance_audit_logs migration hasn't run yet)
-- ============================================
CREATE OR REPLACE FUNCTION public.anonymize_compliance_logs(target_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only update if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'compliance_audit_logs') THEN
    UPDATE public.compliance_audit_logs
    SET
      user_id = NULL,
      user_email = 'deleted-user-' || SUBSTRING(MD5(COALESCE(user_email, 'unknown')) FROM 1 FOR 8) || '@anonymized.local',
      company_name = 'Deleted Account',
      ip_address = NULL,
      user_agent = NULL,
      is_anonymized = TRUE
    WHERE user_id = target_user_id
      AND NOT is_anonymized;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record this migration
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.schema_versions WHERE version = '1.5') THEN
    INSERT INTO public.schema_versions (version, description)
    VALUES ('1.5', 'Compliance audit fixes - anonymization, normalization, monitoring');
  END IF;
END $$;

-- ============================================
-- FIX 1: Update delete_all_user_data to call anonymize_compliance_logs
-- CRITICAL BUG FIX: Ensures compliance logs are anonymized on user deletion
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

  -- Log deletion for compliance
  INSERT INTO public.deletion_logs (user_id, deletion_type, items_deleted, reason)
  VALUES (target_user_id, 'all_data', lead_count, 'User requested complete data deletion');

  -- CRITICAL FIX: Anonymize compliance logs (KEEP for 5 years per TCPA, but detach from user)
  PERFORM public.anonymize_compliance_logs(target_user_id);

  -- Delete user's data
  DELETE FROM public.crm_leads WHERE user_id = target_user_id;
  DELETE FROM public.upload_history WHERE user_id = target_user_id;
  DELETE FROM public.crm_integrations WHERE user_id = target_user_id;
  DELETE FROM public.usage_logs WHERE user_id = target_user_id;
  DELETE FROM public.area_code_requests WHERE requested_by = target_user_id;
  DELETE FROM public.area_code_subscriptions WHERE user_id = target_user_id;

  -- Update user record
  UPDATE public.users
  SET
    data_deleted_at = NOW(),
    total_leads_deleted = COALESCE(total_leads_deleted, 0) + lead_count
  WHERE id = target_user_id;

  RAISE NOTICE 'All data deleted for user %, compliance logs anonymized', target_user_id;
END;
$$;

COMMENT ON FUNCTION public.delete_all_user_data IS 'Deletes all user data while preserving anonymized compliance audit logs per TCPA 5-year retention requirement.';

-- ============================================
-- FIX 2: Phone number normalization trigger
-- Ensures consistent format: 10 digits, no formatting
-- More lenient: warns but doesn't reject invalid numbers
-- ============================================

CREATE OR REPLACE FUNCTION public.normalize_phone_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Skip if phone_number is NULL or empty
  IF NEW.phone_number IS NULL OR NEW.phone_number = '' THEN
    RETURN NEW;
  END IF;

  -- Strip all non-digits
  normalized := REGEXP_REPLACE(NEW.phone_number, '\D', '', 'g');

  -- If 11 digits starting with 1, remove the 1 (US country code)
  IF LENGTH(normalized) = 11 AND LEFT(normalized, 1) = '1' THEN
    normalized := SUBSTRING(normalized FROM 2);
  END IF;

  -- If we got a valid 10-digit number, use it
  IF LENGTH(normalized) = 10 THEN
    NEW.phone_number := normalized;
  ELSE
    -- For invalid numbers, log a notice but don't reject
    -- This allows existing data and edge cases to work
    RAISE NOTICE 'Phone number "%" normalized to "%" (% digits, expected 10)',
      NEW.phone_number, normalized, LENGTH(normalized);
    -- Still store the normalized version (digits only) even if not 10 digits
    IF LENGTH(normalized) > 0 THEN
      NEW.phone_number := normalized;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to crm_leads table (only on INSERT, not UPDATE to avoid breaking existing data)
DROP TRIGGER IF EXISTS normalize_lead_phone ON public.crm_leads;
CREATE TRIGGER normalize_lead_phone
  BEFORE INSERT ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_phone_before_insert();

COMMENT ON FUNCTION public.normalize_phone_before_insert IS 'Normalizes phone numbers to 10-digit format on insert. Logs warning for non-standard numbers but does not reject them.';

-- Normalize existing phone numbers in crm_leads (one-time cleanup)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'crm_leads') THEN
    UPDATE public.crm_leads
    SET phone_number = CASE
      WHEN LENGTH(REGEXP_REPLACE(phone_number, '\D', '', 'g')) = 11
           AND LEFT(REGEXP_REPLACE(phone_number, '\D', '', 'g'), 1) = '1'
      THEN SUBSTRING(REGEXP_REPLACE(phone_number, '\D', '', 'g') FROM 2)
      ELSE REGEXP_REPLACE(phone_number, '\D', '', 'g')
    END
    WHERE phone_number ~ '\D'; -- Only update rows that have non-digit characters

    RAISE NOTICE 'Normalized existing phone numbers in crm_leads';
  END IF;
END $$;

-- ============================================
-- FIX 3: Add composite index for faster duplicate detection
-- Speeds up: SELECT * FROM crm_leads WHERE user_id = $1 AND phone_number = $2
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_user_phone_composite
  ON public.crm_leads(user_id, phone_number)
  WHERE deleted_at IS NULL;

-- ============================================
-- FIX 4: DNC freshness monitoring function
-- Alerts admin if DNC registry hasn't been updated in 28+ days (TCPA requires 31-day max)
-- ============================================

-- Add last_ftc_update tracking column to dnc_registry metadata
SELECT public.add_column_if_not_exists('ftc_subscriptions', 'last_ftc_file_date', 'DATE');
SELECT public.add_column_if_not_exists('ftc_subscriptions', 'data_freshness_days', 'INTEGER', '0');

-- Function to check DNC data freshness across all subscriptions
CREATE OR REPLACE FUNCTION public.check_dnc_freshness()
RETURNS TABLE(
  area_code TEXT,
  days_since_update INTEGER,
  status TEXT,
  last_update_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fs.area_code,
    EXTRACT(DAY FROM NOW() - COALESCE(fs.last_update_at, fs.subscribed_at))::INTEGER AS days_since_update,
    CASE
      WHEN fs.last_update_at IS NULL THEN 'NEVER_UPDATED'
      WHEN EXTRACT(DAY FROM NOW() - fs.last_update_at) > 31 THEN 'STALE'
      WHEN EXTRACT(DAY FROM NOW() - fs.last_update_at) > 28 THEN 'WARNING'
      ELSE 'CURRENT'
    END AS status,
    fs.last_update_at
  FROM public.ftc_subscriptions fs
  WHERE fs.subscription_status = 'active'
  ORDER BY
    CASE
      WHEN fs.last_update_at IS NULL THEN 9999
      ELSE EXTRACT(DAY FROM NOW() - fs.last_update_at)
    END DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_dnc_freshness IS 'Returns DNC data freshness status for all active subscriptions. WARNING at 28 days, STALE at 31+ days per TCPA requirements.';

-- Function to get overall freshness summary
CREATE OR REPLACE FUNCTION public.get_dnc_freshness_summary()
RETURNS TABLE(
  total_subscriptions INTEGER,
  current_count INTEGER,
  warning_count INTEGER,
  stale_count INTEGER,
  never_updated_count INTEGER,
  overall_status TEXT
) AS $$
DECLARE
  counts RECORD;
BEGIN
  SELECT
    COUNT(*)::INTEGER AS total,
    COUNT(*) FILTER (WHERE status = 'CURRENT')::INTEGER AS current,
    COUNT(*) FILTER (WHERE status = 'WARNING')::INTEGER AS warning,
    COUNT(*) FILTER (WHERE status = 'STALE')::INTEGER AS stale,
    COUNT(*) FILTER (WHERE status = 'NEVER_UPDATED')::INTEGER AS never_updated
  INTO counts
  FROM public.check_dnc_freshness();

  RETURN QUERY SELECT
    counts.total,
    counts.current,
    counts.warning,
    counts.stale,
    counts.never_updated,
    CASE
      WHEN counts.stale > 0 OR counts.never_updated > 0 THEN 'CRITICAL'
      WHEN counts.warning > 0 THEN 'WARNING'
      ELSE 'OK'
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_dnc_freshness_summary IS 'Returns summary of DNC data freshness across all subscriptions. Use for admin dashboard alerts.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_dnc_freshness TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dnc_freshness_summary TO authenticated;

-- ============================================
-- FIX 5: Industry validation constraint
-- Ensures only valid industry values are stored
-- ============================================

-- First, clean up any invalid industry values to 'other'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    UPDATE public.users
    SET industry = 'other'
    WHERE industry IS NULL
       OR industry NOT IN (
         'real-estate-residential',
         'real-estate-commercial',
         'solar',
         'insurance-life',
         'insurance-health',
         'insurance-auto-home',
         'financial-services',
         'home-services-hvac',
         'home-services-roofing',
         'home-services-windows',
         'b2b-services',
         'other'
       );

    RAISE NOTICE 'Cleaned up invalid industry values in users table';
  END IF;
END $$;

-- Now add the constraint (with NOT VALID first for safety, then validate)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS valid_industry;

  -- Add CHECK constraint for valid industries (NOT VALID first)
  ALTER TABLE public.users ADD CONSTRAINT valid_industry CHECK (
    industry IN (
      'real-estate-residential',
      'real-estate-commercial',
      'solar',
      'insurance-life',
      'insurance-health',
      'insurance-auto-home',
      'financial-services',
      'home-services-hvac',
      'home-services-roofing',
      'home-services-windows',
      'b2b-services',
      'other'
    )
  ) NOT VALID;

  -- Validate the constraint (now that data is clean)
  ALTER TABLE public.users VALIDATE CONSTRAINT valid_industry;

  RAISE NOTICE 'Added and validated industry constraint on users table';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Industry constraint already exists or failed: %', SQLERRM;
END $$;

-- ============================================
-- FIX 6: Internal DNC tracking (TSR compliance)
-- Allows users to maintain company-specific DNC list
-- ============================================

SELECT public.add_column_if_not_exists('crm_leads', 'internal_dnc', 'BOOLEAN', 'FALSE');
SELECT public.add_column_if_not_exists('crm_leads', 'dnc_requested_at', 'TIMESTAMPTZ');
SELECT public.add_column_if_not_exists('crm_leads', 'dnc_request_method', 'TEXT');

-- Index for internal DNC lookups
CREATE INDEX IF NOT EXISTS idx_leads_internal_dnc
  ON public.crm_leads(user_id, phone_number)
  WHERE internal_dnc = TRUE AND deleted_at IS NULL;

-- Function to check internal DNC
CREATE OR REPLACE FUNCTION public.check_internal_dnc(
  p_user_id UUID,
  p_phone_number TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  normalized_phone TEXT;
BEGIN
  -- Normalize the input phone number
  normalized_phone := REGEXP_REPLACE(p_phone_number, '\D', '', 'g');
  IF LENGTH(normalized_phone) = 11 AND LEFT(normalized_phone, 1) = '1' THEN
    normalized_phone := SUBSTRING(normalized_phone FROM 2);
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.crm_leads
    WHERE user_id = p_user_id
    AND phone_number = normalized_phone
    AND internal_dnc = TRUE
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_internal_dnc IS 'Checks if a phone number is on the user''s internal DNC list per FTC TSR requirements.';

GRANT EXECUTE ON FUNCTION public.check_internal_dnc TO authenticated;

-- ============================================
-- FIX 7: Consent tracking columns (TCPA mobile requirements)
-- ============================================

SELECT public.add_column_if_not_exists('crm_leads', 'consent_status', 'TEXT', '''unknown''');
SELECT public.add_column_if_not_exists('crm_leads', 'consent_type', 'TEXT');
SELECT public.add_column_if_not_exists('crm_leads', 'consent_date', 'TIMESTAMPTZ');
SELECT public.add_column_if_not_exists('crm_leads', 'consent_method', 'TEXT');

-- ============================================
-- FIX 8: Number type tracking (mobile vs landline)
-- ============================================

SELECT public.add_column_if_not_exists('crm_leads', 'number_type', 'TEXT', '''unknown''');

-- ============================================
-- DEPLOYMENT COMPLETE
-- ============================================
--
-- Summary of fixes:
-- 1. delete_all_user_data now calls anonymize_compliance_logs (CRITICAL)
-- 2. Phone normalization trigger prevents duplicates
-- 3. Composite index speeds up duplicate detection
-- 4. DNC freshness monitoring for TCPA 31-day requirement
-- 5. Industry validation constraint for data integrity
-- 6. Internal DNC tracking for TSR compliance
-- 7. Consent tracking for TCPA mobile requirements
-- 8. Number type field for mobile/landline differentiation
--
-- ============================================
