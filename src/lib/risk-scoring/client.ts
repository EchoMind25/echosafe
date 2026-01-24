// ============================================================================
// AI RISK SCORING - CLIENT-SIDE UTILITIES
// Browser-compatible helper functions for risk assessment display
// ============================================================================

import type { RiskLevel, RiskFactor, RiskAssessment } from './types'

/**
 * Get color scheme for risk level (Tailwind CSS classes)
 */
export function getRiskLevelColors(level: RiskLevel): {
  bg: string
  text: string
  border: string
  badge: string
} {
  switch (level) {
    case 'safe':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        badge: 'bg-green-500/20 text-green-400',
      }
    case 'caution':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-400',
      }
    case 'blocked':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        badge: 'bg-red-500/20 text-red-400',
      }
  }
}

/**
 * Get human-readable label for risk level
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 'safe':
      return 'Safe'
    case 'caution':
      return 'Caution'
    case 'blocked':
      return 'Blocked'
  }
}

/**
 * Get icon name for risk level (for use with lucide-react)
 */
export function getRiskLevelIcon(level: RiskLevel): 'check-circle' | 'alert-triangle' | 'x-circle' {
  switch (level) {
    case 'safe':
      return 'check-circle'
    case 'caution':
      return 'alert-triangle'
    case 'blocked':
      return 'x-circle'
  }
}

/**
 * Get color for risk factor severity
 */
export function getFactorSeverityColor(severity: RiskFactor['severity']): string {
  switch (severity) {
    case 'low':
      return 'text-slate-400'
    case 'medium':
      return 'text-amber-400'
    case 'high':
      return 'text-orange-400'
    case 'critical':
      return 'text-red-400'
  }
}

/**
 * Format risk score for display
 */
export function formatRiskScore(score: number): string {
  return score.toFixed(0)
}

/**
 * Get score color based on value
 */
export function getScoreColor(score: number): string {
  if (score >= 71) return 'text-red-400'
  if (score >= 31) return 'text-amber-400'
  return 'text-green-400'
}

/**
 * Get progress bar color for score
 */
export function getScoreProgressColor(score: number): string {
  if (score >= 71) return 'bg-red-500'
  if (score >= 31) return 'bg-amber-500'
  return 'bg-green-500'
}

/**
 * Sort risk factors by severity (critical first)
 */
export function sortFactorsBySeverity(factors: RiskFactor[]): RiskFactor[] {
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  return [...factors].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  )
}

/**
 * Get short summary of risk assessment
 */
export function getRiskSummary(assessment: RiskAssessment): string {
  const { level, factors, score } = assessment

  if (level === 'blocked' && assessment.isDncRegistered) {
    return 'On Do Not Call list'
  }

  if (level === 'blocked') {
    return 'Critical risk - do not call'
  }

  if (factors.length === 0) {
    return 'No risk factors detected'
  }

  const topFactor = sortFactorsBySeverity(factors)[0]
  if (topFactor) {
    switch (topFactor.type) {
      case 'recently_removed_dnc':
        return 'Recently removed from DNC'
      case 'dnc_pattern_suspicious':
        return 'Suspicious DNC pattern'
      case 'dnc_pattern_moderate':
        return 'Moderate DNC pattern'
      case 'area_code_high_risk':
        return 'High-risk area code'
      default:
        return `Score: ${score}`
    }
  }

  return `Score: ${score}`
}

/**
 * Generate CSV export data for risk assessments
 */
export function generateRiskCsvData(assessments: RiskAssessment[]): string {
  const headers = [
    'Phone Number',
    'Area Code',
    'State',
    'Risk Score',
    'Risk Level',
    'On DNC',
    'Recently Removed',
    'Pattern Count',
    'Suspicious Pattern',
    'Explanation',
  ]

  const rows = assessments.map((a) => [
    a.phoneNumber,
    a.areaCode,
    a.state || '',
    a.score.toString(),
    a.level,
    a.isDncRegistered ? 'Yes' : 'No',
    a.wasRecentlyRemoved ? 'Yes' : 'No',
    a.addRemoveCount.toString(),
    a.isPatternSuspicious ? 'Yes' : 'No',
    `"${a.explanation.replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Calculate compliance rate from assessments
 */
export function calculateComplianceRate(assessments: RiskAssessment[]): number {
  if (assessments.length === 0) return 100
  const safeCount = assessments.filter((a) => a.level === 'safe').length
  return Math.round((safeCount / assessments.length) * 100)
}

/**
 * Get risk distribution from assessments
 */
export function getRiskDistribution(
  assessments: RiskAssessment[]
): { safe: number; caution: number; blocked: number } {
  return {
    safe: assessments.filter((a) => a.level === 'safe').length,
    caution: assessments.filter((a) => a.level === 'caution').length,
    blocked: assessments.filter((a) => a.level === 'blocked').length,
  }
}

/**
 * Get the most common risk factor from assessments
 */
export function getMostCommonFactor(
  assessments: RiskAssessment[]
): { type: string; count: number } | null {
  const factorCounts = new Map<string, number>()

  for (const assessment of assessments) {
    for (const factor of assessment.factors) {
      const current = factorCounts.get(factor.type) || 0
      factorCounts.set(factor.type, current + 1)
    }
  }

  let maxType = ''
  let maxCount = 0

  for (const [type, count] of factorCounts) {
    if (count > maxCount) {
      maxType = type
      maxCount = count
    }
  }

  if (maxCount === 0) return null

  return { type: maxType, count: maxCount }
}
