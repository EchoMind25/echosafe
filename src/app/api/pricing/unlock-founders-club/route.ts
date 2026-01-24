import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

export async function POST(_request: NextRequest) {
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

    // Check if user has 3+ completed area code requests
    const { data: completedRequests, error: requestsError } = await fromTable(supabase, 'area_code_requests')
      .select('id, area_code, user_contribution')
      .eq('requested_by', user.id)
      .eq('status', 'completed')

    if (requestsError) {
      console.error('Error fetching area code requests:', requestsError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify eligibility' },
        { status: 500 }
      )
    }

    const completedCount = completedRequests?.length || 0

    if (completedCount < 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'You need to contribute 3 area codes to unlock Founder\'s Club',
          currentCount: completedCount,
          requiredCount: 3,
        },
        { status: 400 }
      )
    }

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('pricing_tier, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if already a Founder's Club member
    if (profile.pricing_tier === 'founders_club') {
      return NextResponse.json(
        { success: false, error: 'You are already a Founder\'s Club member' },
        { status: 400 }
      )
    }

    // Update user to Founder's Club
    const { error: updateError } = await supabase
      .from('users')
      .update({
        pricing_tier: 'founders_club',
        legacy_price_lock: 47.00,
        legacy_granted_at: new Date().toISOString(),
        legacy_reason: 'Area code contribution (3+ contributions)',
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to unlock Founder\'s Club' },
        { status: 500 }
      )
    }

    // Update Stripe subscription if exists
    if (profile.stripe_subscription_id) {
      try {
        // In production, update Stripe subscription to Founder's Club price
        console.log('Would update Stripe subscription:', profile.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to update Stripe subscription:', stripeError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome to Founder\'s Club! You now have access to all area codes.',
      pricing_tier: 'founders_club',
      legacy_price_lock: 47.00,
      benefits: [
        'All area codes included',
        'Price locked at $47/month forever',
        'Priority support',
        'Early access to new features',
      ],
    })

  } catch (error) {
    console.error('Unlock Founder\'s Club error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Check eligibility
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('pricing_tier, legacy_granted_at')
      .eq('id', user.id)
      .single() as { data: { pricing_tier: string | null; legacy_granted_at: string | null } | null }

    // Check completed area code requests
    const { data: completedRequests } = await fromTable(supabase, 'area_code_requests')
      .select('id, area_code')
      .eq('requested_by', user.id)
      .eq('status', 'completed')

    const completedCount = completedRequests?.length || 0
    const isEligible = completedCount >= 3
    const isMember = profile?.pricing_tier === 'founders_club'

    return NextResponse.json({
      success: true,
      isEligible,
      isMember,
      completedCount,
      requiredCount: 3,
      unlockedAt: profile?.legacy_granted_at || null,
      contributedAreaCodes: completedRequests?.map((r: { area_code: string }) => r.area_code) || [],
    })

  } catch (error) {
    console.error('Check eligibility error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
