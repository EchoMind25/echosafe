import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PRICING_TIERS,
  PricingTierName,
  getUpgradeOptions,
  FTC_CONTRIBUTION_COST,
} from '@/lib/pricing/config'
import { getUserPricingTier } from '@/lib/pricing/checkFeatureAccess'

export interface UpgradeOptionResponse {
  tierName: PricingTierName
  displayName: string
  monthlyPrice: number
  isForever: boolean
  upgradeType: 'payment' | 'contribution' | 'both'
  contributionsNeeded?: number
  oneTimeCost?: number
  benefits: string[]
  features: Record<string, unknown>
}

export interface UpgradeOptionsResponse {
  success: boolean
  currentTier: {
    tierName: PricingTierName
    displayName: string
    contributionsCount: number
  }
  options: UpgradeOptionResponse[]
  ftcContributionCost: number
  contributionExplainer: {
    title: string
    description: string
    costBreakdown: string
    benefits: string[]
  }
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's pricing tier info
    const userTierInfo = await getUserPricingTier(user.id)

    if (!userTierInfo) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pricing info' },
        { status: 500 }
      )
    }

    const { tier, contributionsCount } = userTierInfo
    const tierConfig = PRICING_TIERS[tier]

    // Get available upgrade options
    const upgradeOptions = getUpgradeOptions(tier, contributionsCount)

    // Format options for response
    const formattedOptions: UpgradeOptionResponse[] = upgradeOptions.map((option) => ({
      tierName: option.tier.name,
      displayName: option.tier.displayName,
      monthlyPrice: option.tier.monthlyPrice,
      isForever: option.tier.isForever,
      upgradeType: option.upgradeType,
      contributionsNeeded: option.contributionsNeeded,
      oneTimeCost: option.oneTimeCost,
      benefits: option.tier.benefits,
      features: option.tier.features as unknown as Record<string, unknown>,
    }))

    const response: UpgradeOptionsResponse = {
      success: true,
      currentTier: {
        tierName: tier,
        displayName: tierConfig.displayName,
        contributionsCount,
      },
      options: formattedOptions,
      ftcContributionCost: FTC_CONTRIBUTION_COST,
      contributionExplainer: {
        title: 'Support the DNC Registry',
        description:
          'When you contribute to an FTC area code list, you help keep the DNC registry up-to-date for everyone. Your contribution covers the FTC subscription cost for that area code.',
        costBreakdown: `$${FTC_CONTRIBUTION_COST} per area code ($82 FTC subscription + $8 processing)`,
        benefits: [
          '1 contribution → Unlock Contributor tier (save $33/month)',
          '3 contributions → Unlock Founders Forever (FREE for life!)',
          'Help maintain compliance data for the real estate community',
          'Get priority when new area codes are added',
        ],
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get upgrade options error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
