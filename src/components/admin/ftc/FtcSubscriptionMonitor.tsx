'use client'

import { useMemo } from 'react'
import type { FtcSubscription } from '@/lib/supabase/types'
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  MapPin,
  Bell,
  RefreshCw,
} from 'lucide-react'

interface FtcSubscriptionMonitorProps {
  subscriptions: FtcSubscription[]
  isLoading: boolean
}

export default function FtcSubscriptionMonitor({
  subscriptions,
  isLoading,
}: FtcSubscriptionMonitorProps) {
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiresAt: string): number => {
    const expiry = new Date(expiresAt)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Categorize subscriptions
  const categorized = useMemo(() => {
    const active: (FtcSubscription & { daysRemaining: number })[] = []
    const expiringSoon: (FtcSubscription & { daysRemaining: number })[] = []
    const expired: (FtcSubscription & { daysRemaining: number })[] = []

    subscriptions.forEach(sub => {
      const daysRemaining = getDaysUntilExpiry(sub.expires_at)
      const subWithDays = { ...sub, daysRemaining }

      if (daysRemaining <= 0) {
        expired.push(subWithDays)
      } else if (daysRemaining <= 30) {
        expiringSoon.push(subWithDays)
      } else {
        active.push(subWithDays)
      }
    })

    return { active, expiringSoon, expired }
  }, [subscriptions])

  // Calculate total annual cost
  const totalAnnualCost = useMemo(() => {
    return subscriptions.reduce((sum, sub) => sum + (sub.annual_cost || 82), 0)
  }, [subscriptions])

  // Group by state
  const byState = useMemo(() => {
    const grouped: Record<string, FtcSubscription[]> = {}
    subscriptions.forEach(sub => {
      const state = sub.state || 'Unknown'
      if (!grouped[state]) grouped[state] = []
      grouped[state].push(sub)
    })
    return grouped
  }, [subscriptions])

  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscriptions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{subscriptions.length}</p>
              <p className="text-xs text-slate-400">Area Codes</p>
            </div>
          </div>
        </div>

        {/* Active */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categorized.active.length}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              categorized.expiringSoon.length > 0 ? 'bg-amber-500/20' : 'bg-slate-700'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                categorized.expiringSoon.length > 0 ? 'text-amber-400' : 'text-slate-500'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{categorized.expiringSoon.length}</p>
              <p className="text-xs text-slate-400">Expiring Soon</p>
            </div>
          </div>
        </div>

        {/* Annual Cost */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${totalAnnualCost}</p>
              <p className="text-xs text-slate-400">Annual Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {categorized.expiringSoon.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-400">Renewal Required</h3>
              <p className="text-sm text-amber-200/80 mt-1">
                {categorized.expiringSoon.length} subscription{categorized.expiringSoon.length !== 1 ? 's' : ''} expiring within 30 days:
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {categorized.expiringSoon.map(sub => (
                  <span
                    key={sub.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-lg text-sm font-medium text-amber-300"
                  >
                    {sub.area_code}
                    <span className="text-xs text-amber-400/70">
                      ({sub.daysRemaining}d)
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Grid */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">FTC Subscriptions by State</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage your Do Not Call registry data access
          </p>
        </div>

        <div className="p-4">
          {Object.entries(byState).map(([state, subs]) => (
            <div key={state} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-white">{state}</h3>
                <span className="text-xs text-slate-500">({subs.length} area codes)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {subs.map(sub => {
                  const daysRemaining = getDaysUntilExpiry(sub.expires_at)
                  const isExpired = daysRemaining <= 0
                  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30

                  return (
                    <div
                      key={sub.id}
                      className={`relative p-4 rounded-xl border transition-all ${
                        isExpired
                          ? 'bg-red-500/5 border-red-500/30'
                          : isExpiringSoon
                            ? 'bg-amber-500/5 border-amber-500/30'
                            : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {/* Area Code Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-2xl font-bold ${
                          isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-white'
                        }`}>
                          {sub.area_code}
                        </span>
                        {isExpired ? (
                          <span className="px-2 py-0.5 bg-red-500/20 rounded text-xs font-medium text-red-400">
                            Expired
                          </span>
                        ) : isExpiringSoon ? (
                          <span className="px-2 py-0.5 bg-amber-500/20 rounded text-xs font-medium text-amber-400">
                            {daysRemaining}d left
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-500/20 rounded text-xs font-medium text-green-400">
                            Active
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Expires
                          </span>
                          <span className={`font-medium ${
                            isExpired ? 'text-red-400' : isExpiringSoon ? 'text-amber-400' : 'text-white'
                          }`}>
                            {new Date(sub.expires_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3" />
                            Annual
                          </span>
                          <span className="text-white font-medium">
                            ${sub.annual_cost || 82}
                          </span>
                        </div>

                        {sub.last_update_at && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Last Update
                            </span>
                            <span className="text-slate-300">
                              {new Date(sub.last_update_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        )}

                        {(sub.total_records ?? sub.last_update_record_count) > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3" />
                              Records
                            </span>
                            <span className="text-slate-300">
                              {(sub.total_records ?? sub.last_update_record_count).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Auto-renew indicator */}
                      {'auto_renew' in sub && sub.auto_renew && (
                        <div className="mt-3 pt-3 border-t border-slate-600/50">
                          <span className="flex items-center gap-1.5 text-xs text-green-400">
                            <RefreshCw className="w-3 h-3" />
                            Auto-renewal enabled
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {subscriptions.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">No FTC Subscriptions</p>
              <p className="text-sm text-slate-500 mt-1">
                Add area code subscriptions to start receiving DNC data
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
