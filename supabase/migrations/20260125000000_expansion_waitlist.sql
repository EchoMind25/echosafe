-- ============================================================================
-- EXPANSION WAITLIST TABLE
-- Stores emails of users interested in the area code expansion feature
-- Created: 2026-01-25
-- Re-enable contributions: Set ENABLE_CONTRIBUTIONS=true in environment
-- ============================================================================

-- Create the expansion_waitlist table
CREATE TABLE IF NOT EXISTS public.expansion_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ, -- When we notified them about launch
  converted_at TIMESTAMPTZ, -- When they became a contributor
  source TEXT DEFAULT 'pricing_page', -- Where they signed up from
  notes TEXT
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_expansion_waitlist_email
ON public.expansion_waitlist(email);

-- Create index for notification status
CREATE INDEX IF NOT EXISTS idx_expansion_waitlist_notified
ON public.expansion_waitlist(notified_at)
WHERE notified_at IS NULL;

-- Add RLS policies
ALTER TABLE public.expansion_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (public signup)
CREATE POLICY "Anyone can join waitlist"
ON public.expansion_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read the waitlist
CREATE POLICY "Admins can read waitlist"
ON public.expansion_waitlist
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Only admins can update waitlist entries
CREATE POLICY "Admins can update waitlist"
ON public.expansion_waitlist
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Comment on table
COMMENT ON TABLE public.expansion_waitlist IS
'Stores emails of users interested in the area code expansion/contribution feature. Feature launches Q2 2026.';
