import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

/**
 * Creates a Supabase admin client using the service role key.
 * ONLY use this server-side for operations requiring elevated privileges.
 * Never expose the service role key to the client.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable.
 *
 * @example
 * ```ts
 * // In an API route
 * import { createAdminClient } from '@/lib/supabase/admin'
 *
 * export async function POST() {
 *   const supabase = createAdminClient()
 *   // Perform admin operations that bypass RLS...
 * }
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
