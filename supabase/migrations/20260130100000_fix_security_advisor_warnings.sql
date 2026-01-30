-- ============================================================================
-- Fix Supabase Security Advisor warnings
-- ============================================================================
-- 1. Set search_path on all functions with mutable search_path
-- 2. Move pg_trgm extension out of public schema
-- 3. Tighten unrestricted RLS policy on compliance_audit_logs
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fix mutable search_path on all public functions
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.anonymize_compliance_logs(uuid) SET search_path = public;
ALTER FUNCTION public.add_constraint_if_not_exists(text, text, text) SET search_path = public;
ALTER FUNCTION public.delete_all_user_data(uuid) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.cleanup_old_deleted_numbers() SET search_path = public;
ALTER FUNCTION public.check_internal_dnc(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_dnc_freshness_summary() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.log_compliance_check(uuid, text, text, text, text, integer, text, text, uuid, jsonb, text, inet, text) SET search_path = public;
ALTER FUNCTION public.was_recently_removed_from_dnc(text) SET search_path = public;
ALTER FUNCTION public.check_dnc(text) SET search_path = public;
ALTER FUNCTION public.add_column_if_not_exists(text, text, text, text) SET search_path = public;
ALTER FUNCTION public.get_risk_score(text) SET search_path = public;
ALTER FUNCTION public.normalize_phone_before_insert() SET search_path = public;
ALTER FUNCTION public.get_user_area_codes(uuid) SET search_path = public;
ALTER FUNCTION public.create_index_if_column_exists(text, text, text, boolean) SET search_path = public;
ALTER FUNCTION public.daily_privacy_cleanup() SET search_path = public;
ALTER FUNCTION public.purge_expired_audit_logs() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_data() SET search_path = public;
ALTER FUNCTION public.bulk_check_dnc(text[]) SET search_path = public;
ALTER FUNCTION public.update_leads_search_vector() SET search_path = public;
ALTER FUNCTION public.check_dnc_freshness() SET search_path = public;
ALTER FUNCTION public.get_dnc_pattern_count(text) SET search_path = public;

-- ---------------------------------------------------------------------------
-- 2. Move pg_trgm extension to the extensions schema
-- ---------------------------------------------------------------------------
-- Supabase provides an "extensions" schema for this purpose
ALTER EXTENSION pg_trgm SET SCHEMA extensions;

-- ---------------------------------------------------------------------------
-- 3. Tighten the unrestricted INSERT policy on compliance_audit_logs
-- ---------------------------------------------------------------------------
-- Current policy has WITH CHECK (true) which bypasses RLS for all authenticated.
-- Replace with a policy scoped to service_role only (system-level inserts).
DROP POLICY IF EXISTS "System can insert audit logs" ON public.compliance_audit_logs;
CREATE POLICY "System can insert audit logs"
  ON public.compliance_audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
