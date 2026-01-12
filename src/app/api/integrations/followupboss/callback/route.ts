import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCodeForTokens, encryptFUBCredentials } from '@/lib/integrations/followupboss'
import { cookies } from 'next/headers'

// ============================================================================
// GET - Handle OAuth callback from Follow Up Boss
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/integrations`

  try {
    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent(error)}&message=${encodeURIComponent(errorDescription || 'Authorization failed')}`
      )
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        `${redirectBase}?error=invalid_response&message=Missing authorization code or state`
      )
    }

    // Verify state parameter
    const cookieStore = await cookies()
    const storedState = cookieStore.get('fub_oauth_state')?.value
    const userId = cookieStore.get('fub_oauth_user')?.value

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${redirectBase}?error=invalid_state&message=State mismatch. Please try again.`
      )
    }

    if (!userId) {
      return NextResponse.redirect(
        `${redirectBase}?error=session_expired&message=Session expired. Please try again.`
      )
    }

    // Clear OAuth cookies
    cookieStore.delete('fub_oauth_state')
    cookieStore.delete('fub_oauth_user')

    // Exchange code for tokens
    const credentials = await exchangeCodeForTokens(code)

    // Encrypt credentials for storage
    const encryptedCredentials = encryptFUBCredentials(credentials)

    // Create integration in database
    const supabase = await createClient()

    // Double-check user doesn't already have integration (race condition prevention)
    const { data: existing } = await supabase
      .from('crm_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('crm_type', 'FOLLOWUPBOSS')
      .single()

    if (existing) {
      return NextResponse.redirect(
        `${redirectBase}?error=already_connected&message=Follow Up Boss is already connected`
      )
    }

    // Default sync settings
    const defaultSyncSettings = {
      auto_sync: true,
      sync_frequency: 'immediate',
      sync_clean_only: true,
      max_risk_score: 20,
    }

    // Create the integration
    const { data: integration, error: createError } = await supabase
      .from('crm_integrations')
      .insert({
        user_id: userId,
        crm_type: 'FOLLOWUPBOSS',
        credentials: encryptedCredentials,
        sync_settings: defaultSyncSettings,
        status: 'ACTIVE',
        consecutive_failures: 0,
      })
      .select('id')
      .single()

    if (createError) {
      console.error('Error creating integration:', createError)
      return NextResponse.redirect(
        `${redirectBase}?error=database_error&message=Failed to save integration`
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_type: 'crm_integration_connected',
      event_data: { crm_type: 'FOLLOWUPBOSS', integration_id: integration.id },
    })

    // Redirect with success
    return NextResponse.redirect(
      `${redirectBase}?success=true&crm=followupboss&message=Follow Up Boss connected successfully`
    )

  } catch (error) {
    console.error('OAuth callback error:', error)
    const message = error instanceof Error ? error.message : 'Connection failed'
    return NextResponse.redirect(
      `${redirectBase}?error=connection_failed&message=${encodeURIComponent(message)}`
    )
  }
}
