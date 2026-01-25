import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, EMAIL_FROM } from '@/lib/email/resend'

// Helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already exists in waitlist
    const { data: existing } = await fromTable(supabase, 'expansion_waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      // Already on waitlist - return success (don't reveal this to user)
      return NextResponse.json({
        success: true,
        message: 'Successfully joined the waitlist',
      })
    }

    // Add to waitlist
    const { error: insertError } = await fromTable(supabase, 'expansion_waitlist')
      .insert({
        email: email.toLowerCase(),
      })

    if (insertError) {
      console.error('Failed to add to waitlist:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to join waitlist. Please try again.' },
        { status: 500 }
      )
    }

    // Send confirmation email
    const resend = getResend()
    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: email,
          subject: "You're on the Expansion Waitlist - Echo Safe",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #14b8a6;">Thanks for Your Interest!</h2>
              <p>You've been added to the Echo Safe area code expansion waitlist.</p>
              <p>We're building a community-funded expansion model that will allow you to:</p>
              <ul>
                <li>Request new area codes for our DNC database</li>
                <li>Contribute to growing our coverage</li>
                <li>Unlock special benefits like price locks and unlimited area codes</li>
              </ul>
              <p><strong>Expected Launch:</strong> Q2 2026</p>
              <p>We'll email you as soon as it's ready. In the meantime, you can start your 7-day free trial with our current Utah coverage (801, 385, 435) plus Nevada (702, 775).</p>
              <p style="margin-top: 30px;">
                <a href="https://echosafe.app/signup" style="background-color: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Start Free Trial
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
              <p style="color: #64748b; font-size: 12px;">
                Questions? Reply to this email or contact support@echosafe.app
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Failed to send waitlist confirmation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist',
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
