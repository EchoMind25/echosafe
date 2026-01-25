-- ============================================
-- ADD PENDING LEADS COLUMN FOR RETRY FUNCTIONALITY
-- Stores leads temporarily so failed jobs can be retried
-- ============================================

-- Add pending_leads column to upload_history
SELECT public.add_column_if_not_exists(
  'upload_history',
  'pending_leads',
  'JSONB',
  'NULL'
);

-- Add retry_count to track retry attempts
SELECT public.add_column_if_not_exists(
  'upload_history',
  'retry_count',
  'INTEGER',
  '0'
);

-- Add last_retry_at timestamp
SELECT public.add_column_if_not_exists(
  'upload_history',
  'last_retry_at',
  'TIMESTAMPTZ',
  'NULL'
);

-- Comment explaining the column
COMMENT ON COLUMN public.upload_history.pending_leads IS 'Temporarily stores leads for retry functionality. Cleared after successful processing or 24 hours.';
COMMENT ON COLUMN public.upload_history.retry_count IS 'Number of retry attempts for this job.';
COMMENT ON COLUMN public.upload_history.last_retry_at IS 'Timestamp of the last retry attempt.';
