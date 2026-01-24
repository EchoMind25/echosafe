// ============================================================================
// AI RISK SCORING - TYPE DEFINITIONS
// Comprehensive type system for phone number risk assessment
// ============================================================================

/**
 * Risk level classification
 * - SAFE: Score 0-30, low risk for TCPA violations
 * - CAUTION: Score 31-70, moderate risk, proceed carefully
 * - BLOCKED: Score 71-100, high risk, do not call
 */
export type RiskLevel = 'safe' | 'caution' | 'blocked'

/**
 * Individual risk factors that contribute to the overall score
 */
export type RiskFactorType =
  | 'dnc_registered'           // Currently on DNC registry
  | 'recently_removed_dnc'     // Removed from DNC within 90 days
  | 'dnc_pattern_suspicious'   // Multiple add/remove cycles (>2)
  | 'dnc_pattern_moderate'     // Some add/remove activity (2)
  | 'area_code_high_risk'      // Area code with high litigation rates
  | 'litigator_match'          // Matches known TCPA litigator (future)
  | 'wireless_number'          // Wireless number (stricter rules)
  | 'reassigned_number'        // Recently reassigned number
  | 'invalid_format'           // Invalid phone number format

/**
 * Individual risk factor with its contribution to the score
 */
export interface RiskFactor {
  type: RiskFactorType
  points: number
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata?: Record<string, unknown>
}

/**
 * Complete risk assessment for a phone number
 */
export interface RiskAssessment {
  phoneNumber: string
  areaCode: string
  state: string | null

  // Score and classification
  score: number           // 0-100
  level: RiskLevel        // safe | caution | blocked

  // Contributing factors
  factors: RiskFactor[]

  // DNC-specific flags
  isDncRegistered: boolean
  wasRecentlyRemoved: boolean
  addRemoveCount: number
  isPatternSuspicious: boolean

  // Timing information
  dncRegisteredAt: string | null
  dncRemovedAt: string | null
  lastCheckedAt: string

  // Human-readable explanation
  explanation: string
  recommendations: string[]
}

/**
 * Batch risk assessment result with summary statistics
 */
export interface BatchRiskAssessment {
  results: RiskAssessment[]
  summary: {
    total: number
    safe: number
    caution: number
    blocked: number
    averageScore: number
    highestScore: number
    lowestScore: number
  }
  processingTimeMs: number
}

/**
 * Deleted number record from dnc_deleted_numbers table
 */
export interface DeletedNumberRecord {
  phoneNumber: string
  areaCode: string
  state: string | null
  deletedFromDncDate: string
  originalAddDate: string | null
  timesAddedRemoved: number
  deleteAfter: string
}

/**
 * Configuration for risk scoring weights
 */
export interface RiskScoringConfig {
  weights: {
    dncRegistered: number           // Points for being on DNC (default: 100 - blocks)
    recentlyRemoved: number         // Points for recent removal (default: 20)
    patternSuspicious: number       // Points for suspicious pattern >2 (default: 15)
    patternModerate: number         // Points for moderate pattern =2 (default: 8)
    areaCodeHighRisk: number        // Points for high-risk area code (default: 10)
    litigatorMatch: number          // Points for litigator match (default: 50)
    wirelessNumber: number          // Points for wireless (default: 5)
    invalidFormat: number           // Points for invalid format (default: 100)
  }
  thresholds: {
    caution: number                 // Score threshold for caution (default: 31)
    blocked: number                 // Score threshold for blocked (default: 71)
  }
  recentlyRemovedDays: number       // Days to consider as "recently removed" (default: 90)
  suspiciousPatternThreshold: number // Add/remove count for suspicious (default: 3)
}

/**
 * Default configuration values
 */
export const DEFAULT_RISK_CONFIG: RiskScoringConfig = {
  weights: {
    dncRegistered: 100,
    recentlyRemoved: 20,
    patternSuspicious: 15,
    patternModerate: 8,
    areaCodeHighRisk: 10,
    litigatorMatch: 50,
    wirelessNumber: 5,
    invalidFormat: 100,
  },
  thresholds: {
    caution: 31,
    blocked: 71,
  },
  recentlyRemovedDays: 90,
  suspiciousPatternThreshold: 3,
}

/**
 * High-risk area codes (known for higher litigation rates)
 * These are area codes with historically higher TCPA lawsuit rates
 */
export const HIGH_RISK_AREA_CODES = new Set([
  '212', // New York, NY
  '213', // Los Angeles, CA
  '310', // Los Angeles, CA
  '312', // Chicago, IL
  '323', // Los Angeles, CA
  '347', // New York, NY
  '404', // Atlanta, GA
  '415', // San Francisco, CA
  '424', // Los Angeles, CA
  '469', // Dallas, TX
  '470', // Atlanta, GA
  '503', // Portland, OR
  '510', // Oakland, CA
  '602', // Phoenix, AZ
  '619', // San Diego, CA
  '626', // Pasadena, CA
  '646', // New York, NY
  '657', // Orange County, CA
  '678', // Atlanta, GA
  '702', // Las Vegas, NV
  '713', // Houston, TX
  '714', // Orange County, CA
  '718', // New York, NY
  '737', // Austin, TX
  '747', // Los Angeles, CA
  '818', // Los Angeles, CA
  '832', // Houston, TX
  '917', // New York, NY
  '949', // Orange County, CA
])
