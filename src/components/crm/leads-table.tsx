'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Phone,
  Mail,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
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

interface LeadsTableProps {
  leads: Lead[]
  selectedIds: Set<string>
  onSelectLead: (id: string) => void
  onSelectAll: () => void
  onViewLead: (lead: Lead) => void
  onEditLead: (lead: Lead) => void
  onDeleteLead: (id: string) => void
  onMarkContacted: (id: string) => void
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSort: (column: string) => void
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
  })
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    qualified: 'bg-green-100 text-green-700',
    nurturing: 'bg-purple-100 text-purple-700',
    converted: 'bg-emerald-100 text-emerald-700',
    dead: 'bg-red-100 text-red-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

function getRiskColor(riskLevel: string | null, riskScore: number | null): string {
  if (riskLevel === 'blocked' || (riskScore && riskScore >= 70)) {
    return 'text-red-600 bg-red-50'
  }
  if (riskLevel === 'caution' || (riskScore && riskScore >= 40)) {
    return 'text-amber-600 bg-amber-50'
  }
  return 'text-green-600 bg-green-50'
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LeadsTable({
  leads,
  selectedIds,
  onSelectLead,
  onSelectAll,
  onViewLead,
  onEditLead,
  onDeleteLead,
  onMarkContacted,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
}: LeadsTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const allSelected = useMemo(() => {
    return leads.length > 0 && leads.every(lead => selectedIds.has(lead.id))
  }, [leads, selectedIds])

  const someSelected = useMemo(() => {
    return leads.some(lead => selectedIds.has(lead.id)) && !allSelected
  }, [leads, selectedIds, allSelected])

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  }

  const SortableHeader = ({
    column,
    children,
    className = '',
  }: {
    column: string
    children: React.ReactNode
    className?: string
  }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        <SortIndicator column={column} />
      </div>
    </th>
  )

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-100" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 border-t border-gray-100 flex items-center px-4 gap-4">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="w-32 h-4 bg-gray-200 rounded" />
              <div className="w-28 h-4 bg-gray-200 rounded" />
              <div className="w-40 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-6 bg-gray-200 rounded-full" />
              <div className="w-12 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-gray-400 mb-4">
          <Phone className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
        <p className="text-gray-500">
          Try adjusting your filters or add a new lead to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected
                  }}
                  onChange={onSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <SortableHeader column="first_name">Name</SortableHeader>
              <SortableHeader column="phone_number">Phone</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <SortableHeader column="status">Status</SortableHeader>
              <SortableHeader column="risk_score">Risk</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <SortableHeader column="created_at">Created</SortableHeader>
              <th className="px-4 py-3 w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {leads.map(lead => (
              <tr
                key={lead.id}
                className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedIds.has(lead.id) ? 'bg-blue-50' : ''
                }`}
                onClick={() => onViewLead(lead)}
              >
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => onSelectLead(lead.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="font-medium text-gray-900">
                    {lead.first_name || lead.last_name
                      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                      : '-'}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <a
                    href={`tel:${lead.phone_number}`}
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700"
                  >
                    <Phone className="w-4 h-4" />
                    {formatPhone(lead.phone_number)}
                  </a>
                </td>
                <td className="px-4 py-4">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate max-w-[180px]">{lead.email}</span>
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {lead.risk_score !== null ? (
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRiskColor(lead.risk_level, lead.risk_score)}`}>
                      {lead.risk_score}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {(lead.tags || []).slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="inline-flex px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {(lead.tags || []).length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{(lead.tags || []).length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-500">
                  {formatDate(lead.created_at)}
                </td>
                <td className="px-4 py-4 relative" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                    className="p-1.5 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                  {openMenuId === lead.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        <button
                          onClick={() => {
                            onViewLead(lead)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            onEditLead(lead)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Edit Lead
                        </button>
                        <button
                          onClick={() => {
                            onMarkContacted(lead.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Contacted
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            onDeleteLead(lead.id)
                            setOpenMenuId(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
