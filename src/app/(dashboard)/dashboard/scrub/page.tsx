'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle,
  Trash2,
  Database,
  Filter,
  Shield,
  Brain,
} from 'lucide-react'
import { FileDropzone } from '@/components/upload/dropzone'
import { FilePreview, FilePreviewSkeleton } from '@/components/upload/file-preview'
import { parseFile, getFilePreview } from '@/lib/utils/file-parser'
import type { FilePreviewData, ParseResult, UploadOptions } from '@/types/upload'

// ============================================================================
// TYPES
// ============================================================================

type UploadStep = 'select' | 'preview' | 'processing' | 'complete' | 'error'

interface UploadState {
  step: UploadStep
  file: File | null
  preview: FilePreviewData | null
  parseResult: ParseResult | null
  error: string | null
  jobId: string | null
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ScrubPage() {
  const router = useRouter()

  // Upload state
  const [state, setState] = useState<UploadState>({
    step: 'select',
    file: null,
    preview: null,
    parseResult: null,
    error: null,
    jobId: null,
  })

  // Upload options
  const [options, setOptions] = useState<UploadOptions>({
    removeDuplicates: true,
    saveToCrm: false,
    includeRiskyInDownload: false,
  })

  // Loading states
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleFileSelect = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      file,
      error: null,
      step: 'select',
    }))

    setIsParsingFile(true)

    try {
      // Get preview data
      const preview = await getFilePreview(file)

      // Parse file completely
      const parseResult = await parseFile(file)

      if (!parseResult.success) {
        const errorMessage = parseResult.errors[0]?.message || 'Failed to parse file'
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          step: 'error',
        }))
        return
      }

      setState((prev) => ({
        ...prev,
        preview,
        parseResult,
        step: 'preview',
        error: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to parse file',
        step: 'error',
      }))
    } finally {
      setIsParsingFile(false)
    }
  }, [])

  const handleFileClear = useCallback(() => {
    setState({
      step: 'select',
      file: null,
      preview: null,
      parseResult: null,
      error: null,
      jobId: null,
    })
  }, [])

  const handleOptionChange = useCallback((key: keyof UploadOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!state.parseResult || !state.file) return

    setIsSubmitting(true)
    setState((prev) => ({ ...prev, step: 'processing' }))

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leads: state.parseResult.leads,
          options,
          filename: state.file.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to start scrubbing')
      }

      const { jobId } = await response.json()

      setState((prev) => ({
        ...prev,
        jobId,
        step: 'complete',
      }))

      // Navigate to results page
      router.push(`/dashboard/results/${jobId}`)
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to submit leads',
        step: 'error',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }, [state.parseResult, state.file, options, router])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 text-echo-neutral-600 hover:text-echo-neutral-900 hover:bg-echo-neutral-100 rounded-lg transition-colors"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-echo-neutral-900">Scrub Leads</h1>
          <p className="mt-1 text-echo-neutral-600">
            Upload your lead list to check against DNC registries
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Area - Takes 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dropzone */}
          <FileDropzone
            onFileSelect={handleFileSelect}
            onFileClear={handleFileClear}
            selectedFile={state.file}
            error={state.error}
            isProcessing={isParsingFile || isSubmitting}
            disabled={state.step === 'processing'}
          />

          {/* File Preview */}
          {isParsingFile && <FilePreviewSkeleton />}

          {state.preview && state.step === 'preview' && (
            <FilePreview
              preview={state.preview}
              parseResult={state.parseResult}
              maxRows={5}
            />
          )}

          {/* Processing State */}
          {state.step === 'processing' && (
            <div className="bg-white border border-echo-neutral-200 rounded-xl p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-echo-primary-100 flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-echo-primary-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-echo-neutral-900 mb-2">
                  Processing Your Leads
                </h3>
                <p className="text-echo-neutral-600 max-w-md">
                  We're checking your leads against DNC registries. This usually takes a few seconds
                  to a few minutes depending on the file size.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Options Panel - Takes 1 column */}
        <div className="space-y-6">
          {/* Options Card */}
          <div className="bg-white border border-echo-neutral-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-echo-neutral-900 mb-4">
              Scrubbing Options
            </h3>

            <div className="space-y-4">
              {/* Remove Duplicates */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.removeDuplicates}
                  onChange={() => handleOptionChange('removeDuplicates')}
                  className="mt-0.5 w-5 h-5 rounded border-echo-neutral-300 text-echo-primary-600 focus:ring-echo-primary-500"
                  disabled={state.step === 'processing'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-echo-neutral-500" />
                    <span className="font-medium text-echo-neutral-900 group-hover:text-echo-primary-700">
                      Remove Duplicates
                    </span>
                  </div>
                  <p className="text-sm text-echo-neutral-500 mt-0.5">
                    Automatically remove duplicate phone numbers from your list
                  </p>
                </div>
              </label>

              {/* Save to CRM */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.saveToCrm}
                  onChange={() => handleOptionChange('saveToCrm')}
                  className="mt-0.5 w-5 h-5 rounded border-echo-neutral-300 text-echo-primary-600 focus:ring-echo-primary-500"
                  disabled={state.step === 'processing'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-echo-neutral-500" />
                    <span className="font-medium text-echo-neutral-900 group-hover:text-echo-primary-700">
                      Save to CRM
                    </span>
                  </div>
                  <p className="text-sm text-echo-neutral-500 mt-0.5">
                    Save clean leads to your CRM after scrubbing
                  </p>
                </div>
              </label>

              {/* Include Risky */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={options.includeRiskyInDownload}
                  onChange={() => handleOptionChange('includeRiskyInDownload')}
                  className="mt-0.5 w-5 h-5 rounded border-echo-neutral-300 text-echo-primary-600 focus:ring-echo-primary-500"
                  disabled={state.step === 'processing'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-echo-neutral-500" />
                    <span className="font-medium text-echo-neutral-900 group-hover:text-echo-primary-700">
                      Include Risky Leads
                    </span>
                  </div>
                  <p className="text-sm text-echo-neutral-500 mt-0.5">
                    Include leads with uncertain DNC status in results
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Stats Summary */}
          {state.parseResult && state.step === 'preview' && (
            <div className="bg-white border border-echo-neutral-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-echo-neutral-900 mb-4">
                File Summary
              </h3>

              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-echo-neutral-600">Total Rows</dt>
                  <dd className="font-medium text-echo-neutral-900">
                    {state.parseResult.stats.totalRows.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-echo-neutral-600">Valid Leads</dt>
                  <dd className="font-medium text-green-600">
                    {state.parseResult.stats.validRows.toLocaleString()}
                  </dd>
                </div>
                {state.parseResult.stats.invalidRows > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-echo-neutral-600">Invalid Rows</dt>
                    <dd className="font-medium text-red-600">
                      {state.parseResult.stats.invalidRows.toLocaleString()}
                    </dd>
                  </div>
                )}
                {state.parseResult.stats.duplicateCount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-echo-neutral-600">Duplicates</dt>
                    <dd className="font-medium text-amber-600">
                      {state.parseResult.stats.duplicateCount.toLocaleString()}
                    </dd>
                  </div>
                )}
                <div className="pt-3 border-t border-echo-neutral-100">
                  <div className="flex justify-between">
                    <dt className="text-echo-neutral-700 font-medium">To Process</dt>
                    <dd className="font-semibold text-echo-primary-600">
                      {(
                        state.parseResult.stats.validRows -
                        (options.removeDuplicates ? state.parseResult.stats.duplicateCount : 0)
                      ).toLocaleString()}
                    </dd>
                  </div>
                </div>
              </dl>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              disabled={!state.parseResult || state.step !== 'preview' || isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-echo-primary-600 hover:bg-echo-primary-700 disabled:bg-echo-neutral-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Starting Scrub...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Start Scrubbing
                </>
              )}
            </button>

            {state.file && state.step !== 'processing' && (
              <button
                onClick={handleFileClear}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-echo-neutral-300 hover:border-echo-neutral-400 text-echo-neutral-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-echo-primary-50 border border-echo-primary-100 rounded-xl p-4">
            <div className="flex gap-3">
              <CheckCircle className="w-5 h-5 text-echo-primary-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-echo-primary-900 mb-1">FTC Compliant</p>
                <p className="text-echo-primary-700">
                  Your leads are checked against the National Do Not Call Registry to ensure
                  compliance with federal regulations.
                </p>
              </div>
            </div>
          </div>

          {/* AI Insights Card */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
            <div className="flex gap-3">
              <Brain className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-purple-900 mb-1">AI Risk Analysis</p>
                <p className="text-purple-700">
                  Get industry-specific compliance insights powered by AI. Analysis is
                  performed in real-time and never stored.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-slate-900 mb-1">Privacy-First Processing</p>
                <p className="text-slate-600">
                  Your data is never sold or shared. Export your results and delete
                  your history anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-900 font-semibold mb-2">
              Important Legal Notice
            </p>
            <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
              <li>This is a data checking tool, not legal advice or a compliance guarantee.</li>
              <li>You are responsible for TCPA compliance and maintaining your own call records.</li>
              <li>DNC data is sourced from the FTC and may be incomplete. Verify critical leads independently.</li>
              <li>Our audit logs document DNC checks only—not your actual calls.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
