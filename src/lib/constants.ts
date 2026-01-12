// ============================================================================
// ECHO MIND COMPLIANCE - BRAND CONSTANTS
// Central configuration for branding, colors, and assets
// ============================================================================

// ============================================================================
// BRAND IDENTITY
// ============================================================================

export const BRAND = {
  name: 'Echo Mind Compliance',
  shortName: 'Echo Compliance',
  company: 'Echo Mind Systems',
  tagline: 'Intelligent DNC Lead Scrubbing',
  description: 'Stay TCPA compliant with AI-powered risk scoring and automated lead scrubbing',
  website: 'https://echocompli.com',
  supportEmail: 'support@echocompli.com',
  salesEmail: 'sales@echocompli.com',
} as const

// ============================================================================
// LOGO PATHS
// ============================================================================

export const LOGO = {
  // PNG versions (use these in app - SVG has issues)
  full: '/images/logo-full.png',          // Full logo with text
  icon: '/images/logo-icon.png',          // Icon only (circular)
  white: '/images/logo-white.png',        // White version for dark backgrounds
  
  // Fallback SVG paths (if PNG conversion works)
  fullSvg: '/images/logo-full.svg',
  iconSvg: '/images/logo-icon.svg',
  
  // PWA Icons
  pwa: {
    icon192: '/icons/icon-192.png',
    icon512: '/icons/icon-512.png',
    appleTouchIcon: '/icons/apple-touch-icon.png',
    favicon: '/favicon.ico',
  },
} as const

// ============================================================================
// BRAND COLORS (Echo Mind Teal)
// ============================================================================

export const COLORS = {
  // Primary - Echo Mind Teal (from logo)
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // Main brand color
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e',
    DEFAULT: '#14b8a6',
  },
  
  // Neutral - Slate
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  
  // Semantic Colors
  success: '#10b981',   // Green - clean leads
  warning: '#f59e0b',   // Amber - caution leads
  danger: '#ef4444',    // Red - blocked leads
  info: '#06b6d4',      // Cyan - informational
} as const

// ============================================================================
// RISK LEVEL COLORS
// ============================================================================

export const RISK_COLORS = {
  SAFE: COLORS.success,
  CAUTION: COLORS.warning,
  BLOCKED: COLORS.danger,
} as const

// ============================================================================
// STATUS COLORS
// ============================================================================

export const STATUS_COLORS = {
  // Lead Status
  NEW: '#06b6d4',
  CONTACTED: '#8b5cf6',
  QUALIFIED: '#14b8a6',
  NURTURING: '#f59e0b',
  CONVERTED: '#10b981',
  DEAD: '#6b7280',
  
  // Upload Status
  PROCESSING: '#06b6d4',
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  
  // Subscription Status
  ACTIVE: '#10b981',
  TRIALING: '#06b6d4',
  CANCELED: '#6b7280',
  PAST_DUE: '#ef4444',
  PAUSED: '#f59e0b',
} as const

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

// ============================================================================
// SPACING (8px Grid)
// ============================================================================

export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const

// ============================================================================
// TOUCH TARGETS (Mobile)
// ============================================================================

export const TOUCH = {
  minSize: '48px',     // Minimum touch target size
  spacing: '8px',      // Minimum spacing between targets
} as const

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// ============================================================================
// ANIMATION DURATIONS
// ============================================================================

export const ANIMATION = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURES = {
  crmIntegrations: true,
  teamAccounts: false,        // Phase 2
  advancedAnalytics: false,   // Phase 3
  apiAccess: false,           // Phase 4
  darkMode: false,            // Phase 2
} as const

// ============================================================================
// PRICING
// ============================================================================

export const PRICING = {
  BASE: {
    monthly: 47,
    name: 'Base Plan',
    description: 'Unlimited lead scrubbing for individuals',
    features: [
      'Unlimited lead scrubbing',
      '3 area codes included (801, 385, 435)',
      'Built-in CRM (unlimited leads)',
      '1 CRM integration',
      'Google Sheets add-on',
      'Email support',
    ],
  },
  UTAH_ELITE: {
    monthly: 24,
    name: "Utah's Elite Plan",
    description: 'Special pricing for founding partner',
    features: [
      'All Base Plan features',
      'Priority support',
      'Early access to new features',
      'Referral rewards ($10/referral)',
    ],
  },
  TEAM: {
    monthly: 147,
    name: 'Team Plan',
    description: 'For brokerages (up to 10 agents)',
    features: [
      'All Base Plan features',
      'Up to 10 agents',
      'Team dashboard',
      'Centralized billing',
      'Usage reports',
      'Dedicated account manager',
    ],
  },
} as const

// ============================================================================
// LIMITS
// ============================================================================

export const LIMITS = {
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxLeads: 100000,
    allowedTypes: ['.csv', '.xlsx', '.xls', '.txt'],
  },
  
  rateLimit: {
    uploadsPerHour: 10,
    apiRequestsPerMinute: 100,
  },
  
  trial: {
    durationDays: 14,
  },
} as const

// ============================================================================
// EXTERNAL LINKS
// ============================================================================

export const LINKS = {
  social: {
    twitter: 'https://twitter.com/echomindsystems',
    linkedin: 'https://linkedin.com/company/echo-mind-systems',
    youtube: 'https://youtube.com/@echomindsystems',
  },
  
  docs: {
    gettingStarted: 'https://docs.echocompli.com/getting-started',
    api: 'https://docs.echocompli.com/api',
    googleSheets: 'https://docs.echocompli.com/google-sheets',
    integrations: 'https://docs.echocompli.com/integrations',
  },
  
  legal: {
    terms: 'https://echocompli.com/terms',
    privacy: 'https://echocompli.com/privacy',
    compliance: 'https://echocompli.com/compliance',
  },
  
  support: {
    help: 'https://help.echocompli.com',
    contact: 'https://echocompli.com/contact',
    status: 'https://status.echocompli.com',
  },
} as const

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get color for risk level
 */
export function getRiskColor(riskLevel: 'SAFE' | 'CAUTION' | 'BLOCKED'): string {
  return RISK_COLORS[riskLevel]
}

/**
 * Get color for status
 */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || COLORS.neutral[500]
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }
  return phone
}
