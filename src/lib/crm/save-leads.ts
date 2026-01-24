// ============================================================================
// CRM SAVE UTILITY
// Saves processed leads to the CRM database
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import type { ProcessedLead } from '@/types/upload'
import { safeNormalizePhone } from '@/lib/utils/phone-normalize'

// ============================================================================
// TYPES
// ============================================================================

export interface SaveLeadsOptions {
  /** User ID */
  userId: string
  /** Job ID for tracking source */
  jobId: string
  /** Whether to update existing leads */
  updateExisting?: boolean
  /** Tags to apply to saved leads */
  tags?: string[]
}

export interface SaveLeadsResult {
  success: boolean
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Saves processed leads to the CRM database
 *
 * @param supabase - Supabase client
 * @param leads - Array of processed leads to save
 * @param options - Save options
 * @returns Result with counts of inserted, updated, and skipped leads
 */
export async function saveLeadsToCRM(
  supabase: SupabaseClient<Database>,
  leads: ProcessedLead[],
  options: SaveLeadsOptions
): Promise<SaveLeadsResult> {
  const { userId, jobId: _jobId, updateExisting = true, tags = [] } = options

  const result: SaveLeadsResult = {
    success: true,
    inserted: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  }

  if (leads.length === 0) {
    return result
  }

  // Get normalized phone numbers for existing check
  const normalizedPhones = leads.map((lead) => {
    const phoneResult = safeNormalizePhone(lead.phone_number)
    return phoneResult.success ? phoneResult.normalized : lead.phone_number
  })

  // Check for existing leads
  const { data: existingLeads, error: fetchError } = await supabase
    .from('crm_leads')
    .select('id, phone_number')
    .eq('user_id', userId)
    .in('phone_number', normalizedPhones)

  if (fetchError) {
    result.success = false
    result.errors.push(`Failed to check existing leads: ${fetchError.message}`)
    return result
  }

  const existingPhoneMap = new Map(
    (existingLeads || []).map((lead) => [lead.phone_number, lead.id])
  )

  // Separate leads into insert and update batches
  const toInsert: Array<Database['public']['Tables']['crm_leads']['Insert']> = []
  const toUpdate: Array<{ id: string; data: Database['public']['Tables']['crm_leads']['Update'] }> = []

  const now = new Date().toISOString()

  for (const lead of leads) {
    const phoneResult = safeNormalizePhone(lead.phone_number)
    const normalizedPhone = phoneResult.success ? phoneResult.normalized : lead.phone_number

    if (existingPhoneMap.has(normalizedPhone)) {
      if (updateExisting) {
        const existingId = existingPhoneMap.get(normalizedPhone)!
        toUpdate.push({
          id: existingId,
          data: {
            first_name: lead.first_name || undefined,
            last_name: lead.last_name || undefined,
            email: lead.email || undefined,
            address: lead.address || undefined,
            city: lead.city || undefined,
            state: lead.state || undefined,
            zip_code: lead.zip_code || undefined,
            dnc_status: Boolean(lead.dnc_status),
            risk_score: lead.risk_score,
            last_scrubbed_at: now,
            tags: tags.length > 0 ? tags : undefined,
            updated_at: now,
          },
        })
      } else {
        result.skipped++
      }
    } else {
      toInsert.push({
        user_id: userId,
        phone_number: normalizedPhone,
        first_name: lead.first_name || null,
        last_name: lead.last_name || null,
        email: lead.email || null,
        address: lead.address || null,
        city: lead.city || null,
        state: lead.state || null,
        zip_code: lead.zip_code || null,
        dnc_status: Boolean(lead.dnc_status),
        risk_score: lead.risk_score || null,
        last_scrubbed_at: now,
        tags: tags.length > 0 ? tags : null,
        created_at: now,
        updated_at: now,
      })
    }
  }

  // Batch insert new leads
  if (toInsert.length > 0) {
    // Insert in batches of 100
    const batchSize = 100
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize)
      const { error: insertError } = await supabase.from('crm_leads').insert(batch)

      if (insertError) {
        result.errors.push(`Failed to insert batch ${i / batchSize + 1}: ${insertError.message}`)
      } else {
        result.inserted += batch.length
      }
    }
  }

  // Update existing leads
  for (const { id, data } of toUpdate) {
    const { error: updateError } = await supabase
      .from('crm_leads')
      .update(data)
      .eq('id', id)

    if (updateError) {
      result.errors.push(`Failed to update lead ${id}: ${updateError.message}`)
    } else {
      result.updated++
    }
  }

  result.success = result.errors.length === 0

  return result
}

/**
 * Gets CRM leads for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param options - Query options
 * @returns Array of CRM leads
 */
export async function getCRMLeads(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: {
    limit?: number
    offset?: number
    status?: 'clean' | 'dnc' | 'risky'
    search?: string
  } = {}
) {
  const { limit = 50, offset = 0, status, search } = options

  let query = supabase
    .from('crm_leads')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    // Convert status to boolean: 'clean' means not on DNC (false), 'dnc'/'risky' means on DNC (true)
    const dncStatusBool = status !== 'clean'
    query = query.eq('dnc_status', dncStatusBool)
  }

  if (search) {
    query = query.or(
      `phone_number.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
    )
  }

  const { data, count, error } = await query

  if (error) {
    throw new Error(`Failed to fetch CRM leads: ${error.message}`)
  }

  return {
    leads: data || [],
    total: count || 0,
  }
}

/**
 * Deletes CRM leads by IDs
 *
 * @param supabase - Supabase client
 * @param userId - User ID (for security)
 * @param leadIds - Array of lead IDs to delete
 * @returns Number of deleted leads
 */
export async function deleteCRMLeads(
  supabase: SupabaseClient<Database>,
  userId: string,
  leadIds: string[]
): Promise<number> {
  const { data, error } = await supabase
    .from('crm_leads')
    .delete()
    .eq('user_id', userId)
    .in('id', leadIds)
    .select('id')

  if (error) {
    throw new Error(`Failed to delete CRM leads: ${error.message}`)
  }

  return data?.length || 0
}

/**
 * Gets CRM statistics for a user
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns CRM statistics
 */
export async function getCRMStats(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('crm_leads')
    .select('dnc_status')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to fetch CRM stats: ${error.message}`)
  }

  const stats = {
    total: data?.length || 0,
    clean: 0,
    dnc: 0,
    risky: 0,
    unknown: 0,
  }

  for (const lead of data || []) {
    // dnc_status is now a boolean: false = clean, true = dnc
    if (lead.dnc_status === false) {
      stats.clean++
    } else if (lead.dnc_status === true) {
      stats.dnc++
    } else {
      stats.unknown++
    }
  }

  return stats
}
