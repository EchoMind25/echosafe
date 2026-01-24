-- ============================================
-- FTC Daily Change List System Migration
-- Version: 1.2 (January 17, 2026)
--
-- IDEMPOTENT: Safe to re-run on existing databases.
--
-- This migration adds support for:
-- 1. dnc_deleted_numbers - 90-day retention for AI pattern detection
-- 2. ftc_change_lists - Track upload/processing of FTC change lists
-- 3. Updates to ftc_subscriptions - Enhanced monitoring fields
-- ============================================

-- ============================================
-- 1. DNC DELETED NUMBERS TABLE
-- Tracks numbers removed from DNC for 90 days
-- Used for AI pattern detection (recently removed, frequent add/remove)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dnc_deleted_numbers (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  area_code TEXT NOT NULL,
  state TEXT,

  -- When the number was removed from DNC
  deleted_from_dnc_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Original date when number was first added to DNC (for pattern analysis)
  original_add_date TIMESTAMPTZ,

  -- AI pattern detection: how many times this number has been added/removed
  times_added_removed INTEGER DEFAULT 1,
  last_pattern_check TIMESTAMPTZ,

  -- Automatic cleanup after 90 days
  delete_after TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),

  -- Metadata
  source TEXT DEFAULT 'ftc',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique phone numbers (we track one record per number)
  CONSTRAINT dnc_deleted_numbers_phone_unique UNIQUE (phone_number)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_dnc_deleted_area_code
  ON public.dnc_deleted_numbers(area_code);

CREATE INDEX IF NOT EXISTS idx_dnc_deleted_date
  ON public.dnc_deleted_numbers(deleted_from_dnc_date DESC);

CREATE INDEX IF NOT EXISTS idx_dnc_deleted_cleanup
  ON public.dnc_deleted_numbers(delete_after)
  WHERE delete_after <= NOW();

CREATE INDEX IF NOT EXISTS idx_dnc_deleted_pattern
  ON public.dnc_deleted_numbers(times_added_removed)
  WHERE times_added_removed > 1;

CREATE INDEX IF NOT EXISTS idx_dnc_deleted_phone
  ON public.dnc_deleted_numbers(phone_number);

-- Comment on table
COMMENT ON TABLE public.dnc_deleted_numbers IS
  'Tracks phone numbers recently removed from DNC registry for 90-day AI pattern detection. Numbers that appear/disappear repeatedly indicate suspicious patterns.';

-- ============================================
-- 2. FTC CHANGE LISTS TABLE
-- Tracks admin uploads of FTC daily change lists
-- ============================================

CREATE TABLE IF NOT EXISTS public.ftc_change_lists (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  -- Change list metadata
  change_type TEXT NOT NULL CHECK (change_type IN ('additions', 'deletions')),
  ftc_file_date DATE NOT NULL,
  area_codes TEXT[] NOT NULL,

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Results tracking
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,

  -- Progress tracking (for large files)
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  estimated_completion TIMESTAMPTZ,
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER DEFAULT 0,

  -- File information
  file_url TEXT,
  file_name TEXT,
  file_size_bytes BIGINT,
  file_hash TEXT, -- MD5/SHA hash to detect duplicate uploads

  -- Admin tracking
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,

  -- Processing metadata
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ftc_changes_date
  ON public.ftc_change_lists(ftc_file_date DESC);

CREATE INDEX IF NOT EXISTS idx_ftc_changes_status
  ON public.ftc_change_lists(status);

CREATE INDEX IF NOT EXISTS idx_ftc_changes_type
  ON public.ftc_change_lists(change_type);

CREATE INDEX IF NOT EXISTS idx_ftc_changes_uploaded_by
  ON public.ftc_change_lists(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_ftc_changes_created
  ON public.ftc_change_lists(created_at DESC);

-- Prevent duplicate uploads of same file
CREATE INDEX IF NOT EXISTS idx_ftc_changes_hash
  ON public.ftc_change_lists(file_hash)
  WHERE file_hash IS NOT NULL;

-- Comment on table
COMMENT ON TABLE public.ftc_change_lists IS
  'Tracks admin uploads of FTC daily change lists (additions and deletions). Supports background processing with progress tracking.';

-- ============================================
-- 3. UPDATE FTC_SUBSCRIPTIONS TABLE
-- Add new fields for PRD v1.2 requirements
-- ============================================

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add auto_renew column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ftc_subscriptions'
    AND column_name = 'auto_renew'
  ) THEN
    ALTER TABLE public.ftc_subscriptions ADD COLUMN auto_renew BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add renewal_reminder_sent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ftc_subscriptions'
    AND column_name = 'renewal_reminder_sent'
  ) THEN
    ALTER TABLE public.ftc_subscriptions ADD COLUMN renewal_reminder_sent BOOLEAN DEFAULT FALSE;
  END IF;

  -- Add renewal_reminder_sent_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ftc_subscriptions'
    AND column_name = 'renewal_reminder_sent_at'
  ) THEN
    ALTER TABLE public.ftc_subscriptions ADD COLUMN renewal_reminder_sent_at TIMESTAMPTZ;
  END IF;

  -- Add total_records column (current count of DNC records for this area code)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ftc_subscriptions'
    AND column_name = 'total_records'
  ) THEN
    ALTER TABLE public.ftc_subscriptions ADD COLUMN total_records INTEGER DEFAULT 0;
  END IF;

  -- Add last_change_list_id column (reference to most recent change list)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ftc_subscriptions'
    AND column_name = 'last_change_list_id'
  ) THEN
    ALTER TABLE public.ftc_subscriptions ADD COLUMN last_change_list_id UUID;
  END IF;
END $$;

-- Add index for expiring subscriptions (for renewal alerts)
CREATE INDEX IF NOT EXISTS idx_ftc_sub_expiring
  ON public.ftc_subscriptions(expires_at)
  WHERE subscription_status = 'active';

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to check if a number was recently removed from DNC (within 90 days)
CREATE OR REPLACE FUNCTION public.was_recently_removed_from_dnc(phone_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.dnc_deleted_numbers
    WHERE phone_number = phone_num
    AND deleted_from_dnc_date >= CURRENT_DATE - INTERVAL '90 days'
  );
END;
$$;

-- Function to get the add/remove count for pattern detection
CREATE OR REPLACE FUNCTION public.get_dnc_pattern_count(phone_num TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pattern_count INTEGER;
BEGIN
  SELECT times_added_removed INTO pattern_count
  FROM public.dnc_deleted_numbers
  WHERE phone_number = phone_num;

  RETURN COALESCE(pattern_count, 0);
END;
$$;

-- Function to clean up old deleted numbers (older than 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_numbers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.dnc_deleted_numbers
  WHERE delete_after <= NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to process a DNC deletion (move from registry to deleted tracking)
CREATE OR REPLACE FUNCTION public.process_dnc_deletion(phone_num TEXT, p_area_code TEXT, p_state TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_record RECORD;
BEGIN
  -- Check if number already exists in deleted tracking
  SELECT * INTO existing_record
  FROM public.dnc_deleted_numbers
  WHERE phone_number = phone_num;

  IF existing_record IS NOT NULL THEN
    -- Increment the add/remove counter (suspicious pattern)
    UPDATE public.dnc_deleted_numbers
    SET
      times_added_removed = times_added_removed + 1,
      deleted_from_dnc_date = CURRENT_DATE,
      delete_after = NOW() + INTERVAL '90 days',
      updated_at = NOW()
    WHERE phone_number = phone_num;
  ELSE
    -- First time being deleted, create new tracking record
    INSERT INTO public.dnc_deleted_numbers (
      phone_number,
      area_code,
      state,
      deleted_from_dnc_date,
      times_added_removed
    ) VALUES (
      phone_num,
      p_area_code,
      p_state,
      CURRENT_DATE,
      1
    );
  END IF;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.was_recently_removed_from_dnc(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dnc_pattern_count(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_deleted_numbers() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_dnc_deletion(TEXT, TEXT, TEXT) TO service_role;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE public.dnc_deleted_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ftc_change_lists ENABLE ROW LEVEL SECURITY;

-- DNC Deleted Numbers: Read-only for authenticated users (for AI scoring)
DROP POLICY IF EXISTS "Authenticated users can read deleted numbers" ON public.dnc_deleted_numbers;
CREATE POLICY "Authenticated users can read deleted numbers"
  ON public.dnc_deleted_numbers
  FOR SELECT
  TO authenticated
  USING (true);

-- DNC Deleted Numbers: Only admins can modify
DROP POLICY IF EXISTS "Admins can manage deleted numbers" ON public.dnc_deleted_numbers;
CREATE POLICY "Admins can manage deleted numbers"
  ON public.dnc_deleted_numbers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- FTC Change Lists: Only admins can view and manage
DROP POLICY IF EXISTS "Admins can view change lists" ON public.ftc_change_lists;
CREATE POLICY "Admins can view change lists"
  ON public.ftc_change_lists
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage change lists" ON public.ftc_change_lists;
CREATE POLICY "Admins can manage change lists"
  ON public.ftc_change_lists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ============================================
-- 6. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to dnc_deleted_numbers
DROP TRIGGER IF EXISTS update_dnc_deleted_numbers_updated_at ON public.dnc_deleted_numbers;
CREATE TRIGGER update_dnc_deleted_numbers_updated_at
  BEFORE UPDATE ON public.dnc_deleted_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to ftc_change_lists
DROP TRIGGER IF EXISTS update_ftc_change_lists_updated_at ON public.ftc_change_lists;
CREATE TRIGGER update_ftc_change_lists_updated_at
  BEFORE UPDATE ON public.ftc_change_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.dnc_deleted_numbers.times_added_removed IS
  'Number of times this phone has been added to and removed from DNC. Values >2 indicate suspicious pattern.';

COMMENT ON COLUMN public.dnc_deleted_numbers.delete_after IS
  'Automatic cleanup date. Records are deleted after 90 days to keep table size manageable.';

COMMENT ON COLUMN public.ftc_change_lists.change_type IS
  'Type of FTC change list: additions (new DNC numbers) or deletions (removed numbers)';

COMMENT ON COLUMN public.ftc_change_lists.progress_percent IS
  'Processing progress 0-100%. Used for real-time UI updates during large file processing.';

COMMENT ON COLUMN public.ftc_change_lists.file_hash IS
  'MD5/SHA hash of uploaded file to prevent duplicate processing of same file.';
