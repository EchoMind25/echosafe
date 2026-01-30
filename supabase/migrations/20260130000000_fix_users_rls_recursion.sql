-- ============================================================================
-- Fix recursive RLS policy on users table
-- ============================================================================
-- The "Admins can view all users" policy queries the users table to check
-- is_admin, but RLS is being evaluated on that same table, causing a
-- recursive loop and 500 errors on every users query.
--
-- Fix: Use a SECURITY DEFINER function that bypasses RLS to check admin status.
-- ============================================================================

-- Create a helper function that checks admin status without triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.users WHERE id = check_user_id),
    false
  );
$$;

-- Replace the recursive admin policy with one that uses the helper function
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));
