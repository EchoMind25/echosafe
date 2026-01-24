-- ============================================
-- SEED TEST DNC DATA - AREA CODE 801
-- Version: 1.0 | January 21, 2026
--
-- This creates ~1000 sample DNC records for testing
-- For full 50k+ records, use FTC data import
-- ============================================

-- ============================================
-- 1. SEED FTC SUBSCRIPTION FOR 801
-- ============================================
INSERT INTO public.ftc_subscriptions (
  area_code,
  state,
  subscription_status,
  subscribed_at,
  expires_at,
  annual_cost,
  total_records,
  notes
) VALUES (
  '801',
  'UT',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year',
  85.00,
  0,
  'Initial Utah area code for testing'
)
ON CONFLICT (area_code) DO UPDATE SET
  subscription_status = 'active',
  expires_at = NOW() + INTERVAL '1 year',
  updated_at = NOW();

-- Also add 385 and 435 for Utah coverage
INSERT INTO public.ftc_subscriptions (area_code, state, subscription_status, subscribed_at, expires_at, annual_cost, notes)
VALUES
  ('385', 'UT', 'active', NOW(), NOW() + INTERVAL '1 year', 85.00, 'Utah overlay'),
  ('435', 'UT', 'active', NOW(), NOW() + INTERVAL '1 year', 85.00, 'Southern Utah')
ON CONFLICT (area_code) DO UPDATE SET
  subscription_status = 'active',
  updated_at = NOW();

-- ============================================
-- 2. GENERATE SAMPLE DNC RECORDS
-- Creates 1000 realistic test records
-- ============================================

-- Function to generate random phone numbers
CREATE OR REPLACE FUNCTION generate_test_dnc_data(p_area_code TEXT, p_count INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  i INTEGER;
  phone TEXT;
  inserted INTEGER := 0;
BEGIN
  FOR i IN 1..p_count LOOP
    -- Generate random 7-digit number (exchange + subscriber)
    -- Avoid reserved exchanges (555, 911, etc.)
    phone := p_area_code ||
      LPAD((200 + (random() * 799)::INTEGER)::TEXT, 3, '0') ||
      LPAD((1000 + (random() * 8999)::INTEGER)::TEXT, 4, '0');

    BEGIN
      INSERT INTO public.dnc_registry (
        phone_number,
        area_code,
        state,
        registered_at,
        source,
        record_status,
        ftc_release_date
      ) VALUES (
        phone,
        p_area_code,
        'UT',
        NOW() - (random() * 365 || ' days')::INTERVAL,
        'ftc',
        'active',
        CURRENT_DATE - (random() * 30)::INTEGER
      );
      inserted := inserted + 1;
    EXCEPTION WHEN unique_violation THEN
      -- Skip duplicates
      CONTINUE;
    END;
  END LOOP;

  RETURN inserted;
END;
$$;

-- Generate test data for each Utah area code
DO $$
DECLARE
  count_801 INTEGER;
  count_385 INTEGER;
  count_435 INTEGER;
BEGIN
  -- Generate 1000 records for 801 (main test area)
  SELECT generate_test_dnc_data('801', 1000) INTO count_801;
  RAISE NOTICE 'Generated % DNC records for area code 801', count_801;

  -- Generate 500 records for 385
  SELECT generate_test_dnc_data('385', 500) INTO count_385;
  RAISE NOTICE 'Generated % DNC records for area code 385', count_385;

  -- Generate 300 records for 435
  SELECT generate_test_dnc_data('435', 300) INTO count_435;
  RAISE NOTICE 'Generated % DNC records for area code 435', count_435;

  -- Update subscription totals
  UPDATE public.ftc_subscriptions
  SET total_records = (SELECT COUNT(*) FROM public.dnc_registry WHERE area_code = '801')
  WHERE area_code = '801';

  UPDATE public.ftc_subscriptions
  SET total_records = (SELECT COUNT(*) FROM public.dnc_registry WHERE area_code = '385')
  WHERE area_code = '385';

  UPDATE public.ftc_subscriptions
  SET total_records = (SELECT COUNT(*) FROM public.dnc_registry WHERE area_code = '435')
  WHERE area_code = '435';
END $$;

-- ============================================
-- 3. ADD SAMPLE LITIGATORS
-- Known TCPA litigators for risk scoring
-- ============================================
INSERT INTO public.litigators (phone_number, name, case_count, last_case_date, risk_level, source, notes)
VALUES
  ('8015551234', 'Test Litigator 1', 5, CURRENT_DATE - 30, 'high', 'pacer', 'Test data'),
  ('8015552345', 'Test Litigator 2', 12, CURRENT_DATE - 15, 'extreme', 'pacer', 'Serial filer'),
  ('8015553456', 'Test Litigator 3', 3, CURRENT_DATE - 60, 'high', 'pacer', 'Test data'),
  ('3855551111', 'Test Litigator 4', 8, CURRENT_DATE - 45, 'high', 'pacer', 'Test data'),
  ('4355552222', 'Test Litigator 5', 2, CURRENT_DATE - 90, 'high', 'pacer', 'Test data')
ON CONFLICT (phone_number) DO UPDATE SET
  case_count = EXCLUDED.case_count,
  last_case_date = EXCLUDED.last_case_date,
  updated_at = NOW();

-- ============================================
-- 4. ADD SAMPLE DELETED NUMBERS
-- Recently removed from DNC for pattern detection
-- ============================================
INSERT INTO public.dnc_deleted_numbers (phone_number, area_code, state, deleted_from_dnc_date, times_added_removed, source)
VALUES
  ('8015559001', '801', 'UT', CURRENT_DATE - 10, 1, 'ftc'),
  ('8015559002', '801', 'UT', CURRENT_DATE - 20, 2, 'ftc'),  -- Pattern: added/removed twice
  ('8015559003', '801', 'UT', CURRENT_DATE - 5, 3, 'ftc'),   -- Suspicious: 3 times
  ('8015559004', '801', 'UT', CURRENT_DATE - 45, 1, 'ftc'),
  ('8015559005', '801', 'UT', CURRENT_DATE - 60, 2, 'ftc'),
  ('3855559001', '385', 'UT', CURRENT_DATE - 15, 1, 'ftc'),
  ('4355559001', '435', 'UT', CURRENT_DATE - 30, 1, 'ftc')
ON CONFLICT (phone_number) DO UPDATE SET
  times_added_removed = EXCLUDED.times_added_removed,
  deleted_from_dnc_date = EXCLUDED.deleted_from_dnc_date,
  updated_at = NOW();

-- ============================================
-- 5. VERIFY DATA
-- ============================================
DO $$
DECLARE
  dnc_count INTEGER;
  litigator_count INTEGER;
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO dnc_count FROM public.dnc_registry;
  SELECT COUNT(*) INTO litigator_count FROM public.litigators;
  SELECT COUNT(*) INTO deleted_count FROM public.dnc_deleted_numbers;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST DATA SEED COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DNC Registry records: %', dnc_count;
  RAISE NOTICE 'Litigator records: %', litigator_count;
  RAISE NOTICE 'Deleted number records: %', deleted_count;
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 6. TEST FUNCTIONS
-- ============================================

-- Test check_dnc function
DO $$
DECLARE
  test_phone TEXT;
  is_dnc BOOLEAN;
BEGIN
  -- Get a random phone from the registry
  SELECT phone_number INTO test_phone FROM public.dnc_registry LIMIT 1;

  IF test_phone IS NOT NULL THEN
    SELECT public.check_dnc(test_phone) INTO is_dnc;
    RAISE NOTICE 'Test check_dnc(%): %', test_phone, is_dnc;

    IF NOT is_dnc THEN
      RAISE WARNING 'check_dnc function may not be working correctly!';
    ELSE
      RAISE NOTICE 'check_dnc function: PASSED';
    END IF;
  ELSE
    RAISE WARNING 'No DNC records found to test!';
  END IF;
END $$;

-- Test get_risk_score function
DO $$
DECLARE
  test_score INTEGER;
BEGIN
  -- Test with a known litigator
  SELECT public.get_risk_score('8015551234') INTO test_score;
  RAISE NOTICE 'Test get_risk_score for litigator: % (expected: 25+)', test_score;

  IF test_score < 25 THEN
    RAISE WARNING 'get_risk_score may not be detecting litigators correctly!';
  ELSE
    RAISE NOTICE 'get_risk_score function: PASSED';
  END IF;
END $$;

-- Cleanup the helper function
DROP FUNCTION IF EXISTS generate_test_dnc_data(TEXT, INTEGER);

-- ============================================
-- SEED COMPLETE
-- Run manual verification:
-- SELECT COUNT(*) FROM dnc_registry WHERE area_code = '801';
-- SELECT * FROM check_dnc('8015551234');  -- Should test a DNC number
-- SELECT * FROM get_risk_score('8015551234');  -- Should show litigator risk
-- ============================================
