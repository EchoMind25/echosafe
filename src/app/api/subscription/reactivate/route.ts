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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('pricing_tier, legacy_price_lock, legacy_grace_until, stripe_subscription_id, subscription_status, monthly_base_rate')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if subscription is actually cancelled
    if (profile.subscription_status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Subscription is already active' },
        { status: 400 }
      )
    }

    // Check legacy grace period
    const hasLegacyPricing = profile.legacy_price_lock !== null
    const graceExpired = profile.legacy_grace_until
      ? new Date(profile.legacy_grace_until) < new Date()
      : true

    let newPricingTier = profile.pricing_tier
    let newMonthlyRate = profile.monthly_base_rate || 47.00
    let legacyPreserved = false

    if (hasLegacyPricing) {
      if (!graceExpired) {
        // Grace period still valid - restore legacy pricing
        legacyPreserved = true
        newMonthlyRate = profile.legacy_price_lock
      } else {
        // Grace period expired - reset to standard pricing
        newPricingTier = 'standard'
        newMonthlyRate = 47.00

        // Clear legacy pricing fields
        await supabase
          .from('users')
          .update({
            legacy_price_lock: null,
            legacy_grace_until: null,
            pricing_tier: 'standard',
          })
          .eq('id', user.id)
      }
    }

    // Reactivate subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        legacy_grace_until: null, // Clear grace period on reactivation
        monthly_base_rate: newMonthlyRate,
        pricing_tier: newPricingTier,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to reactivate subscription' },
        { status: 500 }
      )
    }

    // Reactivate Stripe subscription if exists
    if (profile.stripe_subscription_id) {
      try {
        // In production, reactivate Stripe subscription
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
        // For cancelled but not deleted subscriptions:
        // await stripe.subscriptions.update(profile.stripe_subscription_id, {
        //   cancel_at_period_end: false,
        // })
        // For fully cancelled, create new subscription
        console.log('Would reactivate Stripe subscription:', profile.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to reactivate Stripe subscription:', stripeError)
        // Return info about needing payment method
        return NextResponse.json({
          success: true,
          requiresPayment: true,
          message: 'Subscription reactivated. Please update your payment method.',
          pricing_tier: newPricingTier,
          monthly_rate: newMonthlyRate,
          legacyPreserved,
        })
      }
    }

    // Log reactivation for analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'subscription_reactivated',
      event_data: {
        pricing_tier: newPricingTier,
        legacy_preserved: legacyPreserved,
        grace_expired: graceExpired,
        monthly_rate: newMonthlyRate,
      },
    })

    const message = legacyPreserved
      ? `Welcome back! Your legacy pricing of $${newMonthlyRate}/month has been preserved.`
      : graceExpired && hasLegacyPricing
        ? `Your subscription has been reactivated at the standard rate of $${newMonthlyRate}/month. Your legacy pricing grace period has expired.`
        : `Your subscription has been reactivated at $${newMonthlyRate}/month.`

    return NextResponse.json({
      success: true,
      message,
      pricing_tier: newPricingTier,
      monthly_rate: newMonthlyRate,
      legacyPreserved,
      graceExpired,
    })

  } catch (error) {
    console.error('Reactivate subscription error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Check reactivation options
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
      .select('pricing_tier, legacy_price_lock, legacy_grace_until, subscription_status, monthly_base_rate')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const hasLegacyPricing = profile.legacy_price_lock !== null
    const graceExpired = profile.legacy_grace_until
      ? new Date(profile.legacy_grace_until) < new Date()
      : true
    const daysRemaining = profile.legacy_grace_until
      ? Math.max(0, Math.ceil((new Date(profile.legacy_grace_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0

    return NextResponse.json({
      success: true,
      canReactivate: profile.subscription_status === 'cancelled',
      currentStatus: profile.subscription_status,
      hasLegacyPricing,
      legacyRate: profile.legacy_price_lock,
      graceExpired,
      graceUntil: profile.legacy_grace_until,
      daysRemaining,
      standardRate: 47.00,
      willPayAfterReactivation: hasLegacyPricing && !graceExpired
        ? profile.legacy_price_lock
        : 47.00,
    })

  } catch (error) {
    console.error('Check reactivation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
