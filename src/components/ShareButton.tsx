'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { shareEchoSafe, copyShareLink, type ShareContext } from '@/lib/utils/share'

interface ShareButtonProps {
  context?: ShareContext
  variant?: 'primary' | 'secondary'
  className?: string
}

export function ShareButton({ context = 'pricing', variant = 'primary', className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    if (isSharing) return

    setIsSharing(true)
    const shared = await shareEchoSafe(context)

    // If native share wasn't used, show copied feedback
    if (!shared || !navigator.share) {
      const success = await copyShareLink(context)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    }

    setIsSharing(false)
  }

  const baseClasses = "px-6 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
  const variantClasses = variant === 'primary'
    ? "bg-teal-500 hover:bg-teal-600 text-white"
    : "bg-white hover:bg-gray-50 text-teal-600 border-2 border-teal-500"

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`${baseClasses} ${variantClasses} ${className}`}
      aria-label="Share Echo Safe with colleagues"
    >
      {copied ? (
        <>
          <Check className="w-5 h-5" />
          Link Copied!
        </>
      ) : (
        <>
          <Share2 className="w-5 h-5" />
          Share with Your Network
        </>
      )}
    </button>
  )
}

interface CopyLinkButtonProps {
  userId?: string
  className?: string
}

export function CopyLinkButton({ userId, className = '' }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      const { copyReferralLink } = await import('@/lib/utils/share')
      await copyReferralLink(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 bg-white text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 flex items-center gap-2 transition-colors ${className}`}
      aria-label="Copy referral link"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          Copy Link
        </>
      )}
    </button>
  )
}
