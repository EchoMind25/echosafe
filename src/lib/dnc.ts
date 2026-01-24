// ============================================================================
// DNC REGISTRY UTILITIES
// Functions for checking and managing Do Not Call registry
// ============================================================================

import { createClient } from './supabase/server'
import { parsePhoneState } from './states'
import type { Database } from './supabase/types'

// Type alias for DNC registry row
type DncRegistryRow = Database['public']['Tables']['dnc_registry']['Row']

// Partial type for batch check results (only selected fields)
type DncBatchRecord = Pick<DncRegistryRow, 'phone_number' | 'area_code' | 'state' | 'registered_at' | 'source'>

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Result from a single DNC check
 */
export type DncCheckResult = {
  isBlocked: boolean
  phoneNumber: string
  state?: string | null
  areaCode?: string
  registeredAt?: string | null
  source?: string | null
}

/**
 * Result from batch DNC check
 */
export type DncBatchCheckResult = {
  phoneNumber: string
  isBlocked: boolean
  state?: string | null
  areaCode?: string
  registeredAt?: string | null
  source?: string | null
}

/**
 * DNC statistics by state
 */
export type DncStateStats = {
  state: string
  totalRecords: number
  uniqueAreaCodes: number
  sources: {
    federal: number
    utah_state: number
    manual: number
  }
}

// ============================================================================
// SINGLE PHONE NUMBER CHECK
// ============================================================================

/**
 * Check if a phone number is on the DNC registry
 * @param phoneNumber - Phone number to check (any format)
 * @returns DNC check result with details
 *
 * @example
 * ```ts
 * const result = await checkDNC('8015551234')
 * if (result.isBlocked) {
 *   console.log(`Number is on DNC (${result.source})`)
 * }
 * ```
 */
export async function checkDNC(phoneNumber: string): Promise<DncCheckResult> {
  // Clean phone number (remove all non-digits)
  const cleanedPhone = phoneNumber.replace(/\D/g, '')

  // Parse area code and state
  const { areaCode, state } = parsePhoneState(cleanedPhone)

  // Query Supabase
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('phone_number, area_code, state, registered_at, source')
    .eq('phone_number', cleanedPhone)
    .single()

  if (error || !data) {
    // Not found in DNC registry
    return {
      isBlocked: false,
      phoneNumber: cleanedPhone,
      areaCode,
      state,
    }
  }

  // Found in DNC registry
  return {
    isBlocked: true,
    phoneNumber: data.phone_number,
    state: data.state,
    areaCode: data.area_code,
    registeredAt: data.registered_at,
    source: data.source,
  }
}

// ============================================================================
// BATCH PHONE NUMBER CHECK
// ============================================================================

/**
 * Check multiple phone numbers against DNC registry
 * @param phoneNumbers - Array of phone numbers (any format)
 * @returns Array of DNC check results
 *
 * @example
 * ```ts
 * const results = await checkDNCBatch(['8015551234', '6025551234'])
 * const blocked = results.filter(r => r.isBlocked)
 * console.log(`${blocked.length} numbers are on DNC`)
 * ```
 */
export async function checkDNCBatch(
  phoneNumbers: string[]
): Promise<DncBatchCheckResult[]> {
  // Clean all phone numbers
  const cleanedPhones = phoneNumbers.map((phone) => phone.replace(/\D/g, ''))

  // Query Supabase for all numbers at once
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('phone_number, area_code, state, registered_at, source')
    .in('phone_number', cleanedPhones)

  // Create a map of phone numbers found in DNC
  const dncMap = new Map<string, DncBatchRecord>()
  if (data && !error) {
    for (const record of data) {
      dncMap.set(record.phone_number, record)
    }
  }

  // Build results for all phone numbers
  return cleanedPhones.map((phone) => {
    const dncRecord = dncMap.get(phone)
    const { areaCode, state } = parsePhoneState(phone)

    if (dncRecord) {
      // Found in DNC registry
      return {
        phoneNumber: phone,
        isBlocked: true,
        state: dncRecord.state,
        areaCode: dncRecord.area_code,
        registeredAt: dncRecord.registered_at,
        source: dncRecord.source,
      }
    }

    // Not found in DNC registry
    return {
      phoneNumber: phone,
      isBlocked: false,
      areaCode,
      state,
    }
  })
}

// ============================================================================
// STATE-BASED QUERIES
// ============================================================================

/**
 * Get all DNC numbers for a specific state
 * @param state - Two-letter state code (e.g., 'UT', 'AZ')
 * @param limit - Maximum number of records to return (default: 1000)
 * @returns Array of DNC registry records
 *
 * @example
 * ```ts
 * const utahDNC = await getDNCByState('UT', 5000)
 * console.log(`Utah has ${utahDNC.length} DNC numbers`)
 * ```
 */
export async function getDNCByState(
  state: string,
  limit = 1000
): Promise<DncRegistryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('*')
    .eq('state', state.toUpperCase())
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch DNC for state ${state}: ${error.message}`)
  }

  return data || []
}

/**
 * Get DNC count by state
 * @param state - Two-letter state code
 * @returns Total count of DNC numbers in state
 *
 * @example
 * ```ts
 * const count = await getDNCCountByState('UT')
 * console.log(`Utah has ${count} DNC numbers`)
 * ```
 */
export async function getDNCCountByState(state: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('dnc_registry')
    .select('*', { count: 'exact', head: true })
    .eq('state', state.toUpperCase())

  if (error) {
    throw new Error(
      `Failed to count DNC for state ${state}: ${error.message}`
    )
  }

  return count || 0
}

/**
 * Get DNC statistics for a state
 * @param state - Two-letter state code
 * @returns Statistics about DNC records in state
 *
 * @example
 * ```ts
 * const stats = await getDNCStatsByState('UT')
 * console.log(`Utah: ${stats.totalRecords} records, ${stats.uniqueAreaCodes} area codes`)
 * ```
 */
export async function getDNCStatsByState(
  state: string
): Promise<DncStateStats> {
  const supabase = await createClient()

  // Get all records for the state
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('area_code, source')
    .eq('state', state.toUpperCase())

  if (error || !data) {
    return {
      state: state.toUpperCase(),
      totalRecords: 0,
      uniqueAreaCodes: 0,
      sources: { federal: 0, utah_state: 0, manual: 0 },
    }
  }

  // Calculate statistics
  const uniqueAreaCodes = new Set(data.map((r) => r.area_code)).size
  const sources = {
    federal: data.filter((r) => r.source === 'ftc').length,
    utah_state: data.filter((r) => r.source === 'state').length,
    manual: data.filter((r) => r.source === 'internal').length,
  }

  return {
    state: state.toUpperCase(),
    totalRecords: data.length,
    uniqueAreaCodes,
    sources,
  }
}

// ============================================================================
// AREA CODE QUERIES
// ============================================================================

/**
 * Get all DNC numbers for a specific area code
 * @param areaCode - 3-digit area code
 * @param limit - Maximum number of records to return
 * @returns Array of DNC registry records
 *
 * @example
 * ```ts
 * const dnc801 = await getDNCByAreaCode('801', 2000)
 * console.log(`Area code 801 has ${dnc801.length} DNC numbers`)
 * ```
 */
export async function getDNCByAreaCode(
  areaCode: string,
  limit = 1000
): Promise<DncRegistryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('*')
    .eq('area_code', areaCode)
    .limit(limit)

  if (error) {
    throw new Error(
      `Failed to fetch DNC for area code ${areaCode}: ${error.message}`
    )
  }

  return data || []
}

/**
 * Get DNC count by area code
 * @param areaCode - 3-digit area code
 * @returns Total count of DNC numbers for area code
 *
 * @example
 * ```ts
 * const count = await getDNCCountByAreaCode('801')
 * console.log(`Area code 801 has ${count} DNC numbers`)
 * ```
 */
export async function getDNCCountByAreaCode(areaCode: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('dnc_registry')
    .select('*', { count: 'exact', head: true })
    .eq('area_code', areaCode)

  if (error) {
    throw new Error(
      `Failed to count DNC for area code ${areaCode}: ${error.message}`
    )
  }

  return count || 0
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Add a phone number to DNC registry
 * @param phoneNumber - Phone number to add
 * @param source - Source of the DNC entry
 * @returns The created DNC record
 *
 * @example
 * ```ts
 * await addToDNC('8015551234', 'manual')
 * ```
 */
export async function addToDNC(
  phoneNumber: string,
  source: 'ftc' | 'state' | 'internal' = 'internal'
): Promise<DncRegistryRow> {
  const cleanedPhone = phoneNumber.replace(/\D/g, '')
  const { areaCode, state } = parsePhoneState(cleanedPhone)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .insert({
      phone_number: cleanedPhone,
      area_code: areaCode,
      state,
      registered_at: new Date().toISOString(),
      source,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add to DNC: ${error.message}`)
  }

  return data
}

/**
 * Remove a phone number from DNC registry
 * @param phoneNumber - Phone number to remove
 * @returns True if removed, false if not found
 *
 * @example
 * ```ts
 * const removed = await removeFromDNC('8015551234')
 * ```
 */
export async function removeFromDNC(phoneNumber: string): Promise<boolean> {
  const cleanedPhone = phoneNumber.replace(/\D/g, '')

  const supabase = await createClient()
  const { error, count } = await supabase
    .from('dnc_registry')
    .delete({ count: 'exact' })
    .eq('phone_number', cleanedPhone)

  if (error) {
    throw new Error(`Failed to remove from DNC: ${error.message}`)
  }

  return (count || 0) > 0
}

/**
 * Batch add multiple phone numbers to DNC registry
 * @param phoneNumbers - Array of phone numbers to add
 * @param source - Source of the DNC entries
 * @returns Array of created DNC records
 *
 * @example
 * ```ts
 * await batchAddToDNC(['8015551234', '6025551234'], 'federal')
 * ```
 */
export async function batchAddToDNC(
  phoneNumbers: string[],
  source: 'ftc' | 'state' | 'internal' = 'internal'
): Promise<DncRegistryRow[]> {
  const records = phoneNumbers.map((phone) => {
    const cleanedPhone = phone.replace(/\D/g, '')
    const { areaCode, state } = parsePhoneState(cleanedPhone)

    return {
      phone_number: cleanedPhone,
      area_code: areaCode,
      state,
      registered_at: new Date().toISOString(),
      source,
    }
  })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .insert(records)
    .select()

  if (error) {
    throw new Error(`Failed to batch add to DNC: ${error.message}`)
  }

  return data || []
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get total DNC registry count
 * @returns Total number of records in DNC registry
 *
 * @example
 * ```ts
 * const total = await getTotalDNCCount()
 * console.log(`Total DNC records: ${total}`)
 * ```
 */
export async function getTotalDNCCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('dnc_registry')
    .select('*', { count: 'exact', head: true })

  if (error) {
    throw new Error(`Failed to count DNC records: ${error.message}`)
  }

  return count || 0
}

/**
 * Get DNC records by source
 * @param source - Source to filter by
 * @param limit - Maximum records to return
 * @returns Array of DNC records from that source
 *
 * @example
 * ```ts
 * const federal = await getDNCBySource('federal')
 * console.log(`${federal.length} federal DNC numbers`)
 * ```
 */
export async function getDNCBySource(
  source: 'ftc' | 'state' | 'internal',
  limit = 1000
): Promise<DncRegistryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('*')
    .eq('source', source)
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch DNC by source: ${error.message}`)
  }

  return data || []
}

/**
 * Get recent DNC additions
 * @param limit - Number of records to return
 * @returns Most recently added DNC records
 *
 * @example
 * ```ts
 * const recent = await getRecentDNCAdditions(10)
 * ```
 */
export async function getRecentDNCAdditions(
  limit = 100
): Promise<DncRegistryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dnc_registry')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch recent DNC additions: ${error.message}`)
  }

  return data || []
}
