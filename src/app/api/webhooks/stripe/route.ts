import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================================================
// STRIPE WEBHOOK HANDLER
// Handles subscription events and FTC contribution payments
// ============================================================================

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Price ID to tier mapping
const PRICE_TO_TIER: Record<string, string> = {
  [process.env.STRIPE_PRICE_BASE_MONTHLY || '']: 'base',
  [process.env.STRIPE_PRICE_CONTRIBUTOR_MONTHLY || '']: 'contributor',
  [process.env.STRIPE_PRICE_FOUNDERS_MONTHLY || '']: 'founders',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // ========================================================================
      // CHECKOUT SESSION COMPLETED
      // Handles both subscription checkouts and one-time contribution payments
      // ========================================================================
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata || {}

        if (metadata.type === 'ftc_contribution') {
          // Handle FTC contribution payment
          await handleContributionPayment(supabase, session, metadata)
        } else if (session.mode === 'subscription' && metadata.user_id) {
          // Handle subscription checkout
          await handleSubscriptionCheckout(supabase, session, metadata)
        }
        break
      }

      // ========================================================================
      // PAYMENT INTENT SUCCEEDED
      // For direct payment intents (FTC contributions via Elements)
      // ========================================================================
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const metadata = paymentIntent.metadata || {}

        if (metadata.type === 'ftc_contribution') {
          await handleContributionPaymentIntent(supabase, paymentIntent, metadata)
        }
        break
      }

      // ========================================================================
      // SUBSCRIPTION CREATED
      // When a new subscription is created
      // ========================================================================
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(supabase, subscription)
        break
      }

      // ========================================================================
      // SUBSCRIPTION UPDATED
      // When subscription is upgraded, downgraded, or plan changed
      // ========================================================================
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(supabase, subscription)
        break
      }

      // ========================================================================
      // SUBSCRIPTION DELETED
      // When subscription is canceled and period ends
      // ========================================================================
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(supabase, subscription)
        break
      }

      // ========================================================================
      // INVOICE PAID
      // Track successful payments
      // ========================================================================
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(supabase, invoice)
        break
      }

      // ========================================================================
      // INVOICE PAYMENT FAILED
      // Handle failed payments
      // ========================================================================
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(supabase, invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HANDLER FUNCTIONS
// ============================================================================

async function handleContributionPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const { contribution_id, user_id, area_codes } = metadata

  if (!contribution_id || !user_id) {
    console.error('Missing contribution_id or user_id in metadata')
    return
  }

  // Update the contribution record
  await supabase
    .from('area_code_requests')
    .update({
      status: 'paid',
      user_contribution: session.amount_total ? session.amount_total / 100 : 90,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contribution_id)

  // Log payment
  await supabase.from('payments').insert({
    user_id,
    stripe_payment_intent_id: session.payment_intent as string,
    amount: session.amount_total || 9000,
    currency: session.currency || 'usd',
    status: 'succeeded',
    description: `FTC Area Code Contribution: ${area_codes || 'N/A'}`,
    payment_type: 'area_code',
    metadata: { contribution_id, area_codes },
  })

  // Check if user qualifies for tier upgrade
  await checkAndUpgradeTier(supabase, user_id)

  console.log(`Contribution payment processed for user ${user_id}`)
}

async function handleContributionPaymentIntent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  paymentIntent: Stripe.PaymentIntent,
  metadata: Record<string, string>
) {
  const { contribution_id, user_id, area_codes } = metadata

  if (!contribution_id || !user_id) {
    console.error('Missing contribution_id or user_id in metadata')
    return
  }

  // Update the contribution record
  await supabase
    .from('area_code_requests')
    .update({
      status: 'paid',
      user_contribution: paymentIntent.amount / 100,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contribution_id)

  // Log payment
  await supabase.from('payments').insert({
    user_id,
    stripe_payment_intent_id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: 'succeeded',
    description: `FTC Area Code Contribution: ${area_codes || 'N/A'}`,
    payment_type: 'area_code',
    metadata: { contribution_id, area_codes },
  })

  // Check if user qualifies for tier upgrade
  await checkAndUpgradeTier(supabase, user_id)

  console.log(`Contribution payment intent processed for user ${user_id}`)
}

async function handleSubscriptionCheckout(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  const { user_id, tier } = metadata

  if (!user_id) {
    console.error('Missing user_id in subscription checkout metadata')
    return
  }

  // Update user with subscription info
  await supabase
    .from('users')
    .update({
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
      pricing_tier: tier || 'base',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user_id)

  // Log analytics event
  await supabase.from('analytics_events').insert({
    user_id,
    event_type: 'subscription_created',
    event_data: {
      tier,
      checkout_session_id: session.id,
    },
  })

  console.log(`Subscription checkout completed for user ${user_id}, tier: ${tier}`)
}

async function handleSubscriptionCreated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.log('User not found for customer:', customerId)
    return
  }

  // Get the price ID to determine tier
  const priceId = subscription.items.data[0]?.price.id
  const tier = PRICE_TO_TIER[priceId] || 'base'

  await supabase
    .from('users')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status === 'active' ? 'active' : subscription.status,
      pricing_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  console.log(`Subscription created for user ${user.id}, tier: ${tier}`)
}

async function handleSubscriptionUpdated(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id, pricing_tier')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.log('User not found for customer:', customerId)
    return
  }

  // Get the price ID to determine tier
  const priceId = subscription.items.data[0]?.price.id
  const tier = PRICE_TO_TIER[priceId] || user.pricing_tier || 'base'

  // Map Stripe status to our status
  let status = subscription.status
  if (subscription.cancel_at_period_end) {
    status = 'canceled'
  }

  await supabase
    .from('users')
    .update({
      subscription_status: status,
      pricing_tier: tier,
      subscription_cancelled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  console.log(`Subscription updated for user ${user.id}, status: ${status}, tier: ${tier}`)
}

async function handleSubscriptionDeleted(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id, pricing_tier, legacy_granted_at')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    console.log('User not found for customer:', customerId)
    return
  }

  // Check if user has earned founders_forever status
  const { data: contributions } = await supabase
    .from('area_code_requests')
    .select('id')
    .eq('requested_by', user.id)
    .eq('status', 'completed')

  const contributionsCount = contributions?.length || 0
  const earnedFoundersForever = contributionsCount >= 3 || user.legacy_granted_at

  if (earnedFoundersForever) {
    // Keep founders_forever tier, but mark subscription as canceled
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        pricing_tier: 'founders_forever',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log(`Subscription deleted for user ${user.id}, but keeping founders_forever tier`)
  } else {
    // Downgrade to base tier
    await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        pricing_tier: 'base',
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    console.log(`Subscription deleted for user ${user.id}, downgraded to base tier`)
  }

  // Log analytics event
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'subscription_deleted',
    event_data: {
      earned_founders_forever: earnedFoundersForever,
      contributions_count: contributionsCount,
    },
  })
}

async function handleInvoicePaid(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    return
  }

  // Log payment
  await supabase.from('payments').insert({
    user_id: user.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    stripe_invoice_id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    description: `Subscription payment`,
    payment_type: 'subscription',
    metadata: { subscription_id: subscriptionId },
  })

  // Update subscription status to active
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
}

async function handleInvoicePaymentFailed(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string

  // Find user by Stripe customer ID
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!user) {
    return
  }

  // Update subscription status
  await supabase
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // Log analytics event
  await supabase.from('analytics_events').insert({
    user_id: user.id,
    event_type: 'payment_failed',
    event_data: {
      invoice_id: invoice.id,
      amount: invoice.amount_due,
    },
  })
}

// ============================================================================
// HELPER: Check and upgrade tier based on contributions
// ============================================================================
async function checkAndUpgradeTier(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
) {
  // Count completed contributions
  const { data: contributions } = await supabase
    .from('area_code_requests')
    .select('id')
    .eq('requested_by', userId)
    .in('status', ['completed', 'paid'])

  const count = contributions?.length || 0

  // Get current user info
  const { data: user } = await supabase
    .from('users')
    .select('pricing_tier')
    .eq('id', userId)
    .single()

  if (!user) return

  let newTier = user.pricing_tier
  let legacyUpdate = {}

  if (count >= 3) {
    newTier = 'founders_forever'
    legacyUpdate = {
      legacy_price_lock: 47.00,
      legacy_granted_at: new Date().toISOString(),
      legacy_reason: 'Area code contribution (3+ contributions)',
    }
  } else if (count >= 1 && user.pricing_tier === 'base') {
    newTier = 'contributor'
  }

  if (newTier !== user.pricing_tier) {
    await supabase
      .from('users')
      .update({
        pricing_tier: newTier,
        ...legacyUpdate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    // Log tier upgrade
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'tier_upgraded',
      event_data: {
        from_tier: user.pricing_tier,
        to_tier: newTier,
        contributions_count: count,
      },
    })

    console.log(`User ${userId} upgraded from ${user.pricing_tier} to ${newTier}`)
  }
}
