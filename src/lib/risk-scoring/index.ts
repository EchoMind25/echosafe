// ============================================================================
// AI RISK SCORING MODULE
// Enhanced DNC compliance with pattern detection and AI-powered risk assessment
// ============================================================================

// Export all types
export type {
  RiskLevel,
  RiskFactorType,
  RiskFactor,
  RiskAssessment,
  BatchRiskAssessment,
  DeletedNumberRecord,
  RiskScoringConfig,
} from './types'

// Export constants
export {
  DEFAULT_RISK_CONFIG,
  HIGH_RISK_AREA_CODES,
} from './types'

// Export calculator functions
export {
  // Deleted number queries
  getDeletedNumberRecord,
  getDeletedNumberRecordsBatch,
  isRecentlyRemoved,
  isPatternSuspicious,

  // Risk assessment
  assessRisk,
  assessRiskBatch,

  // Quick checks
  isSafeToCall,
  filterSafeNumbers,
} from './calculator'

// Export integration utilities
export type {
  ScrubLead,
  EnhancedLead,
  CategorizedScrubResults,
} from './integration'

export {
  // Lead enhancement
  enhanceLeadsWithRisk,
  categorizeScrubResults,

  // Filtering
  filterSafeLeads,
  filterLeadsByRiskLevel,

  // Export utilities
  generateEnhancedCsv,
  generateScrubSummary,

  // Analysis
  getMostCommonRiskFactor,
  getHighPriorityAlerts,
} from './integration'

// Export client utilities (browser-safe)
export {
  getRiskLevelColors,
  getRiskLevelLabel,
  getRiskLevelIcon,
  getFactorSeverityColor,
  formatRiskScore,
  getScoreColor,
  getScoreProgressColor,
  sortFactorsBySeverity,
  getRiskSummary,
  generateRiskCsvData,
  calculateComplianceRate,
  getRiskDistribution,
  getMostCommonFactor,
} from './client'
