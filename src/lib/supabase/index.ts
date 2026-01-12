// =============================================================================
// Supabase Client Exports
// =============================================================================

// Client-side client (for 'use client' components)
// Note: The actual function is named createClient, we re-export as createBrowserClient for clarity
import { createClient as browserClient } from './client'
export const createBrowserClient = browserClient

// Server-side client (for Server Components and Route Handlers)
import { createClient as serverClient } from './server'
export const createServerClient = serverClient

// Admin client (for server-side operations requiring elevated privileges)
export { createAdminClient } from './admin'

// Types
export type { Database, Tables, TablesInsert, TablesUpdate } from './types'

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validates that Supabase environment variables are configured.
 * Returns true if valid, false if using placeholder/missing values.
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'your-project-url' &&
    supabaseAnonKey !== 'your-anon-key' &&
    supabaseUrl.includes('supabase.co')
  )
}
