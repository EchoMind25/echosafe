'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import {
  Check,
  Star,
  Users,
  MapPin,
  Shield,
  Zap,
  Crown,
  ChevronRight,
  ArrowRight,
  Calculator,
} from 'lucide-react'

interface UserPricing {
  pricing_tier: string | null
  legacy_price_lock: number | null
  legacy_granted_at: string | null
}

interface FoundersClubEligibility {
  isEligible: boolean
  isMember: boolean
  completedCount: number
  requiredCount: number
}

export default function PricingPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [userPricing, setUserPricing] = useState<UserPricing | null>(null)
  const [eligibility, setEligibility] = useState<FoundersClubEligibility | null>(null)
  const [, setIsLoading] = useState(true)
  const [leadsPerMonth, setLeadsPerMonth] = useState(1500)
  const supabase = createBrowserClient()

  // ROI Calculator
  const perLeadLow = 0.08
  const perLeadHigh = 0.12
  const echoSafeMonthly = 47
  const competitorCostLow = leadsPerMonth * perLeadLow * 12
  const competitorCostHigh = leadsPerMonth * perLeadHigh * 12
  const echoSafeCost = echoSafeMonthly * 12
  const savingsLow = competitorCostLow - echoSafeCost
  const savingsHigh = competitorCostHigh - echoSafeCost

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Fetch user pricing info
          const { data: profile } = await supabase
            .from('users')
            .select('pricing_tier, legacy_price_lock, legacy_granted_at')
            .eq('id', user.id)
            .single() as { data: UserPricing | null }

          if (profile) setUserPricing(profile)

          // Check Founder's Club eligibility
          const response = await fetch('/api/pricing/unlock-founders-club')
          if (response.ok) {
            const data = await response.json()
            setEligibility(data)
          }
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const plans = [
    {
      name: 'Standard',
      price: 47,
      period: '/month',
      description: 'Perfect for individual real estate agents',
      highlighted: false,
      badge: null,
      features: [
        '5 area codes of your choice',
        'Unlimited lead scrubbing',
        'CSV upload & download',
        'Built-in CRM',
        'Risk scoring with AI',
        'Email support',
      ],
      cta: 'Get Started',
      ctaLink: user ? '/dashboard' : '/signup',
      icon: Shield,
      gradient: 'from-slate-600 to-slate-700',
    },
    {
      name: "Founder's Club",
      price: 47,
      period: '/month forever',
      description: 'Unlock all area codes with a one-time contribution',
      highlighted: true,
      badge: 'BEST VALUE',
      features: [
        'ALL area codes included',
        'Price locked forever',
        'Priority support',
        'Early access to features',
        'Unlimited team members',
        'API access (coming soon)',
      ],
      cta: eligibility?.isMember
        ? 'Current Plan'
        : eligibility?.isEligible
          ? 'Unlock Now'
          : `Contribute ${3 - (eligibility?.completedCount || 0)} more area codes`,
      ctaLink: eligibility?.isEligible ? '/api/pricing/unlock-founders-club' : '/expansion',
      ctaDisabled: eligibility?.isMember,
      icon: Crown,
      gradient: 'from-teal-500 to-emerald-500',
      unlock: {
        title: 'How to unlock:',
        steps: [
          'Contribute $100 for 3 new area codes',
          'We purchase them from FTC',
          'Your $47/month is locked forever',
        ],
      },
    },
    {
      name: 'Team Members',
      price: 15,
      period: '/month per seat',
      description: 'Add team members to your account',
      highlighted: false,
      badge: 'ADD-ON',
      features: [
        'Access to your area codes',
        'Shared lead database',
        'Individual login',
        'Activity tracking',
        'Role-based permissions',
        'Centralized billing',
      ],
      cta: 'Add Team Members',
      ctaLink: user ? '/settings/team' : '/signup',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-500',
    },
  ]

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

      {/* Hero */}
      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-500/20 text-purple-400 rounded-full">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">No Data Selling. Ever.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Transparent Pricing. No Hidden Fees.
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-4">
            Competitors charge per lead and sell your data for extra revenue. We charge a flat rate and make money the honest way—from your subscription.
          </p>
          <p className="text-lg text-teal-400 font-medium">
            $47/month unlimited. Save $1,200+/year. Delete your data anytime.
          </p>

          {/* Current Plan Badge */}
          {userPricing && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-full">
              <Star className="w-4 h-4" />
              <span>
                Current plan: <strong className="capitalize">{userPricing.pricing_tier?.replace('_', ' ') || 'Standard'}</strong>
                {userPricing.legacy_price_lock && ` ($${userPricing.legacy_price_lock}/mo locked)`}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-teal-900/30 to-slate-800 rounded-2xl border border-teal-500/30 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">ROI Calculator</h2>
                <p className="text-sm text-slate-400">See your savings vs per-lead pricing</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Leads scrubbed per month: <span className="text-teal-400 font-bold">{leadsPerMonth.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={leadsPerMonth}
                onChange={(e) => setLeadsPerMonth(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>100</span>
                <span>10,000</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400 mb-1">Competitor Cost</p>
                <p className="text-2xl font-bold text-red-400">
                  ${competitorCostLow.toLocaleString()} - ${competitorCostHigh.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">per year</p>
              </div>
              <div className="bg-teal-500/20 rounded-xl p-4 text-center border border-teal-500/30">
                <p className="text-sm text-slate-400 mb-1">Echo Safe Cost</p>
                <p className="text-2xl font-bold text-teal-400">${echoSafeCost}</p>
                <p className="text-xs text-slate-500">per year (unlimited)</p>
              </div>
              <div className="bg-green-500/20 rounded-xl p-4 text-center border border-green-500/30">
                <p className="text-sm text-slate-400 mb-1">Your Savings</p>
                <p className="text-2xl font-bold text-green-400">
                  ${savingsLow.toLocaleString()} - ${savingsHigh.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">per year</p>
              </div>
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Based on competitors charging $0.08-$0.12 per lead. Echo Safe: $47/month unlimited.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-teal-500/20 to-slate-800 border-2 border-teal-500'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      plan.highlighted
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 sm:p-8">
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400">{plan.period}</span>
                  </div>

                  {/* Description */}
                  <p className="text-slate-400 mb-6">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Unlock Steps for Founder's Club */}
                  {plan.unlock && !eligibility?.isMember && (
                    <div className="mb-6 p-4 bg-slate-700/50 rounded-lg">
                      <p className="text-sm font-medium text-teal-400 mb-2">{plan.unlock.title}</p>
                      <ol className="space-y-2">
                        {plan.unlock.steps.map((step, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* CTA Button */}
                  {plan.ctaDisabled ? (
                    <button
                      disabled
                      className="w-full py-3 bg-slate-600 text-slate-400 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {plan.cta}
                    </button>
                  ) : (
                    <Link
                      href={plan.ctaLink}
                      className={`w-full py-3 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                        plan.highlighted
                          ? 'bg-teal-500 hover:bg-teal-600 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Area Code Expansion */}
      <section className="py-16 sm:py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Area Code Expansion</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Need more coverage? Add individual area codes to your subscription.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Add Area Code</h3>
                      <p className="text-sm text-slate-400">Expand your coverage</p>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">
                        <strong className="text-white">$100</strong> first year (FTC fee)
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">
                        <strong className="text-white">$8/month</strong> ongoing
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">Weekly data updates</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-teal-400" />
                      <span className="text-slate-300">Counts toward Founder's Club</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col justify-between">
                  <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg mb-4">
                    <div className="flex items-center gap-2 text-teal-400 mb-2">
                      <Zap className="w-5 h-5" />
                      <span className="font-semibold">Pro Tip</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Contribute 3 area codes ($300 total) to unlock Founder's Club and get ALL area codes at $47/month forever!
                    </p>
                  </div>

                  <Link
                    href={user ? '/expansion' : '/signup'}
                    className="w-full py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Request Area Code
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Why is Echo Safe so much cheaper than competitors?",
                a: "Simple: we don't sell your data. Competitors charge per lead because they also monetize your lead data by selling it to other agents. We charge a flat subscription rate and that's our only revenue. No hidden fees, no data selling, no conflicts of interest.",
              },
              {
                q: "What's the catch with unlimited scrubbing?",
                a: "No catch. We pay the FTC a fixed fee per area code ($82/year), not per lookup. So whether you scrub 100 leads or 100,000, our costs are the same. We pass those savings to you.",
              },
              {
                q: "What's included in the base 5 area codes?",
                a: "You choose 5 area codes during onboarding—pick the markets you work in most. Need more? Add individual codes for $100/year or unlock all codes with Founder's Club.",
              },
              {
                q: "How does Founder's Club pricing lock work?",
                a: "Contribute 3 area codes ($300 total) and your $47/month rate locks forever—even if we raise prices. Plus you get ALL area codes at no extra cost. It's our thank-you for helping us expand coverage.",
              },
              {
                q: "What happens to my data if I cancel?",
                a: "You have 60 days to export everything. After that, we delete your personal data permanently. Compliance audit logs are anonymized (required by law for 5 years) but can't be linked back to you.",
              },
              {
                q: 'How often is DNC data updated?',
                a: 'Daily. Most competitors update monthly or quarterly. We pull fresh FTC data every day and log every check with timestamps and FTC release dates for your compliance records.',
              },
              {
                q: 'Do you sell my lead data to other agents?',
                a: 'Never. We will never sell, share, or monetize your leads. Our business model is subscriptions, not data brokering. Your leads stay yours.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">{faq.q}</h3>
                <p className="text-slate-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-teal-500/20 to-emerald-500/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-12 h-12 text-teal-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Stop Overpaying. Stop Getting Tracked.
          </h2>
          <p className="text-xl text-slate-300 mb-4">
            14-day free trial. No credit card required. Delete your data anytime.
          </p>
          <p className="text-lg text-slate-400 mb-8">
            Join real estate professionals who save $1,200+/year with privacy-first DNC compliance.
          </p>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg rounded-xl transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Start 14-Day Free Trial'}
            <ArrowRight className="w-5 h-5" />
          </Link>
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
              <Link href="/terms" className="text-slate-400 hover:text-white text-sm transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-slate-400 hover:text-white text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/contact" className="text-slate-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
