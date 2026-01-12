'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Eye,
  Calendar,
} from 'lucide-react'

interface FtcSubscription {
  id: string
  area_code: string
  state: string
  subscription_status: string
  expires_at: string
}

interface AdminUpload {
  id: string
  area_codes: string[]
  total_files: number
  total_records: number
  status: string
  progress: Record<string, number>
  error_message: string | null
  ftc_release_date: string | null
  created_at: string
  completed_at: string | null
}

interface FileUpload {
  file: File
  areaCode: string | null
  isValid: boolean
  error: string | null
}

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState<AdminUpload[]>([])
  const [subscriptions, setSubscriptions] = useState<FtcSubscription[]>([])
  const [files, setFiles] = useState<FileUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [ftcReleaseDate, setFtcReleaseDate] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient()

  // Fetch uploads and subscriptions
  const fetchData = useCallback(async () => {
    const [uploadsRes, subsRes] = await Promise.all([
      supabase
        .from('admin_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('ftc_subscriptions')
        .select('*')
        .eq('subscription_status', 'active')
        .order('area_code', { ascending: true }),
    ])

    if (uploadsRes.data) setUploads(uploadsRes.data)
    if (subsRes.data) setSubscriptions(subsRes.data)
  }, [supabase])

  useEffect(() => {
    fetchData()

    // Poll for updates every 2 seconds when there are processing uploads
    const interval = setInterval(() => {
      const hasProcessing = uploads.some(u => u.status === 'processing')
      if (hasProcessing) {
        fetchData()
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [fetchData, uploads])

  // Extract area code from filename (format: ftc_801_*.csv)
  const extractAreaCode = (filename: string): string | null => {
    const match = filename.match(/ftc_(\d{3})_/i) || filename.match(/^(\d{3})\.csv$/i)
    return match ? match[1] : null
  }

  // Validate file against subscriptions
  const validateFile = (file: File): FileUpload => {
    const areaCode = extractAreaCode(file.name)

    if (!areaCode) {
      return {
        file,
        areaCode: null,
        isValid: false,
        error: 'Cannot extract area code from filename. Use format: ftc_XXX_data.csv',
      }
    }

    const subscription = subscriptions.find(s => s.area_code === areaCode)

    if (!subscription) {
      return {
        file,
        areaCode,
        isValid: false,
        error: `No active FTC subscription for area code ${areaCode}`,
      }
    }

    if (new Date(subscription.expires_at) < new Date()) {
      return {
        file,
        areaCode,
        isValid: false,
        error: `FTC subscription for ${areaCode} has expired`,
      }
    }

    if (file.size > 500 * 1024 * 1024) {
      return {
        file,
        areaCode,
        isValid: false,
        error: 'File exceeds 500MB limit',
      }
    }

    if (!file.name.endsWith('.csv')) {
      return {
        file,
        areaCode,
        isValid: false,
        error: 'Only CSV files are allowed',
      }
    }

    return {
      file,
      areaCode,
      isValid: true,
      error: null,
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validatedFiles = selectedFiles.map(validateFile)
    setFiles(validatedFiles)
    setError(null)
  }

  // Remove a file from the list
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Upload files and start processing
  const handleUpload = async () => {
    const validFiles = files.filter(f => f.isValid)

    if (validFiles.length === 0) {
      setError('No valid files to upload')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Create admin_upload record
      const areaCodes = [...new Set(validFiles.map(f => f.areaCode!))]
      const { data: upload, error: insertError } = await supabase
        .from('admin_uploads')
        .insert({
          area_codes: areaCodes,
          total_files: validFiles.length,
          status: 'uploading',
          ftc_release_date: ftcReleaseDate || null,
          notify_email: notifyEmail || null,
          notify_on_complete: !!notifyEmail,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload files to storage
      for (const fileUpload of validFiles) {
        const filePath = `${upload.id}/ftc_${fileUpload.areaCode}_data.csv`
        const { error: uploadError } = await supabase.storage
          .from('admin-uploads')
          .upload(filePath, fileUpload.file)

        if (uploadError) {
          throw new Error(`Failed to upload ${fileUpload.file.name}: ${uploadError.message}`)
        }
      }

      // Invoke Edge Function
      const { error: fnError } = await supabase.functions.invoke('bulk-dnc-upload', {
        body: {
          admin_upload_id: upload.id,
          ftc_release_date: ftcReleaseDate || null,
        },
      })

      if (fnError) {
        console.error('Edge function error:', fnError)
        // Don't throw - function may be running in background
      }

      // Reset form
      setFiles([])
      setFtcReleaseDate('')
      setNotifyEmail('')
      fetchData()

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
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
      case 'uploading':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-amber-500/20 text-amber-400">
            <Upload className="w-3 h-3" />
            Uploading
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

  // Calculate overall progress
  const getOverallProgress = (upload: AdminUpload): number => {
    if (!upload.progress || Object.keys(upload.progress).length === 0) return 0
    const values = Object.values(upload.progress)
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Bulk DNC Upload</h1>
        <p className="text-slate-400 mt-1">
          Import FTC Do Not Call registry files with compliance tracking
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload FTC Files</h2>

        {/* File Drop Zone */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-teal-500 hover:bg-slate-700/50 transition-colors"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <p className="mb-2 text-sm text-slate-400">
                <span className="font-semibold text-white">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                CSV files only, max 500MB each. Format: ftc_XXX_data.csv
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".csv"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-6 space-y-2">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Selected Files</h3>
            {files.map((fileUpload, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  fileUpload.isValid ? 'bg-slate-700' : 'bg-red-500/10 border border-red-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className={`w-5 h-5 ${fileUpload.isValid ? 'text-teal-400' : 'text-red-400'}`} />
                  <div>
                    <p className="text-sm text-white">{fileUpload.file.name}</p>
                    <p className="text-xs text-slate-400">
                      {fileUpload.areaCode ? `Area Code: ${fileUpload.areaCode}` : 'Unknown area code'}
                      {' - '}
                      {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {fileUpload.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400">{fileUpload.error}</span>
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              FTC Release Date (optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={ftcReleaseDate}
                onChange={(e) => setFtcReleaseDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notify on Complete (optional)
            </label>
            <input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleUpload}
          disabled={uploading || files.filter(f => f.isValid).length === 0}
          className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Start Upload ({files.filter(f => f.isValid).length} files)
            </>
          )}
        </button>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Active FTC Subscriptions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-slate-700 rounded-lg p-3 text-center"
            >
              <p className="text-xl font-bold text-white">{sub.area_code}</p>
              <p className="text-xs text-slate-400">{sub.state}</p>
              <p className="text-xs text-green-400 mt-1">Active</p>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <p className="text-slate-400 col-span-full text-center py-4">
              No active FTC subscriptions found
            </p>
          )}
        </div>
      </div>

      {/* Upload History */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Upload History</h2>
          <button
            onClick={fetchData}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Area Codes</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Records</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Progress</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {uploads.map((upload) => (
                <tr key={upload.id} className="hover:bg-slate-700/50">
                  <td className="py-3 px-4">
                    <p className="text-sm text-white">
                      {new Date(upload.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(upload.created_at).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {upload.area_codes.map((code) => (
                        <span
                          key={code}
                          className="px-2 py-0.5 bg-slate-600 rounded text-xs text-white"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-sm text-white">{upload.total_records.toLocaleString()}</p>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-32">
                      <div className="h-2 bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 transition-all duration-300"
                          style={{ width: `${getOverallProgress(upload)}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {getOverallProgress(upload)}%
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(upload.status)}</td>
                  <td className="py-3 px-4">
                    <button
                      className="text-slate-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {uploads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No uploads yet
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
