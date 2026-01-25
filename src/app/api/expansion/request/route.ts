import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, EMAIL_FROM } from '@/lib/email/resend'
import { AREA_CODE_TO_STATE, STATE_NAMES } from '@/lib/states'
import { FTC_CONTRIBUTION_COST } from '@/lib/pricing/config'
import { featureFlags } from '@/lib/feature-flags'

interface ExpansionRequest {
  areaCodes: string[]
  userEmail: string
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if contributions are enabled
    if (!featureFlags.enableContributions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Area code expansion is currently unavailable. Launching Q2 2026.',
          redirectTo: '/pricing'
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: ExpansionRequest = await request.json()
    const { areaCodes, userEmail } = body

    // Validate area codes
    if (!areaCodes || !Array.isArray(areaCodes) || areaCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No area codes specified' },
        { status: 400 }
      )
    }

    // Validate all area codes exist in our supported list
    const invalidCodes = areaCodes.filter(code => !AREA_CODE_TO_STATE[code])
    if (invalidCodes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid area codes: ${invalidCodes.join(', ')}` },
        { status: 400 }
      )
    }

    // Check which area codes are already active
    const { data: existingSubscriptions } = await supabase
      .from('ftc_subscriptions')
      .select('area_code')
      .in('area_code', areaCodes)
      .eq('subscription_status', 'active')

    const alreadyActive = existingSubscriptions?.map(s => s.area_code) || []
    const newCodes = areaCodes.filter(code => !alreadyActive.includes(code))

    if (newCodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All selected area codes are already active' },
        { status: 400 }
      )
    }

    // Calculate total cost
    const totalCost = newCodes.length * FTC_CONTRIBUTION_COST

    // Get user info
    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const userName = userProfile?.full_name || userEmail || user.email

    // Send notification email to admin
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'support@echosafe.app'

    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: adminEmail,
          subject: `Area Code Expansion Request from ${userName}`,
          html: `
            <h2>New Area Code Expansion Request</h2>
            <p><strong>User:</strong> ${userName}</p>
            <p><strong>Email:</strong> ${userEmail || user.email}</p>
            <p><strong>User ID:</strong> ${user.id}</p>
            <p><strong>Requested Area Codes:</strong></p>
            <ul>
              ${newCodes.map(code => {
                const state = AREA_CODE_TO_STATE[code]
                const stateName = state ? STATE_NAMES[state] : 'Unknown'
                return `<li>${code} (${stateName})</li>`
              }).join('')}
            </ul>
            <p><strong>Total Cost:</strong> $${totalCost}</p>
            <p><strong>Cost Breakdown:</strong> ${newCodes.length} codes x $${FTC_CONTRIBUTION_COST}/code</p>
            <hr>
            <p>Next steps:</p>
            <ol>
              <li>Contact user to confirm and collect payment</li>
              <li>Subscribe to area codes on FTC website</li>
              <li>Add subscriptions to ftc_subscriptions table</li>
              <li>Update user's contribution count</li>
            </ol>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Send confirmation email to user
    if (resend && userEmail) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: userEmail,
          subject: 'Your Area Code Expansion Request - Echo Safe',
          html: `
            <h2>Thank You for Your Contribution Request!</h2>
            <p>Hi ${userName},</p>
            <p>We've received your request to contribute to the following area codes:</p>
            <ul>
              ${newCodes.map(code => {
                const state = AREA_CODE_TO_STATE[code]
                const stateName = state ? STATE_NAMES[state] : 'Unknown'
                return `<li>${code} (${stateName})</li>`
              }).join('')}
            </ul>
            <p><strong>Total:</strong> $${totalCost}</p>
            <p>Our team will reach out within 24 hours to complete the contribution process and set up payment.</p>
            <p>Thank you for helping expand our DNC coverage!</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Questions? Reply to this email or contact support@echosafe.app
            </p>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send user confirmation:', emailError)
        // Don't fail the request if email fails
      }
    }

    // Log the request (could be stored in a database table in the future)
    console.log('Area code expansion request:', {
      userId: user.id,
      userEmail: userEmail || user.email,
      areaCodes: newCodes,
      totalCost,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Request submitted successfully',
      requestedCodes: newCodes,
      totalCost,
    })
  } catch (error) {
    console.error('Expansion request error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
