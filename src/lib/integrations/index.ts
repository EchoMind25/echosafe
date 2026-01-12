// CRM Integration Module Exports
// ============================================================================

// Encryption utilities
export { encrypt, decrypt, maskSensitive } from './encryption'

// Follow Up Boss client
export {
  FollowUpBossClient,
  getAuthorizationUrl as getFUBAuthorizationUrl,
  exchangeCodeForTokens as exchangeFUBCodeForTokens,
  refreshAccessToken as refreshFUBToken,
  mapLeadToFUBPerson,
  encryptFUBCredentials,
  type FUBCredentials,
  type FUBPerson,
} from './followupboss'

// Lofty client
export {
  LoftyClient,
  mapLeadToLoftyContact,
  encryptLoftyCredentials,
  validateApiKey as validateLoftyApiKey,
  type LoftyCredentials,
  type LoftyContact,
} from './lofty'

// Sync engine
export {
  syncLeadToCrm,
  syncBatchToCrm,
  processAutoSync,
  manualSync,
  testCrmConnection,
  createSyncLog,
  updateIntegrationStatus,
  type SyncLeadInput,
  type SyncResult,
  type BatchSyncResult,
  type IntegrationRecord,
} from './sync-engine'
