-- ============================================================================
-- MIGRATION: Add State Column to DNC Registry
-- Version: 001
-- Date: January 9, 2026
-- Description: Adds state column for state-based DNC queries
-- ============================================================================

-- Add state column to dnc_registry (nullable - will be populated)
ALTER TABLE dnc_registry
ADD COLUMN IF NOT EXISTS state TEXT;

-- Add index for state filtering (fast state-based queries)
CREATE INDEX IF NOT EXISTS idx_dnc_state ON dnc_registry(state);

-- Add composite index for state + area_code queries
CREATE INDEX IF NOT EXISTS idx_dnc_state_area ON dnc_registry(state, area_code);

-- Add composite index for state + phone lookups
CREATE INDEX IF NOT EXISTS idx_dnc_state_phone ON dnc_registry(state, phone_number);

-- Update existing rows to set state based on area code
-- This handles any existing Utah data (801, 385, 435)
UPDATE dnc_registry
SET state = 'UT'
WHERE area_code IN ('801', '385', '435')
AND state IS NULL;

-- Update existing rows for other common area codes (if they exist)
-- Arizona
UPDATE dnc_registry
SET state = 'AZ'
WHERE area_code IN ('602', '480', '520', '928')
AND state IS NULL;

-- Nevada
UPDATE dnc_registry
SET state = 'NV'
WHERE area_code IN ('702', '725')
AND state IS NULL;

-- Colorado
UPDATE dnc_registry
SET state = 'CO'
WHERE area_code IN ('303', '719', '720', '970')
AND state IS NULL;

-- Idaho
UPDATE dnc_registry
SET state = 'ID'
WHERE area_code IN ('208', '986')
AND state IS NULL;

-- Wyoming
UPDATE dnc_registry
SET state = 'WY'
WHERE area_code = '307'
AND state IS NULL;

-- New Mexico
UPDATE dnc_registry
SET state = 'NM'
WHERE area_code IN ('505', '575')
AND state IS NULL;

-- Add documentation comment
COMMENT ON COLUMN dnc_registry.state IS 'Two-letter state abbreviation (e.g., UT, AZ, NV). Auto-populated from area code if not provided.';

-- ============================================================================
-- HELPER FUNCTION: Auto-populate state from area code
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_populate_dnc_state()
RETURNS TRIGGER AS $$
BEGIN
  -- If state is not provided, auto-populate from area code
  IF NEW.state IS NULL THEN
    NEW.state := CASE NEW.area_code
      -- Utah
      WHEN '801' THEN 'UT'
      WHEN '385' THEN 'UT'
      WHEN '435' THEN 'UT'
      -- Arizona
      WHEN '602' THEN 'AZ'
      WHEN '480' THEN 'AZ'
      WHEN '520' THEN 'AZ'
      WHEN '928' THEN 'AZ'
      -- Nevada
      WHEN '702' THEN 'NV'
      WHEN '725' THEN 'NV'
      -- Colorado
      WHEN '303' THEN 'CO'
      WHEN '719' THEN 'CO'
      WHEN '720' THEN 'CO'
      WHEN '970' THEN 'CO'
      -- Idaho
      WHEN '208' THEN 'ID'
      WHEN '986' THEN 'ID'
      -- Wyoming
      WHEN '307' THEN 'WY'
      -- New Mexico
      WHEN '505' THEN 'NM'
      WHEN '575' THEN 'NM'
      ELSE NULL
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-populate state on insert
DROP TRIGGER IF EXISTS dnc_auto_populate_state ON dnc_registry;
CREATE TRIGGER dnc_auto_populate_state
  BEFORE INSERT ON dnc_registry
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_dnc_state();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify state column exists
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'dnc_registry' AND column_name = 'state';

-- Check state distribution
-- SELECT state, COUNT(*) as count
-- FROM dnc_registry
-- GROUP BY state
-- ORDER BY state;

-- Check area code to state mapping
-- SELECT area_code, state, COUNT(*)
-- FROM dnc_registry
-- GROUP BY area_code, state
-- ORDER BY area_code;

-- Verify indexes created
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'dnc_registry' AND indexname LIKE 'idx_dnc_state%';

-- Test state query performance (should be fast with index)
-- EXPLAIN ANALYZE SELECT * FROM dnc_registry WHERE state = 'UT' LIMIT 100;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

-- To rollback this migration:
-- DROP TRIGGER IF EXISTS dnc_auto_populate_state ON dnc_registry;
-- DROP FUNCTION IF EXISTS auto_populate_dnc_state();
-- DROP INDEX IF EXISTS idx_dnc_state_phone;
-- DROP INDEX IF EXISTS idx_dnc_state_area;
-- DROP INDEX IF EXISTS idx_dnc_state;
-- ALTER TABLE dnc_registry DROP COLUMN IF EXISTS state;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
