// ============================================================================
// AUTH SERVICE
// Portable authentication logic using Supabase
// ============================================================================

import { createClient } from '@/lib/supabase/client'
import type { ApiResponse, User, SubscriptionStatus, SubscriptionTier, UserPreferences } from '@/types'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  fullName: string
  emailVerified: boolean
  createdAt: Date
}

interface SignUpData {
  user: AuthUser
  needsEmailVerification: boolean
}

interface SignInData {
  user: AuthUser
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function createErrorResponse<T>(code: string, message: string): ApiResponse<T> {
  return {
    success: false,
    error: { code, message },
  }
}

function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  }
}

/**
 * Maps a Supabase user to our AuthUser type
 */
function mapSupabaseUser(supabaseUser: SupabaseUser): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    fullName: supabaseUser.user_metadata?.full_name ?? '',
    emailVerified: supabaseUser.email_confirmed_at !== null,
    createdAt: new Date(supabaseUser.created_at),
  }
}

/**
 * Maps a Supabase user + profile data to our full User type
 */
function mapToFullUser(supabaseUser: SupabaseUser, profile?: Record<string, unknown>): User {
  const defaultPreferences: UserPreferences = {
    email_notifications: true,
    auto_sync_crm: false,
    include_risky_in_download: false,
    default_area_codes: [],
    theme: 'light',
  }

  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    fullName: supabaseUser.user_metadata?.full_name ?? profile?.full_name as string ?? '',
    phone: profile?.phone as string | undefined,
    company: profile?.company as string | undefined,
    industry: supabaseUser.user_metadata?.industry ?? profile?.industry as string ?? 'real-estate-residential',
    industryCustom: supabaseUser.user_metadata?.industry_custom ?? profile?.industry_custom as string | undefined,
    subscriptionStatus: (profile?.subscription_status as SubscriptionStatus) ?? 'TRIALING',
    subscriptionTier: (profile?.subscription_tier as SubscriptionTier) ?? 'BASE',
    stripeCustomerId: profile?.stripe_customer_id as string | undefined,
    stripeSubscriptionId: profile?.stripe_subscription_id as string | undefined,
    trialEndsAt: profile?.trial_ends_at ? new Date(profile.trial_ends_at as string) : undefined,
    preferences: (profile?.preferences as UserPreferences) ?? defaultPreferences,
    totalLeadsScrubbed: (profile?.total_leads_scrubbed as number) ?? 0,
    lastScrubAt: profile?.last_scrub_at ? new Date(profile.last_scrub_at as string) : undefined,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: profile?.updated_at ? new Date(profile.updated_at as string) : new Date(),
  }
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

/**
 * Sign up a new user with email, password, full name, industry, and optional company.
 * Creates the auth user and stores additional metadata including industry for AI insights.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  industry: string,
  company?: string,
  industryCustom?: string
): Promise<ApiResponse<SignUpData>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company: company || null,
          industry: industry,
          industry_custom: industryCustom || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
      },
    })

    if (error) {
      return createErrorResponse('AUTH_SIGNUP_FAILED', error.message)
    }

    if (!data.user) {
      return createErrorResponse('AUTH_SIGNUP_FAILED', 'Failed to create user account')
    }

    const authUser = mapSupabaseUser(data.user)
    const needsEmailVerification = !data.user.email_confirmed_at

    return createSuccessResponse(
      { user: authUser, needsEmailVerification },
      needsEmailVerification
        ? 'Account created. Please check your email to verify your account.'
        : 'Account created successfully.'
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_SIGNUP_ERROR', message)
  }
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse<SignInData>> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return createErrorResponse('AUTH_INVALID_CREDENTIALS', 'Invalid email or password')
      }
      if (error.message.includes('Email not confirmed')) {
        return createErrorResponse('AUTH_EMAIL_NOT_VERIFIED', 'Please verify your email before signing in')
      }
      return createErrorResponse('AUTH_SIGNIN_FAILED', error.message)
    }

    if (!data.user || !data.session) {
      return createErrorResponse('AUTH_SIGNIN_FAILED', 'Failed to sign in')
    }

    const authUser = mapSupabaseUser(data.user)

    return createSuccessResponse({
      user: authUser,
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at ?? 0,
      },
    }, 'Signed in successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_SIGNIN_ERROR', message)
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      return createErrorResponse('AUTH_SIGNOUT_FAILED', error.message)
    }

    return createSuccessResponse(null, 'Signed out successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_SIGNOUT_ERROR', message)
  }
}

/**
 * Send a password reset email to the specified email address.
 */
export async function resetPassword(email: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      return createErrorResponse('AUTH_RESET_FAILED', error.message)
    }

    // Always return success to prevent email enumeration attacks
    return createSuccessResponse(
      null,
      'If an account exists with this email, you will receive a password reset link.'
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_RESET_ERROR', message)
  }
}

/**
 * Update the current user's password.
 * User must be authenticated to call this.
 */
export async function updatePassword(newPassword: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      if (error.message.includes('should be different')) {
        return createErrorResponse('AUTH_SAME_PASSWORD', 'New password must be different from current password')
      }
      return createErrorResponse('AUTH_UPDATE_PASSWORD_FAILED', error.message)
    }

    return createSuccessResponse(null, 'Password updated successfully')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_UPDATE_PASSWORD_ERROR', message)
  }
}

/**
 * Get the current authenticated user with full profile data.
 * Returns null data if no user is authenticated.
 */
export async function getCurrentUser(): Promise<ApiResponse<User | null>> {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return createErrorResponse('AUTH_GET_USER_FAILED', authError.message)
    }

    if (!user) {
      return createSuccessResponse(null)
    }

    // Fetch additional user data from the users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userDataError && userDataError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine for new users
      // Only log in production to avoid noise in development
      if (process.env.NODE_ENV === 'production') {
        console.error('Error fetching user data:', userDataError)
      }
    }

    const fullUser = mapToFullUser(user, userData ?? undefined)

    return createSuccessResponse(fullUser)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_GET_USER_ERROR', message)
  }
}

// ============================================================================
// ADDITIONAL AUTH UTILITIES
// ============================================================================

/**
 * Check if a user is currently authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session !== null
  } catch {
    return false
  }
}

/**
 * Get the current session (if any).
 */
export async function getSession() {
  try {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return createErrorResponse('AUTH_SESSION_ERROR', error.message)
    }

    return createSuccessResponse(session)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_SESSION_ERROR', message)
  }
}

/**
 * Resend email verification to the current user.
 */
export async function resendVerificationEmail(email: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      return createErrorResponse('AUTH_RESEND_FAILED', error.message)
    }

    return createSuccessResponse(null, 'Verification email sent')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_RESEND_ERROR', message)
  }
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google's OAuth consent screen, then back to /auth/callback.
 */
export async function signInWithGoogle(): Promise<ApiResponse<null>> {
  try {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    })

    if (error) {
      return createErrorResponse('AUTH_OAUTH_FAILED', error.message)
    }

    // OAuth redirects, so this won't be reached unless there's an error
    return createSuccessResponse(null, 'Redirecting to Google...')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return createErrorResponse('AUTH_OAUTH_ERROR', message)
  }
}
