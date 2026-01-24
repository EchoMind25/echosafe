'use client'

import { useCallback, useState } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { Upload, FileText, AlertCircle, X } from 'lucide-react'
import {
  MAX_FILE_SIZE,
  formatFileSize,
  validateFile,
} from '@/lib/utils/file-parser'

// ============================================================================
// TYPES
// ============================================================================

export interface DropzoneProps {
  /** Callback when a file is selected */
  onFileSelect: (file: File) => void
  /** Callback when file is cleared */
  onFileClear?: () => void
  /** Whether the dropzone is disabled */
  disabled?: boolean
  /** Currently selected file (controlled) */
  selectedFile?: File | null
  /** Error message to display */
  error?: string | null
  /** Whether file is being processed */
  isProcessing?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileDropzone({
  onFileSelect,
  onFileClear,
  disabled = false,
  selectedFile = null,
  error = null,
  isProcessing = false,
}: DropzoneProps) {
  const [dropError, setDropError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setDropError(null)

      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        const errorCode = rejection.errors[0]?.code

        switch (errorCode) {
          case 'file-too-large':
            setDropError(`File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`)
            break
          case 'file-invalid-type':
            setDropError('File format not supported. Please upload CSV or Excel files.')
            break
          default:
            setDropError('Invalid file. Please try again.')
        }
        return
      }

      // Handle accepted files
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]

        // Additional validation
        const validation = validateFile(file)
        if (!validation.valid) {
          setDropError(validation.error || 'Invalid file')
          return
        }

        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled: disabled || isProcessing,
  })

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDropError(null)
    onFileClear?.()
  }

  const displayError = error || dropError

  // ============================================================================
  // RENDER - File Selected State
  // ============================================================================

  if (selectedFile && !displayError) {
    return (
      <div className="border-2 border-dashed border-echo-primary-300 bg-echo-primary-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-echo-primary-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-echo-primary-600" />
            </div>
            <div>
              <p className="font-medium text-echo-neutral-900">{selectedFile.name}</p>
              <p className="text-sm text-echo-neutral-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          {!isProcessing && (
            <button
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-echo-primary-100 text-echo-neutral-500 hover:text-echo-neutral-700 transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 text-echo-primary-600">
              <div className="w-5 h-5 border-2 border-echo-primary-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER - Error State
  // ============================================================================

  if (displayError) {
    return (
      <div className="border-2 border-dashed border-red-300 bg-red-50 rounded-xl p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-red-700 font-medium mb-2">Upload Error</p>
          <p className="text-red-600 text-sm mb-4">{displayError}</p>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-white border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER - Default/Drag States
  // ============================================================================

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-xl p-8 md:p-12
        transition-all duration-200 cursor-pointer
        ${
          isDragActive && !isDragReject
            ? 'border-echo-primary-500 bg-echo-primary-50 scale-[1.02]'
            : isDragReject
            ? 'border-red-400 bg-red-50'
            : 'border-echo-neutral-300 hover:border-echo-primary-400 hover:bg-echo-neutral-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-4
          ${
            isDragActive && !isDragReject
              ? 'bg-echo-primary-100'
              : isDragReject
              ? 'bg-red-100'
              : 'bg-echo-neutral-100'
          }
        `}
        >
          <Upload
            className={`
            w-8 h-8
            ${
              isDragActive && !isDragReject
                ? 'text-echo-primary-600'
                : isDragReject
                ? 'text-red-600'
                : 'text-echo-neutral-400'
            }
          `}
          />
        </div>

        {/* Text */}
        {isDragActive && !isDragReject ? (
          <>
            <p className="text-lg font-medium text-echo-primary-700 mb-1">Drop file here</p>
            <p className="text-sm text-echo-primary-500">Release to upload</p>
          </>
        ) : isDragReject ? (
          <>
            <p className="text-lg font-medium text-red-700 mb-1">Invalid file type</p>
            <p className="text-sm text-red-500">Please use CSV or Excel files</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium text-echo-neutral-700 mb-1">
              Drag and drop your file here
            </p>
            <p className="text-sm text-echo-neutral-500 mb-4">or click to browse</p>

            {/* Accepted formats */}
            <div className="flex flex-wrap justify-center gap-2">
              {['.csv', '.xlsx', '.xls', '.txt'].map((ext) => (
                <span
                  key={ext}
                  className="px-3 py-1 bg-echo-neutral-100 text-echo-neutral-600 text-xs font-medium rounded-full"
                >
                  {ext}
                </span>
              ))}
            </div>

            {/* Max size */}
            <p className="text-xs text-echo-neutral-400 mt-4">
              Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FileDropzone
