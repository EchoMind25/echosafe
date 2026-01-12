'use client'

import { useState } from 'react'
import { ArrowLeft, Download, Save, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import type { UploadHistory } from '@/types/database'

interface ResultsDisplayProps {
  job: UploadHistory
}

export default function ResultsDisplay({ job }: ResultsDisplayProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveToCRM = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/crm/save-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id })
      })

      if (response.ok) {
        setSaved(true)
      } else {
        alert('Failed to save leads to CRM')
      }
    } catch (error) {
      console.error('Error saving to CRM:', error)
      alert('Failed to save leads to CRM')
    } finally {
      setSaving(false)
    }
  }

  const handleDownload = async (type: 'clean' | 'full' | 'risky') => {
    try {
      const response = await fetch(`/api/download/${job.id}?type=${type}`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-leads-${job.id.slice(0, 8)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download file')
    }
  }

  const totalProcessed = job.processed_leads || job.total_leads || 0
  const cleanPercent = totalProcessed > 0 ? Math.round((job.clean_leads / totalProcessed) * 100) : 0
  const cautionPercent = totalProcessed > 0 ? Math.round((job.caution_leads / totalProcessed) * 100) : 0
  const blockedPercent = totalProcessed > 0 ? Math.round((job.dnc_blocked / totalProcessed) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <Link
          href="/dashboard/scrub"
          className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scrub
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Scrubbing Results</h1>
        <p className="text-gray-600 mt-2">
          {job.filename || 'Upload'} • Completed {new Date(job.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900">
            {totalProcessed.toLocaleString()}
          </p>
          {job.duplicates_removed > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {job.duplicates_removed} duplicates removed
            </p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Clean Leads</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {(job.clean_leads || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{cleanPercent}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Caution</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-600">
            {(job.caution_leads || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{cautionPercent}% of total</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">DNC Blocked</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {(job.dnc_blocked || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{blockedPercent}% of total</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Download Results</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleDownload('clean')}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Clean Leads Only
          </button>

          <button
            onClick={() => handleDownload('full')}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Full Report
          </button>

          {job.caution_leads > 0 && (
            <button
              onClick={() => handleDownload('risky')}
              className="flex items-center justify-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Risky Leads
            </button>
          )}
        </div>
      </div>

      {!saved && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Save to CRM
          </h3>
          <p className="text-blue-700 mb-4">
            Save {(job.clean_leads || 0).toLocaleString()} clean leads to your built-in CRM.
          </p>
          <button
            onClick={handleSaveToCRM}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save to CRM'}
          </button>
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">
                Saved to CRM
              </h3>
              <p className="text-green-700">
                Your clean leads are now available in your CRM.{' '}
                <Link href="/dashboard/crm" className="underline">
                  View CRM
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Processing Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Job ID:</span>
            <span className="ml-2 font-mono text-gray-900">{job.id.slice(0, 8)}...</span>
          </div>

          <div>
            <span className="text-gray-600">Processing Time:</span>
            <span className="ml-2 text-gray-900">
              {job.processing_time_ms
                ? `${(job.processing_time_ms / 1000).toFixed(2)}s`
                : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-gray-600">Status:</span>
            <span className="ml-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {job.status}
              </span>
            </span>
          </div>

          <div>
            <span className="text-gray-600">Area Codes:</span>
            <span className="ml-2 text-gray-900">
              {job.area_codes_used?.join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
