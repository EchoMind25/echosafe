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

/**
 * Ensures a user record exists in the users table.
 * This is a fallback for when the database trigger fails to create the user.
 * Uses upsert to handle race conditions safely.
 */
export async function ensureUserExists(userId: string, email: string, metadata?: {
  full_name?: string
  avatar_url?: string
  industry?: string
}): Promise<boolean> {
  const adminClient = createAdminClient()

  try {
    const { error } = await adminClient
      .from('users')
      .upsert({
        id: userId,
        email: email,
        full_name: metadata?.full_name || email.split('@')[0],
        avatar_url: metadata?.avatar_url || null,
        industry: metadata?.industry || 'real-estate-residential',
        subscription_status: 'trialing',
        trial_started_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        trial_leads_used: 0,
        trial_uploads_count: 0,
        preferences: {
          email_notifications: true,
          sync_to_crm_auto: true,
          include_risky_in_downloads: false,
          ai_insights_enabled: true,
          duplicate_check_enabled: true,
          theme: 'light'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: true, // Don't update if exists
      })

    if (error) {
      console.error('[ensureUserExists] Failed to create user:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[ensureUserExists] Error:', err)
    return false
  }
}
