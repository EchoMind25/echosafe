// ============================================================================
// TRIAL ABUSE PREVENTION SERVICE
// 7-day trial with 1000 leads / 5 uploads limit
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRIAL_LIMITS = {
  DURATION_DAYS: 7,
  MAX_LEADS: 1000,
  MAX_UPLOADS: 5,
  PRICE_PER_MONTH: 47, // $47/month after trial
} as const

// ============================================================================
// TYPES
// ============================================================================

export interface TrialStatus {
  isOnTrial: boolean
  isTrialActive: boolean
  trialExpired: boolean
  leadsLimitReached: boolean
  uploadsLimitReached: boolean
  trialLeadsUsed: number
  trialLeadsRemaining: number
  trialUploadsCount: number
  trialUploadsRemaining: number
  trialStartedAt: Date | null
  trialEndsAt: Date | null
  daysRemaining: number
  subscriptionStatus: string
}

export interface CanUploadResult {
  canUpload: boolean
  reason: string
  leadsWouldUse: number
  leadsRemaining: number
}

// ============================================================================
// CLIENT-SIDE UTILITIES
// ============================================================================

/**
 * Calculate trial status from user data (client-side)
 * Use this when you already have user data and don't need to call the database
 */
export function calculateTrialStatus(userData: {
  subscriptionStatus: string
  trialStartedAt?: Date | null
  trialEndsAt?: Date | null
  trialLeadsUsed?: number
  trialUploadsCount?: number
}): TrialStatus {
  const now = new Date()

  const isOnTrial = userData.subscriptionStatus === 'trialing'
  const trialEndsAt = userData.trialEndsAt ? new Date(userData.trialEndsAt) : null
  const trialExpired = trialEndsAt ? trialEndsAt <= now : false

  const trialLeadsUsed = userData.trialLeadsUsed ?? 0
  const trialUploadsCount = userData.trialUploadsCount ?? 0

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
    trialStartedAt: userData.trialStartedAt ? new Date(userData.trialStartedAt) : null,
    trialEndsAt,
    daysRemaining,
    subscriptionStatus: userData.subscriptionStatus,
  }
}

/**
 * Check if a user can upload leads (client-side validation)
 * This is a pre-check before hitting the API - the server will do the final validation
 */
export function canUserUploadLeads(
  trialStatus: TrialStatus,
  leadCount: number
): CanUploadResult {
  // Active subscribers can always upload
  if (trialStatus.subscriptionStatus === 'active') {
    return {
      canUpload: true,
      reason: 'Active subscription',
      leadsWouldUse: leadCount,
      leadsRemaining: 999999,
    }
  }

  // Not on trial = needs subscription
  if (!trialStatus.isOnTrial) {
    return {
      canUpload: false,
      reason: 'Subscription required',
      leadsWouldUse: leadCount,
      leadsRemaining: 0,
    }
  }

  // Trial expired
  if (trialStatus.trialExpired) {
    return {
      canUpload: false,
      reason: 'Trial period has expired. Subscribe to continue.',
      leadsWouldUse: leadCount,
      leadsRemaining: 0,
    }
  }

  // Uploads limit reached
  if (trialStatus.uploadsLimitReached) {
    return {
      canUpload: false,
      reason: `Trial upload limit reached (${TRIAL_LIMITS.MAX_UPLOADS} uploads). Subscribe to continue.`,
      leadsWouldUse: leadCount,
      leadsRemaining: 0,
    }
  }

  // Leads limit reached
  if (trialStatus.trialLeadsRemaining <= 0) {
    return {
      canUpload: false,
      reason: `Trial lead limit reached (${TRIAL_LIMITS.MAX_LEADS.toLocaleString()} leads). Subscribe to continue.`,
      leadsWouldUse: leadCount,
      leadsRemaining: 0,
    }
  }

  // Would exceed leads limit
  if (leadCount > trialStatus.trialLeadsRemaining) {
    return {
      canUpload: false,
      reason: `This upload has ${leadCount.toLocaleString()} leads but you only have ${trialStatus.trialLeadsRemaining.toLocaleString()} trial leads remaining. Subscribe for unlimited uploads.`,
      leadsWouldUse: leadCount,
      leadsRemaining: trialStatus.trialLeadsRemaining,
    }
  }

  // All checks passed
  return {
    canUpload: true,
    reason: 'OK',
    leadsWouldUse: leadCount,
    leadsRemaining: trialStatus.trialLeadsRemaining,
  }
}

/**
 * Get a human-readable trial status message
 */
export function getTrialStatusMessage(trialStatus: TrialStatus): string {
  if (trialStatus.subscriptionStatus === 'active') {
    return 'Active subscription - unlimited access'
  }

  if (!trialStatus.isOnTrial) {
    return 'Subscription required to continue'
  }

  if (trialStatus.trialExpired) {
    return 'Your 7-day trial has ended. Subscribe to continue scrubbing leads.'
  }

  if (trialStatus.leadsLimitReached) {
    return `You've used all ${TRIAL_LIMITS.MAX_LEADS.toLocaleString()} trial leads. Subscribe for unlimited access.`
  }

  if (trialStatus.uploadsLimitReached) {
    return `You've used all ${TRIAL_LIMITS.MAX_UPLOADS} trial uploads. Subscribe for unlimited access.`
  }

  // Active trial
  const parts: string[] = []

  if (trialStatus.daysRemaining === 1) {
    parts.push('1 day left')
  } else if (trialStatus.daysRemaining > 0) {
    parts.push(`${trialStatus.daysRemaining} days left`)
  }

  parts.push(`${trialStatus.trialLeadsRemaining.toLocaleString()} leads remaining`)
  parts.push(`${trialStatus.trialUploadsRemaining} uploads remaining`)

  return `Free trial: ${parts.join(' • ')}`
}

/**
 * Get trial usage percentage (0-100)
 */
export function getTrialUsagePercentage(trialStatus: TrialStatus): {
  leadsPercentage: number
  uploadsPercentage: number
  daysPercentage: number
  overallPercentage: number
} {
  const leadsPercentage = (trialStatus.trialLeadsUsed / TRIAL_LIMITS.MAX_LEADS) * 100
  const uploadsPercentage = (trialStatus.trialUploadsCount / TRIAL_LIMITS.MAX_UPLOADS) * 100

  let daysPercentage = 0
  if (trialStatus.trialStartedAt && trialStatus.trialEndsAt) {
    const totalDays = TRIAL_LIMITS.DURATION_DAYS
    const daysUsed = totalDays - trialStatus.daysRemaining
    daysPercentage = (daysUsed / totalDays) * 100
  }

  // Overall is the maximum of any limit
  const overallPercentage = Math.max(leadsPercentage, uploadsPercentage, daysPercentage)

  return {
    leadsPercentage: Math.min(100, leadsPercentage),
    uploadsPercentage: Math.min(100, uploadsPercentage),
    daysPercentage: Math.min(100, daysPercentage),
    overallPercentage: Math.min(100, overallPercentage),
  }
}
