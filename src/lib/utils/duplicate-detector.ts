// ============================================================================
// DUPLICATE DETECTION UTILITY
// Detects and handles duplicate entries in lead data
// ============================================================================

import { safeNormalizePhone } from './phone-normalize'
import type { DuplicateInfo } from '@/types/upload'

/**
 * Statistics about duplicates found
 */
export interface DuplicateStats {
  totalDuplicates: number
  uniquePhones: number
  duplicatePhones: string[]
  duplicateIndices: number[]
}

/**
 * Options for duplicate detection
 */
export interface DuplicateDetectionOptions {
  /** Whether to normalize phones before comparing (default: true) */
  normalizePhones?: boolean
  /** Whether to keep the first occurrence or last (default: 'first') */
  keepOccurrence?: 'first' | 'last'
}

/**
 * Finds duplicate phone numbers in an array of leads
 *
 * @param leads - Array of leads to check for duplicates
 * @param options - Detection options
 * @returns Array of duplicate information
 *
 * @example
 * const leads = [
 *   { phone_number: '801-555-1234', first_name: 'John' },
 *   { phone_number: '(801) 555-1234', first_name: 'Jane' }, // Duplicate
 *   { phone_number: '385-555-1234', first_name: 'Bob' },
 * ]
 * const duplicates = findDuplicates(leads)
 * // Returns info about the duplicate at index 1
 */
export function findDuplicates(
  leads: Array<{ phone_number?: string; phone?: string }>,
  options: DuplicateDetectionOptions = {}
): DuplicateInfo[] {
  const { normalizePhones = true, keepOccurrence = 'first' } = options

  const seen = new Map<string, number>()
  const duplicates: DuplicateInfo[] = []

  leads.forEach((lead, index) => {
    const phone = lead.phone_number || lead.phone || ''

    if (!phone) {
      return // Skip empty phones
    }

    // Get normalized phone (or original if normalization disabled/fails)
    let compareKey = phone
    if (normalizePhones) {
      const result = safeNormalizePhone(phone)
      compareKey = result.success ? result.normalized : phone
    }

    if (seen.has(compareKey)) {
      const originalIndex = seen.get(compareKey)!

      if (keepOccurrence === 'first') {
        // Mark this entry as duplicate
        duplicates.push({
          index,
          phone,
          normalized: compareKey,
          originalIndex,
        })
      } else {
        // Mark original as duplicate and update seen to point to this one
        duplicates.push({
          index: originalIndex,
          phone: leads[originalIndex].phone_number || leads[originalIndex].phone || '',
          normalized: compareKey,
          originalIndex: index,
        })
        seen.set(compareKey, index)
      }
    } else {
      seen.set(compareKey, index)
    }
  })

  return duplicates
}

/**
 * Gets statistics about duplicates in the data
 *
 * @param leads - Array of leads to analyze
 * @returns Statistics about duplicates
 */
export function getDuplicateStats(
  leads: Array<{ phone_number?: string; phone?: string }>
): DuplicateStats {
  const duplicates = findDuplicates(leads)
  const duplicatePhones = [...new Set(duplicates.map((d) => d.normalized))]
  const duplicateIndices = duplicates.map((d) => d.index)

  return {
    totalDuplicates: duplicates.length,
    uniquePhones: leads.length - duplicates.length,
    duplicatePhones,
    duplicateIndices,
  }
}

/**
 * Removes duplicates from an array of leads
 *
 * @param leads - Array of leads to deduplicate
 * @param options - Options for duplicate handling
 * @returns Object with unique leads and removed duplicates
 *
 * @example
 * const { unique, removed } = removeDuplicates(leads)
 */
export function removeDuplicates<T extends { phone_number?: string; phone?: string }>(
  leads: T[],
  options: DuplicateDetectionOptions = {}
): { unique: T[]; removed: T[]; duplicateInfo: DuplicateInfo[] } {
  const duplicates = findDuplicates(leads, options)
  const duplicateIndices = new Set(duplicates.map((d) => d.index))

  const unique: T[] = []
  const removed: T[] = []

  leads.forEach((lead, index) => {
    if (duplicateIndices.has(index)) {
      removed.push(lead)
    } else {
      unique.push(lead)
    }
  })

  return {
    unique,
    removed,
    duplicateInfo: duplicates,
  }
}

/**
 * Checks if a specific phone number is a duplicate in the array
 *
 * @param phone - Phone number to check
 * @param leads - Array of leads to search
 * @param excludeIndex - Optional index to exclude from search
 * @returns True if duplicate found, false otherwise
 */
export function isDuplicate(
  phone: string,
  leads: Array<{ phone_number?: string; phone?: string }>,
  excludeIndex?: number
): boolean {
  const result = safeNormalizePhone(phone)
  const normalizedPhone = result.success ? result.normalized : phone

  return leads.some((lead, index) => {
    if (excludeIndex !== undefined && index === excludeIndex) {
      return false
    }

    const leadPhone = lead.phone_number || lead.phone || ''
    const leadResult = safeNormalizePhone(leadPhone)
    const normalizedLeadPhone = leadResult.success ? leadResult.normalized : leadPhone

    return normalizedPhone === normalizedLeadPhone
  })
}

/**
 * Finds all occurrences of a phone number
 *
 * @param phone - Phone number to search for
 * @param leads - Array of leads to search
 * @returns Array of indices where phone number appears
 */
export function findAllOccurrences(
  phone: string,
  leads: Array<{ phone_number?: string; phone?: string }>
): number[] {
  const result = safeNormalizePhone(phone)
  const normalizedPhone = result.success ? result.normalized : phone

  const occurrences: number[] = []

  leads.forEach((lead, index) => {
    const leadPhone = lead.phone_number || lead.phone || ''
    const leadResult = safeNormalizePhone(leadPhone)
    const normalizedLeadPhone = leadResult.success ? leadResult.normalized : leadPhone

    if (normalizedPhone === normalizedLeadPhone) {
      occurrences.push(index)
    }
  })

  return occurrences
}

/**
 * Merges duplicate leads, combining data from multiple occurrences
 *
 * @param leads - Array of leads with potential duplicates
 * @returns Array of merged leads (later values take precedence)
 */
export function mergeDuplicates<T extends { phone_number?: string; phone?: string }>(
  leads: T[]
): T[] {
  const phoneToLead = new Map<string, T>()

  leads.forEach((lead) => {
    const phone = lead.phone_number || lead.phone || ''
    if (!phone) return

    const result = safeNormalizePhone(phone)
    const normalizedPhone = result.success ? result.normalized : phone

    if (phoneToLead.has(normalizedPhone)) {
      // Merge with existing - later values take precedence for non-empty fields
      const existing = phoneToLead.get(normalizedPhone)!
      const merged = { ...existing }

      Object.entries(lead).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (merged as Record<string, unknown>)[key] = value
        }
      })

      phoneToLead.set(normalizedPhone, merged)
    } else {
      phoneToLead.set(normalizedPhone, { ...lead })
    }
  })

  return Array.from(phoneToLead.values())
}

/**
 * Groups leads by phone number
 *
 * @param leads - Array of leads to group
 * @returns Map of normalized phone to array of leads
 */
export function groupByPhone<T extends { phone_number?: string; phone?: string }>(
  leads: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  leads.forEach((lead) => {
    const phone = lead.phone_number || lead.phone || ''
    if (!phone) return

    const result = safeNormalizePhone(phone)
    const normalizedPhone = result.success ? result.normalized : phone

    if (!groups.has(normalizedPhone)) {
      groups.set(normalizedPhone, [])
    }
    groups.get(normalizedPhone)!.push(lead)
  })

  return groups
}
