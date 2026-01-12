'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
  CreditCard,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Calendar,
  DollarSign,
  Database,
  Clock,
  X,
} from 'lucide-react'

interface FtcSubscription {
  id: string
  area_code: string
  state: string | null
  subscription_status: string
  subscribed_at: string
  expires_at: string
  last_update_at: string | null
  next_update_due: string | null
  annual_cost: number
  monthly_cost: number
  total_records: number
  last_record_count: number
  notes: string | null
  created_at: string
  updated_at: string
}

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<FtcSubscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubscription, setNewSubscription] = useState({
    area_code: '',
    state: '',
    annual_cost: 100,
    monthly_cost: 8,
    expires_at: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  const fetchSubscriptions = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('ftc_subscriptions')
        .select('*')
        .order('area_code', { ascending: true })

      if (error) throw error
      setSubscriptions(data || [])
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  // Add new subscription
  const handleAddSubscription = async () => {
    if (!newSubscription.area_code || !newSubscription.expires_at) {
      setError('Area code and expiration date are required')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('ftc_subscriptions')
        .insert({
          area_code: newSubscription.area_code,
          state: newSubscription.state || null,
          subscription_status: 'active',
          expires_at: newSubscription.expires_at,
          annual_cost: newSubscription.annual_cost,
          monthly_cost: newSubscription.monthly_cost,
          notes: newSubscription.notes || null,
        })

      if (insertError) throw insertError

      setShowAddModal(false)
      setNewSubscription({
        area_code: '',
        state: '',
        annual_cost: 100,
        monthly_cost: 8,
        expires_at: '',
        notes: '',
      })
      fetchSubscriptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subscription')
    } finally {
      setSaving(false)
    }
  }

  // Renew subscription
  const handleRenew = async (id: string, currentExpiry: string) => {
    const newExpiry = new Date(currentExpiry)
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    try {
      const { error } = await supabase
        .from('ftc_subscriptions')
        .update({
          expires_at: newExpiry.toISOString(),
          subscription_status: 'active',
        })
        .eq('id', id)

      if (error) throw error
      fetchSubscriptions()
    } catch (err) {
      console.error('Failed to renew subscription:', err)
    }
  }

  // Get status badge
  const getStatusBadge = (status: string, expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (status === 'expired' || daysUntilExpiry < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
          <XCircle className="w-3 h-3" />
          Expired
        </span>
      )
    }

    if (status === 'expiring' || daysUntilExpiry <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          Expiring ({daysUntilExpiry} days)
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    )
  }

  // Calculate stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active' && new Date(s.expires_at) > new Date()).length,
    expiring: subscriptions.filter(s => {
      const days = Math.ceil((new Date(s.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return days > 0 && days <= 30
    }).length,
    expired: subscriptions.filter(s => new Date(s.expires_at) < new Date()).length,
    totalRecords: subscriptions.reduce((sum, s) => sum + s.total_records, 0),
    annualCost: subscriptions.filter(s => s.subscription_status === 'active').reduce((sum, s) => sum + Number(s.annual_cost), 0),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">FTC Subscriptions</h1>
          <p className="text-slate-400 mt-1">
            Manage your Do Not Call registry area code subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Subscription
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-slate-400">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expiring}</p>
              <p className="text-xs text-slate-400">Expiring</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.expired}</p>
              <p className="text-xs text-slate-400">Expired</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(stats.totalRecords / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-slate-400">Records</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">${stats.annualCost.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Annual Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">All Subscriptions</h2>
          <button
            onClick={fetchSubscriptions}
            disabled={isLoading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Area Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">State</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Expires</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Last Update</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Annual Cost</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-700/30">
                  <td className="py-3 px-4">
                    <span className="text-lg font-bold text-white">{sub.area_code}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-300">{sub.state || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(sub.subscription_status, sub.expires_at)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-white">
                        {new Date(sub.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {sub.last_update_at ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300">
                          {new Date(sub.last_update_at).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Never</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-white">{sub.total_records.toLocaleString()}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-white">${Number(sub.annual_cost).toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleRenew(sub.id, sub.expires_at)}
                      className="px-3 py-1 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded text-sm font-medium transition-colors"
                    >
                      Renew +1 Year
                    </button>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No subscriptions found
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subscription Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Add FTC Subscription</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Area Code *
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={newSubscription.area_code}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, area_code: e.target.value.replace(/\D/g, '') }))}
                  placeholder="801"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State
                </label>
                <select
                  value={newSubscription.state}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, state: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select state...</option>
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expiration Date *
                </label>
                <input
                  type="date"
                  value={newSubscription.expires_at}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, expires_at: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Annual Cost ($)
                  </label>
                  <input
                    type="number"
                    value={newSubscription.annual_cost}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, annual_cost: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Monthly Cost ($)
                  </label>
                  <input
                    type="number"
                    value={newSubscription.monthly_cost}
                    onChange={(e) => setNewSubscription(prev => ({ ...prev, monthly_cost: Number(e.target.value) }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newSubscription.notes}
                  onChange={(e) => setNewSubscription(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSubscription}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Subscription
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
