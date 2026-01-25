/**
 * Echo Safe - Social Sharing Utilities
 * Privacy-compliant sharing functionality for industry professional referrals
 */

export type ShareContext = 'pricing' | 'dashboard' | 'results'

interface ShareData {
  title: string
  text: string
  url: string
}

/**
 * Share Echo Safe using the native Web Share API or clipboard fallback
 */
export async function shareEchoSafe(context: ShareContext = 'pricing'): Promise<boolean> {
  const shareData: ShareData = {
    title: 'Echo Safe - Privacy-First DNC Compliance',
    text: 'I found a DNC scrubbing service that actually respects privacy. No tracking, unlimited scrubbing, $47/month. Check it out:',
    url: `https://echosafe.app/pricing?ref=share&ctx=${context}`
  }

  // Check if Web Share API is available and can share this data
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
      // Track share event (privacy-compliant via Plausible)
      trackShareEvent(context, 'native')
      return true
    } catch (err) {
      // User cancelled or share failed - fall through to clipboard
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  // Fallback: Copy to clipboard
  return copyShareLink(context)
}

/**
 * Copy share link to clipboard
 */
export async function copyShareLink(context: ShareContext = 'pricing'): Promise<boolean> {
  const text = `I found a DNC scrubbing service that actually respects privacy. No tracking, unlimited scrubbing, $47/month. Check it out: https://echosafe.app/pricing?ref=share&ctx=${context}`

  try {
    await navigator.clipboard.writeText(text)
    trackShareEvent(context, 'clipboard')
    return true
  } catch (err) {
    console.error('Clipboard write failed:', err)
    return false
  }
}

/**
 * Generate a referral link for the user
 */
export function generateReferralLink(userId?: string): string {
  const ref = userId ? userId.substring(0, 8) : 'user'
  return `https://echosafe.app/pricing?ref=${ref}`
}

/**
 * Copy referral link to clipboard
 */
export async function copyReferralLink(userId?: string): Promise<string> {
  const referralUrl = generateReferralLink(userId)
  await navigator.clipboard.writeText(referralUrl)
  return referralUrl
}

/**
 * Generate email signature template
 */
export function getEmailSignatureTemplate(userId?: string): string {
  const referralUrl = generateReferralLink(userId)
  return `---
Stay TCPA compliant with Echo Safe
Privacy-first DNC scrubbing | $47/month unlimited
No tracking. No hidden fees.
${referralUrl}`
}

/**
 * Track share events via Plausible (privacy-compliant)
 */
function trackShareEvent(context: ShareContext, method: 'native' | 'clipboard'): void {
  // Only track if Plausible is available
  if (typeof window !== 'undefined' && (window as unknown as { plausible?: (event: string, options?: { props: Record<string, string> }) => void }).plausible) {
    (window as unknown as { plausible: (event: string, options?: { props: Record<string, string> }) => void }).plausible('Share', {
      props: { context, method }
    })
  }
}
