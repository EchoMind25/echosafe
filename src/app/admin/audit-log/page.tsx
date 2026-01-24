'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { DncUpdateLog } from '@/lib/supabase/types'
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
  User,
} from 'lucide-react'

interface Filters {
  areaCode: string
  updateType: string
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
    updateType: '',
    dateFrom: '',
    dateTo: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createBrowserClient()

  // Unique area codes for filter dropdown
  const uniqueAreaCodes = [...new Set(logs.map(log => log.area_code))].sort()

  // Unique update types for filter dropdown
  const uniqueUpdateTypes = [...new Set(logs.map(log => log.update_type))].sort()

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

    if (filters.updateType) {
      result = result.filter(log => log.update_type === filters.updateType)
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
        log.update_type.toLowerCase().includes(query) ||
        log.admin_user_id?.toLowerCase().includes(query) ||
        log.id.toLowerCase().includes(query)
      )
    }

    setFilteredLogs(result)
  }, [logs, filters, searchQuery])

  // Reset filters
  const resetFilters = () => {
    setFilters({
      areaCode: '',
      updateType: '',
      dateFrom: '',
      dateTo: '',
    })
    setSearchQuery('')
  }

  // Get update type badge
  const getUpdateTypeBadge = (updateType: string) => {
    const typeLower = updateType.toLowerCase()
    if (typeLower.includes('add') || typeLower.includes('create') || typeLower.includes('insert') || typeLower.includes('initial')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
          <CheckCircle className="w-3 h-3" />
          {updateType}
        </span>
      )
    }
    if (typeLower.includes('delete') || typeLower.includes('remove')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
          <XCircle className="w-3 h-3" />
          {updateType}
        </span>
      )
    }
    if (typeLower.includes('update') || typeLower.includes('modify') || typeLower.includes('refresh')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
          <RefreshCw className="w-3 h-3" />
          {updateType}
        </span>
      )
    }
    if (typeLower.includes('error') || typeLower.includes('fail')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-3 h-3" />
          {updateType}
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-500/20 text-slate-400">
        <Clock className="w-3 h-3" />
        {updateType}
      </span>
    )
  }

  // Calculate stats
  const totalRecordsAffected = filteredLogs.reduce((sum, log) =>
    sum + log.records_added + log.records_updated + log.records_removed, 0)

  const stats = {
    totalLogs: filteredLogs.length,
    totalRecords: totalRecordsAffected,
    uniqueAreaCodes: new Set(filteredLogs.map(log => log.area_code)).size,
    uniqueUpdateTypes: new Set(filteredLogs.map(log => log.update_type)).size,
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Area Code', 'Update Type', 'Status', 'Records Added', 'Records Updated', 'Records Removed', 'Total Records', 'Admin User ID', 'Duration (s)', 'Error Message']
    const rows = filteredLogs.map(log => [
      new Date(log.created_at).toISOString(),
      log.area_code,
      log.update_type,
      log.status,
      log.records_added,
      log.records_updated,
      log.records_removed,
      log.total_records,
      log.admin_user_id || '',
      log.duration_seconds || '',
      log.error_message || '',
    ])

    const csv = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n')
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
            Track all DNC registry updates and administrative actions
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
              <p className="text-2xl font-bold text-white">{stats.totalRecords.toLocaleString()}</p>
              <p className="text-xs text-slate-400">Records Affected</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.uniqueAreaCodes}</p>
              <p className="text-xs text-slate-400">Area Codes</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.uniqueUpdateTypes}</p>
              <p className="text-xs text-slate-400">Update Types</p>
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Update Type</label>
              <select
                value={filters.updateType}
                onChange={(e) => setFilters(prev => ({ ...prev, updateType: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">All Update Types</option>
                {uniqueUpdateTypes.map(updateType => (
                  <option key={updateType} value={updateType}>{updateType}</option>
                ))}
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
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Update Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Area Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
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
                      {getUpdateTypeBadge(log.update_type)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-600 rounded text-xs font-bold text-white">
                        {log.area_code}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="text-white">{log.total_records.toLocaleString()}</span>
                        <p className="text-xs text-slate-400 mt-1">
                          +{log.records_added} / ~{log.records_updated} / -{log.records_removed}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        log.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        log.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        log.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {log.status}
                      </span>
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
                      <td colSpan={6} className="py-4 px-6">
                        <div className="bg-slate-800 rounded-lg p-4 space-y-3">
                          <p className="text-xs text-slate-400 mb-2 font-medium">Details</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Started At</p>
                              <p className="text-white">{new Date(log.started_at).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Completed At</p>
                              <p className="text-white">{log.completed_at ? new Date(log.completed_at).toLocaleString() : '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Duration</p>
                              <p className="text-white">{log.duration_seconds ? `${log.duration_seconds}s` : '-'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Error Count</p>
                              <p className="text-white">{log.error_count}</p>
                            </div>
                            {log.source_file && (
                              <div className="col-span-2">
                                <p className="text-slate-400">Source File</p>
                                <p className="text-white break-all">{log.source_file}</p>
                              </div>
                            )}
                            {log.admin_user_id && (
                              <div>
                                <p className="text-slate-400">Admin User</p>
                                <p className="text-white flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {log.admin_user_id}
                                </p>
                              </div>
                            )}
                            {log.ftc_release_date && (
                              <div>
                                <p className="text-slate-400">FTC Release Date</p>
                                <p className="text-white">{log.ftc_release_date}</p>
                              </div>
                            )}
                          </div>
                          {log.error_message && (
                            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-xs text-red-400 font-medium mb-1">Error Message</p>
                              <p className="text-sm text-red-300">{log.error_message}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {filteredLogs.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No logs found matching your filters
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
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
