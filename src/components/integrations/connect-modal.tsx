'use client'

import { useState } from 'react'
import {
  X,
  Zap,
  Key,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react'
import type { CrmType } from '@/types'

// ============================================================================
// TYPES
// ============================================================================

interface ConnectModalProps {
  isOpen: boolean
  onClose: () => void
  crmType: CrmType | null
  onConnect: (crmType: CrmType, credentials?: { api_key: string; team_id?: string }) => Promise<void>
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  integration: {
    id: string
    crm_type: CrmType
    sync_settings: {
      auto_sync: boolean
      sync_frequency: 'immediate' | 'hourly' | 'daily'
      sync_clean_only: boolean
      max_risk_score: number
    }
  } | null
  onSave: (id: string, settings: {
    auto_sync: boolean
    sync_frequency: 'immediate' | 'hourly' | 'daily'
    sync_clean_only: boolean
    max_risk_score: number
  }) => Promise<void>
}

// ============================================================================
// CRM METADATA
// ============================================================================

const CRM_CONFIG: Record<CrmType, {
  name: string
  authType: 'oauth' | 'apikey'
  description: string
  helpUrl: string
  apiKeyInstructions: string[]
  color: string
  bgColor: string
}> = {
  FOLLOWUPBOSS: {
    name: 'Follow Up Boss',
    authType: 'oauth',
    description: 'Connect using your Follow Up Boss account',
    helpUrl: 'https://help.followupboss.com/hc/en-us/articles/360019696574-API-Access',
    apiKeyInstructions: [],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  LOFTY: {
    name: 'Lofty',
    authType: 'apikey',
    description: 'Enter your Lofty API key to connect',
    helpUrl: 'https://help.lofty.com/en/articles/api-documentation',
    apiKeyInstructions: [
      'Log in to your Lofty account',
      'Go to Settings > Integrations > API',
      'Click "Generate API Key"',
      'Copy the API key and paste it below',
    ],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  KVCORE: {
    name: 'kvCORE',
    authType: 'apikey',
    description: 'Enter your kvCORE API key to connect',
    helpUrl: 'https://support.kvcore.com/hc/en-us/articles/api-access',
    apiKeyInstructions: [
      'Log in to your kvCORE dashboard',
      'Navigate to Settings > API Keys',
      'Create a new API key with "Contacts" permission',
      'Copy the key and paste it below',
    ],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
}

// ============================================================================
// CONNECT MODAL COMPONENT
// ============================================================================

export default function ConnectModal({
  isOpen,
  onClose,
  crmType,
  onConnect,
}: ConnectModalProps) {
  const [apiKey, setApiKey] = useState('')
  const [teamId, setTeamId] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen || !crmType) return null

  const config = CRM_CONFIG[crmType]

  const handleConnect = async () => {
    setError(null)
    setIsConnecting(true)

    try {
      if (config.authType === 'oauth') {
        // For OAuth, redirect to authorize endpoint
        await onConnect(crmType)
      } else {
        // For API key, validate and submit
        if (!apiKey.trim()) {
          setError('API key is required')
          setIsConnecting(false)
          return
        }

        if (apiKey.length < 10) {
          setError('Invalid API key format')
          setIsConnecting(false)
          return
        }

        await onConnect(crmType, { api_key: apiKey.trim(), team_id: teamId.trim() || undefined })
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleClose = () => {
    setApiKey('')
    setTeamId('')
    setShowApiKey(false)
    setError(null)
    setIsConnecting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                <Zap className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Connect {config.name}</h2>
                <p className="text-sm text-slate-500">{config.description}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {config.authType === 'oauth' ? (
              // OAuth Flow
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-700">
                        You&apos;ll be redirected to {config.name} to authorize Echo Safe.
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        We only request permissions to read and write contacts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure OAuth 2.0 authentication</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>No password sharing required</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Revoke access anytime from {config.name}</span>
                </div>
              </div>
            ) : (
              // API Key Flow
              <div className="space-y-4">
                {/* Instructions */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm font-medium text-slate-700 mb-2">How to get your API key:</p>
                  <ol className="space-y-1.5">
                    {config.apiKeyInstructions.map((instruction, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-xs font-medium text-slate-700 flex-shrink-0">
                          {index + 1}
                        </span>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key"
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Team ID (optional) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Team ID <span className="text-slate-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    placeholder="For team accounts only"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <a
                  href={config.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                >
                  View {config.name} API documentation
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : config.authType === 'oauth' ? (
                <>
                  <ExternalLink className="w-4 h-4" />
                  Continue to {config.name}
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SETTINGS MODAL COMPONENT
// ============================================================================

export function SettingsModal({
  isOpen,
  onClose,
  integration,
  onSave,
}: SettingsModalProps) {
  const [settings, setSettings] = useState(integration?.sync_settings || {
    auto_sync: true,
    sync_frequency: 'immediate' as const,
    sync_clean_only: true,
    max_risk_score: 20,
  })
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen || !integration) return null

  const config = CRM_CONFIG[integration.crm_type]

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(integration.id, settings)
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
                <Zap className={`w-5 h-5 ${config.color}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{config.name} Settings</h2>
                <p className="text-sm text-slate-500">Configure sync behavior</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Auto Sync Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-sync leads</p>
                <p className="text-xs text-slate-500">Automatically sync new leads to {config.name}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, auto_sync: !settings.auto_sync })}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${settings.auto_sync ? 'bg-teal-600' : 'bg-slate-200'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${settings.auto_sync ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Sync Frequency */}
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-2">Sync frequency</label>
              <div className="grid grid-cols-3 gap-2">
                {(['immediate', 'hourly', 'daily'] as const).map((frequency) => (
                  <button
                    key={frequency}
                    onClick={() => setSettings({ ...settings, sync_frequency: frequency })}
                    className={`
                      px-3 py-2 text-sm font-medium rounded-lg border transition-colors capitalize
                      ${settings.sync_frequency === frequency
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }
                    `}
                  >
                    {frequency === 'immediate' ? 'Real-time' : frequency}
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Clean Only Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Only sync clean leads</p>
                <p className="text-xs text-slate-500">Skip leads with high risk scores</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, sync_clean_only: !settings.sync_clean_only })}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${settings.sync_clean_only ? 'bg-teal-600' : 'bg-slate-200'}
                `}
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${settings.sync_clean_only ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Max Risk Score */}
            {settings.sync_clean_only && (
              <div>
                <label className="block text-sm font-medium text-slate-900 mb-2">
                  Maximum risk score: <span className="text-teal-600">{settings.max_risk_score}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.max_risk_score}
                  onChange={(e) => setSettings({ ...settings, max_risk_score: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0 (strictest)</span>
                  <span>100 (all leads)</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// DISCONNECT CONFIRMATION MODAL
// ============================================================================

interface DisconnectModalProps {
  isOpen: boolean
  onClose: () => void
  crmName: string
  onConfirm: () => Promise<void>
}

export function DisconnectModal({
  isOpen,
  onClose,
  crmName,
  onConfirm,
}: DisconnectModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  if (!isOpen) return null

  const handleConfirm = async () => {
    setIsDisconnecting(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setIsDisconnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
              Disconnect {crmName}?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will stop syncing leads to {crmName}. You can reconnect anytime.
              Previously synced leads will remain in your CRM.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDisconnecting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
