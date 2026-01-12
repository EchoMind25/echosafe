import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
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

    // Check if user has 3+ completed expansion requests
    const { data: completedRequests, error: requestsError } = await supabase
      .from('expansion_requests')
      .select('id, area_code, contribution_amount')
      .eq('user_id', user.id)
      .eq('status', 'completed')

    if (requestsError) {
      console.error('Error fetching expansion requests:', requestsError)
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
        founders_club_unlocked_at: new Date().toISOString(),
        area_code_limit: 999, // Unlimited area codes
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
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // await stripe.subscriptions.update(profile.stripe_subscription_id, {
        //   items: [{ price: process.env.STRIPE_FOUNDERS_CLUB_PRICE_ID }],
        // })
        console.log('Would update Stripe subscription:', profile.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to update Stripe subscription:', stripeError)
        // Don't fail the request, Stripe can be synced later
      }
    }

    // Mark expansion requests as unlocking Founder's Club
    const requestIds = completedRequests.slice(0, 3).map(r => r.id)
    await supabase
      .from('expansion_requests')
      .update({ unlocks_founders_club: true })
      .in('id', requestIds)

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
export async function GET(request: NextRequest) {
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
      .select('pricing_tier, founders_club_unlocked_at')
      .eq('id', user.id)
      .single()

    // Check completed expansion requests
    const { data: completedRequests } = await supabase
      .from('expansion_requests')
      .select('id, area_code')
      .eq('user_id', user.id)
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
      unlockedAt: profile?.founders_club_unlocked_at || null,
      contributedAreaCodes: completedRequests?.map(r => r.area_code) || [],
    })

  } catch (error) {
    console.error('Check eligibility error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
