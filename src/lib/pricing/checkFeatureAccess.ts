// ============================================================================
// FEATURE ACCESS CHECKER
// Server-side utility to check if a user has access to specific features
// ============================================================================

import { createClient } from '@/lib/supabase/server'
import { PRICING_TIERS, PricingTierName, FeatureName, PricingFeatures } from './config'

export interface FeatureAccessResult {
  hasAccess: boolean
  currentTier: PricingTierName
  requiredTier?: PricingTierName
  upgradeMessage?: string
}

// Get user's current pricing tier from database
export async function getUserPricingTier(userId?: string): Promise<{
  tier: PricingTierName
  isFoundersForever: boolean
  contributionsCount: number
} | null> {
  const supabase = await createClient()

  // If no userId provided, get from auth
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null
    targetUserId = user.id
  }

  // Get user profile with pricing info
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('pricing_tier, legacy_granted_at, legacy_reason')
    .eq('id', targetUserId)
    .single()

  if (profileError || !profile) {
    return null
  }

  // Count completed contributions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: contributions, error: contribError } = await (supabase as any)
    .from('area_code_requests')
    .select('id')
    .eq('requested_by', targetUserId)
    .eq('status', 'completed')

  const contributionsCount = contribError ? 0 : contributions?.length || 0

  // Determine if user is founders_forever
  const isFoundersForever =
    profile.pricing_tier === 'founders_forever' ||
    profile.pricing_tier === 'founders_club' ||
    Boolean(profile.legacy_granted_at && contributionsCount >= 3)

  // Map legacy pricing_tier values to new system
  let tier: PricingTierName = 'base'

  if (isFoundersForever) {
    tier = 'founders_forever'
  } else if (profile.pricing_tier === 'founders' || profile.pricing_tier === 'founders_club') {
    tier = 'founders'
  } else if (profile.pricing_tier === 'contributor') {
    tier = 'contributor'
  } else if (contributionsCount >= 3) {
    // Auto-upgrade based on contributions
    tier = 'founders_forever'
  } else if (contributionsCount >= 1) {
    tier = 'contributor'
  }

  return {
    tier,
    isFoundersForever,
    contributionsCount,
  }
}

// Check if user has access to a specific feature
export async function checkFeatureAccess(
  feature: FeatureName,
  userId?: string
): Promise<FeatureAccessResult> {
  const userTierInfo = await getUserPricingTier(userId)

  if (!userTierInfo) {
    return {
      hasAccess: false,
      currentTier: 'base',
      upgradeMessage: 'Please log in to access this feature',
    }
  }

  const { tier } = userTierInfo
  const tierConfig = PRICING_TIERS[tier]
  const featureValue = tierConfig.features[feature]

  // Check if feature is enabled
  let hasAccess = false
  if (typeof featureValue === 'boolean') {
    hasAccess = featureValue
  } else if (typeof featureValue === 'number') {
    hasAccess = featureValue > 0
  } else if (featureValue === 'unlimited') {
    hasAccess = true
  } else if (Array.isArray(featureValue)) {
    hasAccess = featureValue.length > 0
  }

  if (hasAccess) {
    return { hasAccess: true, currentTier: tier }
  }

  // Find the lowest tier that has this feature
  const tierOrder: PricingTierName[] = ['base', 'contributor', 'founders', 'founders_forever']
  let requiredTier: PricingTierName | undefined

  for (const tierName of tierOrder) {
    const checkTier = PRICING_TIERS[tierName]
    const checkValue = checkTier.features[feature]

    if (
      checkValue === true ||
      checkValue === 'unlimited' ||
      (typeof checkValue === 'number' && checkValue > 0)
    ) {
      requiredTier = tierName
      break
    }
  }

  return {
    hasAccess: false,
    currentTier: tier,
    requiredTier,
    upgradeMessage: requiredTier
      ? `Upgrade to ${PRICING_TIERS[requiredTier].displayName} to access this feature`
      : 'This feature is not available',
  }
}

// Check if user has access to a specific number of something
export async function checkFeatureLimit(
  feature: FeatureName,
  requestedAmount: number,
  userId?: string
): Promise<{
  hasAccess: boolean
  limit: number | 'unlimited'
  currentTier: PricingTierName
}> {
  const userTierInfo = await getUserPricingTier(userId)

  if (!userTierInfo) {
    return {
      hasAccess: false,
      limit: 0,
      currentTier: 'base',
    }
  }

  const { tier } = userTierInfo
  const tierConfig = PRICING_TIERS[tier]
  const featureValue = tierConfig.features[feature]

  if (featureValue === 'unlimited') {
    return { hasAccess: true, limit: 'unlimited', currentTier: tier }
  }

  if (typeof featureValue === 'number') {
    return {
      hasAccess: requestedAmount <= featureValue,
      limit: featureValue,
      currentTier: tier,
    }
  }

  return {
    hasAccess: false,
    limit: 0,
    currentTier: tier,
  }
}

// Get all features for current user
export async function getUserFeatures(userId?: string): Promise<{
  tier: PricingTierName
  displayName: string
  features: PricingFeatures
  benefits: string[]
  isForever: boolean
  contributionsCount: number
} | null> {
  const userTierInfo = await getUserPricingTier(userId)

  if (!userTierInfo) {
    return null
  }

  const { tier, isFoundersForever, contributionsCount } = userTierInfo
  const tierConfig = PRICING_TIERS[tier]

  return {
    tier,
    displayName: tierConfig.displayName,
    features: tierConfig.features,
    benefits: tierConfig.benefits,
    isForever: isFoundersForever,
    contributionsCount,
  }
}

// Middleware helper for API routes
export async function requireFeature(
  feature: FeatureName,
  userId?: string
): Promise<{ allowed: true } | { allowed: false; error: string; status: number }> {
  const access = await checkFeatureAccess(feature, userId)

  if (access.hasAccess) {
    return { allowed: true }
  }

  return {
    allowed: false,
    error: access.upgradeMessage || 'Feature not available on your current plan',
    status: 403,
  }
}
