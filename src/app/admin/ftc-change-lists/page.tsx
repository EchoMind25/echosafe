'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { FtcSubscription, FtcChangeList } from '@/lib/supabase/types'
import {
  FtcChangeListUpload,
  FtcChangeListHistory,
  FtcSubscriptionMonitor,
} from '@/components/admin/ftc'
import {
  FileText,
  RefreshCw,
  ExternalLink,
  Info,
} from 'lucide-react'

type TabType = 'upload' | 'history' | 'subscriptions'

export default function FtcChangeListsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [subscriptions, setSubscriptions] = useState<FtcSubscription[]>([])
  const [changeLists, setChangeLists] = useState<FtcChangeList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const supabase = createBrowserClient()

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [subsRes, changeListsRes] = await Promise.all([
        supabase
          .from('ftc_subscriptions')
          .select('*')
          .order('state', { ascending: true })
          .order('area_code', { ascending: true }),
        supabase
          .from('ftc_change_lists')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      if (subsRes.data) setSubscriptions(subsRes.data as FtcSubscription[])
      if (changeListsRes.data) setChangeLists(changeListsRes.data as FtcChangeList[])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Initial fetch and polling for processing items
  useEffect(() => {
    fetchData()

    // Poll every 3 seconds if there are processing items
    const interval = setInterval(() => {
      const hasProcessing = changeLists.some(c => c.status === 'processing' || c.status === 'pending')
      if (hasProcessing) {
        fetchData()
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchData, changeLists])

  // Calculate stats
  const stats = {
    totalChangeLists: changeLists.length,
    processingCount: changeLists.filter(c => c.status === 'processing').length,
    completedToday: changeLists.filter(c => {
      const today = new Date().toDateString()
      return c.status === 'completed' && new Date(c.processing_completed_at || c.created_at).toDateString() === today
    }).length,
    totalRecordsProcessed: changeLists
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.processed_records, 0),
  }

  // Tab configuration
  const tabs = [
    { id: 'upload' as const, label: 'Upload', icon: FileText },
    { id: 'history' as const, label: 'History', icon: FileText, badge: stats.processingCount > 0 ? stats.processingCount : undefined },
    { id: 'subscriptions' as const, label: 'Subscriptions', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">FTC Change Lists</h1>
          <p className="text-slate-400 mt-1">
            Manage daily DNC registry additions and deletions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.donotcall.gov/data-download.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium text-white transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            FTC Portal
          </a>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Active Subscriptions</p>
          <p className="text-2xl font-bold text-white mt-1">{subscriptions.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Processing Now</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.processingCount}
            {stats.processingCount > 0 && (
              <RefreshCw className="inline w-4 h-4 ml-2 animate-spin text-teal-400" />
            )}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Completed Today</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.completedToday}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Total Processed</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.totalRecordsProcessed.toLocaleString()}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
        <Info className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-slate-300">
          <p className="font-medium text-white">Daily Update Workflow</p>
          <p className="mt-1 text-slate-400">
            Download daily change lists from the FTC portal, select the change type (additions or deletions),
            choose the relevant area codes, and upload. The system will process in the background and update
            your DNC registry automatically.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-teal-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 bg-teal-500 rounded-full text-xs text-white min-w-[20px] text-center">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'upload' && (
          <FtcChangeListUpload
            subscriptions={subscriptions.filter(s => s.subscription_status === 'active')}
            onUploadComplete={fetchData}
          />
        )}

        {activeTab === 'history' && (
          <FtcChangeListHistory
            changeLists={changeLists}
            isLoading={isLoading}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'subscriptions' && (
          <FtcSubscriptionMonitor
            subscriptions={subscriptions}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Last Updated */}
      <div className="text-xs text-slate-500 text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  )
}
