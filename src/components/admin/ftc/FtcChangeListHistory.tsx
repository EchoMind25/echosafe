'use client'

import { useState, useMemo } from 'react'
import type { FtcChangeList } from '@/lib/supabase/types'
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Hash,
  AlertTriangle,
  Eye,
} from 'lucide-react'

interface FtcChangeListHistoryProps {
  changeLists: FtcChangeList[]
  isLoading: boolean
  onRefresh: () => void
}

interface ExpandedDetails {
  [key: string]: boolean
}

export default function FtcChangeListHistory({
  changeLists,
  isLoading,
  onRefresh,
}: FtcChangeListHistoryProps) {
  const [expandedRows, setExpandedRows] = useState<ExpandedDetails>({})
  const [filter, setFilter] = useState<'all' | 'additions' | 'deletions'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')

  // Toggle row expansion
  const toggleExpanded = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter change lists
  const filteredLists = useMemo(() => {
    return changeLists.filter(list => {
      if (filter !== 'all' && list.change_type !== filter) return false
      if (statusFilter !== 'all' && list.status !== statusFilter) return false
      return true
    })
  }, [changeLists, filter, statusFilter])

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">
            {status}
          </span>
        )
    }
  }

  // Change type badge
  const ChangeTypeBadge = ({ type }: { type: 'additions' | 'deletions' }) => {
    if (type === 'additions') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">
          <Plus className="w-3 h-3" />
          Additions
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400">
        <Minus className="w-3 h-3" />
        Deletions
      </span>
    )
  }

  // Progress bar component
  const ProgressBar = ({ percent, status }: { percent: number; status: string }) => {
    const getColor = () => {
      if (status === 'failed') return 'bg-red-500'
      if (status === 'completed') return 'bg-green-500'
      return 'bg-teal-500'
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Progress</span>
          <span className="text-xs font-medium text-white">{percent}%</span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-500 ease-out`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    )
  }

  // Format duration
  const formatDuration = (ms: number | null): string => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  // Format file size
  const formatSize = (bytes: number | null): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Change List History</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {filteredLists.length} of {changeLists.length} records
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          {/* Type Filter */}
          <div className="flex bg-slate-700/50 rounded-lg p-1">
            {(['all', 'additions', 'deletions'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === type
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex bg-slate-700/50 rounded-lg p-1">
            {(['all', 'completed', 'processing', 'failed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  statusFilter === status
                    ? 'bg-slate-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Area Codes</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Records</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Progress</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredLists.map((list) => (
              <>
                <tr
                  key={list.id}
                  className="hover:bg-slate-700/30 transition-colors cursor-pointer"
                  onClick={() => toggleExpanded(list.id)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {new Date(list.ftc_file_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-slate-500">
                          Uploaded {new Date(list.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <ChangeTypeBadge type={list.change_type} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 max-w-40">
                      {list.area_codes.slice(0, 3).map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 bg-slate-700 rounded text-xs text-white font-medium"
                        >
                          {code}
                        </span>
                      ))}
                      {list.area_codes.length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-600 rounded text-xs text-slate-400">
                          +{list.area_codes.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-white font-medium">
                          {list.processed_records.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-500">
                          of {list.total_records.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 w-36">
                    <ProgressBar percent={list.progress_percent} status={list.status} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={list.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpanded(list.id)
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {expandedRows[list.id] ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {expandedRows[list.id] && (
                  <tr key={`${list.id}-details`} className="bg-slate-900/50">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* File Info */}
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">File Info</span>
                          </div>
                          <p className="text-sm text-white truncate" title={list.file_name || '-'}>
                            {list.file_name || '-'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Size: {formatSize(list.file_size_bytes)}
                          </p>
                        </div>

                        {/* Processing Stats */}
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Hash className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Stats</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="flex justify-between">
                              <span className="text-slate-400">Processed:</span>
                              <span className="text-green-400">{list.processed_records.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Failed:</span>
                              <span className="text-red-400">{list.failed_records.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Skipped:</span>
                              <span className="text-amber-400">{list.skipped_records.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>

                        {/* Timing */}
                        <div className="bg-slate-800 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Timing</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <p className="flex justify-between">
                              <span className="text-slate-400">Duration:</span>
                              <span className="text-white">{formatDuration(list.processing_duration_ms)}</span>
                            </p>
                            <p className="flex justify-between">
                              <span className="text-slate-400">Batch:</span>
                              <span className="text-white">{list.current_batch}/{list.total_batches}</span>
                            </p>
                          </div>
                        </div>

                        {/* Error Info (if any) */}
                        {list.error_message && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-400 mb-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span className="text-xs font-medium uppercase">Error</span>
                            </div>
                            <p className="text-xs text-red-300">{list.error_message}</p>
                            {list.retry_count > 0 && (
                              <p className="text-xs text-red-400 mt-1">
                                Retries: {list.retry_count}
                              </p>
                            )}
                          </div>
                        )}

                        {/* All Area Codes */}
                        {!list.error_message && (
                          <div className="bg-slate-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                              <span className="text-xs font-medium uppercase">All Area Codes</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {list.area_codes.map((code) => (
                                <span
                                  key={code}
                                  className="px-2 py-0.5 bg-slate-700 rounded text-xs text-white"
                                >
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {filteredLists.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">No change lists found</p>
                      <p className="text-sm text-slate-500 mt-1">
                        {changeLists.length === 0
                          ? 'Upload your first FTC change list to get started'
                          : 'Try adjusting your filters'}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
