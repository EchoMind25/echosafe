// ============================================================================
// CRM SYNC ENGINE
// Core sync logic with retry, error handling, and logging
// ============================================================================

import { createClient } from '@/lib/supabase/server'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromTable = (supabase: any, table: string) => supabase.from(table)
import { FollowUpBossClient, mapLeadToFUBPerson, encryptFUBCredentials, type FUBCredentials } from './followupboss'
import { LoftyClient, mapLeadToLoftyContact } from './lofty'
import { KvcoreClient, mapLeadToKvcoreContact } from './kvcore'
import { encrypt, decrypt } from './encryption'
import type { CrmType, SyncStatus, SyncType } from '@/types'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_RETRY_ATTEMPTS = 3
const INITIAL_RETRY_DELAY_MS = 1000 // 1 second
const CLEAN_LEAD_MAX_RISK_SCORE = 20

// ============================================================================
// TYPES
// ============================================================================

export interface SyncLeadInput {
  id: string
  phone_number: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  risk_score?: number | null
  tags?: string[] | null
  notes?: string | null
  source?: string | null
}

export interface SyncResult {
  success: boolean
  leadId: string
  crmRecordId?: string
  action: 'created' | 'updated' | 'skipped'
  error?: string
}

export interface BatchSyncResult {
  totalProcessed: number
  successful: number
  failed: number
  skipped: number
  results: SyncResult[]
}

export interface IntegrationRecord {
  id: string
  user_id: string
  crm_type: CrmType
  credentials: string // encrypted
  sync_settings: {
    auto_sync: boolean
    sync_frequency: 'immediate' | 'hourly' | 'daily'
    sync_clean_only: boolean
    max_risk_score: number
  }
  status: 'ACTIVE' | 'PAUSED' | 'ERROR'
  last_sync_at?: string
  last_error?: string
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = MAX_RETRY_ATTEMPTS
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry on authentication errors
      if (lastError.message.includes('Authentication failed') ||
          lastError.message.includes('Invalid API key') ||
          lastError.message.includes('Access denied')) {
        throw lastError
      }

      if (attempt < maxAttempts) {
        const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(`${operationName} attempt ${attempt} failed, retrying in ${delay}ms...`)
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error(`${operationName} failed after ${maxAttempts} attempts`)
}

// ============================================================================
// SYNC FUNCTIONS
// ============================================================================

/**
 * Sync a single lead to the specified CRM
 */
export async function syncLeadToCrm(
  lead: SyncLeadInput,
  integration: IntegrationRecord
): Promise<SyncResult> {
  // Check if lead meets risk score requirements
  if (integration.sync_settings.sync_clean_only) {
    const maxRisk = integration.sync_settings.max_risk_score ?? CLEAN_LEAD_MAX_RISK_SCORE
    if (lead.risk_score !== null && lead.risk_score !== undefined && lead.risk_score > maxRisk) {
      return {
        success: true,
        leadId: lead.id,
        action: 'skipped',
      }
    }
  }

  try {
    switch (integration.crm_type) {
      case 'FOLLOWUPBOSS':
        return await syncToFollowUpBoss(lead, integration)
      case 'LOFTY':
        return await syncToLofty(lead, integration)
      case 'KVCORE':
        return await syncToKvcore(lead, integration)
      default:
        return {
          success: false,
          leadId: lead.id,
          action: 'skipped',
          error: `Unsupported CRM type: ${integration.crm_type}`,
        }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      success: false,
      leadId: lead.id,
      action: 'skipped',
      error: errorMessage,
    }
  }
}

/**
 * Sync lead to Follow Up Boss
 */
async function syncToFollowUpBoss(
  lead: SyncLeadInput,
  integration: IntegrationRecord
): Promise<SyncResult> {
  const supabase = await createClient()

  // Create token refresh callback to update credentials
  const onTokenRefresh = async (newCredentials: FUBCredentials) => {
    const encryptedCreds = encryptFUBCredentials(newCredentials)
    await fromTable(supabase, 'crm_integrations')
      .update({ credentials: encryptedCreds, updated_at: new Date().toISOString() })
      .eq('id', integration.id)
  }

  const client = new FollowUpBossClient(integration.credentials, onTokenRefresh)

  return withRetry(async () => {
    // Check for existing contact by phone
    const existingPerson = await client.findPersonByPhone(lead.phone_number)
    const person = mapLeadToFUBPerson({
      first_name: lead.first_name,
      last_name: lead.last_name,
      phone_number: lead.phone_number,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      risk_score: lead.risk_score,
      tags: lead.tags,
      notes: lead.notes,
      source: lead.source,
    })

    if (existingPerson && existingPerson.id) {
      // Update existing contact
      const updated = await client.updatePerson(existingPerson.id, person)

      // Add sync note if there are notes
      if (lead.notes) {
        await client.addNote(existingPerson.id, `Echo Safe Sync: ${lead.notes}`)
      }

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: String(updated.id),
        action: 'updated' as const,
      }
    } else {
      // Create new contact
      const created = await client.createPerson(person)

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: String(created.id),
        action: 'created' as const,
      }
    }
  }, `FUB sync for lead ${lead.id}`)
}

/**
 * Sync lead to Lofty CRM
 */
async function syncToLofty(
  lead: SyncLeadInput,
  integration: IntegrationRecord
): Promise<SyncResult> {
  const client = new LoftyClient(integration.credentials)

  return withRetry(async () => {
    // Check for existing contact by phone
    const existingContact = await client.findContactByPhone(lead.phone_number)
    const contact = mapLeadToLoftyContact({
      first_name: lead.first_name,
      last_name: lead.last_name,
      phone_number: lead.phone_number,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      risk_score: lead.risk_score,
      tags: lead.tags,
      notes: lead.notes,
      source: lead.source,
    })

    if (existingContact && existingContact.id) {
      // Update existing contact
      const updated = await client.updateContact(existingContact.id, contact)

      // Add sync note if there are notes
      if (lead.notes) {
        await client.addNote(existingContact.id, `Echo Safe Sync: ${lead.notes}`)
      }

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: updated.id,
        action: 'updated' as const,
      }
    } else {
      // Create new contact
      const created = await client.createContact(contact)

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: created.id,
        action: 'created' as const,
      }
    }
  }, `Lofty sync for lead ${lead.id}`)
}

/**
 * Sync lead to Kvcore CRM
 */
async function syncToKvcore(
  lead: SyncLeadInput,
  integration: IntegrationRecord
): Promise<SyncResult> {
  const client = new KvcoreClient(integration.credentials)

  return withRetry(async () => {
    // Check for existing contact by phone
    const existingContact = await client.findContactByPhone(lead.phone_number)
    const contact = mapLeadToKvcoreContact({
      first_name: lead.first_name,
      last_name: lead.last_name,
      phone_number: lead.phone_number,
      email: lead.email,
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip_code: lead.zip_code,
      risk_score: lead.risk_score,
      tags: lead.tags,
      notes: lead.notes,
      source: lead.source,
    })

    if (existingContact && existingContact.id) {
      // Update existing contact
      const updated = await client.updateContact(existingContact.id, contact)

      // Add sync note if there are notes
      if (lead.notes) {
        await client.addNote(existingContact.id, `Echo Safe Sync: ${lead.notes}`)
      }

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: updated.id,
        action: 'updated' as const,
      }
    } else {
      // Create new contact
      const created = await client.createContact(contact)

      return {
        success: true,
        leadId: lead.id,
        crmRecordId: created.id,
        action: 'created' as const,
      }
    }
  }, `Kvcore sync for lead ${lead.id}`)
}

// ============================================================================
// BATCH SYNC
// ============================================================================

/**
 * Sync multiple leads to a CRM
 */
export async function syncBatchToCrm(
  leads: SyncLeadInput[],
  integration: IntegrationRecord
): Promise<BatchSyncResult> {
  const results: SyncResult[] = []
  let successful = 0
  let failed = 0
  let skipped = 0

  for (const lead of leads) {
    const result = await syncLeadToCrm(lead, integration)
    results.push(result)

    if (result.success) {
      if (result.action === 'skipped') {
        skipped++
      } else {
        successful++
      }
    } else {
      failed++
    }

    // Add small delay between requests to avoid rate limiting
    await sleep(100)
  }

  return {
    totalProcessed: leads.length,
    successful,
    failed,
    skipped,
    results,
  }
}

// ============================================================================
// SYNC LOG MANAGEMENT
// ============================================================================

/**
 * Create a sync log entry
 */
export async function createSyncLog(params: {
  integrationId: string
  userId: string
  leadId?: string
  leadName?: string
  syncType: SyncType
  status: SyncStatus
  crmRecordId?: string
  errorMessage?: string
}): Promise<void> {
  const supabase = await createClient()

  await fromTable(supabase, 'crm_integration_logs').insert({
    integration_id: params.integrationId,
    user_id: params.userId,
    lead_id: params.leadId,
    lead_name: params.leadName,
    sync_type: params.syncType,
    status: params.status,
    crm_record_id: params.crmRecordId,
    error_message: params.errorMessage,
    synced_at: new Date().toISOString(),
  })
}

/**
 * Update integration status based on sync results
 */
export async function updateIntegrationStatus(
  integrationId: string,
  success: boolean,
  errorMessage?: string
): Promise<void> {
  const supabase = await createClient()

  if (success) {
    // Reset consecutive failures on success
    await fromTable(supabase, 'crm_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
  } else {
    // Update with error
    await fromTable(supabase, 'crm_integrations')
      .update({
        status: 'ERROR',
        last_error: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integrationId)
  }
}

// ============================================================================
// AUTO-SYNC TRIGGER
// ============================================================================

/**
 * Process auto-sync for a newly created/updated lead
 * Called from the lead-created webhook
 */
export async function processAutoSync(
  userId: string,
  lead: SyncLeadInput
): Promise<{ synced: boolean; integrations: string[]; errors: string[] }> {
  const supabase = await createClient()
  const syncedTo: string[] = []
  const errors: string[] = []

  // Get all active integrations for the user with auto_sync enabled
  const { data: integrations, error } = await fromTable(supabase, 'crm_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ACTIVE')

  if (error || !integrations) {
    console.error('Failed to fetch integrations:', error)
    return { synced: false, integrations: [], errors: ['Failed to fetch integrations'] }
  }

  // Filter integrations with auto_sync enabled
  const autoSyncIntegrations = (integrations as IntegrationRecord[]).filter(i => {
    const settings = i.sync_settings
    return settings?.auto_sync && settings?.sync_frequency === 'immediate'
  })

  if (autoSyncIntegrations.length === 0) {
    return { synced: false, integrations: [], errors: [] }
  }

  // Sync to each integration
  for (const integration of autoSyncIntegrations) {
    try {
      const result = await syncLeadToCrm(lead, integration as IntegrationRecord)

      // Log the sync attempt
      await createSyncLog({
        integrationId: integration.id,
        userId,
        leadId: lead.id,
        leadName: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.phone_number,
        syncType: 'AUTO',
        status: result.success ? 'SUCCESS' : 'FAILED',
        crmRecordId: result.crmRecordId,
        errorMessage: result.error,
      })

      // Update integration status
      await updateIntegrationStatus(integration.id, result.success, result.error)

      if (result.success && result.action !== 'skipped') {
        syncedTo.push(integration.crm_type)
      } else if (!result.success) {
        errors.push(`${integration.crm_type}: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${integration.crm_type}: ${errorMessage}`)

      await createSyncLog({
        integrationId: integration.id,
        userId,
        leadId: lead.id,
        leadName: [lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.phone_number,
        syncType: 'AUTO',
        status: 'FAILED',
        errorMessage,
      })

      await updateIntegrationStatus(integration.id, false, errorMessage)
    }
  }

  return {
    synced: syncedTo.length > 0,
    integrations: syncedTo,
    errors,
  }
}

// ============================================================================
// MANUAL SYNC
// ============================================================================

/**
 * Manually sync specific leads to an integration
 */
export async function manualSync(
  integrationId: string,
  userId: string,
  leadIds?: string[]
): Promise<BatchSyncResult & { integrationId: string }> {
  const supabase = await createClient()

  // Get the integration
  const { data: integration, error: integrationError } = await fromTable(supabase, 'crm_integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('user_id', userId)
    .single()

  if (integrationError || !integration) {
    throw new Error('Integration not found')
  }

  if (integration.status !== 'ACTIVE') {
    throw new Error('Integration is not active')
  }

  // Get leads to sync
  let query = supabase
    .from('crm_leads')
    .select('*')
    .eq('user_id', userId)

  if (leadIds && leadIds.length > 0) {
    query = query.in('id', leadIds)
  }

  const { data: leads, error: leadsError } = await query

  if (leadsError || !leads) {
    throw new Error('Failed to fetch leads')
  }

  // Map database leads to sync input format
  const syncLeads: SyncLeadInput[] = leads.map(lead => ({
    id: lead.id,
    phone_number: lead.phone_number,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email,
    address: lead.address,
    city: lead.city,
    state: lead.state,
    zip_code: lead.zip_code,
    risk_score: lead.risk_score,
    tags: lead.tags,
    notes: lead.notes,
  }))

  // Perform batch sync
  const result = await syncBatchToCrm(syncLeads, integration as IntegrationRecord)

  // Log summary
  await createSyncLog({
    integrationId,
    userId,
    syncType: 'MANUAL',
    status: result.failed === 0 ? 'SUCCESS' : (result.successful > 0 ? 'PARTIAL' : 'FAILED'),
    errorMessage: result.failed > 0 ? `${result.failed} leads failed to sync` : undefined,
  })

  // Update integration status
  await updateIntegrationStatus(
    integrationId,
    result.failed === 0,
    result.failed > 0 ? `${result.failed} leads failed to sync` : undefined
  )

  return { ...result, integrationId }
}

// ============================================================================
// CONNECTION TESTING
// ============================================================================

/**
 * Test connection to a CRM
 */
export async function testCrmConnection(
  crmType: CrmType,
  credentials: string
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (crmType) {
      case 'FOLLOWUPBOSS': {
        const client = new FollowUpBossClient(credentials)
        const connected = await client.testConnection()
        return { success: connected, error: connected ? undefined : 'Connection test failed' }
      }
      case 'LOFTY': {
        const client = new LoftyClient(credentials)
        const connected = await client.testConnection()
        return { success: connected, error: connected ? undefined : 'Connection test failed' }
      }
      case 'KVCORE': {
        const client = new KvcoreClient(credentials)
        const connected = await client.testConnection()
        return { success: connected, error: connected ? undefined : 'Connection test failed' }
      }
      default:
        return { success: false, error: `Unsupported CRM type: ${crmType}` }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }
  }
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { encrypt, decrypt }
