'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/core/services/auth.service'
import type { User } from '@/types'
import { StatCard, QuickActionCard } from '@/components/dashboard'
import { TrialStatusBanner, useTrialStatus } from '@/components/trial'
import {
  CheckCircle,
  ShieldCheck,
  TrendingUp,
  UploadCloud,
  Users,
  FileText,
  ArrowRight,
  Zap,
  Check,
  Clock,
  Loader2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface RecentJob {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  totalLeads: number
  cleanLeads: number
  dncLeads: number
  riskyLeads: number
  createdAt: string
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([])
  const [stats, setStats] = useState({
    totalScrubbed: 0,
    cleanLeads: 0,
    complianceRate: 100,
  })

  // Fetch trial status for trial banner
  const { trialStatus, isAdmin } = useTrialStatus()

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getCurrentUser()
        if (result.success && result.data) {
          setUser(result.data)
          // Fetch recent jobs
          await fetchRecentJobs()
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  async function fetchRecentJobs() {
    try {
      const response = await fetch('/api/jobs/recent')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setRecentJobs(data.jobs)
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent jobs:', error)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (hours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-[#23d8ff]/70">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-[#23d8ff]">
            {isLoading
              ? 'Loading...'
              : user
                ? `Welcome back, ${user.fullName?.split(' ')[0] || 'there'}!`
                : 'Welcome back!'}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-[#23d8ff]/70">
            Your lead screening dashboard
          </p>
        </div>

        {/* Dev Mode Badge - only in development */}
        {process.env.NODE_ENV === 'development' && !user && !isLoading && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
            <Zap className="w-4 h-4" />
            Development Mode
          </div>
        )}
      </div>

      {/* Trial Status Banner - Show for trialing users (hide for admins) */}
      {trialStatus && trialStatus.isOnTrial && !isAdmin && (
        <TrialStatusBanner trialStatus={trialStatus} />
      )}

      {/* Coverage Banner */}
      <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-teal-900 dark:text-teal-300">Your Coverage: 5 Area Codes</p>
            <p className="text-sm text-teal-700 dark:text-teal-400">
              Utah (801, 385, 435) + Nevada (702, 775) • Unlimited scrubbing
            </p>
          </div>
          <Link
            href="/dashboard/settings?tab=coverage"
            className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={CheckCircle}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          title="Leads Checked"
          value={user?.totalLeadsScrubbed ?? stats.totalScrubbed}
          change="+0% from last month"
          changeType="positive"
        />

        <StatCard
          icon={ShieldCheck}
          iconBg="bg-green-100"
          iconColor="text-green-600"
          title="Clean Leads"
          value={stats.cleanLeads}
          badge={`${stats.complianceRate}% rate`}
          badgeBg="bg-green-100"
          badgeColor="text-green-700"
        />

        <StatCard
          icon={TrendingUp}
          iconBg="bg-teal-100"
          iconColor="text-teal-600"
          title="Data Quality Score"
          value={`${stats.complianceRate}%`}
          change={stats.complianceRate >= 95 ? 'Low Risk' : 'Moderate'}
          changeType="positive"
        />

        {/* Legal reminder card */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4">
          <div className="flex items-center gap-2 text-yellow-900 dark:text-yellow-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold text-sm">Legal Reminder</span>
          </div>
          <p className="text-xs text-yellow-800 dark:text-yellow-500">
            Data checking tool only. You are solely responsible for TCPA
            compliance. Verify independently before calling.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <QuickActionCard
          icon={UploadCloud}
          title="Scrub New Leads"
          description="Upload and process your lead list"
          buttonText="Get Started →"
          href="/dashboard/scrub"
          gradientFrom="from-teal-500"
          gradientTo="to-teal-600"
          textMuted="text-teal-100"
          buttonBg="bg-white"
          buttonText2="text-teal-600"
        />

        <QuickActionCard
          icon={Users}
          title="Manage Leads"
          description="View and organize your saved leads"
          buttonText="Open CRM →"
          href="/dashboard/crm"
          gradientFrom="from-purple-500"
          gradientTo="to-purple-600"
          textMuted="text-purple-100"
          buttonBg="bg-white"
          buttonText2="text-purple-600"
        />
      </div>

      {/* Recent Uploads */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-[#23d8ff]">Recent Uploads</h2>
          <Link
            href="/dashboard/history"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-[#23d8ff] dark:hover:text-[#23d8ff]/80 flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-100 dark:border-zinc-800 overflow-hidden">
          {recentJobs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/dashboard/results/${job.id}`}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-slate-500 dark:text-[#23d8ff]/60" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-[#23d8ff]">{job.filename}</p>
                      <p className="text-sm text-slate-500 dark:text-[#23d8ff]/60">
                        {job.totalLeads.toLocaleString()} leads
                        {job.status === 'completed' && (
                          <span className="ml-2">
                            <span className="text-green-600">{job.cleanLeads} clean</span>
                            {job.dncLeads > 0 && (
                              <span className="text-red-600 ml-1">• {job.dncLeads} DNC</span>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(job.status)}
                    <span className="text-sm text-slate-400 dark:text-[#23d8ff]/50">{formatDate(job.createdAt)}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#23d8ff]/50" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-400 dark:text-[#23d8ff]/50" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-[#23d8ff] mb-2">
                No uploads yet
              </h3>
              <p className="text-slate-600 dark:text-[#23d8ff]/70 mb-6 max-w-sm mx-auto">
                Upload your first lead list to get started with DNC scrubbing
              </p>
              <Link
                href="/dashboard/scrub"
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <UploadCloud className="w-5 h-5" />
                Upload Leads
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Getting Started CTA for non-authenticated users */}
      {!user && !isLoading && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 p-8 md:p-10 mt-8">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Get Started?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl">
              Create an account to save your check history, access your CRM, and sync with your favorite tools.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Check className="w-5 h-5 text-teal-200" />
                Unlimited DNC checks
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Check className="w-5 h-5 text-teal-200" />
                Built-in CRM
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Check className="w-5 h-5 text-teal-200" />
                7-day free trial
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Create Free Account
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
