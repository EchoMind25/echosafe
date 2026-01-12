import { AlertCircle, X } from 'lucide-react'

export interface ErrorMessageProps {
  message: string | null
  onDismiss?: () => void
  className?: string
  variant?: 'error' | 'warning' | 'info'
}

const variantStyles = {
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    text: 'text-red-700',
    dismiss: 'text-red-400 hover:text-red-600',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    text: 'text-amber-700',
    dismiss: 'text-amber-400 hover:text-amber-600',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    text: 'text-blue-700',
    dismiss: 'text-blue-400 hover:text-blue-600',
  },
}

/**
 * Reusable error/warning/info message component
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   message={error}
 *   onDismiss={() => setError(null)}
 * />
 * ```
 */
export function ErrorMessage({
  message,
  onDismiss,
  className = '',
  variant = 'error',
}: ErrorMessageProps) {
  if (!message) return null

  const styles = variantStyles[variant]

  return (
    <div
      role="alert"
      className={`
        p-4 rounded-lg border
        flex items-start gap-3
        animate-fade-in
        ${styles.container}
        ${className}
      `}
    >
      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
      <p className={`text-sm flex-1 ${styles.text}`}>{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={`
            flex-shrink-0 p-1 rounded
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
            ${styles.dismiss}
          `}
          aria-label="Dismiss message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/**
 * Inline field error message for form validation
 */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null

  return (
    <p className="text-xs text-red-500 mt-1" role="alert">
      {message}
    </p>
  )
}
