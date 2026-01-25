// ============================================================================
// TRIAL ABUSE PREVENTION - SERVER-SIDE SERVICE
// Database interactions for trial checking and usage tracking
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { createAdminClient, ensureUserExists } from '@/lib/supabase/admin'
import type { TrialStatus, CanUploadResult } from './index'
import { TRIAL_LIMITS } from './index'

// ============================================================================
// RPC RESPONSE TYPES
// ============================================================================

interface TrialStatusRpcResponse {
  is_on_trial: boolean
  is_trial_active: boolean
  trial_expired: boolean
  leads_limit_reached: boolean
  uploads_limit_reached: boolean
  trial_leads_used: number
  trial_leads_remaining: number
  trial_uploads_count: number
  trial_uploads_remaining: number
  trial_started_at: string | null
  trial_ends_at: string | null
  days_remaining: number
  subscription_status: string
}

interface CanUploadRpcResponse {
  can_upload: boolean
  reason: string | null
  leads_would_use: number
  leads_remaining: number
}

// ============================================================================
// DATABASE FUNCTIONS
// ============================================================================

/**
 * Get trial status from database (server-side)
 * Uses the get_trial_status database function for consistency
 */
export async function getTrialStatusFromDB(userId: string): Promise<TrialStatus | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_trial_status', { p_user_id: userId })
    .single()

  if (error) {
    console.error('Error fetching trial status:', error)
    return null
  }

  if (!data) {
    return null
  }

  // Cast to expected type - the RPC function returns this structure
  const result = data as unknown as TrialStatusRpcResponse

  return {
    isOnTrial: result.is_on_trial,
    isTrialActive: result.is_trial_active,
    trialExpired: result.trial_expired,
    leadsLimitReached: result.leads_limit_reached,
    uploadsLimitReached: result.uploads_limit_reached,
    trialLeadsUsed: result.trial_leads_used,
    trialLeadsRemaining: result.trial_leads_remaining,
    trialUploadsCount: result.trial_uploads_count,
    trialUploadsRemaining: result.trial_uploads_remaining,
    trialStartedAt: result.trial_started_at ? new Date(result.trial_started_at) : null,
    trialEndsAt: result.trial_ends_at ? new Date(result.trial_ends_at) : null,
    daysRemaining: result.days_remaining,
    subscriptionStatus: result.subscription_status,
  }
}

/**
 * Check if user can upload (server-side)
 * Uses the can_user_upload database function for authoritative check
 */
export async function canUserUpload(
  userId: string,
  leadCount: number
): Promise<CanUploadResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('can_user_upload', {
      p_user_id: userId,
      p_lead_count: leadCount,
    })
    .single()

  if (error) {
    console.error('Error checking upload permission:', error)
    return {
      canUpload: false,
      reason: 'Unable to verify trial status. Please try again.',
      leadsWouldUse: leadCount,
      leadsRemaining: 0,
    }
  }

  // Cast to expected type - the RPC function returns this structure
  const result = data as unknown as CanUploadRpcResponse

  return {
    canUpload: result.can_upload,
    reason: result.reason ?? 'OK',
    leadsWouldUse: result.leads_would_use,
    leadsRemaining: result.leads_remaining,
  }
}

/**
 * Increment trial usage after successful upload (server-side)
 * Call this AFTER the upload is successfully processed
 */
export async function incrementTrialUsage(
  userId: string,
  leadsProcessed: number
): Promise<boolean> {
  // Use admin client to ensure we have permission to update
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .rpc('increment_trial_usage', {
      p_user_id: userId,
      p_leads_processed: leadsProcessed,
    })

  if (error) {
    console.error('Error incrementing trial usage:', error)
    return false
  }

  return data === true
}

/**
 * Direct database update for trial usage (alternative to RPC)
 * Use this if the RPC function is not available
 */
export async function updateTrialUsageDirect(
  userId: string,
  leadsProcessed: number
): Promise<boolean> {
  const adminClient = createAdminClient()

  // First get current user data to check subscription status
  const { data: userData, error: userError } = await adminClient
    .from('users')
    .select('subscription_status, trial_leads_used, trial_uploads_count')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    console.error('Error fetching user for trial update:', userError)
    return false
  }

  // Only update for trialing users
  if (userData.subscription_status !== 'trialing') {
    return true // Active subscribers don't track trial usage
  }

  // Update trial counters
  const { error: updateError } = await adminClient
    .from('users')
    .update({
      trial_leads_used: (userData.trial_leads_used ?? 0) + leadsProcessed,
      trial_uploads_count: (userData.trial_uploads_count ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating trial usage:', updateError)
    return false
  }

  return true
}

/**
 * Get trial status directly from users table (no RPC)
 * Use this as a fallback if the RPC function is not available
 */
export async function getTrialStatusDirect(userId: string): Promise<TrialStatus | null> {
  const supabase = await createClient()

  let { data: userData, error } = await supabase
    .from('users')
    .select(`
      subscription_status,
      trial_started_at,
      trial_ends_at,
      trial_leads_used,
      trial_uploads_count
    `)
    .eq('id', userId)
    .single()

  // If user record doesn't exist, try to create it
  if (error?.code === 'PGRST116' || !userData) {
    console.log('[Trial] User record missing, attempting to create...')

    // Get auth user data to create record
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (authUser) {
      await ensureUserExists(userId, authUser.email || '', {
        full_name: authUser.user_metadata?.full_name,
        avatar_url: authUser.user_metadata?.avatar_url,
        industry: authUser.user_metadata?.industry,
      })

      // Retry fetch
      const retry = await supabase
        .from('users')
        .select(`
          subscription_status,
          trial_started_at,
          trial_ends_at,
          trial_leads_used,
          trial_uploads_count
        `)
        .eq('id', userId)
        .single()

      userData = retry.data
      error = retry.error
    }
  }

  if (error || !userData) {
    console.error('Error fetching user trial data:', error)
    return null
  }

  const now = new Date()
  const isOnTrial = userData.subscription_status === 'trialing'
  const trialEndsAt = userData.trial_ends_at ? new Date(userData.trial_ends_at) : null
  const trialExpired = trialEndsAt ? trialEndsAt <= now : false

  const trialLeadsUsed = userData.trial_leads_used ?? 0
  const trialUploadsCount = userData.trial_uploads_count ?? 0

  const leadsLimitReached = trialLeadsUsed >= TRIAL_LIMITS.MAX_LEADS
  const uploadsLimitReached = trialUploadsCount >= TRIAL_LIMITS.MAX_UPLOADS

  const isTrialActive = isOnTrial && !trialExpired && !leadsLimitReached && !uploadsLimitReached

  const trialLeadsRemaining = Math.max(0, TRIAL_LIMITS.MAX_LEADS - trialLeadsUsed)
  const trialUploadsRemaining = Math.max(0, TRIAL_LIMITS.MAX_UPLOADS - trialUploadsCount)

  let daysRemaining = 0
  if (trialEndsAt && trialEndsAt > now) {
    daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return {
    isOnTrial,
    isTrialActive,
    trialExpired,
    leadsLimitReached,
    uploadsLimitReached,
    trialLeadsUsed,
    trialLeadsRemaining,
    trialUploadsCount,
    trialUploadsRemaining,
    trialStartedAt: userData.trial_started_at ? new Date(userData.trial_started_at) : null,
    trialEndsAt,
    daysRemaining,
    subscriptionStatus: userData.subscription_status,
  }
}
