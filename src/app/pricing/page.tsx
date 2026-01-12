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
  Lock,
  Crown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'

interface UserPricing {
  pricing_tier: string
  legacy_price_lock: number | null
  area_code_limit: number
  founders_club_unlocked_at: string | null
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
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createBrowserClient()

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Fetch user pricing info
          const { data: profile } = await supabase
            .from('users')
            .select('pricing_tier, legacy_price_lock, area_code_limit, founders_club_unlocked_at')
            .eq('id', user.id)
            .single()

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
              <span className="text-xl font-bold text-white">Echo Mind</span>
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Stay compliant with FTC Do Not Call regulations. Choose the plan that fits your business.
          </p>

          {/* Current Plan Badge */}
          {userPricing && (
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-teal-500/20 text-teal-400 rounded-full">
              <Star className="w-4 h-4" />
              <span>
                Current plan: <strong className="capitalize">{userPricing.pricing_tier.replace('_', ' ')}</strong>
                {userPricing.legacy_price_lock && ` ($${userPricing.legacy_price_lock}/mo locked)`}
              </span>
            </div>
          )}
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
                q: "What's included in the base 5 area codes?",
                a: "Utah's Elite includes 801, 385, and 435 (all Utah area codes), plus 2 area codes of your choice. You select these during onboarding.",
              },
              {
                q: "How does Founder's Club pricing lock work?",
                a: "Once you unlock Founder's Club, your $47/month rate is locked forever, even if we raise prices. You also get unlimited area codes at no extra cost.",
              },
              {
                q: "What happens if I cancel and come back?",
                a: "If you have legacy pricing, you have a 90-day grace period to reactivate at your locked rate. After 90 days, you'll be on standard pricing.",
              },
              {
                q: 'How often is the DNC data updated?',
                a: 'We update our registry weekly with the latest FTC data. Each upload is logged with FTC release dates for compliance auditing.',
              },
              {
                q: 'Can I add team members later?',
                a: 'Yes! You can add team members at any time for $15/month per seat. They get access to your area codes and shared lead database.',
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
          <Lock className="w-12 h-12 text-teal-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Start Your 14-Day Free Trial
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            No credit card required. Get instant access to DNC compliance tools.
          </p>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold text-lg rounded-xl transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Start Free Trial'}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} Echo Mind Compliance. All rights reserved.
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
