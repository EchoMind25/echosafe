'use client'

import { useState } from 'react'
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  Download,
  Clock,
  User,
  Building,
  FileText,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
  id: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  status: string
  risk_score: number | null
  risk_level: string | null
  dnc_status: boolean
  last_scrubbed_at: string | null
  source: string | null
  tags: string[] | null
  notes: string | null
  contact_count: number
  last_contact_at: string | null
  next_followup_at: string | null
  created_at: string
  updated_at: string
}

interface LeadDetailModalProps {
  lead: Lead
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onUpdateStatus: (status: string) => Promise<void>
  onMarkContacted: () => Promise<void>
  isLoading: boolean
}

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-700 border-gray-300',
    contacted: 'bg-blue-100 text-blue-700 border-blue-300',
    qualified: 'bg-green-100 text-green-700 border-green-300',
    nurturing: 'bg-purple-100 text-purple-700 border-purple-300',
    converted: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    dead: 'bg-red-100 text-red-700 border-red-300',
  }
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'
}

function getRiskInfo(riskLevel: string | null, riskScore: number | null) {
  if (riskLevel === 'blocked' || (riskScore && riskScore >= 70)) {
    return { color: 'text-red-600 bg-red-50', label: 'High Risk', icon: AlertTriangle }
  }
  if (riskLevel === 'caution' || (riskScore && riskScore >= 40)) {
    return { color: 'text-amber-600 bg-amber-50', label: 'Caution', icon: AlertTriangle }
  }
  return { color: 'text-green-600 bg-green-50', label: 'Safe', icon: CheckCircle }
}

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'converted', label: 'Converted' },
  { value: 'dead', label: 'Dead' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function LeadDetailModal({
  lead,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onMarkContacted,
  isLoading,
}: LeadDetailModalProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const fullName = lead.first_name || lead.last_name
    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
    : 'Unknown'

  const fullAddress = [lead.address, lead.city, lead.state, lead.zip_code]
    .filter(Boolean)
    .join(', ')

  const riskInfo = getRiskInfo(lead.risk_level, lead.risk_score)
  const RiskIcon = riskInfo.icon

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
            <p className="text-sm text-gray-500">Lead Details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <a
                href={`tel:${lead.phone_number}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              )}
              <button
                onClick={onMarkContacted}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Contacted
              </button>
            </div>

            {/* Status */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-lg ${getStatusColor(lead.status)}`}
              >
                <span className="capitalize font-medium">{lead.status}</span>
                <span className="text-xs">Change</span>
              </button>
              {showStatusDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {STATUS_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={async () => {
                          await onUpdateStatus(option.value)
                          setShowStatusDropdown(false)
                        }}
                        disabled={isLoading}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                          lead.status === option.value ? 'bg-blue-50' : ''
                        }`}
                      >
                        <span>{option.label}</span>
                        {lead.status === option.value && (
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Contact Information</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span>{formatPhone(lead.phone_number)}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {fullAddress && (
                  <div className="flex items-start gap-3 text-gray-600">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span>{fullAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Compliance Status</h3>
              <div className="p-4 rounded-lg border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Risk Score</span>
                  <span className={`flex items-center gap-1.5 px-2 py-1 rounded ${riskInfo.color}`}>
                    <RiskIcon className="w-4 h-4" />
                    {lead.risk_score !== null ? `${lead.risk_score} - ${riskInfo.label}` : 'Not scored'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">DNC Status</span>
                  <span className={lead.dnc_status ? 'text-red-600' : 'text-green-600'}>
                    {lead.dnc_status ? 'On DNC List' : 'Clean'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Scrubbed</span>
                  <span className="text-gray-900">
                    {lead.last_scrubbed_at ? formatDate(lead.last_scrubbed_at) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Activity</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Contact Count</span>
                  </div>
                  <span className="font-medium">{lead.contact_count}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Last Contact</span>
                  </div>
                  <span>{formatDate(lead.last_contact_at)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Next Followup</span>
                  </div>
                  <span>{formatDate(lead.next_followup_at)}</span>
                </div>
                {lead.source && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4" />
                      <span>Source</span>
                    </div>
                    <span>{lead.source}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {lead.tags && lead.tags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Notes</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                    <p className="text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1 pt-4 border-t border-gray-200">
              <p>Created: {formatDate(lead.created_at)}</p>
              <p>Updated: {formatDate(lead.updated_at)}</p>
              <p>ID: {lead.id}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete this lead?</h3>
                <p className="mt-2 text-sm text-gray-600">
                  This lead will be moved to trash and can be recovered within 30 days.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete()
                  setShowDeleteConfirm(false)
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
