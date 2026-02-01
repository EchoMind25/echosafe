'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, FileText, Users, AlertTriangle, ArrowRight, X } from 'lucide-react'
import { TRIAL_LIMITS, type TrialStatus, getTrialStatusMessage, getTrialUsagePercentage } from '@/lib/trial'

interface TrialStatusBannerProps {
  trialStatus: TrialStatus
  onDismiss?: () => void
  variant?: 'full' | 'compact'
}

export function TrialStatusBanner({
  trialStatus,
  onDismiss,
  variant = 'full',
}: TrialStatusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show for active subscribers
  if (trialStatus.subscriptionStatus === 'active') {
    return null
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  const usage = getTrialUsagePercentage(trialStatus)
  const statusMessage = getTrialStatusMessage(trialStatus)

  // Determine urgency level for styling
  const isUrgent = trialStatus.daysRemaining <= 2 ||
    usage.leadsPercentage >= 80 ||
    usage.uploadsPercentage >= 80

  const isExpired = !trialStatus.isTrialActive && trialStatus.isOnTrial

  if (isExpired) {
    // Trial expired banner
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-300 mb-1">
              Trial Limit Reached
            </h3>
            <p className="text-sm text-red-700 dark:text-red-400 mb-3">
              {trialStatus.trialExpired
                ? 'Your 7-day trial period has ended.'
                : trialStatus.leadsLimitReached
                  ? `You've used all ${TRIAL_LIMITS.MAX_LEADS.toLocaleString()} trial leads.`
                  : `You've used all ${TRIAL_LIMITS.MAX_UPLOADS} trial uploads.`
              }
              {' '}Subscribe now to continue scrubbing leads and stay TCPA compliant.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Subscribe Now - $47/month
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    // Compact version for header/navbar
    return (
      <div className={`
        flex items-center gap-3 px-4 py-2 rounded-lg text-sm
        ${isUrgent
          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
          : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-300'
        }
      `}>
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">{statusMessage}</span>
        <Link
          href="/pricing"
          className="font-semibold hover:underline ml-auto"
        >
          Upgrade
        </Link>
      </div>
    )
  }

  // Full version for dashboard
  return (
    <div className={`
      relative rounded-xl p-5 mb-6 border
      ${isUrgent
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
      }
    `}>
      {onDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Status Message */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-amber-600' : 'text-blue-600'}`} />
            <h3 className={`font-semibold ${isUrgent ? 'text-amber-900 dark:text-amber-300' : 'text-blue-900 dark:text-blue-300'}`}>
              Free Trial
            </h3>
          </div>
          <p className={`text-sm ${isUrgent ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
            {statusMessage}
          </p>
        </div>

        {/* Usage Stats */}
        <div className="flex flex-wrap gap-4">
          {/* Days Remaining */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <Clock className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">
                {trialStatus.daysRemaining}
              </span>
              <span className="text-slate-500 dark:text-slate-400"> days left</span>
            </div>
          </div>

          {/* Leads Remaining */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <Users className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">
                {trialStatus.trialLeadsRemaining.toLocaleString()}
              </span>
              <span className="text-slate-500 dark:text-slate-400"> / {TRIAL_LIMITS.MAX_LEADS.toLocaleString()} leads</span>
            </div>
          </div>

          {/* Uploads Remaining */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm">
            <FileText className="w-4 h-4 text-slate-500" />
            <div className="text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">
                {trialStatus.trialUploadsRemaining}
              </span>
              <span className="text-slate-500 dark:text-slate-400"> / {TRIAL_LIMITS.MAX_UPLOADS} uploads</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/pricing"
          className={`
            inline-flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors whitespace-nowrap
            ${isUrgent
              ? 'bg-amber-600 hover:bg-amber-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          Upgrade to Pro
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Trial Usage
          </span>
          <span className="text-xs text-slate-500">
            {Math.round(usage.overallPercentage)}% used
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usage.overallPercentage >= 80
                ? 'bg-red-500'
                : usage.overallPercentage >= 50
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
            }`}
            style={{ width: `${usage.overallPercentage}%` }}
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to fetch trial status from API
 */
export function useTrialStatus() {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const response = await fetch('/api/trial/status')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setTrialStatus(data.data)
            setIsAdmin(data.isAdmin === true)
          }
        }
      } catch (err) {
        setError('Failed to fetch trial status')
        console.error('Error fetching trial status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrialStatus()
  }, [])

  return { trialStatus, isAdmin, isLoading, error }
}
