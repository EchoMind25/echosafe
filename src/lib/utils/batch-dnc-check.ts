/**
 * Batch DNC Check Utility
 *
 * Optimized lead processing using batch queries instead of N+1 pattern.
 * Performance improvement: 1,000 leads from 2,000+ queries to 3-4 queries.
 *
 * From COMPLIANCE_PERFORMANCE_AUDIT.md:
 * - Before: 30-60 seconds for 1,000 leads
 * - After: 2-5 seconds for 1,000 leads
 *
 * Usage:
 * ```ts
 * import { processLeadsBatch } from '@/lib/utils/batch-dnc-check'
 *
 * const results = await processLeadsBatch(leads, supabase)
 * ```
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface LeadInput {
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  source?: string
  [key: string]: unknown
}

export interface ProcessedLead extends LeadInput {
  phone_number: string
  risk_score: number
  risk_flags: string[]
  dnc_status: 'clean' | 'caution' | 'blocked'
}

/**
 * Normalize a phone number to 10-digit format
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '')

  // If 11 digits starting with 1, remove the 1 (US country code)
  if (normalized.length === 11 && normalized.startsWith('1')) {
    normalized = normalized.slice(1)
  }

  return normalized
}

/**
 * Process leads in batch with optimized queries
 *
 * This function replaces the N+1 query pattern with batch lookups:
 * - 1 query for all DNC registry checks
 * - 1 query for all deleted numbers checks
 * - 1 query for all litigator checks
 *
 * @param leads - Array of leads with phone numbers
 * @param supabase - Supabase client instance
 * @returns Processed leads with risk scores and DNC status
 */
export async function processLeadsBatch(
  leads: LeadInput[],
  supabase: SupabaseClient
): Promise<ProcessedLead[]> {
  if (leads.length === 0) {
    return []
  }

  // Step 1: Normalize all phone numbers
  const normalizedLeads = leads.map(lead => ({
    ...lead,
    phone_number: normalizePhoneNumber(lead.phone_number)
  }))

  // Get unique phone numbers
  const phoneNumbers = [...new Set(normalizedLeads.map(l => l.phone_number).filter(p => p.length === 10))]

  if (phoneNumbers.length === 0) {
    return normalizedLeads.map(lead => ({
      ...lead,
      risk_score: 0,
      risk_flags: ['invalid_phone_number'],
      dnc_status: 'caution' as const
    }))
  }

  // Step 2: Batch query all DNC registry entries (1 query instead of N)
  const { data: dncResults } = await supabase
    .from('dnc_registry')
    .select('phone_number')
    .in('phone_number', phoneNumbers)
    .eq('record_status', 'active')

  const dncSet = new Set(dncResults?.map(r => r.phone_number) || [])

  // Step 3: Batch query all deleted/removed numbers (1 query instead of N)
  const { data: deletedResults } = await supabase
    .from('dnc_deleted_numbers')
    .select('phone_number, times_added_removed')
    .in('phone_number', phoneNumbers)

  const deletedMap = new Map<string, number>(
    deletedResults?.map(r => [r.phone_number, r.times_added_removed]) || []
  )

  // Step 4: Batch query all known litigators (1 query instead of N)
  const { data: litigatorResults } = await supabase
    .from('litigators')
    .select('phone_number, case_count, risk_level')
    .in('phone_number', phoneNumbers)

  const litigatorMap = new Map<string, { case_count: number; risk_level: string }>(
    litigatorResults?.map(r => [r.phone_number, { case_count: r.case_count, risk_level: r.risk_level }]) || []
  )

  // Step 5: Process leads in memory (no more DB calls)
  const processedLeads: ProcessedLead[] = normalizedLeads.map(lead => {
    const phone = lead.phone_number
    let score = 0
    const flags: string[] = []

    // Validate phone number format
    if (phone.length !== 10) {
      flags.push('invalid_phone_number')
      return {
        ...lead,
        risk_score: 0,
        risk_flags: flags,
        dnc_status: 'caution' as const
      }
    }

    // Check federal DNC (60 points - BLOCKED)
    if (dncSet.has(phone)) {
      score += 60
      flags.push('federal_dnc')
    }

    // Check recently removed from DNC (20 points base)
    if (deletedMap.has(phone)) {
      score += 20
      flags.push('recently_removed_dnc')

      // Pattern: Added/removed multiple times (extra 15 points)
      const timesRemoved = deletedMap.get(phone) || 0
      if (timesRemoved > 1) {
        score += 15
        flags.push('pattern_add_remove')
      }
    }

    // Check known litigator (25 points)
    if (litigatorMap.has(phone)) {
      const litigatorInfo = litigatorMap.get(phone)!
      score += 25
      flags.push('known_litigator')

      // High-risk litigator with multiple cases
      if (litigatorInfo.case_count > 5 || litigatorInfo.risk_level === 'critical') {
        score += 10
        flags.push('serial_litigator')
      }
    }

    // Determine DNC status based on score
    let dncStatus: 'clean' | 'caution' | 'blocked'
    if (score >= 60) {
      dncStatus = 'blocked'
    } else if (score > 20) {
      dncStatus = 'caution'
    } else {
      dncStatus = 'clean'
    }

    return {
      ...lead,
      phone_number: phone,
      risk_score: score,
      risk_flags: flags,
      dnc_status: dncStatus
    }
  })

  return processedLeads
}

/**
 * Process leads in chunks to avoid memory issues with very large batches
 *
 * @param leads - Array of leads
 * @param supabase - Supabase client
 * @param chunkSize - Number of leads per chunk (default: 1000)
 * @returns All processed leads
 */
export async function processLeadsInChunks(
  leads: LeadInput[],
  supabase: SupabaseClient,
  chunkSize = 1000
): Promise<ProcessedLead[]> {
  const results: ProcessedLead[] = []

  for (let i = 0; i < leads.length; i += chunkSize) {
    const chunk = leads.slice(i, i + chunkSize)
    const processedChunk = await processLeadsBatch(chunk, supabase)
    results.push(...processedChunk)
  }

  return results
}

/**
 * Calculate batch statistics from processed leads
 */
export function calculateBatchStats(processedLeads: ProcessedLead[]) {
  const total = processedLeads.length
  const clean = processedLeads.filter(l => l.dnc_status === 'clean').length
  const caution = processedLeads.filter(l => l.dnc_status === 'caution').length
  const blocked = processedLeads.filter(l => l.dnc_status === 'blocked').length

  const riskFlags = processedLeads.flatMap(l => l.risk_flags)
  const flagCounts: Record<string, number> = {}
  for (const flag of riskFlags) {
    flagCounts[flag] = (flagCounts[flag] || 0) + 1
  }

  const averageRiskScore = total > 0
    ? Math.round(processedLeads.reduce((sum, l) => sum + l.risk_score, 0) / total)
    : 0

  const complianceRate = total > 0
    ? Math.round((clean / total) * 100)
    : 100

  return {
    total,
    clean,
    caution,
    blocked,
    averageRiskScore,
    complianceRate,
    flagCounts,
    areaCodes: [...new Set(processedLeads.map(l => l.phone_number.substring(0, 3)))]
  }
}
