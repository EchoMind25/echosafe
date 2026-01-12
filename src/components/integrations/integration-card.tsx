'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  RefreshCw,
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Zap,
  ExternalLink,
  MoreVertical,
  Play,
  Pause,
} from 'lucide-react'
import type { CrmType } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface IntegrationStats {
  totalSynced: number
  successful: number
  failed: number
}

interface Integration {
  id: string
  crm_type: CrmType
  status: 'ACTIVE' | 'PAUSED' | 'ERROR'
  sync_settings: {
    auto_sync: boolean
    sync_frequency: 'immediate' | 'hourly' | 'daily'
    sync_clean_only: boolean
    max_risk_score: number
  }
  last_sync_at?: string
  last_error?: string
  consecutive_failures: number
  stats: IntegrationStats
}

interface IntegrationCardProps {
  integration: Integration
  onSync: (id: string) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
  onUpdateStatus: (id: string, status: 'ACTIVE' | 'PAUSED') => Promise<void>
  onSettings: (integration: Integration) => void
}

// ============================================================================
// CRM METADATA
// ============================================================================

const CRM_CONFIG: Record<CrmType, {
  name: string
  description: string
  logo: string
  color: string
  bgColor: string
}> = {
  FOLLOWUPBOSS: {
    name: 'Follow Up Boss',
    description: 'Real estate CRM with automated follow-up',
    logo: '/images/crm/followupboss.svg',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  LOFTY: {
    name: 'Lofty',
    description: 'All-in-one real estate platform',
    logo: '/images/crm/lofty.svg',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  KVCORE: {
    name: 'kvCORE',
    description: 'Real estate technology platform',
    logo: '/images/crm/kvcore.svg',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function IntegrationCard({
  integration,
  onSync,
  onDisconnect,
  onUpdateStatus,
  onSettings,
}: IntegrationCardProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const config = CRM_CONFIG[integration.crm_type]
  const isActive = integration.status === 'ACTIVE'
  const isPaused = integration.status === 'PAUSED'
  const hasError = integration.status === 'ERROR'

  const handleSync = async () => {
    if (isSyncing || !isActive) return
    setIsSyncing(true)
    try {
      await onSync(integration.id)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleToggleStatus = async () => {
    const newStatus = isActive ? 'PAUSED' : 'ACTIVE'
    await onUpdateStatus(integration.id, newStatus)
    setShowMenu(false)
  }

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className={`
      bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200
      ${hasError ? 'border-red-200' : isPaused ? 'border-slate-200' : 'border-slate-100'}
    `}>
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 ${config.bgColor} rounded-xl flex items-center justify-center`}>
              {/* Fallback icon if logo doesn't exist */}
              <Zap className={`w-7 h-7 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{config.name}</h3>
              <p className="text-sm text-slate-500">{config.description}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Connected
              </span>
            )}
            {isPaused && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                <Pause className="w-3.5 h-3.5" />
                Paused
              </span>
            )}
            {hasError && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                Error
              </span>
            )}

            {/* Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-slate-400" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                    <button
                      onClick={() => {
                        onSettings(integration)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleToggleStatus}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Pause Sync
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume Sync
                        </>
                      )}
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        onDisconnect(integration.id)
                        setShowMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {hasError && integration.last_error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Connection Error</p>
              <p className="text-xs text-red-600 mt-0.5">{integration.last_error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 px-6 pb-4">
        <div className="text-center p-3 bg-slate-50 rounded-lg">
          <p className="text-2xl font-bold text-slate-900">{integration.stats.totalSynced}</p>
          <p className="text-xs text-slate-500">Total Synced</p>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{integration.stats.successful}</p>
          <p className="text-xs text-slate-500">Successful</p>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <p className="text-2xl font-bold text-red-600">{integration.stats.failed}</p>
          <p className="text-xs text-slate-500">Failed</p>
        </div>
      </div>

      {/* Sync Settings Info */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Last sync: {formatLastSync(integration.last_sync_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {integration.sync_settings.auto_sync ? (
              <>
                <Zap className="w-4 h-4 text-teal-500" />
                <span className="text-teal-600">Auto-sync on</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Manual sync</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-slate-100 p-4 flex items-center justify-between">
        <Link
          href={`/dashboard/settings/integrations/logs?integration=${integration.id}`}
          className="text-sm text-slate-600 hover:text-teal-600 flex items-center gap-1 transition-colors"
        >
          View sync logs
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <button
          onClick={handleSync}
          disabled={isSyncing || !isActive}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${isActive
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }
          `}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// AVAILABLE INTEGRATION CARD (for CRMs not yet connected)
// ============================================================================

interface AvailableIntegrationCardProps {
  crmType: CrmType
  onConnect: (crmType: CrmType) => void
  isConnected: boolean
}

export function AvailableIntegrationCard({
  crmType,
  onConnect,
  isConnected,
}: AvailableIntegrationCardProps) {
  const config = CRM_CONFIG[crmType]

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-14 h-14 ${config.bgColor} rounded-xl flex items-center justify-center`}>
          <Zap className={`w-7 h-7 ${config.color}`} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{config.name}</h3>
          <p className="text-sm text-slate-500">{config.description}</p>
        </div>
      </div>

      {isConnected ? (
        <button
          disabled
          className="w-full py-2.5 px-4 bg-slate-100 text-slate-400 rounded-lg text-sm font-medium cursor-not-allowed flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Already Connected
        </button>
      ) : (
        <button
          onClick={() => onConnect(crmType)}
          className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Connect
        </button>
      )}
    </div>
  )
}
