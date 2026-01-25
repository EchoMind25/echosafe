/**
 * Echo Safe - Centralized Brand Copy
 * Single source of truth for all user-facing text
 */

export const COPY = {
  brand: {
    name: 'Echo Safe',
    tagline: 'Privacy-First DNC Compliance',
    domain: 'echosafe.app',
    company: 'Echo Safe Systems'
  },

  trial: {
    duration: '7-day',
    durationDays: 7,
    maxLeads: 1000,
    maxUploads: 5,
    requiresCreditCard: true,
    terms: '7-day trial \u2022 1,000 leads or 5 uploads \u2022 Credit card required',
    explanation: 'Full access to all features. Credit card required upfront but you won\'t be charged until day 8. Cancel anytime before then, zero charge.'
  },

  pricing: {
    monthly: '$47/month',
    monthlyAmount: 47,
    annual: '$564/year',
    annualAmount: 564,
    pitch: 'Unlimited DNC scrubbing with complete privacy',
    included: '5 area codes included (Utah: 801, 385, 435 + 2 of your choice)',
    areaCodes: {
      utah: ['801', '385', '435'],
      nevada: ['702', '775']
    }
  },

  privacy: {
    headline: 'Privacy-First by Design',
    promise: 'No tracking. No profiling. No data selling.',
    differentiator: 'Most competitors track everything you do and sell your data. We never will.',
    features: [
      'We don\'t track you',
      'We never sell your data',
      'Delete everything instantly',
      'AI forgets immediately'
    ]
  },

  features: {
    unlimited: 'Unlimited lead scrubbing',
    areaCodes: '5 area codes included',
    ai: 'AI compliance insights',
    crm: 'Built-in CRM',
    privacy: 'Privacy guaranteed',
    dncUpdates: 'Daily FTC DNC updates',
    history: 'Upload history (30 days)',
    support: 'Email support'
  },

  cta: {
    primary: 'Start 7-Day Free Trial',
    secondary: 'See Pricing',
    dashboard: 'Go to Dashboard',
    signup: 'Get Started',
    login: 'Sign In'
  },

  social: {
    shareText: 'I found a DNC scrubbing service that actually respects privacy. No tracking, unlimited scrubbing, $47/month. Check it out:',
    shareTitle: 'Echo Safe - Privacy-First DNC Compliance'
  },

  legal: {
    copyright: '\u00a9 2026 Echo Safe. We don\'t sell your data.',
    disclaimer: 'This is a data checking tool, not legal advice or a compliance guarantee. You are responsible for TCPA compliance and maintaining your own call records.'
  }
} as const

// Type for COPY object
export type CopyType = typeof COPY
