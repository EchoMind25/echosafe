// ============================================================================
// FEATURE FLAGS
// Centralized feature flag management for controlled rollouts
// ============================================================================

/**
 * Feature flag configuration
 * Set via environment variables for easy deployment control
 */
export const featureFlags = {
  /**
   * CONTRIBUTIONS / EXPANSION SYSTEM
   * Controls: /expansion page, Founder's Club, area code contributions
   * Re-enable in Month 4 (Q2 2026) after proving execution
   * Set ENABLE_CONTRIBUTIONS=true in .env to re-enable
   */
  enableContributions: process.env.ENABLE_CONTRIBUTIONS === 'true',

  /**
   * CRM INTEGRATIONS
   * Controls: Follow Up Boss, Lofty, Kvcore integrations
   */
  enableCrmIntegrations: process.env.FEATURE_CRM_INTEGRATIONS !== 'false',

  /**
   * TEAM ACCOUNTS
   * Controls: Multi-user team features
   */
  enableTeamAccounts: process.env.FEATURE_TEAM_ACCOUNTS === 'true',

  /**
   * ADVANCED ANALYTICS
   * Controls: Detailed reporting and analytics dashboards
   */
  enableAdvancedAnalytics: process.env.FEATURE_ADVANCED_ANALYTICS === 'true',

  /**
   * API ACCESS
   * Controls: External API access for enterprise users
   */
  enableApiAccess: process.env.FEATURE_API_ACCESS === 'true',
} as const

/**
 * Check if a feature is enabled
 * @param feature - The feature flag key
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature]
}

/**
 * Type-safe feature flag keys
 */
export type FeatureFlagKey = keyof typeof featureFlags
