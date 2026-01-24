// ============================================================================
// AI RISK SCORING - INTEGRATION UTILITIES
// Functions to integrate risk scoring with existing scrubbing workflow
// ============================================================================

import { assessRiskBatch } from './calculator'
import type { RiskAssessment, RiskScoringConfig, RiskLevel } from './types'
import { DEFAULT_RISK_CONFIG } from './types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Processed lead from scrubbing workflow
 */
export interface ScrubLead {
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  [key: string]: unknown
}

/**
 * Enhanced lead with risk assessment
 */
export interface EnhancedLead extends ScrubLead {
  risk_score: number
  risk_level: RiskLevel
  risk_factors: string[]
  is_dnc_registered: boolean
  was_recently_removed: boolean
  is_pattern_suspicious: boolean
  risk_explanation: string
  recommendations: string[]
}

/**
 * Categorized scrub results
 */
export interface CategorizedScrubResults {
  clean: EnhancedLead[]
  caution: EnhancedLead[]
  blocked: EnhancedLead[]
  summary: {
    total: number
    cleanCount: number
    cautionCount: number
    blockedCount: number
    complianceRate: number
    averageRiskScore: number
    processingTimeMs: number
  }
}

// ============================================================================
// LEAD ENHANCEMENT
// ============================================================================

/**
 * Enhance a list of leads with risk assessments
 * @param leads - Array of scrub leads
 * @param config - Optional risk scoring configuration
 * @returns Array of enhanced leads with risk data
 */
export async function enhanceLeadsWithRisk(
  leads: ScrubLead[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<EnhancedLead[]> {
  if (leads.length === 0) return []

  // Extract phone numbers
  const phoneNumbers = leads.map((lead) => lead.phone_number)

  // Get batch risk assessments
  const { results: assessments } = await assessRiskBatch(phoneNumbers, config)

  // Create assessment map for quick lookup
  const assessmentMap = new Map<string, RiskAssessment>()
  for (const assessment of assessments) {
    assessmentMap.set(assessment.phoneNumber, assessment)
  }

  // Enhance each lead
  return leads.map((lead) => {
    const cleanedPhone = lead.phone_number.replace(/\D/g, '')
    const assessment = assessmentMap.get(cleanedPhone)

    if (!assessment) {
      // Fallback if no assessment found (shouldn't happen)
      return {
        ...lead,
        risk_score: 0,
        risk_level: 'safe' as RiskLevel,
        risk_factors: [],
        is_dnc_registered: false,
        was_recently_removed: false,
        is_pattern_suspicious: false,
        risk_explanation: 'Unable to assess risk',
        recommendations: [],
      }
    }

    return {
      ...lead,
      risk_score: assessment.score,
      risk_level: assessment.level,
      risk_factors: assessment.factors.map((f) => f.type),
      is_dnc_registered: assessment.isDncRegistered,
      was_recently_removed: assessment.wasRecentlyRemoved,
      is_pattern_suspicious: assessment.isPatternSuspicious,
      risk_explanation: assessment.explanation,
      recommendations: assessment.recommendations,
    }
  })
}

/**
 * Categorize leads by risk level
 * @param leads - Array of scrub leads
 * @param config - Optional risk scoring configuration
 * @returns Categorized results with summary
 */
export async function categorizeScrubResults(
  leads: ScrubLead[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<CategorizedScrubResults> {
  const startTime = Date.now()

  // Enhance all leads with risk
  const enhancedLeads = await enhanceLeadsWithRisk(leads, config)

  // Categorize by risk level
  const clean = enhancedLeads.filter((l) => l.risk_level === 'safe')
  const caution = enhancedLeads.filter((l) => l.risk_level === 'caution')
  const blocked = enhancedLeads.filter((l) => l.risk_level === 'blocked')

  // Calculate statistics
  const total = enhancedLeads.length
  const complianceRate =
    total > 0 ? Math.round((clean.length / total) * 100) : 100
  const averageRiskScore =
    total > 0
      ? Math.round(
          (enhancedLeads.reduce((sum, l) => sum + l.risk_score, 0) / total) * 10
        ) / 10
      : 0

  return {
    clean,
    caution,
    blocked,
    summary: {
      total,
      cleanCount: clean.length,
      cautionCount: caution.length,
      blockedCount: blocked.length,
      complianceRate,
      averageRiskScore,
      processingTimeMs: Date.now() - startTime,
    },
  }
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

/**
 * Filter leads to get only safe-to-call numbers
 * @param leads - Array of scrub leads
 * @param config - Optional risk scoring configuration
 * @returns Array of leads that are safe to call
 */
export async function filterSafeLeads(
  leads: ScrubLead[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<ScrubLead[]> {
  const { clean } = await categorizeScrubResults(leads, config)
  return clean
}

/**
 * Filter leads by risk level
 * @param leads - Array of scrub leads
 * @param levels - Risk levels to include
 * @param config - Optional risk scoring configuration
 * @returns Filtered leads
 */
export async function filterLeadsByRiskLevel(
  leads: ScrubLead[],
  levels: RiskLevel[],
  config: RiskScoringConfig = DEFAULT_RISK_CONFIG
): Promise<EnhancedLead[]> {
  const enhancedLeads = await enhanceLeadsWithRisk(leads, config)
  return enhancedLeads.filter((l) => levels.includes(l.risk_level))
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Generate CSV export data for enhanced leads
 * @param leads - Array of enhanced leads
 * @param includeRiskDetails - Include all risk columns
 * @returns CSV string
 */
export function generateEnhancedCsv(
  leads: EnhancedLead[],
  includeRiskDetails = true
): string {
  if (leads.length === 0) return ''

  // Define headers
  const baseHeaders = [
    'Phone Number',
    'First Name',
    'Last Name',
    'Email',
    'Address',
    'City',
    'State',
    'Zip Code',
  ]

  const riskHeaders = [
    'Risk Score',
    'Risk Level',
    'DNC Registered',
    'Recently Removed',
    'Pattern Suspicious',
    'Risk Explanation',
  ]

  const headers = includeRiskDetails
    ? [...baseHeaders, ...riskHeaders]
    : baseHeaders

  // Generate rows
  const rows = leads.map((lead) => {
    const baseRow = [
      lead.phone_number,
      lead.first_name || '',
      lead.last_name || '',
      lead.email || '',
      lead.address || '',
      lead.city || '',
      lead.state || '',
      lead.zip_code || '',
    ]

    if (includeRiskDetails) {
      return [
        ...baseRow,
        lead.risk_score.toString(),
        lead.risk_level,
        lead.is_dnc_registered ? 'Yes' : 'No',
        lead.was_recently_removed ? 'Yes' : 'No',
        lead.is_pattern_suspicious ? 'Yes' : 'No',
        `"${lead.risk_explanation.replace(/"/g, '""')}"`,
      ]
    }

    return baseRow
  })

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Generate summary report for scrub results
 * @param results - Categorized scrub results
 * @returns Formatted summary text
 */
export function generateScrubSummary(results: CategorizedScrubResults): string {
  const { summary } = results

  return `
DNC Scrub Results Summary
=========================

Total Records Processed: ${summary.total}
Processing Time: ${summary.processingTimeMs}ms

Risk Distribution:
- Safe to Call: ${summary.cleanCount} (${Math.round((summary.cleanCount / summary.total) * 100)}%)
- Proceed with Caution: ${summary.cautionCount} (${Math.round((summary.cautionCount / summary.total) * 100)}%)
- Blocked (Do Not Call): ${summary.blockedCount} (${Math.round((summary.blockedCount / summary.total) * 100)}%)

Overall Compliance Rate: ${summary.complianceRate}%
Average Risk Score: ${summary.averageRiskScore}/100
`.trim()
}

// ============================================================================
// RISK LEVEL UTILITIES
// ============================================================================

/**
 * Get the most common risk factor from results
 * @param results - Categorized scrub results
 * @returns Most common factor with count
 */
export function getMostCommonRiskFactor(
  results: CategorizedScrubResults
): { factor: string; count: number } | null {
  const factorCounts = new Map<string, number>()

  const allLeads = [...results.clean, ...results.caution, ...results.blocked]

  for (const lead of allLeads) {
    for (const factor of lead.risk_factors) {
      const count = factorCounts.get(factor) || 0
      factorCounts.set(factor, count + 1)
    }
  }

  let maxFactor = ''
  let maxCount = 0

  for (const [factor, count] of factorCounts) {
    if (count > maxCount) {
      maxFactor = factor
      maxCount = count
    }
  }

  if (maxCount === 0) return null

  return { factor: maxFactor, count: maxCount }
}

/**
 * Get leads requiring immediate attention (blocked or recent DNC removal)
 * @param results - Categorized scrub results
 * @returns High-priority leads
 */
export function getHighPriorityAlerts(
  results: CategorizedScrubResults
): EnhancedLead[] {
  return [
    ...results.blocked,
    ...results.caution.filter((l) => l.was_recently_removed || l.is_pattern_suspicious),
  ]
}
