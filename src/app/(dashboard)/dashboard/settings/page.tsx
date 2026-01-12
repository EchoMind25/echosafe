'use client'

import Link from 'next/link'
import {
  Settings,
  User,
  ArrowLeft,
  Sparkles,
  Bell,
  CreditCard,
  Zap,
  ArrowRight,
} from 'lucide-react'

export default function SettingsPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="mt-1 text-slate-600">
            Manage your account and preferences
          </p>
        </div>
      </div>

      {/* CRM Integrations Card - Coming Soon */}
      <Link
        href="/dashboard/settings/integrations"
        className="block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-200 group"
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">CRM Integrations</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Coming Soon
                </span>
              </div>
              <p className="text-slate-500 text-sm">
                Connect Follow Up Boss, Lofty, and more to auto-sync clean leads
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-sm font-medium">Preview</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-slate-200 rounded-2xl rotate-6" />
            <div className="absolute inset-0 bg-slate-700 rounded-2xl flex items-center justify-center shadow-lg">
              <Settings className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-200 text-slate-700 text-sm font-medium rounded-full mb-4">
            <Sparkles className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Account Settings
          </h2>
          <p className="text-slate-600 max-w-md mx-auto mb-8">
            Customize your experience, manage billing, configure notifications,
            and connect your CRM integrations.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Profile</p>
                <p className="text-xs text-slate-500">Update your info</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Notifications</p>
                <p className="text-xs text-slate-500">Email preferences</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-slate-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Billing</p>
                <p className="text-xs text-slate-500">Manage subscription</p>
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
