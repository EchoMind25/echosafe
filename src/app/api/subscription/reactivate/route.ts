import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

interface UserProfile {
  pricing_tier: string | null
  legacy_price_lock: number | null
  legacy_grace_until: string | null
  stripe_subscription_id: string | null
  subscription_status: string
}

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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('pricing_tier, legacy_price_lock, legacy_grace_until, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single() as { data: UserProfile | null; error: Error | null }

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if subscription is actually canceled
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
    let newMonthlyRate = profile.legacy_price_lock || 47.00
    let legacyPreserved = false

    if (hasLegacyPricing) {
      if (!graceExpired) {
        // Grace period still valid - restore legacy pricing
        legacyPreserved = true
        newMonthlyRate = profile.legacy_price_lock!
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
          } as Record<string, unknown>)
          .eq('id', user.id)
      }
    }

    // Reactivate subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        legacy_grace_until: null, // Clear grace period on reactivation
        pricing_tier: newPricingTier,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
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
        // Undo the cancel_at_period_end flag
        const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

        if (subscription.cancel_at_period_end) {
          await stripe.subscriptions.update(profile.stripe_subscription_id, {
            cancel_at_period_end: false,
          })
          console.log('Reactivated Stripe subscription:', profile.stripe_subscription_id)
        } else if (subscription.status === 'canceled') {
          // Subscription was fully canceled, need to create new one
          return NextResponse.json({
            success: true,
            requiresPayment: true,
            message: 'Your previous subscription has expired. Please subscribe again to continue.',
            pricing_tier: newPricingTier,
            monthly_rate: newMonthlyRate,
            legacyPreserved,
          })
        }
      } catch (stripeError) {
        console.error('Failed to reactivate Stripe subscription:', stripeError)
        // Revert database change if Stripe fails
        await supabase
          .from('users')
          .update({
            subscription_status: profile.subscription_status,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', user.id)

        return NextResponse.json(
          { success: false, error: 'Failed to reactivate subscription with payment provider' },
          { status: 500 }
        )
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
      .select('pricing_tier, legacy_price_lock, legacy_grace_until, subscription_status')
      .eq('id', user.id)
      .single() as { data: UserProfile | null }

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
      canReactivate: profile.subscription_status === 'canceled',
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
