'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Clock,
  ArrowLeft,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileJson,
  FileSpreadsheet,
  MoreVertical,
} from 'lucide-react'
import { exportHistory, type HistoryJob, type ExportFormat } from '@/lib/utils/export-history'

// ============================================================================
// TYPES
// ============================================================================

interface PaginatedResponse {
  success: boolean
  jobs: HistoryJob[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function HistoryPage() {
  const [jobs, setJobs] = useState<HistoryJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'selected' | 'all' | string | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/jobs/history?page=${page}&limit=10`)
      const data: PaginatedResponse = await response.json()

      if (data.success) {
        setJobs(data.jobs)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      } else {
        setError('Failed to load history')
      }
    } catch {
      setError('Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Format file size
  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3.5 h-3.5" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        )
    }
  }

  // Toggle job selection
  const toggleJobSelection = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  // Select all jobs
  const toggleSelectAll = () => {
    if (selectedJobs.size === jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobs.map(j => j.id)))
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    try {
      let url = '/api/jobs/history?'

      if (deleteTarget === 'all') {
        url += 'all=true'
      } else if (deleteTarget === 'selected') {
        // Delete selected jobs one by one
        for (const jobId of selectedJobs) {
          await fetch(`/api/jobs/history?jobId=${jobId}`, { method: 'DELETE' })
        }
        setSelectedJobs(new Set())
        fetchHistory()
        setShowDeleteConfirm(false)
        setDeleteTarget(null)
        setIsDeleting(false)
        return
      } else {
        url += `jobId=${deleteTarget}`
      }

      await fetch(url, { method: 'DELETE' })
      setSelectedJobs(new Set())
      fetchHistory()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setShowDeleteConfirm(false)
      setDeleteTarget(null)
      setIsDeleting(false)
    }
  }

  // Handle export
  const handleExport = (format: ExportFormat) => {
    const jobsToExport = selectedJobs.size > 0
      ? jobs.filter(j => selectedJobs.has(j.id))
      : jobs

    exportHistory(jobsToExport, format, 'echo_mind_history')
    setExportMenuOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Upload History</h1>
            <p className="text-sm text-slate-600">
              {total} total uploads • Export or delete anytime
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
              {selectedJobs.size > 0 && (
                <span className="px-1.5 py-0.5 bg-echo-primary-100 text-echo-primary-700 text-xs rounded">
                  {selectedJobs.size}
                </span>
              )}
            </button>

            {exportMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setExportMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileText className="w-4 h-4 text-green-600" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Export as Excel
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileJson className="w-4 h-4 text-orange-600" />
                    Export as JSON
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Delete Selected */}
          {selectedJobs.size > 0 && (
            <button
              onClick={() => {
                setDeleteTarget('selected')
                setShowDeleteConfirm(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedJobs.size})
            </button>
          )}

          {/* Delete All */}
          <button
            onClick={() => {
              setDeleteTarget('all')
              setShowDeleteConfirm(true)
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete all history"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
        <Shield className="w-4 h-4 text-purple-600" />
        <span className="text-sm text-purple-800">
          Your history is private. Delete anytime with no recovery period.
        </span>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Loader2 className="w-8 h-8 text-echo-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading history...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-4" />
          <p className="text-slate-600">{error}</p>
          <button
            onClick={fetchHistory}
            className="mt-4 px-4 py-2 bg-echo-primary-500 text-white rounded-lg hover:bg-echo-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && jobs.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No uploads yet</h2>
          <p className="text-slate-600 mb-6">Start scrubbing leads to see your history here.</p>
          <Link
            href="/dashboard/scrub"
            className="inline-flex items-center gap-2 px-6 py-3 bg-echo-primary-500 hover:bg-echo-primary-600 text-white font-medium rounded-lg transition-colors"
          >
            Upload Leads
          </Link>
        </div>
      )}

      {/* History Table */}
      {!isLoading && !error && jobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Table Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-4">
            <input
              type="checkbox"
              checked={selectedJobs.size === jobs.length && jobs.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 text-echo-primary-500 focus:ring-echo-primary-500"
            />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Select All
            </span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 hover:bg-slate-50 transition-colors ${
                  selectedJobs.has(job.id) ? 'bg-echo-primary-50' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedJobs.has(job.id)}
                    onChange={() => toggleJobSelection(job.id)}
                    className="w-4 h-4 rounded border-slate-300 text-echo-primary-500 focus:ring-echo-primary-500"
                  />

                  {/* File Icon */}
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-500" />
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-medium text-slate-900 truncate">{job.filename}</p>
                      {getStatusBadge(job.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{job.totalLeads.toLocaleString()} leads</span>
                      {job.status === 'completed' && (
                        <>
                          <span className="text-green-600">{job.cleanLeads} clean</span>
                          {job.dncBlocked > 0 && (
                            <span className="text-red-600">{job.dncBlocked} DNC</span>
                          )}
                          {job.complianceRate && (
                            <span className="text-echo-primary-600">
                              {job.complianceRate}% compliant
                            </span>
                          )}
                        </>
                      )}
                      <span>{formatFileSize(job.fileSize)}</span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="hidden md:block text-sm text-slate-500 text-right">
                    {formatDate(job.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && (
                      <Link
                        href={`/dashboard/results/${job.id}`}
                        className="p-2 text-echo-primary-600 hover:bg-echo-primary-50 rounded-lg transition-colors"
                        title="View results"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setDeleteTarget(job.id)
                        setShowDeleteConfirm(true)
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-slate-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-900 mb-2">
              {deleteTarget === 'all'
                ? 'Delete All History?'
                : deleteTarget === 'selected'
                  ? `Delete ${selectedJobs.size} Items?`
                  : 'Delete This Upload?'}
            </h3>
            <p className="text-center text-slate-600 mb-6">
              {deleteTarget === 'all'
                ? 'This will permanently delete all your upload history. This action cannot be undone.'
                : 'This will permanently delete the selected upload(s). This action cannot be undone.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteTarget(null)
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
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
