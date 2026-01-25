# ECHO SAFE - PRODUCTION DEPLOYMENT EXECUTION
**Target:** Claude Opus 4.5 | **Date:** January 25, 2026 | **Priority:** CRITICAL

---

## MISSION STATEMENT

Execute a comprehensive site optimization focusing on brand consistency, SEO excellence, performance optimization, and human-touched UX. You are the lead engineer responsible for shipping production-ready code that matches Echo Safe's privacy-first brand while driving conversions through industry professional sharing.

---

## PROJECT CONTEXT

### Current State (Critical Updates)
- **Site Name:** Echo Safe (formerly Echo Mind Compliance)
- **Domain:** echosafe.app
- **Trial Structure:** 7-day trial, 1,000 leads OR 5 uploads max, credit card required upfront
- **Pricing:** Single Professional tier at $47/month, includes 5 area codes (Utah: 801, 385, 435 + 2 additional user-selected)
- **Expansion Model:** Contribution-based system HIDDEN for MVP; waitlist system for new area code requests
- **Recent Fixes:** upload_history table created, N8N webhook integration functional, authentication working

### Reference Documents
Read these IN ORDER before executing:
1. `/mnt/project/CORE_PRD.md` - Product requirements (UPDATE brand name references)
2. `/mnt/project/CORE_REFERENCE.md` - Privacy principles, competitive moat
3. `/mnt/project/DATABASE.md` - Schema, current state post-fixes
4. `/mnt/project/TECH_ARCHITECTURE.md` - Stack, deployment, N8N workflow
5. `/mnt/project/UI_GUIDELINES.md` - Design system, brand voice
6. `/mnt/project/production-audit.md` - Quality checklist

### Brand Assets
**Logo File:** `public/images/Logo Echo Mind Automation with White Contrast.png`
- Use for: Main logo in header/footer
- Use for: Favicon generation (create multiple sizes)
- Verify file exists; if not, flag immediately

---

## EXECUTION OBJECTIVES

### 1. BRANDING CONSISTENCY (HIGHEST PRIORITY)

**Task:** Update all brand references from "Echo Mind Compliance" to "Echo Safe"

**Files to Update:**
```bash
# Critical UI files
src/app/layout.tsx                    # Update <title>, metadata
src/components/Header.tsx             # Logo alt text, site name
src/components/Footer.tsx             # Copyright, branding
src/app/page.tsx                      # Landing page hero, copy
src/app/(dashboard)/layout.tsx        # Dashboard branding
src/app/pricing/page.tsx              # Pricing page metadata, copy

# Configuration files
package.json                          # name, description
public/manifest.json                  # name, short_name
public/robots.txt                     # Verify domain
next.config.js                        # Any brand references
.env.example                          # Update NEXT_PUBLIC_APP_NAME

# Documentation (update references but keep filenames)
README.md                             # Project title, description
```

**Logo Implementation:**
```tsx
// src/components/Header.tsx
import Image from 'next/image'

<Link href="/" className="flex items-center gap-2">
  <Image 
    src="/images/Logo Echo Mind Automation with White Contrast.png"
    alt="Echo Safe - Privacy-First DNC Compliance"
    width={40}
    height={40}
    priority
  />
  <span className="text-xl font-semibold text-gray-900">Echo Safe</span>
</Link>
```

**Favicon Generation:**
```bash
# Generate from logo file
# Required sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 180x180, 192x192, 512x512

# Create these files in public/
favicon.ico                           # 32x32, 16x16 multi-resolution
apple-touch-icon.png                  # 180x180
favicon-16x16.png
favicon-32x32.png
android-chrome-192x192.png
android-chrome-512x512.png

# Update in layout.tsx
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

**Validation Checklist:**
- [ ] No instances of "Echo Mind Compliance" in user-facing text
- [ ] Logo renders correctly on white and colored backgrounds
- [ ] Favicon displays in browser tab
- [ ] Apple touch icon works on iOS home screen
- [ ] Brand name consistent in metadata, emails, error messages

---

### 2. TEXT SELECTION STYLING (BRAND ALIGNMENT)

**Objective:** Custom text selection highlighting that matches Echo Safe teal brand identity.

**Implementation:**
```css
/* Add to src/app/globals.css */

/* Custom Text Selection - Echo Safe Teal */
::selection {
  background-color: rgba(20, 184, 166, 0.25); /* teal-500 at 25% opacity */
  color: #0f172a; /* gray-900 for maximum readability */
}

::-moz-selection {
  background-color: rgba(20, 184, 166, 0.25);
  color: #0f172a;
}

/* Enhanced selection for code blocks and pre elements */
pre::selection,
code::selection {
  background-color: rgba(20, 184, 166, 0.3); /* Slightly stronger for code */
  color: #0f172a;
}

pre::-moz-selection,
code::-moz-selection {
  background-color: rgba(20, 184, 166, 0.3);
  color: #0f172a;
}

/* Selection in dark mode areas (if applicable) */
.dark ::selection {
  background-color: rgba(20, 184, 166, 0.4);
  color: #f1f5f9; /* gray-100 for dark backgrounds */
}

.dark ::-moz-selection {
  background-color: rgba(20, 184, 166, 0.4);
  color: #f1f5f9;
}
```

**Testing Requirements:**
- Test selection on: Landing page hero, pricing tables, dashboard text, CRM table data
- Verify contrast ratio: Text must remain readable when selected
- Check on: Chrome, Firefox, Safari (desktop and mobile)
- Ensure no conflicts with existing Tailwind utilities

---

### 3. PRICING PAGE SEO OPTIMIZATION (CRITICAL FOR CONVERSIONS)

**File:** `src/app/pricing/page.tsx`

**Current Issues:**
- Generic metadata (if any)
- Header "Pricing" button may link to wrong page
- Missing schema markup for pricing
- No social sharing optimization

**Required Changes:**

#### A. Metadata Export (Top Priority)
```typescript
// src/app/pricing/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing - Echo Safe | Privacy-First DNC Scrubbing from $47/month',
  description: 'Transparent pricing for DNC compliance. $47/month unlimited scrubbing, 5 area codes, built-in CRM. No tracking, no hidden fees. 7-day trial with 1,000 leads.',
  keywords: [
    'DNC scrubbing pricing',
    'TCPA compliance cost',
    'real estate lead scrubbing',
    'privacy-first lead tools',
    'affordable DNC check',
    'unlimited lead scrubbing',
    'no tracking lead service'
  ],
  openGraph: {
    title: 'Transparent Pricing - Echo Safe',
    description: 'Privacy-first DNC scrubbing. $47/month unlimited. No tracking. No hidden fees.',
    url: 'https://echosafe.app/pricing',
    siteName: 'Echo Safe',
    type: 'website',
    images: [
      {
        url: 'https://echosafe.app/og-pricing.png', // TODO: Create this image
        width: 1200,
        height: 630,
        alt: 'Echo Safe Pricing - $47/month unlimited DNC scrubbing',
        type: 'image/png'
      }
    ],
    locale: 'en_US'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echo Safe Pricing - Privacy-First DNC Compliance',
    description: '$47/month unlimited scrubbing. No tracking. 7-day trial.',
    images: ['https://echosafe.app/og-pricing.png'],
    creator: '@echosafe' // Update if Twitter handle exists
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },
  alternates: {
    canonical: 'https://echosafe.app/pricing'
  },
  other: {
    'price:amount': '47.00',
    'price:currency': 'USD'
  }
}
```

#### B. Structured Data (JSON-LD Schema)
```tsx
// Add this component to pricing page
function PricingSchema() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Echo Safe Professional Plan",
    "description": "Privacy-first DNC lead scrubbing service with unlimited processing, 5 area codes, built-in CRM, and AI-powered compliance insights.",
    "brand": {
      "@type": "Brand",
      "name": "Echo Safe"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://echosafe.app/pricing",
      "priceCurrency": "USD",
      "price": "47.00",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Echo Safe"
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "returnPolicyCategory": "https://schema.org/MerchantReturnUnlimitedWindow",
        "refundType": "FullRefund",
        "returnFees": "FreeReturn"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "12" // Update with actual count
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  )
}

// Include in pricing page
export default function PricingPage() {
  return (
    <>
      <PricingSchema />
      {/* Rest of page content */}
    </>
  )
}
```

#### C. On-Page SEO Elements
```tsx
// Update pricing page content structure

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Optimized for SEO */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Transparent Pricing for Privacy-First DNC Compliance
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            No hidden fees. No tracking. No contracts.
          </p>
          <p className="text-lg text-gray-600">
            $47/month for unlimited DNC scrubbing with complete privacy.
          </p>
        </div>
      </section>

      {/* Pricing Card with proper semantic HTML */}
      <section aria-labelledby="pricing-plans" className="py-12 px-4">
        <h2 id="pricing-plans" className="text-3xl font-bold text-center mb-12">
          Simple, Honest Pricing
        </h2>
        
        {/* Pricing card component */}
        <article className="max-w-md mx-auto bg-white rounded-xl shadow-lg border-2 border-teal-500 p-8">
          <header>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Professional Plan
            </h3>
            <div className="flex items-baseline mb-4">
              <span className="text-5xl font-bold text-teal-600">$47</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
          </header>
          
          <ul className="space-y-4 mb-8" role="list">
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" /* checkmark icon */></svg>
              <span><strong>Unlimited scrubbing</strong> - No lead limits, ever</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"></svg>
              <span><strong>5 area codes included</strong> - Utah (801, 385, 435) + 2 of your choice</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"></svg>
              <span><strong>AI compliance insights</strong> - Industry-specific, real-time analysis</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"></svg>
              <span><strong>Built-in CRM</strong> - Permanent lead storage, full control</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5"></svg>
              <span><strong>Privacy guaranteed</strong> - No tracking, no profiling, no data selling</span>
            </li>
          </ul>

          <Link 
            href="/signup" 
            className="block w-full bg-teal-500 hover:bg-teal-600 text-white text-center font-semibold py-4 rounded-lg transition-colors"
          >
            Start 7-Day Trial
          </Link>
          
          <p className="text-sm text-gray-600 text-center mt-4">
            7-day trial • 1,000 leads or 5 uploads • Credit card required
          </p>
        </article>
      </section>

      {/* FAQ Section - Critical for SEO */}
      <section aria-labelledby="pricing-faq" className="py-12 px-4 bg-white">
        <h2 id="pricing-faq" className="text-3xl font-bold text-center mb-12">
          Pricing Questions
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Use proper FAQ schema */}
          <article itemScope itemType="https://schema.org/Question">
            <h3 itemProp="name" className="text-xl font-semibold text-gray-900 mb-2">
              What does "unlimited scrubbing" actually mean?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600">
                Upload and scrub as many leads as you want, as often as you want. No per-lead fees, no monthly caps, no overage charges. We mean unlimited.
              </p>
            </div>
          </article>

          <article itemScope itemType="https://schema.org/Question">
            <h3 itemProp="name" className="text-xl font-semibold text-gray-900 mb-2">
              How much does area code expansion cost?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600">
                For the MVP launch, we're including 5 area codes in the base $47/month price. Additional area codes will be available through a waitlist system - join the waitlist to request specific coverage areas.
              </p>
            </div>
          </article>

          <article itemScope itemType="https://schema.org/Question">
            <h3 itemProp="name" className="text-xl font-semibold text-gray-900 mb-2">
              Do you really not track me?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600">
                Correct. We don't use Google Analytics, Facebook Pixel, or any tracking cookies. We use Plausible Analytics (privacy-first, no cookies) for aggregate traffic stats only. We don't profile users, track conversions, or sell data. Read our <a href="/privacy" className="text-teal-600 hover:underline">privacy policy</a> for full details.
              </p>
            </div>
          </article>

          <article itemScope itemType="https://schema.org/Question">
            <h3 itemProp="name" className="text-xl font-semibold text-gray-900 mb-2">
              What's included in the 7-day trial?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600">
                Full access to all features: scrub up to 1,000 leads OR 5 upload batches (whichever comes first), AI insights, built-in CRM, integrations. Credit card required upfront but you won't be charged until day 8. Cancel anytime before then, zero charge.
              </p>
            </div>
          </article>

          <article itemScope itemType="https://schema.org/Question">
            <h3 itemProp="name" className="text-xl font-semibold text-gray-900 mb-2">
              Can I cancel anytime?
            </h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text" className="text-gray-600">
                Yes. Cancel anytime from your settings. Your data stays safe for 60 days after cancellation, then it's permanently deleted. You can export everything before canceling.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-12 px-4 bg-teal-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Trusted by Industry Professionals
          </h2>
          
          {/* Share CTA */}
          <div className="bg-white rounded-xl p-8 shadow-md">
            <p className="text-lg text-gray-700 mb-6">
              Know a real estate agent, solar pro, or insurance agent who needs TCPA compliance?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => {/* Share functionality */}}
                className="px-6 py-3 bg-teal-500 text-white font-semibold rounded-lg hover:bg-teal-600"
              >
                Share Echo Safe
              </button>
              <button 
                onClick={() => {/* Copy link */}}
                className="px-6 py-3 bg-white text-teal-600 font-semibold border-2 border-teal-500 rounded-lg hover:bg-teal-50"
              >
                Copy Referral Link
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">$0</div>
              <div className="text-gray-600">Hidden Fees</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">0</div>
              <div className="text-gray-600">User Tracking</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-600 mb-2">100%</div>
              <div className="text-gray-600">Data Ownership</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

#### D. Header Navigation Fix
```tsx
// src/components/Header.tsx or Navigation.tsx
// Ensure pricing button links to /pricing (not /pricing-calculator or elsewhere)

<Link 
  href="/pricing" 
  className="text-gray-600 hover:text-gray-900 font-medium"
>
  Pricing
</Link>
```

**Validation:**
- [ ] Pricing link in header points to `/pricing`
- [ ] All pricing page metadata filled correctly
- [ ] Structured data validates at https://validator.schema.org/
- [ ] OpenGraph preview looks correct at https://www.opengraph.xyz/
- [ ] Mobile responsive on all sections
- [ ] Share buttons functional
- [ ] FAQ schema implemented

---

### 4. SOCIAL SHARING & VIRAL MECHANISMS

**Objective:** Make it effortless for industry professionals to share Echo Safe with peers.

#### A. Native Share API Implementation
```typescript
// src/lib/utils/shareUtils.ts

export async function shareEchoSafe(context: 'pricing' | 'dashboard' | 'results' = 'pricing') {
  const shareData = {
    title: 'Echo Safe - Privacy-First DNC Compliance',
    text: 'I found a DNC scrubbing service that actually respects privacy. No tracking, unlimited scrubbing, $47/month. Check it out:',
    url: 'https://echosafe.app/pricing?ref=share'
  }

  if (navigator.share && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData)
      // Track share (privacy-compliant way)
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, method: 'native' })
      })
    } catch (err) {
      console.log('Share cancelled or failed')
    }
  } else {
    // Fallback: Copy to clipboard
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
    // Show toast: "Link copied!"
  }
}

export async function copyReferralLink(userId: string) {
  const referralUrl = `https://echosafe.app/pricing?ref=${userId}`
  await navigator.clipboard.writeText(referralUrl)
  return referralUrl
}
```

#### B. Share Button Component
```tsx
// src/components/ShareButton.tsx

'use client'

import { useState } from 'react'
import { Share2, Copy, Check } from 'lucide-react'
import { shareEchoSafe } from '@/lib/utils/shareUtils'

interface ShareButtonProps {
  context?: 'pricing' | 'dashboard' | 'results'
  variant?: 'primary' | 'secondary'
}

export function ShareButton({ context = 'pricing', variant = 'primary' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    await shareEchoSafe(context)
  }

  const baseClasses = "px-6 py-3 font-semibold rounded-lg transition-all flex items-center gap-2"
  const variantClasses = variant === 'primary' 
    ? "bg-teal-500 hover:bg-teal-600 text-white"
    : "bg-white hover:bg-gray-50 text-teal-600 border-2 border-teal-500"

  return (
    <button 
      onClick={handleShare}
      className={`${baseClasses} ${variantClasses}`}
      aria-label="Share Echo Safe with colleagues"
    >
      <Share2 className="w-5 h-5" />
      Share with Your Network
    </button>
  )
}
```

#### C. Dashboard Share Widget
```tsx
// Add to src/app/(dashboard)/dashboard/page.tsx

<div className="bg-gradient-to-br from-purple-50 to-teal-50 rounded-xl p-6 border border-teal-200">
  <div className="flex items-start gap-4">
    <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
      <Users className="w-6 h-6 text-white" />
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Love Echo Safe? Share with Industry Peers
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Help other real estate agents, solar pros, and insurance agents discover privacy-first DNC compliance.
      </p>
      <div className="flex gap-3">
        <ShareButton context="dashboard" variant="primary" />
        <button 
          onClick={async () => {
            const userId = 'user_id_here' // Get from auth context
            await copyReferralLink(userId)
            // Show success toast
          }}
          className="px-4 py-2 bg-white text-teal-600 border border-teal-300 rounded-lg hover:bg-teal-50 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Copy Link
        </button>
      </div>
    </div>
  </div>
</div>
```

#### D. Email Signature Template
```tsx
// src/app/(dashboard)/settings/page.tsx - Add to settings

<section className="bg-white rounded-xl p-6">
  <h3 className="text-xl font-semibold text-gray-900 mb-4">
    Email Signature Template
  </h3>
  <p className="text-gray-600 mb-4">
    Copy this to your email signature to share Echo Safe with every message:
  </p>
  
  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm">
    <pre className="whitespace-pre-wrap">
{`---
Stay TCPA compliant with Echo Safe
Privacy-first DNC scrubbing | $47/month unlimited
No tracking. No hidden fees.
https://echosafe.app/pricing?ref=${userId}`}
    </pre>
  </div>
  
  <button 
    onClick={() => {/* Copy to clipboard */}}
    className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
  >
    Copy Signature
  </button>
</section>
```

---

### 5. CODEBASE CONSISTENCY AUDIT

**Objective:** Eliminate ALL contradicting information across codebase.

#### A. Critical Consistency Checks

**Brand Name:**
```bash
# Run these searches and replace ALL instances

# Find old brand name
grep -r "Echo Mind Compliance" src/
grep -r "Echo Mind" src/ --exclude-dir=node_modules
grep -r "echomindcompliance" src/

# Replace with Echo Safe
# Files that MUST be updated:
- src/app/layout.tsx
- src/components/Header.tsx
- src/components/Footer.tsx
- package.json
- public/manifest.json
- All email templates in src/lib/email/
```

**Trial Structure:**
```typescript
// Verify these constants exist and are correct
// src/lib/constants.ts or src/config/pricing.ts

export const TRIAL_CONFIG = {
  duration: 7, // days
  maxLeads: 1000,
  maxUploads: 5,
  requiresCreditCard: true
} as const

export const PRICING_CONFIG = {
  professional: {
    monthlyPrice: 47,
    currency: 'USD',
    includedAreaCodes: 5,
    features: [
      'Unlimited scrubbing',
      '5 area codes',
      'AI compliance insights',
      'Built-in CRM',
      'Privacy guaranteed'
    ]
  }
} as const
```

**Check for conflicting copy:**
```bash
# Search for old trial language
grep -r "14-day" src/
grep -r "14 day" src/
grep -r "free trial" src/ | grep -v "7-day"

# Search for old pricing
grep -r "\$27" src/  # Old conference pricing
grep -r "\$24" src/  # Old Utah's Elite pricing
grep -r "contribution" src/  # Old expansion model

# Search for wrong domain
grep -r "echocompli.com" src/
grep -r "echomindcompliance.com" src/
```

#### B. Update All User-Facing Copy

**Files to Audit for Consistency:**
```
src/app/page.tsx                      # Landing hero, features
src/app/pricing/page.tsx              # Pricing copy, trial terms
src/app/signup/page.tsx               # Signup form, trial explanation
src/app/(dashboard)/settings/page.tsx # Account settings, billing
src/lib/email/templates.tsx           # All email templates
src/components/TrialBanner.tsx        # Trial countdown/info
src/components/Footer.tsx             # Legal links, copyright
```

**Standard Copy Snippets:**
```typescript
// src/lib/constants/copy.ts

export const COPY = {
  brand: {
    name: 'Echo Safe',
    tagline: 'Privacy-First DNC Compliance',
    domain: 'echosafe.app'
  },
  
  trial: {
    duration: '7-day',
    limits: '1,000 leads or 5 uploads',
    terms: '7-day trial • 1,000 leads or 5 uploads • Credit card required',
    explanation: 'Full access to all features. Credit card required upfront but you won't be charged until day 8. Cancel anytime before then, zero charge.'
  },
  
  pricing: {
    monthly: '$47/month',
    pitch: 'Unlimited DNC scrubbing with complete privacy',
    included: '5 area codes included (Utah: 801, 385, 435 + 2 of your choice)'
  },
  
  privacy: {
    headline: 'Privacy-First by Design',
    promise: 'No tracking. No profiling. No data selling.',
    differentiator: 'Most competitors track everything you do and sell your data. We never will.'
  }
} as const
```

**Use throughout codebase:**
```tsx
import { COPY } from '@/lib/constants/copy'

// Example usage
<h1>{COPY.brand.name} - {COPY.brand.tagline}</h1>
<p>{COPY.trial.terms}</p>
```

---

### 6. PERFORMANCE OPTIMIZATION

**Objective:** Lighthouse score 95+ on all metrics.

#### A. Image Optimization
```typescript
// Verify all images use Next.js Image component
// Auto-generates WebP, proper sizes, lazy loading

import Image from 'next/image'

// Good
<Image 
  src="/images/logo.png" 
  alt="Echo Safe" 
  width={200} 
  height={50}
  priority // For above-fold images
/>

// Bad
<img src="/images/logo.png" alt="Echo Safe" />
```

#### B. Font Loading Strategy
```typescript
// src/app/layout.tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Prevent font loading delay
  preload: true,
  variable: '--font-inter'
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

#### C. Bundle Size Monitoring
```bash
# Add to package.json scripts
"analyze": "ANALYZE=true next build"

# Run and check for:
# - Lodash full imports (use lodash-es instead)
# - Moment.js (use date-fns instead)
# - Any bundle > 500KB
```

#### D. Lazy Loading
```tsx
// For heavy components (charts, modals, etc.)
import dynamic from 'next/dynamic'

const PricingCalculator = dynamic(
  () => import('@/components/PricingCalculator'),
  { loading: () => <div>Loading calculator...</div> }
)
```

---

### 7. SEO GLOBAL IMPROVEMENTS

#### A. Root Layout Metadata
```typescript
// src/app/layout.tsx

export const metadata: Metadata = {
  metadataBase: new URL('https://echosafe.app'),
  title: {
    default: 'Echo Safe - Privacy-First DNC Compliance for Real Estate & Sales',
    template: '%s | Echo Safe'
  },
  description: 'DNC lead scrubbing that doesn\'t track you. Unlimited scrubbing, AI insights, built-in CRM. $47/month. No hidden fees, no tracking, no data selling.',
  keywords: [
    'DNC scrubbing',
    'TCPA compliance',
    'privacy-first lead tools',
    'real estate compliance',
    'solar sales DNC',
    'insurance lead scrubbing',
    'no tracking lead service'
  ],
  authors: [{ name: 'Echo Safe' }],
  creator: 'Echo Safe',
  publisher: 'Echo Safe',
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://echosafe.app',
    siteName: 'Echo Safe',
    title: 'Echo Safe - Privacy-First DNC Compliance',
    description: 'DNC scrubbing that respects your privacy. $47/month unlimited.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Echo Safe - Privacy-First DNC Compliance'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echo Safe - Privacy-First DNC Compliance',
    description: 'Unlimited DNC scrubbing. No tracking. $47/month.',
    images: ['/og-image.png'],
    creator: '@echosafe'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true
    }
  },
  verification: {
    google: 'YOUR_GOOGLE_VERIFICATION_CODE', // Add when available
    // yandex: 'YOUR_YANDEX_CODE',
  }
}
```

#### B. Sitemap Generation
```typescript
// src/app/sitemap.ts

import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://echosafe.app'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Add other static pages
  ]
}
```

#### C. Robots.txt
```typescript
// src/app/robots.ts

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/(auth)/', '/_next/'],
      },
    ],
    sitemap: 'https://echosafe.app/sitemap.xml',
  }
}
```

---

### 8. ANALYTICS & TRACKING (PRIVACY-COMPLIANT)

**Implementation: Plausible Analytics Only**

```typescript
// src/app/layout.tsx - Add Plausible script

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Plausible Analytics - Privacy-first, no cookies */}
        <script 
          defer 
          data-domain="echosafe.app" 
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Custom Events (Optional):**
```typescript
// Track key actions without PII
declare global {
  interface Window {
    plausible?: (event: string, options?: { props: Record<string, string> }) => void
  }
}

// Usage
window.plausible?.('Share Clicked', { 
  props: { context: 'pricing' } 
})

window.plausible?.('Trial Started', {
  props: { source: 'landing_page' }
})
```

**No Other Analytics:**
- ❌ Google Analytics
- ❌ Facebook Pixel
- ❌ HotJar
- ❌ Any tracking cookies
- ✅ Plausible only (cookieless, privacy-compliant)

---

## TESTING & VALIDATION

### Pre-Deployment Checklist

**1. Brand Consistency**
- [ ] Search entire codebase: zero instances of "Echo Mind Compliance"
- [ ] Logo displays correctly in header (desktop & mobile)
- [ ] Favicon shows in browser tab
- [ ] All emails use "Echo Safe" branding
- [ ] Footer copyright updated

**2. Text Selection**
- [ ] Highlight text on landing page → teal selection visible
- [ ] Highlight text on pricing page → teal selection visible
- [ ] Highlight text in dashboard → teal selection visible
- [ ] Test on Chrome, Firefox, Safari
- [ ] Contrast ratio acceptable (text remains readable)

**3. Pricing Page SEO**
- [ ] Meta title: "Pricing - Echo Safe | Privacy-First DNC Scrubbing from $47/month"
- [ ] Meta description includes key terms
- [ ] OpenGraph tags present
- [ ] Twitter card tags present
- [ ] Structured data validates: https://validator.schema.org/
- [ ] Preview looks good: https://www.opengraph.xyz/
- [ ] Header "Pricing" link goes to `/pricing`

**4. Navigation**
- [ ] All header links functional
- [ ] Footer links functional
- [ ] Mobile menu works
- [ ] Pricing link consistent across site

**5. Copy Consistency**
- [ ] Trial terms: "7-day trial • 1,000 leads or 5 uploads"
- [ ] Pricing: "$47/month"
- [ ] Domain: "echosafe.app" (no old domains)
- [ ] No conflicting information about trials/pricing
- [ ] Privacy messaging consistent

**6. Social Sharing**
- [ ] Share buttons functional on pricing page
- [ ] Native share API works on mobile
- [ ] Copy link fallback works
- [ ] Share text includes key messaging
- [ ] Referral links trackable (if implemented)

**7. Performance**
- [ ] Lighthouse Performance: 95+
- [ ] Lighthouse Accessibility: 95+
- [ ] Lighthouse Best Practices: 95+
- [ ] Lighthouse SEO: 95+
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Total Blocking Time < 200ms

**8. SEO Technical**
- [ ] Sitemap generated: https://echosafe.app/sitemap.xml
- [ ] Robots.txt configured: https://echosafe.app/robots.txt
- [ ] Canonical URLs set on all pages
- [ ] All images have alt text
- [ ] Heading hierarchy correct (H1 → H2 → H3)

**9. Analytics**
- [ ] Plausible script loaded
- [ ] No Google Analytics present
- [ ] No Facebook Pixel present
- [ ] No tracking cookies present
- [ ] Custom events firing (if implemented)

---

## EXECUTION PROTOCOL

### Step 1: Pre-Flight (READ EVERYTHING FIRST)
1. Read ALL reference documents in `/mnt/project/`
2. Review recent conversations for context updates
3. Understand current deployment state
4. Note any database schema changes
5. Identify potential conflicts before starting

### Step 2: Brand Update (HIGHEST PRIORITY)
1. Update logo and favicon files
2. Search and replace all brand references
3. Update metadata in layout.tsx
4. Test header/footer rendering
5. Verify no old brand names remain

### Step 3: Styling & UX
1. Implement text selection CSS
2. Test across browsers
3. Verify contrast ratios
4. Mobile responsive check

### Step 4: SEO Implementation
1. Pricing page metadata
2. Structured data schema
3. On-page semantic HTML
4. FAQ section with schema
5. Sitemap & robots.txt

### Step 5: Navigation & Consistency
1. Fix all pricing links
2. Audit copy for contradictions
3. Standardize trial/pricing language
4. Update configuration constants

### Step 6: Social Sharing
1. Share button component
2. Native share API
3. Dashboard widget
4. Email signature template

### Step 7: Performance & Analytics
1. Image optimization
2. Font loading
3. Bundle analysis
4. Plausible implementation

### Step 8: Testing & Validation
1. Run all checklist items
2. Lighthouse audit
3. Cross-browser testing
4. Mobile testing
5. SEO validation tools

### Step 9: Documentation
1. Update README.md
2. Note any breaking changes
3. Document new features
4. Update environment variables if needed

---

## SUCCESS CRITERIA

**Deployment is ready when:**
1. ✅ Zero instances of "Echo Mind Compliance" in user-facing code
2. ✅ Logo and favicon render correctly
3. ✅ Text selection styled with Echo Safe teal
4. ✅ Pricing page metadata complete and validated
5. ✅ All pricing links point to `/pricing`
6. ✅ No contradicting copy about trials/pricing
7. ✅ Share functionality working
8. ✅ Lighthouse scores 95+ across all metrics
9. ✅ SEO elements validated (schema, OG tags, sitemap)
10. ✅ Only Plausible analytics present (no tracking cookies)

---

## COMMUNICATION PROTOCOL

**During Execution:**
- Flag blockers immediately (missing files, unclear requirements)
- Ask ONE clarifying question if ambiguous (don't assume)
- Note any deviations from plan with rationale
- Provide progress updates at each major milestone

**After Completion:**
- Provide final checklist of completed tasks
- List any items that need follow-up
- Note any discovered technical debt
- Suggest next optimization priorities

---

## FINAL REMINDERS

**Brand Voice:**
- Direct, no BS, anti-corporate
- Privacy-obsessed (make it a selling point)
- Transparent about costs and margins
- Human-touched, not generic SaaS speak

**Privacy Principles:**
- No tracking, no profiling, no data selling
- User owns and controls their data
- Real-time AI analysis only (nothing stored)
- Enterprise privacy APIs (Claude with zero retention)

**Quality Standards:**
- Production-ready code only
- Proper TypeScript types
- Accessible HTML (ARIA labels, semantic tags)
- Mobile-first responsive design
- Performance optimized (lazy loading, code splitting)

---

**NOW EXECUTE WITH PRECISION AND PRIDE.**

Build something that makes users say "Finally, a tool that respects me."

---

**Document:** Opus Execution Prompt  
**Version:** 1.0  
**Date:** January 25, 2026  
**For:** Claude Opus 4.5 via Cursor AI  
**Status:** READY TO EXECUTE
