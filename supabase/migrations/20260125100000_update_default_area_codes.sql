-- ============================================
-- Migration: Update Default Area Codes to 5 (Utah + Nevada)
-- Date: 2026-01-25
-- Description: Phase 1 launch - Update all users to have 5 area codes
--              Utah (801, 385, 435) + Nevada (702, 775)
-- ============================================

-- 1. Update the default value for new users
ALTER TABLE public.users
ALTER COLUMN area_codes
SET DEFAULT '["801", "385", "435", "702", "775"]'::jsonb;

-- 2. Update all existing users to have the new 5 area codes
-- This ensures all users get the Nevada coverage addition
UPDATE public.users
SET area_codes = '["801", "385", "435", "702", "775"]'::jsonb,
    updated_at = NOW()
WHERE area_codes IS NULL
   OR area_codes = '["801", "385", "435"]'::jsonb
   OR jsonb_array_length(area_codes) < 5;

-- 3. Update the get_user_area_codes function to use new defaults
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
  -- Updated default to include Nevada (702, 775)
  RETURN COALESCE(codes, ARRAY['801', '385', '435', '702', '775']::TEXT[]);
END;
$$;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Updated default area codes to Utah + Nevada (5 codes)';
  RAISE NOTICE 'Users now have coverage for: 801, 385, 435 (Utah) + 702, 775 (Nevada)';
END $$;
