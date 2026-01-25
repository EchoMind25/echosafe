-- ============================================================================
-- ECHO SAFE - TRIAL SYSTEM MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to users table
-- ============================================================================

-- Add trial_started_at column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'trial_started_at'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN trial_started_at TIMESTAMPTZ DEFAULT NULL;
  END IF;
END $$;

-- Add trial_leads_used column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'trial_leads_used'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN trial_leads_used INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add trial_uploads_count column (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name = 'trial_uploads_count'
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN trial_uploads_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Initialize trial data for existing users
-- ============================================================================

-- Set trial_started_at for existing trialing users who don't have it
UPDATE public.users
SET trial_started_at = created_at
WHERE subscription_status = 'trialing'
AND trial_started_at IS NULL;

-- Set trial_ends_at for existing trialing users who don't have it
UPDATE public.users
SET trial_ends_at = created_at + INTERVAL '7 days'
WHERE subscription_status = 'trialing'
AND trial_ends_at IS NULL;

-- ============================================================================
-- STEP 3: Create RPC function - get_trial_status
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_trial_status(p_user_id UUID)
RETURNS TABLE (
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
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_max_leads CONSTANT INTEGER := 1000;
  v_max_uploads CONSTANT INTEGER := 5;
  v_trial_days CONSTANT INTEGER := 7;
BEGIN
  -- Get user data
  SELECT
    u.subscription_status,
    u.trial_started_at,
    u.trial_ends_at,
    COALESCE(u.trial_leads_used, 0) as trial_leads_used,
    COALESCE(u.trial_uploads_count, 0) as trial_uploads_count
  INTO v_user
  FROM public.users u
  WHERE u.id = p_user_id;

  -- If user not found, return empty result
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate trial status
  is_on_trial := v_user.subscription_status = 'trialing';
  trial_expired := v_user.trial_ends_at IS NOT NULL AND v_user.trial_ends_at <= NOW();
  leads_limit_reached := v_user.trial_leads_used >= v_max_leads;
  uploads_limit_reached := v_user.trial_uploads_count >= v_max_uploads;
  is_trial_active := is_on_trial AND NOT trial_expired AND NOT leads_limit_reached AND NOT uploads_limit_reached;

  -- Calculate remaining
  trial_leads_used := v_user.trial_leads_used;
  trial_leads_remaining := GREATEST(0, v_max_leads - v_user.trial_leads_used);
  trial_uploads_count := v_user.trial_uploads_count;
  trial_uploads_remaining := GREATEST(0, v_max_uploads - v_user.trial_uploads_count);

  -- Calculate days remaining
  IF v_user.trial_ends_at IS NOT NULL AND v_user.trial_ends_at > NOW() THEN
    days_remaining := CEIL(EXTRACT(EPOCH FROM (v_user.trial_ends_at - NOW())) / 86400)::INTEGER;
  ELSE
    days_remaining := 0;
  END IF;

  trial_started_at := v_user.trial_started_at;
  trial_ends_at := v_user.trial_ends_at;
  subscription_status := v_user.subscription_status;

  RETURN NEXT;
END;
$$;

-- ============================================================================
-- STEP 4: Create RPC function - can_user_upload
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_user_upload(p_user_id UUID, p_lead_count INTEGER)
RETURNS TABLE (
  can_upload BOOLEAN,
  reason TEXT,
  leads_would_use INTEGER,
  leads_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_max_leads CONSTANT INTEGER := 1000;
  v_max_uploads CONSTANT INTEGER := 5;
BEGIN
  -- Get user data
  SELECT
    u.subscription_status,
    u.trial_ends_at,
    COALESCE(u.trial_leads_used, 0) as trial_leads_used,
    COALESCE(u.trial_uploads_count, 0) as trial_uploads_count
  INTO v_user
  FROM public.users u
  WHERE u.id = p_user_id;

  -- If user not found
  IF NOT FOUND THEN
    can_upload := FALSE;
    reason := 'User not found';
    leads_would_use := p_lead_count;
    leads_remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Active subscribers can always upload
  IF v_user.subscription_status = 'active' THEN
    can_upload := TRUE;
    reason := NULL;
    leads_would_use := p_lead_count;
    leads_remaining := 999999;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Not on trial = needs subscription
  IF v_user.subscription_status != 'trialing' THEN
    can_upload := FALSE;
    reason := 'Subscription required';
    leads_would_use := p_lead_count;
    leads_remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Trial expired
  IF v_user.trial_ends_at IS NOT NULL AND v_user.trial_ends_at <= NOW() THEN
    can_upload := FALSE;
    reason := 'Trial period has expired. Subscribe to continue.';
    leads_would_use := p_lead_count;
    leads_remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Uploads limit reached
  IF v_user.trial_uploads_count >= v_max_uploads THEN
    can_upload := FALSE;
    reason := 'Trial upload limit reached (' || v_max_uploads || ' uploads). Subscribe to continue.';
    leads_would_use := p_lead_count;
    leads_remaining := 0;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Calculate leads remaining
  leads_remaining := GREATEST(0, v_max_leads - v_user.trial_leads_used);
  leads_would_use := p_lead_count;

  -- Leads limit already reached
  IF leads_remaining <= 0 THEN
    can_upload := FALSE;
    reason := 'Trial lead limit reached (' || v_max_leads || ' leads). Subscribe to continue.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- Would exceed leads limit
  IF p_lead_count > leads_remaining THEN
    can_upload := FALSE;
    reason := 'This upload has ' || p_lead_count || ' leads but you only have ' || leads_remaining || ' trial leads remaining.';
    RETURN NEXT;
    RETURN;
  END IF;

  -- All checks passed
  can_upload := TRUE;
  reason := NULL;
  RETURN NEXT;
END;
$$;

-- ============================================================================
-- STEP 5: Create RPC function - increment_trial_usage
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_trial_usage(p_user_id UUID, p_leads_processed INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_status TEXT;
BEGIN
  -- Get current subscription status
  SELECT subscription_status INTO v_subscription_status
  FROM public.users
  WHERE id = p_user_id;

  -- If user not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only update for trialing users
  IF v_subscription_status != 'trialing' THEN
    RETURN TRUE; -- Active subscribers don't track trial usage
  END IF;

  -- Update trial counters
  UPDATE public.users
  SET
    trial_leads_used = COALESCE(trial_leads_used, 0) + p_leads_processed,
    trial_uploads_count = COALESCE(trial_uploads_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- STEP 6: Grant execute permissions
-- ============================================================================

-- Allow authenticated users to call these functions
GRANT EXECUTE ON FUNCTION public.get_trial_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_upload(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_trial_usage(UUID, INTEGER) TO service_role;

-- ============================================================================
-- STEP 7: Create index for better query performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON public.users(trial_ends_at) WHERE trial_ends_at IS NOT NULL;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration worked)
-- ============================================================================

-- Check if columns exist:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'users'
-- AND column_name IN ('trial_started_at', 'trial_leads_used', 'trial_uploads_count');

-- Check if functions exist:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND routine_name IN ('get_trial_status', 'can_user_upload', 'increment_trial_usage');

-- Test get_trial_status (replace with an actual user ID):
-- SELECT * FROM get_trial_status('00000000-0000-0000-0000-000000000000'::uuid);

-- Test can_user_upload (replace with an actual user ID):
-- SELECT * FROM can_user_upload('00000000-0000-0000-0000-000000000000'::uuid, 100);
