// ============================================================================
// PRICING CONFIGURATION
// Centralized pricing tiers, features, and Stripe configuration
// ============================================================================

export type PricingTierName = 'base' | 'contributor' | 'founders' | 'founders_forever'

export interface PricingTier {
  name: PricingTierName
  displayName: string
  monthlyPrice: number
  isForever: boolean
  contributionsRequired: number | null // null = payment only, number = contributions needed
  stripePriceId: string | null // null for free tiers
  features: PricingFeatures
  benefits: string[]
}

export interface PricingFeatures {
  maxAreaCodes: number | 'unlimited'
  apiAccess: boolean
  prioritySupport: boolean
  teamMembers: number | 'unlimited'
  aiInsights: boolean
  exportFormats: string[]
  crmIntegrations: number | 'unlimited'
  whiteLabel: boolean
  customWebhooks: boolean
  bulkProcessing: boolean
  advancedReporting: boolean
}

// FTC Contribution cost (covers $82 FTC fee + $8 processing)
export const FTC_CONTRIBUTION_COST = 90

// Pricing tiers configuration
export const PRICING_TIERS: Record<PricingTierName, PricingTier> = {
  base: {
    name: 'base',
    displayName: 'Professional',
    monthlyPrice: 47,
    isForever: false,
    contributionsRequired: null,
    stripePriceId: process.env.STRIPE_PRICE_BASE_MONTHLY || null,
    features: {
      maxAreaCodes: 5,
      apiAccess: false,
      prioritySupport: false,
      teamMembers: 1,
      aiInsights: true,
      exportFormats: ['csv'],
      crmIntegrations: 2,
      whiteLabel: false,
      customWebhooks: false,
      bulkProcessing: true,
      advancedReporting: false,
    },
    benefits: [
      '5 area codes of your choice',
      'Unlimited lead scrubbing',
      'CSV upload & download',
      'Built-in CRM',
      'Risk scoring with AI',
      'Email support',
    ],
  },
  contributor: {
    name: 'contributor',
    displayName: 'Contributor',
    monthlyPrice: 80,
    isForever: false,
    contributionsRequired: 1,
    stripePriceId: process.env.STRIPE_PRICE_CONTRIBUTOR_MONTHLY || null,
    features: {
      maxAreaCodes: 15,
      apiAccess: false,
      prioritySupport: true,
      teamMembers: 3,
      aiInsights: true,
      exportFormats: ['csv', 'xlsx'],
      crmIntegrations: 5,
      whiteLabel: false,
      customWebhooks: false,
      bulkProcessing: true,
      advancedReporting: true,
    },
    benefits: [
      '15 area codes included',
      'Priority support',
      'Up to 3 team members',
      'Excel export',
      'Advanced reporting',
      'More CRM integrations',
    ],
  },
  founders: {
    name: 'founders',
    displayName: 'Founders',
    monthlyPrice: 100,
    isForever: false,
    contributionsRequired: 3,
    stripePriceId: process.env.STRIPE_PRICE_FOUNDERS_MONTHLY || null,
    features: {
      maxAreaCodes: 'unlimited',
      apiAccess: true,
      prioritySupport: true,
      teamMembers: 10,
      aiInsights: true,
      exportFormats: ['csv', 'xlsx', 'json'],
      crmIntegrations: 'unlimited',
      whiteLabel: false,
      customWebhooks: true,
      bulkProcessing: true,
      advancedReporting: true,
    },
    benefits: [
      'ALL area codes included',
      'API access',
      'Up to 10 team members',
      'Custom webhooks',
      'Unlimited CRM integrations',
      'JSON export',
    ],
  },
  founders_forever: {
    name: 'founders_forever',
    displayName: 'Founders Forever',
    monthlyPrice: 0,
    isForever: true,
    contributionsRequired: 3,
    stripePriceId: null, // Free tier, no Stripe price
    features: {
      maxAreaCodes: 'unlimited',
      apiAccess: true,
      prioritySupport: true,
      teamMembers: 'unlimited',
      aiInsights: true,
      exportFormats: ['csv', 'xlsx', 'json'],
      crmIntegrations: 'unlimited',
      whiteLabel: true,
      customWebhooks: true,
      bulkProcessing: true,
      advancedReporting: true,
    },
    benefits: [
      'ALL area codes - FOREVER',
      'No monthly fee ever',
      'Unlimited team members',
      'White-label option',
      'All future features included',
      'Lifetime VIP support',
    ],
  },
}

// Feature names for checking access
export type FeatureName = keyof PricingFeatures

// Helper to get tier by name
export function getTier(name: PricingTierName): PricingTier {
  return PRICING_TIERS[name]
}

// Helper to get tier order for comparison
const TIER_ORDER: PricingTierName[] = ['base', 'contributor', 'founders', 'founders_forever']

export function getTierRank(tier: PricingTierName): number {
  return TIER_ORDER.indexOf(tier)
}

export function isHigherTier(current: PricingTierName, target: PricingTierName): boolean {
  return getTierRank(target) > getTierRank(current)
}

// Calculate contributions needed for next upgrade
export function getContributionsNeededForUpgrade(
  currentTier: PricingTierName,
  currentContributions: number
): { nextTier: PricingTierName | null; contributionsNeeded: number } {
  // Already at max tier
  if (currentTier === 'founders_forever') {
    return { nextTier: null, contributionsNeeded: 0 }
  }

  // Check what tier they can achieve with contributions
  if (currentContributions >= 3) {
    // Already qualified for founders_forever
    return { nextTier: 'founders_forever', contributionsNeeded: 0 }
  }

  if (currentContributions >= 1) {
    // Qualified for contributor, need more for founders_forever
    return {
      nextTier: 'founders_forever',
      contributionsNeeded: 3 - currentContributions,
    }
  }

  // No contributions yet, first target is contributor
  return {
    nextTier: 'contributor',
    contributionsNeeded: 1,
  }
}

// Get upgrade options for a user
export interface UpgradeOption {
  tier: PricingTier
  upgradeType: 'payment' | 'contribution' | 'both'
  contributionsNeeded?: number
  monthlyCost?: number
  oneTimeCost?: number // For contribution
}

export function getUpgradeOptions(
  currentTier: PricingTierName,
  currentContributions: number
): UpgradeOption[] {
  const options: UpgradeOption[] = []
  const currentRank = getTierRank(currentTier)

  for (const tierName of TIER_ORDER) {
    const tier = PRICING_TIERS[tierName]
    const tierRank = getTierRank(tierName)

    // Skip current and lower tiers
    if (tierRank <= currentRank) continue

    // founders_forever is only available through contributions
    if (tierName === 'founders_forever') {
      if (currentContributions >= 3) {
        // Already qualified
        options.push({
          tier,
          upgradeType: 'contribution',
          contributionsNeeded: 0,
        })
      } else {
        options.push({
          tier,
          upgradeType: 'contribution',
          contributionsNeeded: 3 - currentContributions,
          oneTimeCost: (3 - currentContributions) * FTC_CONTRIBUTION_COST,
        })
      }
    } else {
      // Other tiers can be achieved via payment or contribution
      const option: UpgradeOption = {
        tier,
        upgradeType: 'both',
        monthlyCost: tier.monthlyPrice,
      }

      if (tier.contributionsRequired !== null) {
        const needed = tier.contributionsRequired - currentContributions
        if (needed > 0) {
          option.contributionsNeeded = needed
          option.oneTimeCost = needed * FTC_CONTRIBUTION_COST
        } else {
          option.contributionsNeeded = 0
        }
      }

      options.push(option)
    }
  }

  return options
}
