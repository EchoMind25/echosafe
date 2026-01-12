'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/core/validation/auth.schema'
import { resetPassword } from '@/core/services/auth.service'
import { ErrorMessage } from '@/components/ui/error-message'

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(urlError)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await resetPassword(data.email)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error?.message || 'Failed to send reset link')
        console.error('Password reset error:', result.error)
      }
    } catch (err) {
      console.error('Unexpected password reset error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

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
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Check Your Email
        </h2>
        <p className="text-echo-neutral-600">
          If an account exists with that email address, you will receive a password reset link shortly.
        </p>
        <p className="text-sm text-echo-neutral-500">
          Didn&apos;t receive the email? Check your spam folder or try again.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => setSuccess(false)}
            className="text-echo-primary-500 hover:text-echo-primary-600 font-medium transition-colors"
          >
            Try another email
          </button>
          <p className="text-sm text-echo-neutral-400">or</p>
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
          Forgot Password?
        </h2>
        <p className="mt-2 text-sm text-echo-neutral-600">
          No worries, we&apos;ll send you reset instructions
        </p>
      </div>

      {/* Error Message */}
      <ErrorMessage
        message={error}
        onDismiss={() => setError(null)}
      />

      {/* Reset Form */}
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
              Sending Reset Link...
            </>
          ) : (
            'Send Reset Link'
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
