'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  ArrowLeft,
  Shield,
  CreditCard,
  Zap,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Database,
  FileJson,
  FileSpreadsheet,
  ExternalLink,
  FileText,
  Download,
  Sun,
  Moon,
  MapPin,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { getCurrentUser } from '@/core/services/auth.service'
import { saveThemePreference } from '@/hooks/use-theme-sync'
import type { User as UserType } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface UserStats {
  leadCount: number
  uploadCount: number
  storageUsed: string
  integrationsCount: number
}

interface Integration {
  id: string
  crm_type: string
  crm_name: string
  status: 'active' | 'paused' | 'error'
  last_sync_at: string | null
}

interface ComplianceLog {
  id: string
  phone_number: string
  dnc_status: 'clean' | 'blocked' | 'caution'
  risk_score: number | null
  checked_at: string
  upload_job_id: string | null
  check_purpose: string
}

// ============================================================================
// TABS
// ============================================================================

type TabId = 'profile' | 'coverage' | 'data-privacy' | 'compliance' | 'integrations' | 'billing'

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'coverage', label: 'Coverage', icon: MapPin },
  { id: 'data-privacy', label: 'Data & Privacy', icon: Shield },
  { id: 'compliance', label: 'Compliance Logs', icon: FileText },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(
    tabParam && ['profile', 'coverage', 'data-privacy', 'compliance', 'integrations', 'billing'].includes(tabParam)
      ? tabParam
      : 'profile'
  )
  const [user, setUser] = useState<UserType | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    leadCount: 0,
    uploadCount: 0,
    storageUsed: '0 KB',
    integrationsCount: 0,
  })
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [complianceLogs, setComplianceLogs] = useState<ComplianceLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [isExportingLogs, setIsExportingLogs] = useState(false)

  // Form state for profile
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Theme state
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSavingTheme, setIsSavingTheme] = useState(false)

  // Handle hydration for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchUserData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    setTheme(newTheme)
    setIsSavingTheme(true)
    try {
      await saveThemePreference(newTheme)
    } catch (error) {
      console.error('Failed to save theme preference:', error)
    } finally {
      setIsSavingTheme(false)
    }
  }

  const fetchUserData = async () => {
    try {
      const result = await getCurrentUser()
      if (result.success && result.data) {
        setUser(result.data)
        setFullName(result.data.fullName || '')
        setCompanyName(result.data.company || '')
        setIndustry(result.data.industry || '')
        // Apply saved theme preference
        if (result.data.preferences?.theme) {
          setTheme(result.data.preferences.theme)
        }
      }

      // Fetch stats
      const statsRes = await fetch('/api/user/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Fetch integrations
      const integrationsRes = await fetch('/api/integrations')
      if (integrationsRes.ok) {
        const integrationsData = await integrationsRes.json()
        setIntegrations(integrationsData.integrations || [])
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, companyName, industry }),
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true)
    setExportFormat(format)

    try {
      const res = await fetch(`/api/user/export?format=${format}`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = format === 'csv'
          ? `echosafe-leads-${new Date().toISOString().split('T')[0]}.csv`
          : `echosafe-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_ALL_MY_DATA') {
      setDeleteError('Please type DELETE_ALL_MY_DATA to confirm')
      return
    }

    if (!deletePassword) {
      setDeleteError('Password is required')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Redirect to home after deletion
        router.push('/?deleted=true')
      } else {
        setDeleteError(data.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      setDeleteError('Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const fetchComplianceLogs = async () => {
    setIsLoadingLogs(true)
    try {
      const res = await fetch('/api/user/compliance-logs')
      if (res.ok) {
        const data = await res.json()
        setComplianceLogs(data)
      }
    } catch (error) {
      console.error('Failed to fetch compliance logs:', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const exportComplianceLogs = async () => {
    setIsExportingLogs(true)
    try {
      const res = await fetch('/api/user/compliance-logs?format=csv')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compliance-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        a.remove()
      }
    } catch (error) {
      console.error('Export compliance logs failed:', error)
    } finally {
      setIsExportingLogs(false)
    }
  }

  // Fetch compliance logs when tab is selected
  useEffect(() => {
    if (activeTab === 'compliance' && complianceLogs.length === 0) {
      fetchComplianceLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const industryOptions = [
    { value: '', label: 'Select your industry...' },
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'solar', label: 'Solar Sales' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'home-services', label: 'Home Services' },
    { value: 'financial-services', label: 'Financial Services' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Manage your account, data, and integrations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex overflow-x-auto" aria-label="Settings tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${isActive
                      ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="max-w-xl space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Email cannot be changed</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                          placeholder="Your company (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Industry
                        </label>
                        <select
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                        >
                          {industryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          This helps us tailor AI compliance insights to your industry
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : saveSuccess ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : null}
                      {saveSuccess ? 'Saved!' : 'Save Changes'}
                    </button>
                  </div>

                  {/* Appearance Section */}
                  <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Appearance</h2>
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Choose your preferred theme for the dashboard
                      </p>
                      {mounted && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleThemeChange('light')}
                            disabled={isSavingTheme}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                              resolvedTheme === 'light'
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              resolvedTheme === 'light'
                                ? 'bg-teal-100 dark:bg-teal-800'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                              <Sun className={`w-5 h-5 ${
                                resolvedTheme === 'light' ? 'text-teal-600' : 'text-slate-500 dark:text-slate-400'
                              }`} />
                            </div>
                            <div className="text-left">
                              <p className={`font-medium ${
                                resolvedTheme === 'light'
                                  ? 'text-teal-700 dark:text-teal-300'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                Light
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Bright and clean
                              </p>
                            </div>
                            {resolvedTheme === 'light' && (
                              <CheckCircle className="w-5 h-5 text-teal-500 ml-2" />
                            )}
                          </button>
                          <button
                            onClick={() => handleThemeChange('dark')}
                            disabled={isSavingTheme}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                              resolvedTheme === 'dark'
                                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              resolvedTheme === 'dark'
                                ? 'bg-teal-100 dark:bg-teal-800'
                                : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                              <Moon className={`w-5 h-5 ${
                                resolvedTheme === 'dark' ? 'text-teal-600 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'
                              }`} />
                            </div>
                            <div className="text-left">
                              <p className={`font-medium ${
                                resolvedTheme === 'dark'
                                  ? 'text-teal-700 dark:text-teal-300'
                                  : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                Dark
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Easy on the eyes
                              </p>
                            </div>
                            {resolvedTheme === 'dark' && (
                              <CheckCircle className="w-5 h-5 text-teal-500" />
                            )}
                          </button>
                        </div>
                      )}
                      {isSavingTheme && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving preference...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Coverage Tab */}
              {activeTab === 'coverage' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Your Area Codes</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      5 area codes included with your Professional plan
                    </p>
                  </div>

                  {/* Area Codes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Utah Area Codes */}
                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-700 p-5">
                      <h3 className="font-semibold text-teal-900 dark:text-teal-300 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Utah
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="font-mono text-sm text-teal-800 dark:text-teal-300">801</span>
                          <span className="text-sm text-teal-700 dark:text-teal-400">Salt Lake City metro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="font-mono text-sm text-teal-800 dark:text-teal-300">385</span>
                          <span className="text-sm text-teal-700 dark:text-teal-400">Salt Lake City overlay</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="font-mono text-sm text-teal-800 dark:text-teal-300">435</span>
                          <span className="text-sm text-teal-700 dark:text-teal-400">Rural Utah</span>
                        </div>
                      </div>
                    </div>

                    {/* Nevada Area Codes */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700 p-5">
                      <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Nevada
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-mono text-sm text-purple-800 dark:text-purple-300">702</span>
                          <span className="text-sm text-purple-700 dark:text-purple-400">Las Vegas metro</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-mono text-sm text-purple-800 dark:text-purple-300">775</span>
                          <span className="text-sm text-purple-700 dark:text-purple-400">Reno / Northern Nevada</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">What does this mean?</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Your plan includes unlimited DNC scrubbing for phone numbers in these 5 area codes.
                      Numbers outside these area codes will show as &quot;uncovered&quot; in your results.
                    </p>
                  </div>

                  {/* Expansion Waitlist CTA */}
                  <div className="bg-gradient-to-r from-teal-500 to-purple-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-2">Want more area codes?</h3>
                    <p className="text-white/90 mb-4">
                      We&apos;re launching nationwide expansion in Q2 2026. Join the waitlist to get notified
                      when new area codes become available.
                    </p>
                    <Link
                      href="/pricing#waitlist"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-teal-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
                    >
                      Join Waitlist
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Data & Privacy Tab */}
              {activeTab === 'data-privacy' && (
                <div className="space-y-8">
                  {/* Data Summary */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Your Data Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.leadCount}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Leads Stored</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.uploadCount}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Uploads</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.integrationsCount}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Integrations</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Export Data */}
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Export Your Data</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Download all your data anytime. Your data belongs to you.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleExport('csv')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 font-semibold border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting && exportFormat === 'csv' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                        Export Leads (CSV)
                      </button>
                      <button
                        onClick={() => handleExport('json')}
                        disabled={isExporting}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 font-semibold border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isExporting && exportFormat === 'json' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileJson className="w-4 h-4" />
                        )}
                        Full Export (JSON)
                      </button>
                    </div>
                  </div>

                  {/* Privacy Policy Link */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-1">Privacy-First Platform</h3>
                        <p className="text-sm text-purple-800 dark:text-purple-400 mb-2">
                          We don&apos;t track you, profile you, or sell your data. Read our full privacy policy.
                        </p>
                        <Link
                          href="/privacy"
                          className="inline-flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300"
                        >
                          View Privacy Policy
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Delete Data */}
                  <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Permanently delete all your data. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => setShowDeleteDialog(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete All My Data
                    </button>
                  </div>

                  {/* Delete Dialog */}
                  {showDeleteDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                              Delete All Data?
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              This will permanently delete:
                            </p>
                          </div>
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 border border-red-200 dark:border-red-800">
                          <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                            <li>• All {stats.leadCount} leads</li>
                            <li>• {stats.uploadCount} upload records</li>
                            <li>• All integrations and settings</li>
                            <li>• Your account profile</li>
                          </ul>
                          <p className="text-sm text-red-900 dark:text-red-200 font-semibold mt-3">
                            This cannot be undone. Export your data first if needed.
                          </p>
                        </div>

                        <div className="space-y-4 mb-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Enter your password
                            </label>
                            <input
                              type="password"
                              value={deletePassword}
                              onChange={(e) => setDeletePassword(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              placeholder="Your password"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Type <span className="font-mono text-red-600 dark:text-red-400">DELETE_ALL_MY_DATA</span> to confirm
                            </label>
                            <input
                              type="text"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                              placeholder="DELETE_ALL_MY_DATA"
                            />
                          </div>
                        </div>

                        {deleteError && (
                          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                            {deleteError}
                          </div>
                        )}

                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => {
                              setShowDeleteDialog(false)
                              setDeletePassword('')
                              setDeleteConfirmation('')
                              setDeleteError(null)
                            }}
                            className="px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || deleteConfirmation !== 'DELETE_ALL_MY_DATA' || !deletePassword}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Delete Everything
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Compliance Logs Tab */}
              {activeTab === 'compliance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Federal Compliance Audit Logs</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      View your DNC check history (5-year retention required by TCPA)
                    </p>
                  </div>

                  {/* Info Box */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Why These Logs Exist</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-400 mb-2">
                          Federal law (TCPA 47 CFR &sect; 64.1200) requires us to keep audit logs of all
                          DNC registry checks for 5 years. These logs prove compliance in case of
                          regulatory audits.
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-400">
                          <strong>Privacy Note:</strong> When you delete your data, these logs are
                          anonymized (detached from your account) but retained for the 5-year period.
                          They are NEVER used for profiling, marketing, or analytics.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Logs Table */}
                  {isLoadingLogs ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                    </div>
                  ) : complianceLogs.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No compliance logs yet</h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Compliance logs will appear here after you scrub your first leads
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Date</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Phone Number</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Result</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Risk Score</th>
                              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">Upload Job</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {complianceLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                  {new Date(log.checked_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                                  {log.phone_number}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                                      log.dnc_status === 'clean'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                        : log.dnc_status === 'blocked'
                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                    }`}
                                  >
                                    {log.dnc_status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                  {log.risk_score ?? '-'}
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs font-mono">
                                  {log.upload_job_id ? `${log.upload_job_id.substring(0, 8)}...` : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing last 100 checks. Logs retained for 5 years, then automatically purged.
                  </p>

                  {/* Export Compliance Logs */}
                  <button
                    onClick={exportComplianceLogs}
                    disabled={isExportingLogs || complianceLogs.length === 0}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-teal-700 dark:text-teal-400 font-semibold border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingLogs ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export Compliance Logs (CSV)
                  </button>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">CRM Integrations</h2>
                      <p className="text-sm text-slate-600">
                        Connect your CRM to auto-sync clean leads
                      </p>
                    </div>
                    <Link
                      href="/dashboard/settings/integrations"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-150"
                    >
                      <Zap className="w-4 h-4" />
                      Add Integration
                    </Link>
                  </div>

                  {integrations.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg">
                      <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No integrations yet</h3>
                      <p className="text-slate-600 mb-4">
                        Connect Follow Up Boss, Lofty, or other CRMs to sync leads automatically
                      </p>
                      <Link
                        href="/dashboard/settings/integrations"
                        className="inline-flex items-center gap-2 text-teal-600 font-medium hover:text-teal-700"
                      >
                        Set up your first integration
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {integrations.map((integration) => (
                        <div
                          key={integration.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                              <Zap className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{integration.crm_name}</p>
                              <p className="text-sm text-slate-500">
                                {integration.last_sync_at
                                  ? `Last synced ${new Date(integration.last_sync_at).toLocaleDateString()}`
                                  : 'Never synced'
                                }
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              integration.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : integration.status === 'paused'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {integration.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Subscription</h2>
                    <p className="text-sm text-slate-600">
                      Manage your subscription and billing
                    </p>
                  </div>

                  {/* Current Plan */}
                  <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-sm text-teal-600 font-medium mb-1">Current Plan</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                          {user?.subscriptionTier === 'UTAH_ELITE' ? "Utah's Elite" : 'Professional'}
                        </h3>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          user?.subscriptionStatus === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : user?.subscriptionStatus === 'TRIALING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {user?.subscriptionStatus?.toLowerCase() || 'unknown'}
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">
                      ${user?.subscriptionTier === 'UTAH_ELITE' ? '24' : '47'}
                      <span className="text-lg font-normal text-slate-500">/month</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">
                      Unlimited DNC scrubbing, AI insights, and CRM storage
                    </p>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors">
                        Manage Subscription
                      </button>
                      <button className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors">
                        View Invoices
                      </button>
                    </div>
                  </div>

                  {/* Billing Info */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">
                          Billing is handled securely through Stripe. We never see your full card number.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
