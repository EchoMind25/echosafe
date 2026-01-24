import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  PRICING_TIERS,
  PricingTierName,
  getContributionsNeededForUpgrade,
} from '@/lib/pricing/config'
import { getUserPricingTier } from '@/lib/pricing/checkFeatureAccess'

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

export interface FtcContribution {
  id: string
  areaCode: string
  status: string
  amount: number
  createdAt: string
  completedAt: string | null
}

export interface CurrentPricingResponse {
  success: boolean
  currentTier: {
    tierName: PricingTierName
    displayName: string
    monthlyPrice: number
    isForever: boolean
    contributionsCount: number
    contributionsNeededForUpgrade: number
    features: Record<string, unknown>
    benefits: string[]
  }
  contributions: FtcContribution[]
  totalContributions: number
  nextTier: {
    tierName: PricingTierName
    displayName: string
    contributionsNeeded: number
  } | null
  subscription: {
    status: string
    trialEndsAt: string | null
    cancelledAt: string | null
    graceUntil: string | null
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

    // Get contribution history
    const { data: contributions, error: contributionsError } = await fromTable(supabase, 'area_code_requests')
      .select('id, area_code, status, user_contribution, created_at, completed_at')
      .eq('requested_by', user.id)
      .order('created_at', { ascending: false })

    if (contributionsError) {
      console.error('Error fetching contributions:', contributionsError)
    }

    // Get user profile for subscription info
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('subscription_status, trial_ends_at, subscription_cancelled_at, legacy_grace_until')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    // Calculate next tier info
    const upgradeInfo = getContributionsNeededForUpgrade(tier, contributionsCount)
    const nextTierConfig = upgradeInfo.nextTier ? PRICING_TIERS[upgradeInfo.nextTier] : null

    // Format contributions
    const formattedContributions: FtcContribution[] = (contributions || []).map(
      (c: {
        id: string
        area_code: string
        status: string
        user_contribution: number
        created_at: string
        completed_at: string | null
      }) => ({
        id: c.id,
        areaCode: c.area_code,
        status: c.status,
        amount: c.user_contribution,
        createdAt: c.created_at,
        completedAt: c.completed_at,
      })
    )

    const response: CurrentPricingResponse = {
      success: true,
      currentTier: {
        tierName: tier,
        displayName: tierConfig.displayName,
        monthlyPrice: tierConfig.monthlyPrice,
        isForever: tierConfig.isForever,
        contributionsCount,
        contributionsNeededForUpgrade: upgradeInfo.contributionsNeeded,
        features: tierConfig.features as unknown as Record<string, unknown>,
        benefits: tierConfig.benefits,
      },
      contributions: formattedContributions,
      totalContributions: contributionsCount,
      nextTier: nextTierConfig
        ? {
            tierName: upgradeInfo.nextTier!,
            displayName: nextTierConfig.displayName,
            contributionsNeeded: upgradeInfo.contributionsNeeded,
          }
        : null,
      subscription: {
        status: profile?.subscription_status || 'inactive',
        trialEndsAt: profile?.trial_ends_at || null,
        cancelledAt: profile?.subscription_cancelled_at || null,
        graceUntil: profile?.legacy_grace_until || null,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get current pricing error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
