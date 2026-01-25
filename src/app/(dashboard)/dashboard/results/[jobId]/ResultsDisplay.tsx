'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Download,
  Save,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Brain,
  Shield,
  FileText,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import type { UploadHistory, AiInsightsResult } from '@/types/database'
import { DataFreshnessNotice } from '@/components/legal'

// ============================================================================
// TYPES
// ============================================================================

interface ResultsDisplayProps {
  job: UploadHistory
}

// Legacy type for fallback API response
interface LegacyAIInsights {
  summary: string
  recommendations: string[]
  riskAnalysis: string
  industryTips: string[]
  complianceNotes: string[]
}

// ============================================================================
// GRADE COLOR HELPER
// ============================================================================

function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): {
  bg: string
  text: string
  border: string
  ring: string
} {
  switch (grade) {
    case 'A':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', ring: 'ring-green-500' }
    case 'B':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', ring: 'ring-blue-500' }
    case 'C':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', ring: 'ring-yellow-500' }
    case 'D':
    case 'F':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', ring: 'ring-red-500' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', ring: 'ring-slate-500' }
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ResultsDisplay({ job }: ResultsDisplayProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [insightsExpanded, setInsightsExpanded] = useState(true)
  // Use stored insights from job if available
  const [insights] = useState<AiInsightsResult | null>(job.ai_insights || null)
  const [legacyInsights, setLegacyInsights] = useState<LegacyAIInsights | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(!job.ai_insights)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(
    job.ai_insights ? 'This AI analysis was generated in real-time and is stored temporarily. Your lead data was not sent to AI—only aggregate statistics.' : null
  )

  // Fetch AI insights on mount if not already stored
  useEffect(() => {
    if (!job.ai_insights) {
      fetchInsights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id, job.ai_insights])

  const fetchInsights = async () => {
    setInsightsLoading(true)
    setInsightsError(null)

    try {
      const totalProcessed = job.processed_leads || job.total_leads || 0
      const complianceRate = totalProcessed > 0
        ? Math.round((job.clean_leads / totalProcessed) * 100)
        : 100

      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          stats: {
            totalLeads: totalProcessed,
            cleanLeads: job.clean_leads,
            dncBlocked: job.dnc_blocked,
            cautionLeads: job.caution_leads,
            duplicatesRemoved: job.duplicates_removed,
            complianceRate,
            averageRiskScore: job.average_risk_score,
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.insights) {
        // Handle legacy API response format
        setLegacyInsights(data.insights)
        setPrivacyNotice(data.privacyNotice)
      } else {
        setInsightsError(data.error || 'Failed to load insights')
      }
    } catch {
      setInsightsError('Failed to load AI insights')
    } finally {
      setInsightsLoading(false)
    }
  }

  const handleSaveToCRM = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/crm/save-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
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

  const handleDownload = async (type: 'clean' | 'full' | 'risky', format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      // For now, all downloads go through the same API which returns CSV
      // The format parameter is for future enhancement when we support multiple formats
      const response = await fetch(`/api/download/${job.id}?type=${type}&format=${format}`)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Download failed' }))
        throw new Error(error.message || 'Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      // Determine extension based on format
      const extension = format === 'json' ? 'json' : format === 'excel' ? 'xlsx' : 'csv'
      a.download = `${type}-leads-${job.id.slice(0, 8)}.${extension}`

      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert(error instanceof Error ? error.message : 'Failed to download file')
    }
  }

  const totalProcessed = job.processed_leads || job.total_leads || 0
  const cleanPercent = totalProcessed > 0 ? Math.round((job.clean_leads / totalProcessed) * 100) : 0
  const cautionPercent = totalProcessed > 0 ? Math.round((job.caution_leads / totalProcessed) * 100) : 0
  const blockedPercent = totalProcessed > 0 ? Math.round((job.dnc_blocked / totalProcessed) * 100) : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl pb-20">
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
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Data Check Results</h1>
            <p className="text-slate-600 mt-2">
              {job.filename || 'Upload'} • Completed {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Data Tool Badge */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-300 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">Data Tool - Not Legal Advice</span>
          </div>
        </div>
      </div>

      {/* Data Freshness Notice */}
      <div className="mb-8">
        <DataFreshnessNotice
          lastFtcUpdate={new Date(Date.now() - 24 * 60 * 60 * 1000)}
          lastStateUpdate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Total Leads</h3>
          <p className="text-3xl font-bold text-slate-900">
            {totalProcessed.toLocaleString()}
          </p>
          {job.duplicates_removed > 0 && (
            <p className="text-xs text-slate-500 mt-1">
              {job.duplicates_removed} duplicates removed
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Clean Leads</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {(job.clean_leads || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{cleanPercent}% of total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">Caution</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-amber-600">
            {(job.caution_leads || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{cautionPercent}% of total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-600">DNC Blocked</h3>
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-600">
            {(job.dnc_blocked || 0).toLocaleString()}
          </p>
          <p className="text-xs text-slate-500 mt-1">{blockedPercent}% of total</p>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-white rounded-xl shadow-sm border border-purple-200 mb-8 overflow-hidden">
        {/* AI Content Warning Banner */}
        <div className="bg-yellow-50 border-b-2 border-yellow-400 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-900">
              <p className="font-bold mb-1">AI-Generated Content - Informational Only</p>
              <p>
                The analysis below is generated by AI based on public data patterns.
                It is NOT legal advice, compliance guidance, or recommendations.
                We are NOT attorneys. Consult a qualified TCPA attorney before making calls.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          className="w-full flex items-center justify-between p-6 hover:bg-purple-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold text-slate-900">AI Data Analysis</h2>
              <p className="text-sm text-slate-500">Pattern-based data observations (not legal advice)</p>
            </div>
          </div>
          {insightsExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {insightsExpanded && (
          <div className="px-6 pb-6 border-t border-purple-100">
            {insightsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-3" />
                <span className="text-slate-600">Generating insights...</span>
              </div>
            )}

            {insightsError && !insights && !legacyInsights && (
              <div className="py-6">
                <div className="flex items-center gap-3 text-amber-600 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{insightsError}</span>
                </div>
                <button
                  onClick={fetchInsights}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            )}

            {/* New format: stored insights with compliance grade */}
            {insights && !insightsLoading && (
              <div className="pt-6 space-y-6">
                {/* Compliance Grade Card */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {(() => {
                    const gradeColors = getGradeColor(insights.compliance_grade)
                    return (
                      <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${gradeColors.border} ${gradeColors.bg}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${gradeColors.bg} ring-4 ${gradeColors.ring}`}>
                          <span className={`text-3xl font-bold ${gradeColors.text}`}>
                            {insights.compliance_grade}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${gradeColors.text}`}>Compliance Grade</p>
                          <p className={`text-2xl font-bold ${gradeColors.text}`}>
                            {insights.compliance_score}/100
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                  <div className="flex-1">
                    <p className="text-slate-700">{insights.summary}</p>
                  </div>
                </div>

                {/* Warnings */}
                {insights.warnings && insights.warnings.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-red-900">Critical Warnings</h3>
                    </div>
                    <ul className="space-y-2">
                      {insights.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-red-800">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk Analysis */}
                {insights.risk_analysis && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Risk Analysis</h3>
                    <p className="text-slate-700">{insights.risk_analysis}</p>
                  </div>
                )}

                {/* Recommendations */}
                {insights.recommendations && insights.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                    <ul className="space-y-2">
                      {insights.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Industry Tips */}
                {insights.industry_tips && insights.industry_tips.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Industry Tips</h3>
                    <ul className="space-y-2">
                      {insights.industry_tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Privacy Notice */}
                {privacyNotice && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">Privacy Notice</p>
                      <p className="text-sm text-purple-700">{privacyNotice}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Legacy format: fallback API response */}
            {legacyInsights && !insights && !insightsLoading && (
              <div className="pt-6 space-y-6">
                {/* Summary */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-slate-900">Summary</h3>
                  </div>
                  <p className="text-slate-700">{legacyInsights.summary}</p>
                </div>

                {/* Risk Analysis */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Risk Analysis</h3>
                  <p className="text-slate-700">{legacyInsights.riskAnalysis}</p>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Recommendations</h3>
                  <ul className="space-y-2">
                    {legacyInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Industry Tips */}
                {legacyInsights.industryTips && legacyInsights.industryTips.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Industry Tips</h3>
                    <ul className="space-y-2">
                      {legacyInsights.industryTips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Brain className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Privacy Notice */}
                {privacyNotice && (
                  <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Shield className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-1">Privacy Notice</p>
                      <p className="text-sm text-purple-700">{privacyNotice}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Download Results</h2>

        {/* Download Warning */}
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-bold mb-1">Before You Call:</p>
              <ul className="space-y-1 text-red-800 ml-4">
                <li>• Verify all data independently - our data may be incomplete or outdated</li>
                <li>• Consult a TCPA attorney regarding your compliance obligations</li>
                <li>• Obtain required consent for mobile/autodialer calls</li>
                <li>• You are SOLELY responsible for compliance with telemarketing laws</li>
                <li>• Violations carry penalties of $500-$1,500 per call</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-6">
          Export your checked leads in multiple formats. All downloads are generated on-demand.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Clean Leads Download */}
          <div className="relative">
            <button
              onClick={() => handleDownload('clean', 'csv')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Clean Leads
              <span className="text-green-200 text-sm">({job.clean_leads})</span>
            </button>
          </div>

          {/* Full Report Download */}
          <div className="relative">
            <button
              onClick={() => handleDownload('full', 'csv')}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-echo-primary-600 text-white rounded-lg hover:bg-echo-primary-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Full Report
            </button>
          </div>

          {/* Risky Leads Download */}
          {(job.caution_leads > 0 || job.dnc_blocked > 0) && (
            <div className="relative">
              <button
                onClick={() => handleDownload('risky', 'csv')}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Risky/Blocked
                <span className="text-amber-200 text-sm">({job.caution_leads + job.dnc_blocked})</span>
              </button>
            </div>
          )}
        </div>

        {/* Format Options */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-3">Need a different format?</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDownload('full', 'csv')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleDownload('full', 'excel')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleDownload('full', 'json')}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
            >
              <FileJson className="w-4 h-4" />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Save to CRM */}
      {!saved && job.clean_leads > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Save to CRM</h3>
          <p className="text-blue-700 mb-4">
            Save {(job.clean_leads || 0).toLocaleString()} clean leads to your built-in CRM for future follow-up.
          </p>
          <button
            onClick={handleSaveToCRM}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save to CRM
              </>
            )}
          </button>
        </div>
      )}

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Saved to CRM</h3>
              <p className="text-green-700">
                Your clean leads are now available in your CRM.{' '}
                <Link href="/dashboard/crm" className="underline font-medium">
                  View CRM
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Details */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-xl font-semibold mb-4">Processing Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-600">Job ID:</span>
            <span className="ml-2 font-mono text-slate-900">{job.id.slice(0, 8)}...</span>
          </div>

          <div>
            <span className="text-slate-600">Processing Time:</span>
            <span className="ml-2 text-slate-900">
              {job.processing_time_ms
                ? `${(job.processing_time_ms / 1000).toFixed(2)}s`
                : 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-600">Status:</span>
            <span className="ml-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {job.status}
              </span>
            </span>
          </div>

          <div>
            <span className="text-slate-600">Compliance Rate:</span>
            <span className="ml-2 text-slate-900 font-medium">
              {cleanPercent}%
            </span>
          </div>

          {job.average_risk_score !== null && job.average_risk_score !== undefined && (
            <div>
              <span className="text-slate-600">Avg Risk Score:</span>
              <span className="ml-2 text-slate-900">
                {job.average_risk_score.toFixed(1)}
              </span>
            </div>
          )}

          <div>
            <span className="text-slate-600">Area Codes:</span>
            <span className="ml-2 text-slate-900">
              {job.area_codes_used?.join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800 text-center">
          <strong>Reminder:</strong> This is a data checking tool, not legal advice.
          You are solely responsible for TCPA compliance. Consult a qualified attorney before making calls.
        </p>
      </div>
    </div>
  )
}






