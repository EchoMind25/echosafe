import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthorizationUrl } from '@/lib/integrations/followupboss'
import { cookies } from 'next/headers'
import crypto from 'crypto'

// ============================================================================
// FEATURE FLAG: CRM Integrations Coming Soon
// ============================================================================
const CRM_INTEGRATIONS_COMING_SOON = true

// Helper to create typed supabase queries for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)

// ============================================================================
// GET - Start OAuth flow for Follow Up Boss
// ============================================================================

export async function GET(_request: NextRequest) {
  // Coming Soon - redirect with message
  if (CRM_INTEGRATIONS_COMING_SOON) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=coming_soon`
    )
  }

  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Redirect to login with return URL
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?redirect=${encodeURIComponent(returnUrl)}`
      )
    }

    // Check if user already has a Follow Up Boss integration
    const { data: existing } = await fromTable(supabase, 'crm_integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('crm_type', 'followupboss')
      .single()

    if (existing) {
      // Redirect back with error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=already_connected`
      )
    }

    // Generate a secure state parameter
    const state = crypto.randomBytes(32).toString('hex')

    // Store state in a cookie (expires in 10 minutes)
    const cookieStore = await cookies()
    cookieStore.set('fub_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
      path: '/',
    })

    // Also store user ID to associate with the integration after callback
    cookieStore.set('fub_oauth_user', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600,
      path: '/',
    })

    // Generate authorization URL and redirect
    const authUrl = getAuthorizationUrl(state)

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('OAuth authorize error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations?error=oauth_failed`
    )
  }
}
