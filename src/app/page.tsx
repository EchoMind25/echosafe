'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  Brain,
  Users,
  Zap,
  Upload,
  Download,
  Sparkles,
  Shield,
  ArrowRight,
  Menu,
  X,
  Check,
  ChevronDown,
} from 'lucide-react'

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: CheckCircle,
      title: 'Unlimited Scrubbing',
      description: 'Flat $60/month. No per-lead fees. Scrub as many leads as you want.',
      color: 'text-echo-primary-500',
      bgColor: 'bg-echo-primary-500/10',
    },
    {
      icon: Brain,
      title: 'Smart Risk Analysis',
      description: 'Beyond DNC yes/no. Get AI-powered risk scores (0-100) for every lead.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: Users,
      title: 'Free CRM Included',
      description: 'Save and manage leads forever. No extra cost. Instant CRM integration.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Process 1,000 leads in under 10 seconds. Real-time results.',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
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
      description: 'Get your clean leads instantly. Export to CSV or sync to your CRM.',
    },
  ]

  const pricingFeatures = [
    'Unlimited lead scrubbing',
    '3 Utah area codes (801, 385, 435)',
    'AI-powered risk scoring',
    'Built-in CRM (unlimited leads)',
    '1 CRM integration included',
    'Google Sheets add-on',
    'Email support',
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
              <span className="text-lg md:text-xl font-bold text-white">
                Echo Mind
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-echo-neutral-400 hover:text-white transition-colors">
                Features
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
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-echo-primary-500/10 border border-echo-primary-500/20 rounded-full animate-fade-in">
            <span className="w-2 h-2 bg-echo-primary-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-echo-primary-400 uppercase tracking-wider">
              Now serving Utah real estate professionals
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight animate-slide-up">
            <span className="bg-gradient-to-r from-echo-primary-400 via-echo-primary-500 to-teal-400 bg-clip-text text-transparent">
              Echo Mind Compliance
            </span>
          </h1>

          {/* Tagline */}
          <p className="mt-6 text-xl md:text-2xl text-echo-neutral-300 font-light animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Intelligent DNC Lead Scrubbing Platform
          </p>

          {/* Value Proposition */}
          <p className="mt-6 text-lg text-echo-neutral-400 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Stop paying per lead. Get unlimited DNC scrubbing with AI-powered risk scoring for just $60/month.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/signup"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 h-14 px-8 bg-echo-primary-500 hover:bg-echo-primary-600 text-white text-lg font-medium rounded-xl shadow-lg shadow-echo-primary-500/30 hover:shadow-xl hover:shadow-echo-primary-500/40 hover:scale-105 transition-all duration-200"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 border-2 border-echo-neutral-700 text-echo-neutral-300 hover:border-echo-primary-500 hover:text-echo-primary-500 text-lg font-medium rounded-xl transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* Dev Mode Link */}
          <div className="mt-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link
              href="/dashboard"
              className="text-xs text-echo-neutral-600 hover:text-echo-neutral-500 transition-colors"
            >
              View Dashboard (Dev Mode)
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-echo-neutral-600" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 bg-echo-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-echo-neutral-900">
              Why Real Estate Agents Choose Echo Mind
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-600 max-w-2xl mx-auto">
              Everything you need to stay TCPA compliant and call with confidence
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

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-white">
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
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-echo-neutral-400">
              No hidden fees. No per-lead charges. Just one flat rate.
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
                  Everything you need to stay compliant
                </p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-8">
                  <span className="text-6xl font-bold text-echo-neutral-900">$60</span>
                  <span className="text-xl text-echo-neutral-500">/month</span>
                </div>

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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-echo-primary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Scrub Smarter?
          </h2>
          <p className="text-xl text-echo-primary-100 mb-10 max-w-2xl mx-auto">
            Join hundreds of Utah real estate professionals who trust Echo Mind for TCPA compliance.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 h-14 px-8 bg-white hover:bg-echo-neutral-100 text-echo-primary-600 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-echo-neutral-900 border-t border-echo-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-echo-primary-400 to-echo-primary-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Echo Mind</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
              <Link href="/docs" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Docs
              </Link>
              <Link href="/api" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/support" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Support
              </Link>
              <Link href="/privacy" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-echo-neutral-400 hover:text-white transition-colors">
                Terms
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-sm text-echo-neutral-500">
              &copy; 2026 Echo Mind Systems
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
