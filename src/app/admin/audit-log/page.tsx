'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
  FileText,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Filter,
  Calendar,
  Database,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Search,
  X,
} from 'lucide-react'

interface DncUpdateLog {
  id: string
  admin_upload_id: string | null
  area_code: string
  ftc_release_date: string | null
  records_processed: number
  records_added: number
  records_updated: number
  records_removed: number
  records_failed: number
  status: string
  error_message: string | null
  error_details: string[] | null
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  file_path: string | null
  file_size_bytes: number | null
  batch_size: number
  created_at: string
}

interface Filters {
  areaCode: string
  status: string
  dateFrom: string
  dateTo: string
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<DncUpdateLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<DncUpdateLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    areaCode: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createBrowserClient()

  // Unique area codes for filter dropdown
  const uniqueAreaCodes = [...new Set(logs.map(log => log.area_code))].sort()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('dnc_update_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setLogs(data || [])
      setFilteredLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Apply filters
  useEffect(() => {
    let result = [...logs]

    if (filters.areaCode) {
      result = result.filter(log => log.area_code === filters.areaCode)
    }

    if (filters.status) {
      result = result.filter(log => log.status === filters.status)
    }

    if (filters.dateFrom) {
      result = result.filter(log => new Date(log.created_at) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      result = result.filter(log => new Date(log.created_at) <= new Date(filters.dateTo + 'T23:59:59'))
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(log =>
        log.area_code.includes(query) ||
        log.error_message?.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query)
      )
    }

    setFilteredLogs(result)
  }, [logs, filters, searchQuery])

  // Reset filters
  const resetFilters = () => {
    setFilters({
      areaCode: '',
      status: '',
      dateFrom: '',
      dateTo: '',
    })
    setSearchQuery('')
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Processing
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            Partial
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
            <Clock className="w-3 h-3" />
            {status}
          </span>
        )
    }
  }

  // Format duration
  const formatDuration = (ms: number | null): string => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  // Calculate stats
  const stats = {
    totalLogs: filteredLogs.length,
    totalRecords: filteredLogs.reduce((sum, log) => sum + log.records_processed, 0),
    successRate: filteredLogs.length > 0
      ? Math.round((filteredLogs.filter(l => l.status === 'completed').length / filteredLogs.length) * 100)
      : 0,
    avgDuration: filteredLogs.length > 0
      ? Math.round(filteredLogs.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / filteredLogs.length)
      : 0,
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Area Code', 'Status', 'Records Processed', 'Added', 'Failed', 'Duration', 'Error']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.area_code,
      log.status,
      log.records_processed,
      log.records_added,
      log.records_failed,
      formatDuration(log.duration_ms),
      log.error_message || '',
    ])

    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dnc-audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DNC Update Audit Log</h1>
          <p className="text-slate-400 mt-1">
            Track all DNC registry updates with FTC compliance data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalLogs}</p>
              <p className="text-xs text-slate-400">Total Logs</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{(stats.totalRecords / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-slate-400">Records Processed</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              <p className="text-xs text-slate-400">Success Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatDuration(stats.avgDuration)}</p>
              <p className="text-xs text-slate-400">Avg Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-white font-medium"
          >
            <Filter className="w-5 h-5 text-slate-400" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 w-64"
            />
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Area Code</label>
              <select
                value={filters.areaCode}
                onChange={(e) => setFilters(prev => ({ ...prev, areaCode: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Area Codes</option>
                {uniqueAreaCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="partial">Partial</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Area Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">FTC Release</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map((log) => (
                <>
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="py-3 px-4">
                      <p className="text-sm text-white">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-600 rounded text-sm font-bold text-white">
                        {log.area_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-slate-300">
                        {log.ftc_release_date
                          ? new Date(log.ftc_release_date).toLocaleDateString()
                          : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p className="text-white">{log.records_processed.toLocaleString()} processed</p>
                        <p className="text-xs text-slate-400">
                          +{log.records_added.toLocaleString()} added
                          {log.records_failed > 0 && (
                            <span className="text-red-400"> / {log.records_failed.toLocaleString()} failed</span>
                          )}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-white">{formatDuration(log.duration_ms)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedLog === log.id && (
                    <tr key={`${log.id}-details`} className="bg-slate-700/30">
                      <td colSpan={7} className="py-4 px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Log ID</p>
                            <p className="text-sm text-white font-mono">{log.id.slice(0, 8)}...</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Upload ID</p>
                            <p className="text-sm text-white font-mono">
                              {log.admin_upload_id?.slice(0, 8) || '-'}...
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">File Size</p>
                            <p className="text-sm text-white">{formatFileSize(log.file_size_bytes)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Batch Size</p>
                            <p className="text-sm text-white">{log.batch_size.toLocaleString()}</p>
                          </div>
                        </div>

                        {/* Error Details */}
                        {log.error_message && (
                          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-xs text-red-400 font-medium mb-1">Error Message</p>
                            <p className="text-sm text-red-300">{log.error_message}</p>

                            {log.error_details && log.error_details.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-red-400 font-medium mb-1">Error Details</p>
                                <ul className="text-sm text-red-300 list-disc list-inside">
                                  {(typeof log.error_details === 'string'
                                    ? JSON.parse(log.error_details)
                                    : log.error_details
                                  ).slice(0, 5).map((error: string, index: number) => (
                                    <li key={index}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timing Details */}
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Started At</p>
                            <p className="text-sm text-white">
                              {new Date(log.started_at).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Completed At</p>
                            <p className="text-sm text-white">
                              {log.completed_at
                                ? new Date(log.completed_at).toLocaleString()
                                : 'In progress...'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {filteredLogs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No logs found matching your filters
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
