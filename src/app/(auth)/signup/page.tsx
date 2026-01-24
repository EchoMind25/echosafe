'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signupSchema, type SignupFormData, INDUSTRY_OPTIONS } from '@/core/validation/auth.schema'
import { signUp } from '@/core/services/auth.service'
import { Shield, Info } from 'lucide-react'
import { GoogleOAuthButton, OAuthDivider } from '@/components/auth/google-oauth-button'

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      acceptTerms: false,
      industry: '',
    },
  })

  const selectedIndustry = watch('industry')

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp(
        data.email,
        data.password,
        data.fullName,
        data.industry,
        data.company,
        data.industryCustom
      )

      if (result.success) {
        if (result.data?.needsEmailVerification) {
          setSuccess(true)
        } else {
          router.push('/dashboard')
        }
      } else {
        const errorMessage = result.error?.message || 'Failed to create account'
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else if (errorMessage.includes('weak password') || errorMessage.includes('password')) {
          setError('Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.')
        } else {
          setError(errorMessage)
        }
        console.error('Signup error:', result.error)
      }
    } catch (err) {
      console.error('Unexpected signup error:', err)
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
          We&apos;ve sent a verification link to your email address. Please click the link to verify your account.
        </p>
        <Link
          href="/login"
          className="inline-block text-echo-primary-500 hover:text-echo-primary-600 font-medium transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-echo-neutral-900">
          Create Your Account
        </h2>
        <p className="mt-2 text-sm text-echo-neutral-600">
          Start scrubbing leads in minutes
        </p>
      </div>

      {/* Privacy Badge */}
      <div className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
        <Shield className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-purple-800 font-medium">Privacy-First Platform</span>
      </div>

      {/* Google OAuth Quick Signup */}
      <GoogleOAuthButton mode="signup" />
      <OAuthDivider />

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            {...register('fullName')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              placeholder:text-echo-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.fullName
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
            placeholder="John Smith"
          />
          {errors.fullName && (
            <p className="text-xs text-red-500">{errors.fullName.message}</p>
          )}
        </div>

        {/* Company Field */}
        <div className="space-y-2">
          <label
            htmlFor="company"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Company <span className="text-echo-neutral-400 font-normal">(optional)</span>
          </label>
          <input
            id="company"
            type="text"
            autoComplete="organization"
            {...register('company')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              placeholder:text-echo-neutral-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.company
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
            placeholder="Acme Inc."
          />
          {errors.company && (
            <p className="text-xs text-red-500">{errors.company.message}</p>
          )}
        </div>

        {/* Industry Selection */}
        <div className="space-y-2">
          <label
            htmlFor="industry"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Your Industry
          </label>
          <select
            id="industry"
            {...register('industry')}
            className={`
              w-full h-12 px-4
              bg-white
              border rounded-lg
              text-echo-neutral-900
              cursor-pointer
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
              ${errors.industry
                ? 'border-red-500 focus:border-red-500'
                : 'border-echo-neutral-300 focus:border-echo-primary-500'
              }
            `}
          >
            <option value="">Select your industry...</option>
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.industry && (
            <p className="text-xs text-red-500">{errors.industry.message}</p>
          )}
          <div className="flex items-start gap-2 mt-1">
            <Info className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-echo-neutral-500">
              This helps us tailor AI compliance insights to your specific industry.
              We don&apos;t track or profile your usage.
            </p>
          </div>
        </div>

        {/* Custom Industry Field (shown when "Other" is selected) */}
        {selectedIndustry === 'other' && (
          <div className="space-y-2">
            <label
              htmlFor="industryCustom"
              className="block text-sm font-medium text-echo-neutral-700"
            >
              Please specify your industry
            </label>
            <input
              id="industryCustom"
              type="text"
              {...register('industryCustom')}
              className={`
                w-full h-12 px-4
                bg-white
                border rounded-lg
                text-echo-neutral-900
                placeholder:text-echo-neutral-400
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-echo-primary-500/20
                ${errors.industryCustom
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-echo-neutral-300 focus:border-echo-primary-500'
                }
              `}
              placeholder="e.g., Mortgage Lending"
            />
            {errors.industryCustom && (
              <p className="text-xs text-red-500">{errors.industryCustom.message}</p>
            )}
          </div>
        )}

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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-echo-neutral-700"
          >
            Password
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
            placeholder="Min. 8 characters"
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
            Confirm Password
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
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <input
              id="acceptTerms"
              type="checkbox"
              {...register('acceptTerms')}
              className="
                mt-1 h-4 w-4
                rounded
                border-echo-neutral-300
                text-echo-primary-500
                focus:ring-echo-primary-500
                cursor-pointer
              "
            />
            <label
              htmlFor="acceptTerms"
              className="text-sm text-echo-neutral-600 cursor-pointer"
            >
              I agree to the{' '}
              <Link
                href="/terms"
                className="text-echo-primary-500 hover:text-echo-primary-600 transition-colors"
                target="_blank"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy"
                className="text-echo-primary-500 hover:text-echo-primary-600 transition-colors"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
          )}
        </div>

        {/* Legal Disclaimer */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <p className="text-xs text-amber-900 font-semibold">
            Important Legal Notice
          </p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>Echo Safe is a data checking tool, not a compliance solution or legal advice.</li>
            <li>You are solely responsible for TCPA/DNC compliance and maintaining your own call records.</li>
            <li>DNC data may be incomplete or outdated. Always verify critical leads independently.</li>
            <li>AI insights are informational only and do not constitute legal guidance.</li>
          </ul>
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
              Creating Account...
            </>
          ) : (
            'Create Account'
          )}
        </button>
      </form>

      {/* Privacy Guarantee */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-900 mb-1">Privacy Guarantee</p>
            <p className="text-xs text-purple-700">
              We don&apos;t track you, profile you, or sell your data. Your leads stay yours.
              Delete anytime, no questions asked.
            </p>
          </div>
        </div>
      </div>

      {/* Sign In Link */}
      <p className="text-center text-sm text-echo-neutral-600">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-echo-primary-500 hover:text-echo-primary-600 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
