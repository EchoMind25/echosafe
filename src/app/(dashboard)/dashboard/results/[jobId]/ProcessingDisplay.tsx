'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Loader2,
  ArrowLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface JobStatus {
  id: string
  status: 'processing' | 'completed' | 'failed'
  filename: string
  totalLeads: number
  processedLeads: number
  cleanLeads: number
  dncLeads: number
  riskyLeads: number
  progress: number
  errorMessage: string | null
  createdAt: string
}

interface ProcessingDisplayProps {
  jobId: string
  initialFilename?: string
  initialTotalLeads?: number
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ProcessingDisplay({
  jobId,
  initialFilename,
  initialTotalLeads,
}: ProcessingDisplayProps) {
  const router = useRouter()
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [pollCount, setPollCount] = useState(0)

  // Fetch job status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/upload/${jobId}`)
      const data = await response.json()

      if (data.success && data.job) {
        setJobStatus(data.job)

        // If completed or failed, stop polling
        if (data.job.status === 'completed') {
          setIsPolling(false)
          // Refresh the page to show ResultsDisplay
          router.refresh()
        } else if (data.job.status === 'failed') {
          setIsPolling(false)
          setError(data.job.errorMessage || 'Processing failed')
        }
      } else {
        setError(data.message || 'Failed to fetch status')
        setIsPolling(false)
      }
    } catch {
      setError('Failed to check processing status')
      setIsPolling(false)
    }
  }, [jobId, router])

  // Poll for status updates
  useEffect(() => {
    if (!isPolling) return

    // Initial fetch
    fetchStatus()
    setPollCount((c) => c + 1)

    // Poll every 2 seconds
    const interval = setInterval(() => {
      fetchStatus()
      setPollCount((c) => c + 1)
    }, 2000)

    // Stop polling after 5 minutes (150 polls)
    if (pollCount > 150) {
      setIsPolling(false)
      setError('Processing is taking longer than expected. Please check back later.')
    }

    return () => clearInterval(interval)
  }, [isPolling, fetchStatus, pollCount])

  // Progress percentage
  const progress = jobStatus?.progress || 0
  const filename = jobStatus?.filename || initialFilename || 'Your file'
  const totalLeads = jobStatus?.totalLeads || initialTotalLeads || 0

  // Processing stages
  const stages = [
    { id: 'upload', label: 'File received', completed: true },
    { id: 'parse', label: 'Parsing leads', completed: progress > 0 },
    { id: 'scrub', label: 'Checking DNC registry', completed: progress > 50 },
    { id: 'analyze', label: 'Risk analysis', completed: progress > 80 },
    { id: 'complete', label: 'Generating report', completed: progress === 100 },
  ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/scrub"
          className="inline-flex items-center text-echo-primary-600 hover:text-echo-primary-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scrub
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Processing Leads</h1>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-800 font-medium">Privacy-First</span>
          </div>
        </div>
      </div>

      {/* Main Processing Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* File Info Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-echo-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-echo-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">{filename}</h2>
              <p className="text-sm text-slate-500">
                {totalLeads > 0 ? `${totalLeads.toLocaleString()} leads` : 'Processing...'}
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">Processing Failed</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      setError(null)
                      setIsPolling(true)
                      setPollCount(0)
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                  <Link
                    href="/dashboard/scrub"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Upload New File
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {!error && (
          <div className="p-6">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm text-slate-500">{progress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-echo-primary-500 to-echo-primary-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Processing Stages */}
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      stage.completed
                        ? 'bg-green-100 text-green-600'
                        : index === stages.findIndex((s) => !s.completed)
                        ? 'bg-echo-primary-100 text-echo-primary-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {stage.completed ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : index === stages.findIndex((s) => !s.completed) ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      stage.completed
                        ? 'text-green-700 font-medium'
                        : index === stages.findIndex((s) => !s.completed)
                        ? 'text-slate-900 font-medium'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Stats */}
            {jobStatus && progress > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-medium text-slate-700 mb-4">Live Statistics</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-2xl font-bold text-slate-900">
                      {jobStatus.processedLeads.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-500">Processed</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {jobStatus.cleanLeads.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-700">Clean</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      {jobStatus.dncLeads.toLocaleString()}
                    </p>
                    <p className="text-xs text-red-700">DNC Blocked</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
        <Shield className="w-4 h-4" />
        <span>Your data is processed securely and never sold or shared.</span>
      </div>

      {/* Timing Info */}
      <p className="text-center text-xs text-slate-400 mt-4">
        Processing typically takes 10-60 seconds depending on file size. This page will automatically update.
      </p>
    </div>
  )
}
