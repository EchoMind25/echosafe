import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Auth callback route handler
 *
 * Handles redirects from Supabase Auth for:
 * - Email verification (signup confirmation)
 * - Password reset (magic link)
 * - OAuth provider callbacks (if implemented)
 *
 * Supabase uses PKCE flow and redirects here with a `code` parameter.
 * The `type` parameter indicates what kind of auth action triggered the callback.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle error responses from Supabase
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription)
    const errorMessage = encodeURIComponent(errorDescription || 'Authentication failed')
    return NextResponse.redirect(
      new URL(`/login?error=${errorMessage}`, requestUrl.origin)
    )
  }

  // Handle code exchange (PKCE flow)
  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)

      // Handle specific error types
      if (exchangeError.message.includes('expired')) {
        return NextResponse.redirect(
          new URL('/login?error=Verification+link+has+expired.+Please+request+a+new+one.', requestUrl.origin)
        )
      }

      const errorMessage = encodeURIComponent(exchangeError.message)
      return NextResponse.redirect(
        new URL(`/login?error=${errorMessage}`, requestUrl.origin)
      )
    }

    // Determine where to redirect based on the type of auth action
    let redirectTo = '/dashboard'

    if (type === 'recovery') {
      // Password reset - redirect to the reset password page
      redirectTo = '/reset-password'
    } else if (type === 'signup' || type === 'email') {
      // Email verification - redirect to dashboard with a success message
      redirectTo = '/dashboard?verified=true'
    } else if (next) {
      // Custom redirect was specified (validate to prevent open redirect)
      redirectTo = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
    }

    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
  }

  // No code parameter - redirect to login
  console.warn('[Auth Callback] Called without code parameter')
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
