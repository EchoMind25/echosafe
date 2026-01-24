'use client'

import { useState } from 'react'
import { X, AlertTriangle, Plus, Tag } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Lead {
  id?: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  status: string
  source: string | null
  tags: string[] | null
  notes: string | null
}

interface AddLeadModalProps {
  lead?: Lead | null
  onClose: () => void
  onSave: (data: Partial<Lead>) => Promise<{ success: boolean; message?: string; duplicate?: { id: string } }>
  isLoading: boolean
  availableTags: string[]
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

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

// ============================================================================
// HELPERS
// ============================================================================

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  if (digits.length >= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length >= 3) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  }
  if (digits.length > 0) {
    return `(${digits}`
  }
  return ''
}

function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddLeadModal({
  lead,
  onClose,
  onSave,
  isLoading,
  availableTags,
}: AddLeadModalProps) {
  const isEditing = !!lead?.id

  const [formData, setFormData] = useState({
    phone_number: lead?.phone_number || '',
    first_name: lead?.first_name || '',
    last_name: lead?.last_name || '',
    email: lead?.email || '',
    address: lead?.address || '',
    city: lead?.city || '',
    state: lead?.state || '',
    zip_code: lead?.zip_code || '',
    status: lead?.status || 'new',
    source: lead?.source || '',
    tags: lead?.tags || [],
    notes: lead?.notes || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [newTag, setNewTag] = useState('')
  const [showTagDropdown, setShowTagDropdown] = useState(false)

  // Format phone on input
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value)
    setFormData(prev => ({ ...prev, phone_number: formatted }))
    setErrors(prev => ({ ...prev, phone_number: '' }))
    setDuplicateWarning(null)
  }

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.phone_number) {
      newErrors.phone_number = 'Phone number is required'
    } else if (!validatePhone(formData.phone_number)) {
      newErrors.phone_number = 'Enter a valid 10-digit phone number'
    }

    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Enter a valid email address'
    }

    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Enter a valid ZIP code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const result = await onSave({
      ...formData,
      phone_number: formData.phone_number.replace(/\D/g, ''),
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      email: formData.email || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      zip_code: formData.zip_code || null,
      source: formData.source || null,
      notes: formData.notes || null,
    })

    if (!result.success && result.duplicate) {
      setDuplicateWarning('A lead with this phone number already exists')
    } else if (result.success) {
      onClose()
    }
  }

  // Add tag
  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setNewTag('')
    setShowTagDropdown(false)
  }

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Lead' : 'Add New Lead'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Duplicate Warning */}
              {duplicateWarning && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-medium">{duplicateWarning}</p>
                    <p className="text-amber-700 text-sm mt-1">
                      Please use a different phone number or update the existing lead.
                    </p>
                  </div>
                </div>
              )}

              {/* Phone Number - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder="(555) 123-4567"
                  disabled={isEditing}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                    errors.phone_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, email: e.target.value }))
                    setErrors(prev => ({ ...prev, email: '' }))
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={e => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">--</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={formData.zip_code}
                    onChange={e => {
                      setFormData(prev => ({ ...prev, zip_code: e.target.value }))
                      setErrors(prev => ({ ...prev, zip_code: '' }))
                    }}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.zip_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.zip_code && (
                    <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>
                  )}
                </div>
              </div>

              {/* Status & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., Website, Referral"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onFocus={() => setShowTagDropdown(true)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addTag(newTag.trim())
                        }
                      }}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newTag.trim())}
                      disabled={!newTag.trim()}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {showTagDropdown && availableTags.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTagDropdown(false)}
                      />
                      <div className="absolute top-full left-0 right-12 mt-1 max-h-40 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        {availableTags
                          .filter(tag => !formData.tags.includes(tag))
                          .filter(tag => !newTag || tag.toLowerCase().includes(newTag.toLowerCase()))
                          .map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => addTag(tag)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              {tag}
                            </button>
                          ))
                        }
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Add any notes about this lead..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
