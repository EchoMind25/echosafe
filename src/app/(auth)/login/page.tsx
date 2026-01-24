'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/core/validation/auth.schema'
import { signIn } from '@/core/services/auth.service'
import { ErrorMessage } from '@/components/ui/error-message'
import { GoogleOAuthButton, OAuthDivider } from '@/components/auth/google-oauth-button'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Handle URL params for messages (from redirects)
  useEffect(() => {
    const errorParam = searchParams.get('error')
    const messageParam = searchParams.get('message')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
    }
    if (messageParam) {
      setSuccessMessage(decodeURIComponent(messageParam))
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await signIn(data.email, data.password)

      if (result.success) {
        // Redirect to intended destination or dashboard
        const redirectTo = searchParams.get('redirect') || '/dashboard'
        // Validate redirect URL to prevent open redirect attacks
        const validRedirect = redirectTo.startsWith('/') && !redirectTo.startsWith('//')
          ? redirectTo
          : '/dashboard'
        router.push(validRedirect)
      } else {
        // Handle specific error cases
        const errorMessage = result.error?.message || 'Failed to sign in'
        if (errorMessage.includes('Invalid') || errorMessage.includes('credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (errorMessage.includes('not confirmed') || errorMessage.includes('verify')) {
          setError('Please verify your email before signing in. Check your inbox for a verification link.')
        } else {
          setError(errorMessage)
        }
        console.error('Login error:', result.error)
      }
    } catch (err) {
      console.error('Unexpected login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-echo-neutral-600">
          Sign in to your account to continue
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      <ErrorMessage
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Email Address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              placeholder:text-echo-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.email
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-xs text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-echo-neutral-700"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-echo-primary-500 hover:text-echo-primary-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              placeholder:text-echo-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.password
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="
            w-full h-12
            bg-echo-primary-500 hover:bg-echo-primary-600 active:bg-echo-primary-700
            disabled:bg-echo-primary-300 disabled:cursor-not-allowed
            text-white font-medium
            rounded-lg
            shadow-sm hover:shadow-md
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-echo-primary-500 focus:ring-offset-2
            flex items-center justify-center gap-2
          "
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* OAuth Divider and Google Button */}
      <OAuthDivider />
      <GoogleOAuthButton mode="login" />

      {/* Sign Up Link */}
      <p className="text-center text-sm text-echo-neutral-600">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-echo-primary-500 hover:text-echo-primary-600 transition-colors"
        >
          Sign up
        </Link>
      </p>

      {/* Development Mode Skip Link - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="pt-4 border-t border-echo-neutral-200">
          <Link
            href="/dashboard"
            className="block text-center text-xs text-echo-neutral-400 hover:text-echo-neutral-500 transition-colors"
          >
            Skip to Dashboard (Dev Mode)
          </Link>
        </div>
      )}
    </div>
  )
}
