'use client'

import { useState, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import type { FtcSubscription } from '@/lib/supabase/types'
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Calendar,
  Plus,
  Minus,
  Info,
} from 'lucide-react'

type ChangeType = 'additions' | 'deletions'

interface FileUpload {
  file: File
  id: string
  isValid: boolean
  error: string | null
  hash?: string
}

interface FtcChangeListUploadProps {
  subscriptions: FtcSubscription[]
  onUploadComplete: () => void
}

export default function FtcChangeListUpload({
  subscriptions,
  onUploadComplete,
}: FtcChangeListUploadProps) {
  const [changeType, setChangeType] = useState<ChangeType>('additions')
  const [ftcFileDate, setFtcFileDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [selectedAreaCodes, setSelectedAreaCodes] = useState<string[]>([])
  const [files, setFiles] = useState<FileUpload[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createBrowserClient()

  // Generate unique ID for file tracking
  const generateId = () => Math.random().toString(36).substring(2, 15)

  // Calculate file hash (simple version using size + name + lastModified)
  const calculateHash = (file: File): string => {
    return btoa(`${file.name}-${file.size}-${file.lastModified}`).slice(0, 16)
  }

  // Validate file
  const validateFile = useCallback((file: File): FileUpload => {
    const id = generateId()
    const hash = calculateHash(file)

    // Check file extension
    const ext = file.name.toLowerCase().split('.').pop()
    if (!['csv', 'txt'].includes(ext || '')) {
      return { file, id, isValid: false, error: 'Only CSV or TXT files allowed', hash }
    }

    // Check file size (max 500MB)
    if (file.size > 500 * 1024 * 1024) {
      return { file, id, isValid: false, error: 'File exceeds 500MB limit', hash }
    }

    // Check for empty file
    if (file.size === 0) {
      return { file, id, isValid: false, error: 'File is empty', hash }
    }

    return { file, id, isValid: true, error: null, hash }
  }, [])

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles).map(validateFile)

    // Check for duplicate files
    const existingHashes = new Set(files.map(f => f.hash))
    const uniqueNewFiles = newFiles.filter(f => {
      if (existingHashes.has(f.hash)) {
        f.isValid = false
        f.error = 'Duplicate file already added'
      }
      return true
    })

    setFiles(prev => [...prev, ...uniqueNewFiles])
    setError(null)
  }, [files, validateFile])

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  // Remove a file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // Toggle area code selection
  const toggleAreaCode = useCallback((areaCode: string) => {
    setSelectedAreaCodes(prev =>
      prev.includes(areaCode)
        ? prev.filter(c => c !== areaCode)
        : [...prev, areaCode]
    )
  }, [])

  // Select all area codes
  const selectAllAreaCodes = useCallback(() => {
    setSelectedAreaCodes(subscriptions.map(s => s.area_code))
  }, [subscriptions])

  // Deselect all area codes
  const deselectAllAreaCodes = useCallback(() => {
    setSelectedAreaCodes([])
  }, [])

  // Upload files
  const handleUpload = async () => {
    const validFiles = files.filter(f => f.isValid)

    if (validFiles.length === 0) {
      setError('No valid files to upload')
      return
    }

    if (selectedAreaCodes.length === 0) {
      setError('Please select at least one area code')
      return
    }

    if (!ftcFileDate) {
      setError('Please select the FTC file date')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create ftc_change_lists record
      const { data: changeList, error: insertError } = await supabase
        .from('ftc_change_lists')
        .insert({
          change_type: changeType,
          ftc_file_date: ftcFileDate,
          area_codes: selectedAreaCodes,
          status: 'pending',
          total_records: 0,
          file_name: validFiles.map(f => f.file.name).join(', '),
          file_size_bytes: validFiles.reduce((sum, f) => sum + f.file.size, 0),
          file_hash: validFiles.map(f => f.hash).join('-'),
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Upload files to storage
      for (const fileUpload of validFiles) {
        const filePath = `ftc-change-lists/${changeList.id}/${fileUpload.file.name}`
        const { error: uploadError } = await supabase.storage
          .from('admin-uploads')
          .upload(filePath, fileUpload.file)

        if (uploadError) {
          throw new Error(`Failed to upload ${fileUpload.file.name}: ${uploadError.message}`)
        }
      }

      // Get file URL
      const { data: urlData } = supabase.storage
        .from('admin-uploads')
        .getPublicUrl(`ftc-change-lists/${changeList.id}/${validFiles[0].file.name}`)

      // Update change list with file URL
      await supabase
        .from('ftc_change_lists')
        .update({ file_url: urlData.publicUrl })
        .eq('id', changeList.id)

      // Invoke Edge Function for background processing
      const { error: fnError } = await supabase.functions.invoke('process-ftc-change-list', {
        body: {
          change_list_id: changeList.id,
          change_type: changeType,
        },
      })

      if (fnError) {
        console.warn('Edge function may be processing in background:', fnError)
      }

      // Reset form
      setFiles([])
      setSelectedAreaCodes([])
      onUploadComplete()

    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const validFileCount = files.filter(f => f.isValid).length
  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0)

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-lg font-semibold text-white">Upload FTC Change List</h2>
        <p className="text-sm text-slate-400 mt-1">
          Import daily additions or deletions from the FTC Do Not Call registry
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Change Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Change Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setChangeType('additions')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                changeType === 'additions'
                  ? 'border-green-500 bg-green-500/10 text-green-400'
                  : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                changeType === 'additions' ? 'bg-green-500/20' : 'bg-slate-600'
              }`}>
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Additions</p>
                <p className="text-xs opacity-75">Numbers added to DNC</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setChangeType('deletions')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                changeType === 'deletions'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                  : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                changeType === 'deletions' ? 'bg-amber-500/20' : 'bg-slate-600'
              }`}>
                <Minus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Deletions</p>
                <p className="text-xs opacity-75">Numbers removed from DNC</p>
              </div>
            </button>
          </div>
        </div>

        {/* Deletions Info Banner */}
        {changeType === 'deletions' && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200">
              <p className="font-medium">Deletion Processing</p>
              <p className="opacity-90 mt-1">
                Deleted numbers will be moved to 90-day tracking for AI pattern detection.
                Numbers with multiple add/remove cycles will be flagged as suspicious.
              </p>
            </div>
          </div>
        )}

        {/* FTC File Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            FTC File Date
          </label>
          <div className="relative max-w-xs">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              value={ftcFileDate}
              onChange={(e) => setFtcFileDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Date the FTC published this change list
          </p>
        </div>

        {/* Area Code Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">
              Area Codes Included
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllAreaCodes}
                className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={deselectAllAreaCodes}
                className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => {
              const isSelected = selectedAreaCodes.includes(sub.area_code)
              const isExpired = new Date(sub.expires_at) < new Date()

              return (
                <button
                  key={sub.area_code}
                  type="button"
                  onClick={() => !isExpired && toggleAreaCode(sub.area_code)}
                  disabled={isExpired}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isExpired
                      ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      : isSelected
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {sub.area_code}
                  {isExpired && <span className="ml-1 text-xs">(expired)</span>}
                </button>
              )
            })}
            {subscriptions.length === 0 && (
              <p className="text-sm text-slate-500">No active FTC subscriptions</p>
            )}
          </div>
          {selectedAreaCodes.length > 0 && (
            <p className="text-xs text-teal-400 mt-2">
              {selectedAreaCodes.length} area code{selectedAreaCodes.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {/* File Drop Zone */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Upload Files
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              dragOver
                ? 'border-teal-500 bg-teal-500/10'
                : 'border-slate-600 hover:border-teal-500 hover:bg-slate-700/50'
            }`}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                dragOver ? 'bg-teal-500/20' : 'bg-slate-700'
              }`}>
                <Upload className={`w-6 h-6 ${dragOver ? 'text-teal-400' : 'text-slate-500'}`} />
              </div>
              <p className="text-sm text-slate-400">
                <span className="font-semibold text-white">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                CSV or TXT files, max 500MB each
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.txt"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-300">
                Selected Files ({validFileCount} valid)
              </h3>
              <span className="text-xs text-slate-500">
                Total: {(totalSize / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((fileUpload) => (
                <div
                  key={fileUpload.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    fileUpload.isValid
                      ? 'bg-slate-700/50 border border-slate-600'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      fileUpload.isValid ? 'bg-slate-600' : 'bg-red-500/20'
                    }`}>
                      <FileText className={`w-4 h-4 ${fileUpload.isValid ? 'text-teal-400' : 'text-red-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{fileUpload.file.name}</p>
                      <p className="text-xs text-slate-400">
                        {(fileUpload.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {fileUpload.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 max-w-32 truncate">{fileUpload.error}</span>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(fileUpload.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || validFileCount === 0 || selectedAreaCodes.length === 0}
          className="w-full py-3.5 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 disabled:shadow-none"
        >
          {uploading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing Upload...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload {changeType === 'additions' ? 'Additions' : 'Deletions'} ({validFileCount} file{validFileCount !== 1 ? 's' : ''})
            </>
          )}
        </button>
      </div>
    </div>
  )
}
