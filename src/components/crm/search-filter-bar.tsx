'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

export interface CrmFilters {
  search: string
  status: string[]
  riskLevel: string[]
  tags: string[]
  minRisk: number | null
  maxRisk: number | null
}

interface SearchFilterBarProps {
  filters: CrmFilters
  onFiltersChange: (filters: CrmFilters) => void
  availableTags: string[]
  totalResults: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'nurturing', label: 'Nurturing' },
  { value: 'converted', label: 'Converted' },
  { value: 'dead', label: 'Dead' },
]

const RISK_LEVEL_OPTIONS = [
  { value: 'safe', label: 'Safe', color: 'bg-green-100 text-green-700' },
  { value: 'caution', label: 'Caution', color: 'bg-amber-100 text-amber-700' },
  { value: 'blocked', label: 'Blocked', color: 'bg-red-100 text-red-700' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchFilterBar({
  filters,
  onFiltersChange,
  availableTags,
  totalResults,
}: SearchFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)
  const [showFilters, setShowFilters] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showRiskDropdown, setShowRiskDropdown] = useState(false)
  const [showTagsDropdown, setShowTagsDropdown] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [localSearch, filters, onFiltersChange])

  // Count active filters
  const activeFilterCount =
    filters.status.length +
    filters.riskLevel.length +
    filters.tags.length +
    (filters.minRisk !== null ? 1 : 0) +
    (filters.maxRisk !== null ? 1 : 0)

  // Toggle status filter
  const toggleStatus = useCallback((status: string) => {
    const newStatuses = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status]
    onFiltersChange({ ...filters, status: newStatuses })
  }, [filters, onFiltersChange])

  // Toggle risk level filter
  const toggleRiskLevel = useCallback((level: string) => {
    const newLevels = filters.riskLevel.includes(level)
      ? filters.riskLevel.filter(l => l !== level)
      : [...filters.riskLevel, level]
    onFiltersChange({ ...filters, riskLevel: newLevels })
  }, [filters, onFiltersChange])

  // Toggle tag filter
  const toggleTag = useCallback((tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }, [filters, onFiltersChange])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setLocalSearch('')
    onFiltersChange({
      search: '',
      status: [],
      riskLevel: [],
      tags: [],
      minRisk: null,
      maxRisk: null,
    })
  }, [onFiltersChange])

  return (
    <div className="space-y-4">
      {/* Search bar and filter toggle */}
      <div className="flex gap-3">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter toggle button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors
            ${showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <Filter className="w-5 h-5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowRiskDropdown(false)
                setShowTagsDropdown(false)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span>Status</span>
              {filters.status.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                  {filters.status.length}
                </span>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  {STATUS_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.status.includes(option.value)}
                        onChange={() => toggleStatus(option.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Risk level filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowRiskDropdown(!showRiskDropdown)
                setShowStatusDropdown(false)
                setShowTagsDropdown(false)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span>Risk Level</span>
              {filters.riskLevel.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                  {filters.riskLevel.length}
                </span>
              )}
              <ChevronDown className="w-4 h-4" />
            </button>
            {showRiskDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-2 space-y-1">
                  {RISK_LEVEL_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.riskLevel.includes(option.value)}
                        onChange={() => toggleRiskLevel(option.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm px-2 py-0.5 rounded ${option.color}`}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags filter */}
          {availableTags.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowTagsDropdown(!showTagsDropdown)
                  setShowStatusDropdown(false)
                  setShowRiskDropdown(false)
                }}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span>Tags</span>
                {filters.tags.length > 0 && (
                  <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded">
                    {filters.tags.length}
                  </span>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showTagsDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2 space-y-1">
                    {availableTags.map(tag => (
                      <label
                        key={tag}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.tags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm truncate">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Risk score range */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Risk:</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Min"
              value={filters.minRisk ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                minRisk: e.target.value ? parseInt(e.target.value) : null
              })}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
            <span className="text-gray-400">-</span>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Max"
              value={filters.maxRisk ?? ''}
              onChange={(e) => onFiltersChange({
                ...filters,
                maxRisk: e.target.value ? parseInt(e.target.value) : null
              })}
              className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}

          {/* Results count */}
          <div className="ml-auto text-sm text-gray-500">
            {totalResults.toLocaleString()} {totalResults === 1 ? 'lead' : 'leads'}
          </div>
        </div>
      )}

      {/* Active filters pills */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.status.map(status => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200"
            >
              {status}
              <X className="w-3 h-3" />
            </button>
          ))}
          {filters.riskLevel.map(level => (
            <button
              key={level}
              onClick={() => toggleRiskLevel(level)}
              className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full hover:bg-blue-200"
            >
              {level}
              <X className="w-3 h-3" />
            </button>
          ))}
          {filters.tags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full hover:bg-purple-200"
            >
              {tag}
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-700 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
