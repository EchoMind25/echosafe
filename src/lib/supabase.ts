// =============================================================================
// SUPABASE CLIENT EXPORTS
// =============================================================================
//
// This file provides exports for CLIENT-SIDE Supabase usage only.
// For SERVER-SIDE (Server Components, Route Handlers), import from:
//   import { createClient } from '@/lib/supabase/server'
//
// For ADMIN operations (bypassing RLS), import from:
//   import { createAdminClient } from '@/lib/supabase/admin'
//
// =============================================================================

import { createClient } from './supabase/client'

// Client-side client (for 'use client' components)
// Re-export with explicit function to preserve type inference
export function createBrowserClient() {
  return createClient()
}

// Types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from './supabase/types'

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
