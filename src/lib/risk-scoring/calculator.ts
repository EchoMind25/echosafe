// ============================================================================
// AI RISK SCORING - CALCULATOR
// Core risk calculation engine with deleted number pattern detection
// ============================================================================

import { createClient } from '../supabase/server'
import { parsePhoneState } from '../states'
import {
  RiskAssessment,
  RiskFactor,
  RiskLevel,
  DeletedNumberRecord,
  RiskScoringConfig,
  DEFAULT_RISK_CONFIG,
  HIGH_RISK_AREA_CODES,
} from './types'

// ============================================================================
// DELETED NUMBER QUERIES
// ============================================================================

/**
 * Check if a phone number was recently removed from DNC (within 90 days)
 * @param phoneNumber - Cleaned 10-digit phone number
 * @returns Deleted number record if found, null otherwise
 */
export async function getDeletedNumberRecord(
  phoneNumber: string
): Promise<DeletedNumberRecord | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dnc_deleted_numbers')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single()

  if (error || !data) {
    return null
  }

  return {
    phoneNumber: data.phone_number,
    areaCode: data.area_code,
    state: data.state,
    deletedFromDncDate: data.deleted_from_dnc_date,
    originalAddDate: data.original_add_date,
    timesAddedRemoved: data.times_added_removed,
    deleteAfter: data.delete_after,
  }
}

/**
 * Batch check for deleted number records
 * @param phoneNumbers - Array of cleaned phone numbers
 * @returns Map of phone number to deleted record
 */
export async function getDeletedNumberRecordsBatch(
  phoneNumbers: string[]
): Promise<Map<string, DeletedNumberRecord>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dnc_deleted_numbers')
    .select('*')
    .in('phone_number', phoneNumbers)

  const recordMap = new Map<string, DeletedNumberRecord>()

  if (!error && data) {
    for (const record of data) {
      recordMap.set(record.phone_number, {
        phoneNumber: record.phone_number,
        areaCode: record.area_code,
        state: record.state,
        deletedFromDncDate: record.deleted_from_dnc_date,
        originalAddDate: record.original_add_date,
        timesAddedRemoved: record.times_added_removed,
        deleteAfter: record.delete_after,
      })
    }
  }

  return recordMap
}

/**
 * Check if a number was recently removed (within configured days)
 * @param deletedRecord - The deleted number record
 * @param config - Risk scoring configuration
 * @returns True if recently removed
 */
export function isRecentlyRemoved(
  deletedRecord: DeletedNumberRecord | null,
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): boolean {
  if (!deletedRecord) return false

  const deletedDate = new Date(deletedRecord.deletedFromDncDate)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - config.recentlyRemovedDays)

  return deletedDate >= cutoffDate
}

/**
 * Check if add/remove pattern is suspicious
 * @param deletedRecord - The deleted number record
 * @param config - Risk scoring configuration
 * @returns True if pattern is suspicious (>= threshold)
 */
export function isPatternSuspicious(
  deletedRecord: DeletedNumberRecord | null,
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): boolean {
  if (!deletedRecord) return false
  return deletedRecord.timesAddedRemoved >= config.suspiciousPatternThreshold
}

// ============================================================================
// DNC REGISTRY QUERIES
// ============================================================================

interface DncRecord {
  phone_number: string
  area_code: string
  state: string | null
  registered_at: string | null
  source: string | null
}

/**
 * Check if a phone number is on the DNC registry
 */
async function getDncRecord(phoneNumber: string): Promise<DncRecord | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dnc_registry')
    .select('phone_number, area_code, state, registered_at, source')
    .eq('phone_number', phoneNumber)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Batch check DNC registry
 */
async function getDncRecordsBatch(
  phoneNumbers: string[]
): Promise<Map<string, DncRecord>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('dnc_registry')
    .select('phone_number, area_code, state, registered_at, source')
    .in('phone_number', phoneNumbers)

  const recordMap = new Map<string, DncRecord>()

  if (!error && data) {
    for (const record of data) {
      recordMap.set(record.phone_number, record)
    }
  }

  return recordMap
}

// ============================================================================
// RISK FACTOR COLLECTION
// ============================================================================

/**
 * Collect all risk factors for a phone number
 */
function collectRiskFactors(
  phoneNumber: string,
  areaCode: string,
  dncRecord: DncRecord | null,
  deletedRecord: DeletedNumberRecord | null,
  config: RiskScoringConfig
): RiskFactor[] {
  const factors: RiskFactor[] = []

  // 1. Currently on DNC registry (critical - blocks the call)
  if (dncRecord) {
    factors.push({
      type: 'dnc_registered',
      points: config.weights.dncRegistered,
      description: `Phone number is registered on the Do Not Call list${dncRecord.source ? ` (${dncRecord.source})` : ''}`,
      severity: 'critical',
      metadata: {
        registeredAt: dncRecord.registered_at,
        source: dncRecord.source,
      },
    })
  }

  // 2. Recently removed from DNC (high risk)
  if (deletedRecord && isRecentlyRemoved(deletedRecord, config)) {
    const daysSinceRemoval = Math.floor(
      (Date.now() - new Date(deletedRecord.deletedFromDncDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    factors.push({
      type: 'recently_removed_dnc',
      points: config.weights.recentlyRemoved,
      description: `Number was removed from DNC ${daysSinceRemoval} days ago. May be added back soon.`,
      severity: 'high',
      metadata: {
        removedAt: deletedRecord.deletedFromDncDate,
        daysSinceRemoval,
      },
    })
  }

  // 3. Suspicious add/remove pattern (high risk)
  if (deletedRecord && isPatternSuspicious(deletedRecord, config)) {
    factors.push({
      type: 'dnc_pattern_suspicious',
      points: config.weights.patternSuspicious,
      description: `Number has been added/removed from DNC ${deletedRecord.timesAddedRemoved} times. This is a suspicious pattern.`,
      severity: 'high',
      metadata: {
        timesAddedRemoved: deletedRecord.timesAddedRemoved,
      },
    })
  } else if (deletedRecord && deletedRecord.timesAddedRemoved === 2) {
    // 4. Moderate pattern (medium risk)
    factors.push({
      type: 'dnc_pattern_moderate',
      points: config.weights.patternModerate,
      description: `Number has been added/removed from DNC twice. Monitor for future changes.`,
      severity: 'medium',
      metadata: {
        timesAddedRemoved: deletedRecord.timesAddedRemoved,
      },
    })
  }

  // 5. High-risk area code (low-medium risk)
  if (HIGH_RISK_AREA_CODES.has(areaCode)) {
    factors.push({
      type: 'area_code_high_risk',
      points: config.weights.areaCodeHighRisk,
      description: `Area code ${areaCode} has historically higher TCPA litigation rates.`,
      severity: 'low',
      metadata: {
        areaCode,
      },
    })
  }

  // 6. Invalid phone format (blocks)
  if (phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber)) {
    factors.push({
      type: 'invalid_format',
      points: config.weights.invalidFormat,
      description: 'Phone number format is invalid. Cannot verify compliance.',
      severity: 'critical',
    })
  }

  return factors
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Calculate total score from risk factors
 */
function calculateScore(factors: RiskFactor[]): number {
  const totalPoints = factors.reduce((sum, factor) => sum + factor.points, 0)
  // Cap at 100
  return Math.min(100, totalPoints)
}

/**
 * Determine risk level from score
 */
function determineRiskLevel(
  score: number,
  config: RiskScoringConfig
): RiskLevel {
  if (score >= config.thresholds.blocked) return 'blocked'
  if (score >= config.thresholds.caution) return 'caution'
  return 'safe'
}

// ============================================================================
// EXPLANATION GENERATION
// ============================================================================

/**
 * Generate human-readable explanation
 */
function generateExplanation(
  level: RiskLevel,
  factors: RiskFactor[]
): string {
  if (factors.length === 0) {
    return 'This phone number has no known risk factors. It appears safe to contact.'
  }

  const criticalFactors = factors.filter((f) => f.severity === 'critical')
  const highFactors = factors.filter((f) => f.severity === 'high')

  if (level === 'blocked') {
    if (criticalFactors.some((f) => f.type === 'dnc_registered')) {
      return 'This phone number is registered on the Do Not Call list. Calling this number may result in TCPA violations and potential fines of $500-$1,500 per call.'
    }
    return 'This phone number has critical risk factors that prevent safe contact. Review the risk factors for details.'
  }

  if (level === 'caution') {
    const reasons: string[] = []
    if (highFactors.some((f) => f.type === 'recently_removed_dnc')) {
      reasons.push('recently removed from DNC')
    }
    if (highFactors.some((f) => f.type === 'dnc_pattern_suspicious')) {
      reasons.push('suspicious DNC pattern detected')
    }
    const reasonText = reasons.length > 0 ? reasons.join(' and ') : 'elevated risk indicators'
    return `Proceed with caution. This number has ${reasonText}. Consider additional verification before calling.`
  }

  return 'This phone number has minor risk factors but is generally safe to contact. Always ensure you have proper consent.'
}

/**
 * Generate recommendations based on risk level
 */
function generateRecommendations(
  level: RiskLevel,
  factors: RiskFactor[]
): string[] {
  const recommendations: string[] = []

  if (level === 'blocked') {
    recommendations.push('Do not call this number')
    recommendations.push('Remove from your calling list')
    recommendations.push('Document the scrub result for compliance records')
  } else if (level === 'caution') {
    recommendations.push('Verify consent before calling')
    recommendations.push('Consider sending a text or email first')
    recommendations.push('Document all contact attempts')

    if (factors.some((f) => f.type === 'recently_removed_dnc')) {
      recommendations.push('Re-check DNC status before each contact')
    }
    if (factors.some((f) => f.type === 'dnc_pattern_suspicious')) {
      recommendations.push('Add to watch list for future DNC changes')
    }
  } else {
    recommendations.push('Proceed with standard calling protocols')
    recommendations.push('Maintain consent documentation')
  }

  return recommendations
}

// ============================================================================
// MAIN ASSESSMENT FUNCTIONS
// ============================================================================

/**
 * Perform complete risk assessment for a single phone number
 * @param phoneNumber - Phone number in any format
 * @param config - Optional custom configuration
 * @returns Complete risk assessment
 */
export async function assessRisk(
  phoneNumber: string,
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<RiskAssessment> {
  // Clean phone number
  const cleanedPhone = phoneNumber.replace(/\D/g, '')
  const { areaCode, state } = parsePhoneState(cleanedPhone)

  // Fetch DNC and deleted records in parallel
  const [dncRecord, deletedRecord] = await Promise.all([
    getDncRecord(cleanedPhone),
    getDeletedNumberRecord(cleanedPhone),
  ])

  // Collect risk factors
  const factors = collectRiskFactors(
    cleanedPhone,
    areaCode,
    dncRecord,
    deletedRecord,
    config
  )

  // Calculate score and level
  const score = calculateScore(factors)
  const level = determineRiskLevel(score, config)

  // Generate explanation and recommendations
  const explanation = generateExplanation(level, factors)
  const recommendations = generateRecommendations(level, factors)

  return {
    phoneNumber: cleanedPhone,
    areaCode,
    state,
    score,
    level,
    factors,
    isDncRegistered: !!dncRecord,
    wasRecentlyRemoved: deletedRecord ? isRecentlyRemoved(deletedRecord, config) : false,
    addRemoveCount: deletedRecord?.timesAddedRemoved || 0,
    isPatternSuspicious: deletedRecord ? isPatternSuspicious(deletedRecord, config) : false,
    dncRegisteredAt: dncRecord?.registered_at || null,
    dncRemovedAt: deletedRecord?.deletedFromDncDate || null,
    lastCheckedAt: new Date().toISOString(),
    explanation,
    recommendations,
  }
}

/**
 * Perform batch risk assessment for multiple phone numbers
 * Optimized for performance with batch database queries
 * @param phoneNumbers - Array of phone numbers
 * @param config - Optional custom configuration
 * @returns Batch assessment with summary statistics
 */
export async function assessRiskBatch(
  phoneNumbers: string[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<{
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
}> {
  const startTime = Date.now()

  // Clean all phone numbers
  const cleanedPhones = phoneNumbers.map((phone) => phone.replace(/\D/g, ''))

  // Batch fetch DNC and deleted records
  const [dncMap, deletedMap] = await Promise.all([
    getDncRecordsBatch(cleanedPhones),
    getDeletedNumberRecordsBatch(cleanedPhones),
  ])

  // Process each phone number
  const results: RiskAssessment[] = cleanedPhones.map((cleanedPhone) => {
    const { areaCode, state } = parsePhoneState(cleanedPhone)
    const dncRecord = dncMap.get(cleanedPhone) || null
    const deletedRecord = deletedMap.get(cleanedPhone) || null

    // Collect risk factors
    const factors = collectRiskFactors(
      cleanedPhone,
      areaCode,
      dncRecord,
      deletedRecord,
      config
    )

    // Calculate score and level
    const score = calculateScore(factors)
    const level = determineRiskLevel(score, config)

    // Generate explanation and recommendations
    const explanation = generateExplanation(level, factors)
    const recommendations = generateRecommendations(level, factors)

    return {
      phoneNumber: cleanedPhone,
      areaCode,
      state,
      score,
      level,
      factors,
      isDncRegistered: !!dncRecord,
      wasRecentlyRemoved: deletedRecord
        ? isRecentlyRemoved(deletedRecord, config)
        : false,
      addRemoveCount: deletedRecord?.timesAddedRemoved || 0,
      isPatternSuspicious: deletedRecord
        ? isPatternSuspicious(deletedRecord, config)
        : false,
      dncRegisteredAt: dncRecord?.registered_at || null,
      dncRemovedAt: deletedRecord?.deletedFromDncDate || null,
      lastCheckedAt: new Date().toISOString(),
      explanation,
      recommendations,
    }
  })

  // Calculate summary statistics
  const safe = results.filter((r) => r.level === 'safe').length
  const caution = results.filter((r) => r.level === 'caution').length
  const blocked = results.filter((r) => r.level === 'blocked').length
  const scores = results.map((r) => r.score)
  const averageScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  return {
    results,
    summary: {
      total: results.length,
      safe,
      caution,
      blocked,
      averageScore: Math.round(averageScore * 10) / 10,
      highestScore: Math.max(...scores, 0),
      lowestScore: Math.min(...scores, 100),
    },
    processingTimeMs: Date.now() - startTime,
  }
}

/**
 * Quick check if a number is safe to call (score < caution threshold)
 * @param phoneNumber - Phone number to check
 * @param config - Optional configuration
 * @returns True if safe to call
 */
export async function isSafeToCall(
  phoneNumber: string,
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<boolean> {
  const assessment = await assessRisk(phoneNumber, config)
  return assessment.level === 'safe'
}

/**
 * Quick batch check for numbers safe to call
 * @param phoneNumbers - Array of phone numbers
 * @param config - Optional configuration
 * @returns Array of phone numbers that are safe to call
 */
export async function filterSafeNumbers(
  phoneNumbers: string[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<string[]> {
  const { results } = await assessRiskBatch(phoneNumbers, config)
  return results.filter((r) => r.level === 'safe').map((r) => r.phoneNumber)
}
