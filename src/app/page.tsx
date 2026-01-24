'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Brain,
  Users,
  Upload,
  Download,
  Sparkles,
  Shield,
  ArrowRight,
  Menu,
  X,
  Check,
  ChevronDown,
  Lock,
  EyeOff,
  Trash2,
  RefreshCw,
  Database,
} from 'lucide-react'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: Database,
      title: 'Daily FTC DNC Updates',
      description: 'Most competitors update monthly. We update daily. Every phone number checked against the latest federal DNC registry data.',
      color: 'text-echo-primary-500',
      bgColor: 'bg-echo-primary-500/10',
    },
    {
      icon: Brain,
      title: 'AI Risk Scoring (Stateless)',
      description: 'Real-time analysis using public data—DNC registry, PACER litigators, deleted numbers. AI gives you insights, then forgets everything. Nothing stored.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Users,
      title: 'Built-In CRM (User-Controlled)',
      description: 'Store leads permanently. You own this data. Export as CSV/JSON anytime. Delete with one click. We never access or monetize it.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Shield,
      title: '5-Year Compliance Audit Trail',
      description: 'TCPA requires 5-year records. We log every DNC check with timestamps, FTC release dates, and results. Your proof of due diligence.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
  ]

  const privacyFeatures = [
    {
      icon: EyeOff,
      title: 'We Don\'t Track You',
      description: 'No behavior tracking. No session analytics. No "anonymous" profiling. We literally can\'t tell you what you did yesterday.',
    },
    {
      icon: Lock,
      title: 'We Never Sell Your Data',
      description: 'Most competitors sell your lead data to other agents. We never will. Your leads stay yours. Our revenue comes from subscriptions, not your data.',
    },
    {
      icon: Trash2,
      title: 'Delete Everything, Instantly',
      description: 'One click. Gone. No 30-day waits. No "are you sure?" emails. No hidden backups. When you say delete, we delete.',
    },
    {
      icon: RefreshCw,
      title: 'AI Forgets Immediately',
      description: 'Claude API enterprise mode: zero retention. Your leads are analyzed, insights delivered, data forgotten. Nothing used for training. Nothing stored.',
    },
  ]

  const steps = [
    {
      number: '01',
      icon: Upload,
      title: 'Upload Your Leads',
      description: 'Drop your CSV file or paste from Google Sheets. We accept any format.',
    },
    {
      number: '02',
      icon: Sparkles,
      title: 'AI Scrubs & Scores',
      description: 'Our AI checks every number against DNC lists and calculates risk scores.',
    },
    {
      number: '03',
      icon: Download,
      title: 'Download Clean List',
      description: 'Get your clean leads instantly. Export to CSV, Excel, or JSON.',
    },
  ]

  const pricingFeatures = [
    'Unlimited lead scrubbing',
    '3 Utah area codes (801, 385, 435)',
    'AI-powered risk scoring',
    'Built-in CRM (unlimited leads)',
    'Daily FTC DNC updates',
    'Export in multiple formats',
    'Email support',
    'Delete all data anytime',
  ]

  const comparisonData = [
    { feature: 'Pricing', echoMind: '$47/month flat (unlimited)', competitors: '$0.08-0.12 per lead' },
    { feature: 'DNC Updates', echoMind: 'Daily (from FTC)', competitors: 'Monthly or quarterly' },
    { feature: 'AI Risk Scoring', echoMind: 'Real-time, stateless (0-100)', competitors: 'Binary or none' },
    { feature: 'Your Lead Data', echoMind: 'Never sold. Ever.', competitors: 'Often resold to other agents' },
    { feature: 'Data Control', echoMind: 'Export/delete with one click', competitors: 'Good luck finding the button' },
    { feature: 'Annual Cost (1,500 leads/mo)', echoMind: '$564/year', competitors: '$1,440 - $2,160/year' },
    { feature: 'Your Savings', echoMind: '$876 - $1,596/year', competitors: '$0 (you\'re the product)' },
  ]

  return (
    <div className="min-h-screen bg-echo-neutral-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-echo-neutral-900/95 backdrop-blur-md border-b border-echo-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-echo-primary-400 to-echo-primary-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-white">
                  Echo Safe
                </span>
                <span className="text-xs text-purple-400 -mt-1 hidden sm:block">Privacy-First</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-echo-neutral-400 hover:text-white transition-colors">
                Features
              </a>
              <a href="#privacy" className="text-sm font-medium text-echo-neutral-400 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#pricing" className="text-sm font-medium text-echo-neutral-400 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-echo-neutral-400 hover:text-white transition-colors">
                How It Works
              </a>
              <Link
                href="/login"
                className="text-sm font-medium text-echo-neutral-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2.5 bg-echo-primary-500 hover:bg-echo-primary-600 text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-echo-primary-500/25"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-echo-neutral-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-echo-neutral-900 border-t border-echo-neutral-800">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block py-2 text-echo-neutral-300 hover:text-white transition-colors">
                Features
              </a>
              <a href="#privacy" className="block py-2 text-echo-neutral-300 hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#pricing" className="block py-2 text-echo-neutral-300 hover:text-white transition-colors">
                Pricing
              </a>
              <a href="#how-it-works" className="block py-2 text-echo-neutral-300 hover:text-white transition-colors">
                How It Works
              </a>
              <Link href="/login" className="block py-2 text-echo-neutral-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full py-3 bg-echo-primary-500 hover:bg-echo-primary-600 text-white text-center font-medium rounded-lg transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-echo-neutral-900 via-echo-neutral-800 to-echo-neutral-900" />

        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-echo-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Privacy Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-purple-500/10 border border-purple-500/30 rounded-full animate-fade-in">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">
              Privacy-First DNC Scrubbing
            </span>
          </div>

          {/* Main Heading - SEO Optimized */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight animate-slide-up">
            <span className="bg-gradient-to-r from-echo-primary-400 via-echo-primary-500 to-teal-400 bg-clip-text text-transparent">
              DNC Scrubbing That
            </span>
            <br />
            <span className="text-white">Doesn&apos;t Track You</span>
          </h1>

          {/* Value Prop - Direct Braxton Voice */}
          <p className="mt-6 text-xl md:text-2xl text-echo-neutral-300 font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            AI-powered TCPA compliance for real estate. Unlimited scrubbing, industry-specific insights, complete data control.
            <span className="text-purple-400"> No tracking. No profiling. No data selling.</span>
          </p>

          {/* ROI Statement */}
          <p className="mt-6 text-lg text-echo-neutral-400 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-white font-semibold">Save $1,200+/year</span> vs per-lead pricing.
            <span className="text-echo-neutral-500"> $47/month unlimited</span> with daily FTC updates.
            <br className="hidden sm:block" />
            <span className="text-purple-400">Delete your data anytime. No questions asked.</span>
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 bg-echo-primary-500 hover:bg-echo-primary-600 text-white text-lg font-medium rounded-xl shadow-lg shadow-echo-primary-500/30 hover:shadow-xl hover:shadow-echo-primary-500/40 hover:scale-105 transition-all duration-200"
            >
              Start 14-Day Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="#privacy"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 border-2 border-purple-500/50 text-purple-400 hover:border-purple-500 hover:text-purple-300 text-lg font-medium rounded-xl transition-all duration-200"
            >
              <Shield className="w-5 h-5" />
              See Privacy Promise
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-echo-neutral-500 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Delete data anytime
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-echo-neutral-600" />
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <section id="privacy" className="py-20 md:py-32 bg-gradient-to-b from-purple-900/20 to-echo-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400">Privacy-First Architecture</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              We Don&apos;t Track You. We Don&apos;t Sell Your Data.
            </h2>
            <p className="text-lg text-echo-neutral-400 max-w-2xl mx-auto">
              Most DNC services track everything and sell your leads to other agents. We can&apos;t do that even if we wanted to—our architecture doesn&apos;t collect that data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {privacyFeatures.map((feature) => (
              <div
                key={feature.title}
                className="bg-echo-neutral-800/50 border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all"
              >
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-echo-neutral-400 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Privacy Promise Box */}
          <div className="mt-12 bg-gradient-to-r from-purple-900/30 to-echo-primary-900/30 border border-purple-500/30 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <Shield className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Our Privacy Promise</h3>
                <p className="text-echo-neutral-300 mb-4">
                  We will <span className="text-purple-400 font-semibold">never</span> sell, share, or monetize your lead data.
                  AI insights are generated in real-time and never stored. Delete all your data with one click—immediately honored. No 30-day waits. No hoops.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-2 text-purple-300">
                    <Check className="w-4 h-4" /> Zero data retention AI
                  </span>
                  <span className="flex items-center gap-2 text-purple-300">
                    <Check className="w-4 h-4" /> SOC 2 encrypted storage
                  </span>
                  <span className="flex items-center gap-2 text-purple-300">
                    <Check className="w-4 h-4" /> CCPA/GDPR compliant
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-echo-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-echo-neutral-900">
              TCPA Compliance Features Built on Privacy
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-600 max-w-2xl mx-auto">
              Real-time DNC scrubbing, AI risk scoring, and compliance tools—without tracking you or selling your data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-echo-neutral-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-echo-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-echo-neutral-900">
              Why Real Estate Agents Switch to Echo Safe
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-600">
              $1,200+/year in savings. Daily updates vs monthly. Privacy you can actually verify.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-echo-neutral-200 shadow-lg">
            <table className="w-full">
              <thead>
                <tr className="bg-echo-neutral-50">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-echo-neutral-900">Feature</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-echo-primary-600">Echo Safe</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-echo-neutral-500">Competitors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-echo-neutral-100">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="hover:bg-echo-neutral-50">
                    <td className="px-6 py-4 text-sm text-echo-neutral-700">{row.feature}</td>
                    <td className="px-6 py-4 text-sm font-medium text-echo-primary-600">{row.echoMind}</td>
                    <td className="px-6 py-4 text-sm text-echo-neutral-500">{row.competitors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-echo-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-echo-neutral-900">
              Get Started in 3 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-600">
              From upload to clean leads in under 10 seconds
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-echo-primary-200 to-echo-primary-100" />
                )}

                {/* Step Number */}
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-br from-echo-primary-50 to-echo-primary-100 rounded-2xl">
                  <span className="absolute -top-2 -right-2 text-5xl font-bold text-echo-primary-500/20">
                    {step.number}
                  </span>
                  <step.icon className="w-10 h-10 text-echo-primary-500" />
                </div>

                <h3 className="text-xl font-semibold text-echo-neutral-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-echo-neutral-600 max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 bg-gradient-to-br from-echo-neutral-900 to-echo-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Transparent Pricing. No Hidden Fees. No Data Selling.
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-400">
              Competitors charge per lead and sell your data for extra revenue. We charge a flat rate and make money the honest way—from your subscription.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Popular Badge */}
              <div className="absolute top-0 right-0 bg-echo-primary-500 text-white text-xs font-bold px-4 py-2 rounded-bl-xl">
                MOST POPULAR
              </div>

              <div className="p-8 md:p-10">
                <h3 className="text-xl font-semibold text-echo-neutral-900 mb-2">
                  Professional Plan
                </h3>
                <p className="text-echo-neutral-600 mb-6">
                  Unlimited DNC scrubbing + AI risk scoring
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold text-echo-neutral-900">$47</span>
                  <span className="text-xl text-echo-neutral-500">/month</span>
                </div>
                <p className="text-sm text-echo-neutral-500 mb-2">
                  That&apos;s <span className="text-green-600 font-semibold">$564/year</span> vs <span className="line-through">$1,440-$2,160</span> with per-lead pricing
                </p>
                <p className="text-sm text-green-600 font-medium mb-8">
                  Save $876-$1,596/year
                </p>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {pricingFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-echo-primary-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-echo-primary-600" />
                      </div>
                      <span className="text-echo-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  href="/signup"
                  className="block w-full py-4 bg-echo-primary-500 hover:bg-echo-primary-600 text-white text-center text-lg font-semibold rounded-xl shadow-lg shadow-echo-primary-500/30 hover:shadow-xl transition-all"
                >
                  Start 14-Day Free Trial
                </Link>

                <p className="mt-4 text-center text-sm text-echo-neutral-500">
                  No credit card required
                </p>

                {/* Privacy Badge */}
                <div className="mt-6 flex items-center justify-center gap-2 text-purple-600">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Privacy-First Platform</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-echo-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Stop Overpaying. Start Protecting Your Privacy.
          </h2>
          <p className="text-xl text-echo-primary-100 mb-4 max-w-2xl mx-auto">
            14-day free trial. No credit card required. Delete your data anytime.
          </p>
          <p className="text-lg text-echo-primary-200 mb-10 max-w-2xl mx-auto">
            See why real estate professionals are switching to privacy-first DNC compliance.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-14 px-8 bg-white hover:bg-echo-neutral-100 text-echo-primary-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-echo-neutral-900 border-t border-echo-neutral-800 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-echo-primary-400 to-echo-primary-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-white">Echo Safe</span>
                <span className="text-xs text-purple-400">Privacy-First DNC Compliance</span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              <Link href="/features" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/privacy" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/legal/disclaimer" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Legal Disclaimer
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-echo-neutral-500">
              &copy; 2026 Echo Safe Systems. We don&apos;t sell your data.
            </p>
          </div>

        </div>
      </footer>
    </div>
  )
}
