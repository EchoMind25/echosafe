'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updatePasswordSchema, type UpdatePasswordFormData } from '@/core/validation/auth.schema'
import { updatePassword, getSession } from '@/core/services/auth.service'
import { ErrorMessage } from '@/components/ui/error-message'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  })

  // Check if user has a valid session (came from password reset email)
  useEffect(() => {
    async function validateSession() {
      try {
        const sessionResult = await getSession()

        if (sessionResult.success && sessionResult.data) {
          setIsValidSession(true)
        } else {
          // No valid session - user may have accessed this page directly
          setError('Invalid or expired reset link. Please request a new password reset.')
          console.error('No valid session for password reset')
        }
      } catch (err) {
        console.error('Session validation error:', err)
        setError('Unable to validate your session. Please try again.')
      } finally {
        setIsValidating(false)
      }
    }

    validateSession()
  }, [])

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePassword(data.password)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login?message=Password+updated+successfully.+Please+sign+in.')
        }, 3000)
      } else {
        // Handle specific error cases
        const errorMessage = result.error?.message || 'Failed to update password'
        if (errorMessage.includes('same') || errorMessage.includes('different')) {
          setError('New password must be different from your current password.')
        } else if (errorMessage.includes('weak')) {
          setError('Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.')
        } else {
          setError(errorMessage)
        }
        console.error('Password update error:', result.error)
      }
    } catch (err) {
      console.error('Unexpected password update error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating session
  if (isValidating) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-echo-primary-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-echo-primary-500 animate-spin"
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
        </div>
        <h2 className="text-xl font-semibold text-echo-neutral-900">
          Validating Reset Link...
        </h2>
        <p className="text-echo-neutral-600">
          Please wait while we verify your password reset link.
        </p>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-echo-success/10 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-echo-success"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Password Updated
        </h2>
        <p className="text-echo-neutral-600">
          Your password has been successfully updated. You will be redirected to the login page shortly.
        </p>
        <Link
          href="/login"
          className="inline-block text-echo-primary-500 hover:text-echo-primary-600 font-medium transition-colors"
        >
          Sign in now
        </Link>
      </div>
    )
  }

  // Invalid session state
  if (!isValidSession && error) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Invalid Reset Link
        </h2>
        <p className="text-echo-neutral-600">
          {error}
        </p>
        <div className="space-y-3">
          <Link
            href="/forgot-password"
            className="inline-block w-full py-3 px-4 bg-echo-primary-500 hover:bg-echo-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Request New Reset Link
          </Link>
          <Link
            href="/login"
            className="inline-block text-echo-primary-500 hover:text-echo-primary-600 font-medium transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Set New Password
        </h2>
        <p className="mt-2 text-sm text-echo-neutral-600">
          Your new password must be different from previously used passwords
        </p>
      </div>

      {/* Error Message */}
      <ErrorMessage
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Password Requirements */}
      <div className="p-4 rounded-lg bg-echo-neutral-50 border border-echo-neutral-200">
        <p className="text-sm font-medium text-echo-neutral-700 mb-2">Password requirements:</p>
        <ul className="text-xs text-echo-neutral-600 space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-echo-neutral-400 rounded-full" />
            At least 8 characters long
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-echo-neutral-400 rounded-full" />
            Contains at least one uppercase letter
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-echo-neutral-400 rounded-full" />
            Contains at least one lowercase letter
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1 h-1 bg-echo-neutral-400 rounded-full" />
            Contains at least one number
          </li>
        </ul>
      </div>

      {/* Reset Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
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
            placeholder="Enter new password"
          />
          {errors.password && (
            <p className="text-xs text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              placeholder:text-echo-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.confirmPassword
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
            placeholder="Confirm new password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
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
              Updating Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>

      {/* Back to Sign In */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-echo-neutral-600 hover:text-echo-neutral-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}
