'use client'

import { useMemo } from 'react'
import {
  FileText,
  AlertTriangle,
  Copy,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils/file-parser'
import type { FilePreviewData, ParseResult } from '@/types/upload'

// ============================================================================
// TYPES
// ============================================================================

export interface FilePreviewProps {
  /** Preview data from file parsing */
  preview: FilePreviewData
  /** Full parse result (optional, for showing errors) */
  parseResult?: ParseResult | null
  /** Maximum rows to show in preview */
  maxRows?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilePreview({ preview, parseResult, maxRows = 5 }: FilePreviewProps) {
  const { filename, fileSize, rowCount, columns, previewRows, duplicateCount, invalidPhoneCount } =
    preview

  // Determine which columns to display (prioritize important ones)
  const displayColumns = useMemo(() => {
    const priorityColumns = [
      'phone_number',
      'phone',
      'first_name',
      'firstname',
      'last_name',
      'lastname',
      'email',
      'city',
      'state',
    ]

    // Sort columns by priority, then alphabetically
    const sorted = [...columns].sort((a, b) => {
      const aIndex = priorityColumns.indexOf(a.toLowerCase())
      const bIndex = priorityColumns.indexOf(b.toLowerCase())

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.localeCompare(b)
    })

    // Limit to first 6 columns on mobile, more on desktop
    return sorted.slice(0, 8)
  }, [columns])

  // Stats for display
  const stats = useMemo(
    () => [
      {
        label: 'Total Rows',
        value: rowCount.toLocaleString(),
        icon: FileText,
        color: 'text-echo-neutral-600',
      },
      {
        label: 'Duplicates',
        value: duplicateCount.toLocaleString(),
        icon: duplicateCount > 0 ? Copy : CheckCircle,
        color: duplicateCount > 0 ? 'text-amber-600' : 'text-green-600',
      },
      {
        label: 'Invalid Phones',
        value: invalidPhoneCount.toLocaleString(),
        icon: invalidPhoneCount > 0 ? XCircle : CheckCircle,
        color: invalidPhoneCount > 0 ? 'text-red-600' : 'text-green-600',
      },
    ],
    [rowCount, duplicateCount, invalidPhoneCount]
  )

  return (
    <div className="bg-white border border-echo-neutral-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-echo-neutral-50 border-b border-echo-neutral-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-echo-primary-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-echo-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-echo-neutral-900 truncate max-w-[200px] md:max-w-none">
                {filename}
              </h3>
              <p className="text-sm text-echo-neutral-500">{formatFileSize(fileSize)}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-sm font-medium text-echo-neutral-700">{stat.value}</span>
                <span className="text-xs text-echo-neutral-500 hidden sm:inline">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {(duplicateCount > 0 || invalidPhoneCount > 0) && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-100">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              {duplicateCount > 0 && (
                <p>
                  <strong>{duplicateCount} duplicate</strong> phone numbers found (will be removed
                  if option selected)
                </p>
              )}
              {invalidPhoneCount > 0 && (
                <p>
                  <strong>{invalidPhoneCount} invalid</strong> phone numbers found (will be skipped)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-echo-neutral-50 border-b border-echo-neutral-200">
              <th className="px-3 py-2 text-left text-xs font-semibold text-echo-neutral-500 uppercase tracking-wider">
                #
              </th>
              {displayColumns.map((column) => (
                <th
                  key={column}
                  className="px-3 py-2 text-left text-xs font-semibold text-echo-neutral-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
              {columns.length > displayColumns.length && (
                <th className="px-3 py-2 text-left text-xs font-semibold text-echo-neutral-400">
                  +{columns.length - displayColumns.length} more
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-echo-neutral-100">
            {previewRows.slice(0, maxRows).map((row, index) => (
              <tr key={index} className="hover:bg-echo-neutral-50">
                <td className="px-3 py-2 text-echo-neutral-400 font-mono text-xs">{index + 1}</td>
                {displayColumns.map((column) => (
                  <td
                    key={column}
                    className="px-3 py-2 text-echo-neutral-700 max-w-[150px] truncate"
                    title={row[column] || ''}
                  >
                    {row[column] || <span className="text-echo-neutral-300">-</span>}
                  </td>
                ))}
                {columns.length > displayColumns.length && (
                  <td className="px-3 py-2 text-echo-neutral-400">...</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {rowCount > maxRows && (
        <div className="px-4 py-2 bg-echo-neutral-50 border-t border-echo-neutral-200">
          <p className="text-xs text-echo-neutral-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Showing first {maxRows} of {rowCount.toLocaleString()} rows
          </p>
        </div>
      )}

      {/* Parse Errors (if any) */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <div className="flex items-start gap-2">
            <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 mb-1">
                {parseResult.errors.length} rows with errors
              </p>
              <ul className="text-xs text-red-700 space-y-0.5">
                {parseResult.errors.slice(0, 3).map((error, index) => (
                  <li key={index}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
                {parseResult.errors.length > 3 && (
                  <li className="text-red-500">
                    ...and {parseResult.errors.length - 3} more errors
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// LOADING STATE
// ============================================================================

export function FilePreviewSkeleton() {
  return (
    <div className="bg-white border border-echo-neutral-200 rounded-xl overflow-hidden animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 bg-echo-neutral-50 border-b border-echo-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-echo-neutral-200" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-echo-neutral-200 rounded" />
            <div className="h-3 w-20 bg-echo-neutral-200 rounded" />
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-4 w-8 bg-echo-neutral-100 rounded" />
            <div className="h-4 w-24 bg-echo-neutral-100 rounded" />
            <div className="h-4 w-20 bg-echo-neutral-100 rounded" />
            <div className="h-4 w-20 bg-echo-neutral-100 rounded" />
            <div className="h-4 w-32 bg-echo-neutral-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FilePreview
