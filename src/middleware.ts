import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware for Echo Mind Compliance
 *
 * Handles:
 * - Session refresh (keeps auth tokens fresh via cookie management)
 * - Route protection (redirects unauthenticated users from protected routes)
 * - Auth route guards (redirects authenticated users away from auth pages)
 * - Redirect URL preservation (saves intended destination for post-login redirect)
 *
 * IMPORTANT: Uses @supabase/ssr with proper cookie handling for Next.js 14 App Router
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // Create initial response
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip middleware for static files and specific paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/public') ||
    pathname.includes('.') // Static files
  ) {
    return supabaseResponse
  }

  try {
    // Create Supabase client with proper cookie handling for middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // IMPORTANT: Use getUser() instead of getSession() for security
    // getSession() reads from cookies which can be tampered with
    // getUser() validates the JWT with Supabase Auth server
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Define route categories
    const publicPaths = ['/', '/pricing', '/features', '/about', '/contact', '/terms', '/privacy']
    const authPaths = ['/login', '/signup', '/forgot-password', '/reset-password']
    const protectedPaths = [
      '/dashboard',
      '/scrub',
      '/crm',
      '/history',
      '/settings',
      '/integrations',
      '/expansion',
      '/admin',
      '/results',
    ]

    const isPublicRoute = publicPaths.some(path => pathname === path)
    const isAuthRoute = authPaths.some(path => pathname.startsWith(path))
    const isProtectedRoute = protectedPaths.some(path => pathname.startsWith(path))
    const isAuthCallback = pathname.startsWith('/auth/callback')

    // Always allow auth callback routes (these handle email verification, password reset, etc.)
    if (isAuthCallback) {
      return supabaseResponse
    }

    // Allow public routes without auth check
    if (isPublicRoute) {
      return supabaseResponse
    }

    // Handle protected routes - redirect unauthenticated users to login
    if (isProtectedRoute && !user) {
      const redirectUrl = new URL('/login', request.url)
      // Preserve the original URL so we can redirect back after login
      redirectUrl.searchParams.set(
        'redirect',
        pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      )
      return NextResponse.redirect(redirectUrl)
    }

    // Handle auth routes - redirect authenticated users to dashboard
    if (isAuthRoute && user) {
      const redirectTo = searchParams.get('redirect') || '/dashboard'
      // Validate redirect URL to prevent open redirect attacks
      const validRedirect =
        redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : '/dashboard'
      return NextResponse.redirect(new URL(validRedirect, request.url))
    }

    return supabaseResponse
  } catch (error) {
    // Log error but don't block the request
    // This prevents auth issues from completely breaking the app
    console.error('[Middleware] Error:', error)
    return supabaseResponse
  }
}

/**
 * Configure which paths the middleware runs on.
 * Excludes static files, images, and favicon.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
