import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

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

    // Get request body
    const body = await request.json().catch(() => ({}))
    const { reason, feedback } = body

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('pricing_tier, legacy_price_lock, stripe_subscription_id, subscription_status')
      .eq('id', user.id)
      .single() as { data: { pricing_tier: string | null; legacy_price_lock: number | null; stripe_subscription_id: string | null; subscription_status: string } | null; error: Error | null }

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Check if already canceled
    if (profile.subscription_status === 'canceled') {
      return NextResponse.json(
        { success: false, error: 'Subscription is already canceled' },
        { status: 400 }
      )
    }

    // Calculate grace period (90 days from now if has legacy pricing)
    const hasLegacyPricing = profile.legacy_price_lock !== null
    const graceUntil = hasLegacyPricing
      ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      : null

    // Update user subscription status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled' as 'CANCELED',
        legacy_grace_until: graceUntil,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to cancel subscription' },
        { status: 500 }
      )
    }

    // Cancel Stripe subscription if exists
    if (profile.stripe_subscription_id) {
      try {
        // Cancel at period end to allow access until billing cycle ends
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
        console.log('Canceled Stripe subscription:', profile.stripe_subscription_id)
      } catch (stripeError) {
        console.error('Failed to cancel Stripe subscription:', stripeError)
        // Revert database change if Stripe fails
        await supabase
          .from('users')
          .update({
            subscription_status: profile.subscription_status,
            legacy_grace_until: null,
            updated_at: new Date().toISOString(),
          } as Record<string, unknown>)
          .eq('id', user.id)

        return NextResponse.json(
          { success: false, error: 'Failed to cancel subscription with payment provider' },
          { status: 500 }
        )
      }
    }

    // Log cancellation for analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'subscription_canceled',
      event_data: {
        pricing_tier: profile.pricing_tier,
        had_legacy_pricing: hasLegacyPricing,
        grace_until: graceUntil,
        reason: reason || null,
        feedback: feedback || null,
      },
    })

    const responseMessage = hasLegacyPricing
      ? `Your subscription has been canceled. Your legacy pricing will be preserved for 90 days until ${new Date(graceUntil!).toLocaleDateString()}. Reactivate before then to keep your locked-in rate.`
      : 'Your subscription has been canceled. You can reactivate anytime from your account settings.'

    return NextResponse.json({
      success: true,
      message: responseMessage,
      hasLegacyPricing,
      graceUntil,
      canReactivate: true,
    })

  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
