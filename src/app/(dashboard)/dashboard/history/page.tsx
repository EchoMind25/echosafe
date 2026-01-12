'use client'

import Link from 'next/link'
import {
  Clock,
  Calendar,
  ArrowLeft,
  Sparkles,
  Download,
  BarChart3,
} from 'lucide-react'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Upload History</h1>
          <p className="mt-1 text-slate-600">
            View and download your past scrubbing jobs
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-blue-100 rounded-2xl rotate-6" />
            <div className="absolute inset-0 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Scrub History Dashboard
          </h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Track all your scrubbing jobs with detailed reports.
            Re-download clean lists and view compliance analytics.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Full Timeline</p>
                <p className="text-xs text-slate-500">All scrub jobs saved</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Re-download</p>
                <p className="text-xs text-slate-500">Get clean files anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Analytics</p>
                <p className="text-xs text-slate-500">Track compliance trends</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
