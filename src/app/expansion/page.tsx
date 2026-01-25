'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase'
import {
  Check,
  Shield,
  MapPin,
  Crown,
  ArrowRight,
  Zap,
  Globe,
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
} from 'lucide-react'
import {
  STATE_AREA_CODES,
  STATE_NAMES,
} from '@/lib/states'
import { FTC_CONTRIBUTION_COST } from '@/lib/pricing/config'
import { featureFlags } from '@/lib/feature-flags'

interface FtcSubscription {
  area_code: string
  state: string
  subscription_status: string
}

interface FoundersClubEligibility {
  isEligible: boolean
  isMember: boolean
  completedCount: number
  requiredCount: number
}

interface AreaCodeInfo {
  code: string
  state: string
  stateName: string
  isActive: boolean
  isPending: boolean
}

export default function ExpansionPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSubscriptions, setActiveSubscriptions] = useState<FtcSubscription[]>([])
  const [eligibility, setEligibility] = useState<FoundersClubEligibility | null>(null)
  const [selectedAreaCodes, setSelectedAreaCodes] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  // Check if contributions are enabled - redirect if not
  useEffect(() => {
    if (!featureFlags.enableContributions) {
      // Store a flag to show the message on pricing page
      sessionStorage.setItem('expansion_redirect', 'true')
      router.push('/pricing')
    }
  }, [router])

  useEffect(() => {
    // Skip data fetching if contributions are disabled
    if (!featureFlags.enableContributions) return

    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        // Fetch active FTC subscriptions
        const { data: subscriptions } = await supabase
          .from('ftc_subscriptions')
          .select('area_code, state, subscription_status')
          .eq('subscription_status', 'active')

        if (subscriptions) {
          setActiveSubscriptions(subscriptions)
        }

        // Check Founder's Club eligibility if logged in
        if (user) {
          const response = await fetch('/api/pricing/unlock-founders-club')
          if (response.ok) {
            const data = await response.json()
            setEligibility(data)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  // Build area code info with status
  const areaCodeInfoByState: Record<string, AreaCodeInfo[]> = {}
  const activeAreaCodes = new Set(activeSubscriptions.map(s => s.area_code))

  for (const [state, areaCodes] of Object.entries(STATE_AREA_CODES)) {
    areaCodeInfoByState[state] = areaCodes.map(code => ({
      code,
      state,
      stateName: STATE_NAMES[state] || state,
      isActive: activeAreaCodes.has(code),
      isPending: false,
    }))
  }

  const toggleAreaCodeSelection = (code: string) => {
    setSelectedAreaCodes(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  const handleSubmitRequest = async () => {
    if (!user) {
      window.location.href = '/signup'
      return
    }

    if (selectedAreaCodes.length === 0) return

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // For now, send an email/request to admin
      // In production, this would integrate with Stripe for payment
      const response = await fetch('/api/expansion/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaCodes: selectedAreaCodes,
          userEmail: user.email,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit request')
      }

      setSubmitSuccess(true)
      setSelectedAreaCodes([])
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalCost = selectedAreaCodes.length * FTC_CONTRIBUTION_COST
  const contributionsAfterPurchase = (eligibility?.completedCount || 0) + selectedAreaCodes.length
  const willUnlockFounders = contributionsAfterPurchase >= 3 && !eligibility?.isMember

  // If contributions are disabled, show a brief "redirecting" state
  if (!featureFlags.enableContributions) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center p-8">
          <Clock className="w-12 h-12 text-teal-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold text-white mb-2">Area Code Expansion</h1>
          <p className="text-slate-400 mb-4">Launching Q2 2026</p>
          <p className="text-slate-500 text-sm">Redirecting to pricing page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-teal-400" />
              </div>
              <span className="text-xl font-bold text-white">Echo Safe</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white hover:text-teal-400 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-white hover:text-teal-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-500/20 text-purple-400 rounded-full">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Community-Funded Expansion</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Expand DNC Coverage Together
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
            Help grow our DNC database by contributing to new area codes. Your contribution covers the FTC subscription cost and unlocks benefits for everyone.
          </p>
          <p className="text-lg text-teal-400 font-medium">
            ${FTC_CONTRIBUTION_COST} per area code contribution. Contribute 3 to unlock Founder's Club.
          </p>

          {/* Eligibility Status */}
          {eligibility && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-full">
              <Crown className="w-4 h-4" />
              <span>
                {eligibility.isMember ? (
                  <strong>Founder's Club Member</strong>
                ) : (
                  <>
                    Contributions: <strong>{eligibility.completedCount}/3</strong> toward Founder's Club
                  </>
                )}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-2xl border border-purple-500/30 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How Expansion Works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">1. Select Area Codes</h3>
                <p className="text-slate-400 text-sm">
                  Choose area codes you want added to the network. Each costs ${FTC_CONTRIBUTION_COST}.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">2. We Subscribe to FTC</h3>
                <p className="text-slate-400 text-sm">
                  Your contribution covers the $82 FTC annual fee plus processing. We handle the setup.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">3. Everyone Benefits</h3>
                <p className="text-slate-400 text-sm">
                  New area codes become available to all users. Contributors earn Founder's Club progress.
                </p>
              </div>
            </div>

            {/* Founder's Club Info */}
            <div className="mt-8 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Crown className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-teal-400 mb-1">Unlock Founder's Club</h4>
                  <p className="text-sm text-slate-300">
                    Contribute 3 area codes (${FTC_CONTRIBUTION_COST * 3} total) and your $47/month rate locks forever—even if we raise prices. Plus you get ALL area codes at no extra cost!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Area Code Selection */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Available Area Codes</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Select area codes to contribute. Active codes are already in our network.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Object.entries(areaCodeInfoByState).map(([state, areaCodes]) => (
                <div key={state} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-teal-400" />
                    {STATE_NAMES[state] || state}
                  </h3>
                  <div className="space-y-2">
                    {areaCodes.map(({ code, isActive }) => (
                      <button
                        key={code}
                        onClick={() => !isActive && toggleAreaCodeSelection(code)}
                        disabled={isActive}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          isActive
                            ? 'bg-teal-500/10 border border-teal-500/30 cursor-default'
                            : selectedAreaCodes.includes(code)
                            ? 'bg-purple-500/20 border border-purple-500 cursor-pointer'
                            : 'bg-slate-700/50 border border-slate-600 hover:border-purple-500/50 cursor-pointer'
                        }`}
                      >
                        <span className={`font-mono font-bold ${
                          isActive ? 'text-teal-400' : 'text-white'
                        }`}>
                          {code}
                        </span>
                        {isActive ? (
                          <span className="flex items-center gap-1 text-xs text-teal-400">
                            <Check className="w-4 h-4" />
                            Active
                          </span>
                        ) : selectedAreaCodes.includes(code) ? (
                          <span className="flex items-center gap-1 text-xs text-purple-400">
                            <Check className="w-4 h-4" />
                            Selected
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            ${FTC_CONTRIBUTION_COST}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Selection Summary & CTA */}
      {selectedAreaCodes.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 p-4 z-50">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-white font-semibold">
                {selectedAreaCodes.length} area code{selectedAreaCodes.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-slate-400 text-sm">
                Total: <span className="text-teal-400 font-bold">${totalCost}</span>
                {willUnlockFounders && (
                  <span className="ml-2 text-purple-400">
                    + Unlocks Founder's Club!
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedAreaCodes([])}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
                className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : user ? (
                  <>
                    Request Contribution
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Sign Up to Contribute
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {submitSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-teal-500 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-teal-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
            <p className="text-slate-400 mb-6">
              We've received your area code contribution request. Our team will reach out within 24 hours to complete the process.
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {submitError && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-red-500 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Something Went Wrong</h3>
            <p className="text-slate-400 mb-6">{submitError}</p>
            <button
              onClick={() => setSubmitError(null)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Alternative: Contact for Custom Requests */}
      <section className="py-16 sm:py-24 bg-slate-800/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Need a Specific Area Code?
          </h2>
          <p className="text-slate-400 mb-6">
            Don't see your area code listed? We can add any US area code to the network. Contact us with your request.
          </p>
          <a
            href="mailto:support@echosafe.app?subject=Area%20Code%20Request"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
          >
            Contact Support
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Echo Safe Compliance. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/pricing" className="text-slate-400 hover:text-white text-sm transition-colors">
                Pricing
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
