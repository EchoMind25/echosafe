'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { SearchFilterBar, type CrmFilters } from '@/components/crm/search-filter-bar'
import { LeadsTable } from '@/components/crm/leads-table'
import { LeadDetailModal } from '@/components/crm/lead-detail-modal'
import { AddLeadModal } from '@/components/crm/add-lead-modal'
import { BulkActionsMenu } from '@/components/crm/bulk-actions-menu'
import { downloadCSV } from '@/lib/utils/export-csv'

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

interface ApiResponse {
  success: boolean
  data?: Lead[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  meta?: {
    availableTags: string[]
  }
  message?: string
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function CrmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [totalLeads, setTotalLeads] = useState(0)

  // Sorting
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  )

  // Filters
  const [filters, setFilters] = useState<CrmFilters>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status')?.split(',').filter(Boolean) || [],
    riskLevel: searchParams.get('riskLevel')?.split(',').filter(Boolean) || [],
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    minRisk: searchParams.get('minRisk') ? parseInt(searchParams.get('minRisk')!) : null,
    maxRisk: searchParams.get('maxRisk') ? parseInt(searchParams.get('maxRisk')!) : null,
  })
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Modals
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchLeads = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sortBy,
        sortOrder,
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.status.length) params.set('status', filters.status.join(','))
      if (filters.riskLevel.length) params.set('riskLevel', filters.riskLevel.join(','))
      if (filters.tags.length) params.set('tags', filters.tags.join(','))
      if (filters.minRisk !== null) params.set('minRisk', filters.minRisk.toString())
      if (filters.maxRisk !== null) params.set('maxRisk', filters.maxRisk.toString())

      const response = await fetch(`/api/crm/leads?${params}`)
      const data: ApiResponse = await response.json()

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch leads')
      }

      setLeads(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotalLeads(data.pagination?.total || 0)
      setAvailableTags(data.meta?.availableTags || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads')
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortOrder, filters])

  // Fetch on mount and when params change
  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (sortBy !== 'created_at') params.set('sortBy', sortBy)
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder)
    if (filters.search) params.set('search', filters.search)
    if (filters.status.length) params.set('status', filters.status.join(','))
    if (filters.riskLevel.length) params.set('riskLevel', filters.riskLevel.join(','))
    if (filters.tags.length) params.set('tags', filters.tags.join(','))
    if (filters.minRisk !== null) params.set('minRisk', filters.minRisk.toString())
    if (filters.maxRisk !== null) params.set('maxRisk', filters.maxRisk.toString())

    const queryString = params.toString()
    router.replace(`/dashboard/crm${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [page, sortBy, sortOrder, filters, router])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setPage(1)
  }

  const handleFiltersChange = (newFilters: CrmFilters) => {
    setFilters(newFilters)
    setPage(1)
    setSelectedIds(new Set())
  }

  const handleSelectLead = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === leads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(leads.map(l => l.id)))
    }
  }

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead)
  }

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead)
    setSelectedLead(null)
  }

  const handleDeleteLead = async (id: string) => {
    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setSelectedLead(null)
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await response.json()

      if (data.success) {
        // Optimistic update
        setLeads(prev =>
          prev.map(l => l.id === id ? { ...l, status } : l)
        )
        if (selectedLead?.id === id) {
          setSelectedLead(prev => prev ? { ...prev, status } : null)
        }
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleMarkContacted = async (id: string) => {
    setIsActionLoading(true)
    try {
      const response = await fetch(`/api/crm/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'contacted',
          last_contact_at: new Date().toISOString(),
          contact_count: (leads.find(l => l.id === id)?.contact_count || 0) + 1,
        }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    setIsActionLoading(true)
    try {
      const isEditing = !!editingLead?.id
      const url = isEditing
        ? `/api/crm/leads/${editingLead.id}`
        : '/api/crm/leads'

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      })

      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setShowAddModal(false)
        setEditingLead(null)
      }

      return data
    } finally {
      setIsActionLoading(false)
    }
  }

  // ============================================================================
  // BULK ACTIONS
  // ============================================================================

  const handleBulkUpdateStatus = async (status: string) => {
    setIsActionLoading(true)
    try {
      const response = await fetch('/api/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          lead_ids: Array.from(selectedIds),
          data: { status },
        }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setSelectedIds(new Set())
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBulkAddTags = async (tags: string[]) => {
    setIsActionLoading(true)
    try {
      const response = await fetch('/api/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_tags',
          lead_ids: Array.from(selectedIds),
          data: { tags },
        }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setSelectedIds(new Set())
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBulkRemoveTags = async (tags: string[]) => {
    setIsActionLoading(true)
    try {
      const response = await fetch('/api/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_tags',
          lead_ids: Array.from(selectedIds),
          data: { tags },
        }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setSelectedIds(new Set())
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    setIsActionLoading(true)
    try {
      const response = await fetch('/api/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          lead_ids: Array.from(selectedIds),
        }),
      })
      const data = await response.json()

      if (data.success) {
        await fetchLeads()
        setSelectedIds(new Set())
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleBulkExport = async () => {
    setIsActionLoading(true)
    try {
      const response = await fetch('/api/crm/leads/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          lead_ids: Array.from(selectedIds),
        }),
      })
      const data = await response.json()

      if (data.success && data.data?.csv) {
        const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`
        downloadCSV(data.data.csv, filename)
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Leads</h1>
          <p className="text-gray-500 mt-1">
            Manage your leads and track compliance status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeads}
            disabled={isLoading}
            className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <SearchFilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableTags={availableTags}
        totalResults={totalLeads}
      />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Leads Table */}
      <LeadsTable
        leads={leads}
        selectedIds={selectedIds}
        onSelectLead={handleSelectLead}
        onSelectAll={handleSelectAll}
        onViewLead={handleViewLead}
        onEditLead={handleEditLead}
        onDeleteLead={handleDeleteLead}
        onMarkContacted={handleMarkContacted}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        isLoading={isLoading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalLeads)} of {totalLeads} leads
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions Menu */}
      <BulkActionsMenu
        selectedCount={selectedIds.size}
        onUpdateStatus={handleBulkUpdateStatus}
        onAddTags={handleBulkAddTags}
        onRemoveTags={handleBulkRemoveTags}
        onDelete={handleBulkDelete}
        onExport={handleBulkExport}
        onClearSelection={() => setSelectedIds(new Set())}
        availableTags={availableTags}
        isLoading={isActionLoading}
      />

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onEdit={() => handleEditLead(selectedLead)}
          onDelete={() => handleDeleteLead(selectedLead.id)}
          onUpdateStatus={(status) => handleUpdateStatus(selectedLead.id, status)}
          onMarkContacted={() => handleMarkContacted(selectedLead.id)}
          isLoading={isActionLoading}
        />
      )}

      {/* Add/Edit Lead Modal */}
      {(showAddModal || editingLead) && (
        <AddLeadModal
          lead={editingLead}
          onClose={() => {
            setShowAddModal(false)
            setEditingLead(null)
          }}
          onSave={handleSaveLead}
          isLoading={isActionLoading}
          availableTags={availableTags}
        />
      )}
    </div>
  )
}
