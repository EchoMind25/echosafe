'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Zap,
  Sparkles,
  CheckCircle,
} from 'lucide-react'

// ============================================================================
// CRM INTEGRATIONS - COMING SOON
// Phase 2 feature - placeholder page
// ============================================================================

const COMING_SOON_CRMS = [
  {
    name: 'Follow Up Boss',
    description: 'Real estate CRM with automated follow-up',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Lofty',
    description: 'All-in-one real estate platform',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'kvCORE',
    description: 'Real estate technology platform',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">CRM Integrations</h1>
          <p className="mt-1 text-slate-600">
            Connect your CRM to automatically sync clean leads
          </p>
        </div>
      </div>

      {/* Coming Soon Hero */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-teal-100 rounded-2xl rotate-6" />
            <div className="absolute inset-0 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Zap className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-100 text-teal-700 text-sm font-medium rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            CRM Auto-Sync
          </h2>
          <p className="text-slate-600 max-w-lg mx-auto mb-8">
            Soon you&apos;ll be able to automatically sync your clean, compliant leads
            directly to your favorite CRM. No more manual exports!
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Real-time sync</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Duplicate detection</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-sm text-slate-700">Risk score tagging</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available CRMs Preview */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Integrations We&apos;re Building
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COMING_SOON_CRMS.map((crm) => (
            <div
              key={crm.name}
              className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm opacity-75"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 ${crm.bgColor} rounded-xl flex items-center justify-center`}>
                  <Zap className={`w-7 h-7 ${crm.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{crm.name}</h3>
                  <p className="text-sm text-slate-500">{crm.description}</p>
                </div>
              </div>

              <button
                disabled
                className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="bg-slate-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">How It Will Work</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>Connect your CRM with one click (OAuth or API key)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>After scrubbing, clean leads (risk score 20 or below) auto-sync to your CRM</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>Duplicate contacts are detected and updated instead of creating duplicates</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
