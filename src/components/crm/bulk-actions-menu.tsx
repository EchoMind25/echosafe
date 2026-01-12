'use client'

import { useState } from 'react'
import {
  Trash2,
  Tag,
  CheckCircle,
  Download,
  ChevronDown,
  AlertTriangle,
  X,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface BulkActionsMenuProps {
  selectedCount: number
  onUpdateStatus: (status: string) => Promise<void>
  onAddTags: (tags: string[]) => Promise<void>
  onRemoveTags: (tags: string[]) => Promise<void>
  onDelete: () => Promise<void>
  onExport: () => Promise<void>
  onClearSelection: () => void
  availableTags: string[]
  isLoading: boolean
}

// ============================================================================
// STATUS OPTIONS
// ============================================================================

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: 'bg-gray-100 text-gray-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-700' },
  { value: 'nurturing', label: 'Nurturing', color: 'bg-purple-100 text-purple-700' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'dead', label: 'Dead', color: 'bg-red-100 text-red-700' },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function BulkActionsMenu({
  selectedCount,
  onUpdateStatus,
  onAddTags,
  onDelete,
  onExport,
  onClearSelection,
  availableTags,
  isLoading,
}: BulkActionsMenuProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showTagsMenu, setShowTagsMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  if (selectedCount === 0) return null

  const handleStatusChange = async (status: string) => {
    setShowStatusMenu(false)
    await onUpdateStatus(status)
  }

  const handleAddTags = async () => {
    const tagsToAdd = [...selectedTags]
    if (newTag.trim() && !tagsToAdd.includes(newTag.trim())) {
      tagsToAdd.push(newTag.trim())
    }
    if (tagsToAdd.length > 0) {
      await onAddTags(tagsToAdd)
    }
    setShowTagsMenu(false)
    setSelectedTags([])
    setNewTag('')
  }

  const handleDelete = async () => {
    setShowDeleteConfirm(false)
    await onDelete()
  }

  return (
    <>
      {/* Bulk actions bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-2xl">
          {/* Selection count */}
          <div className="flex items-center gap-2 pr-3 border-r border-gray-700">
            <span className="font-medium">{selectedCount} selected</span>
            <button
              onClick={onClearSelection}
              className="p-1 hover:bg-gray-700 rounded"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusMenu(!showStatusMenu)
                setShowTagsMenu(false)
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Status</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-44 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                {STATUS_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleStatusChange(option.value)}
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <span className={`px-2 py-0.5 rounded text-xs ${option.color}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tags dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowTagsMenu(!showTagsMenu)
                setShowStatusMenu(false)
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <Tag className="w-4 h-4" />
              <span>Add Tags</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showTagsMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-3 space-y-3">
                  {/* New tag input */}
                  <div>
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="New tag..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
                    />
                  </div>

                  {/* Existing tags */}
                  {availableTags.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availableTags.map(tag => (
                        <label
                          key={tag}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag)}
                            onChange={() => {
                              setSelectedTags(prev =>
                                prev.includes(tag)
                                  ? prev.filter(t => t !== tag)
                                  : [...prev, tag]
                              )
                            }}
                            className="rounded border-gray-300 text-blue-600"
                          />
                          <span className="text-sm text-gray-700">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleAddTags}
                    disabled={selectedTags.length === 0 && !newTag.trim()}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Tags
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Export button */}
          <button
            onClick={onExport}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>

          {/* Delete button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'}?
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    These leads will be moved to trash and can be recovered within 30 days.
                    After that, they will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
