import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leadsToCSV } from '@/lib/utils/export-csv'
import type { CrmLead } from '@/types'
import type { LeadStatus } from '@/lib/supabase/types'

// Database row type for crm_leads table
interface CrmLeadRow {
  id: string
  user_id: string
  phone_number: string
  first_name: string | null
  last_name: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  risk_score: number | null
  risk_level: string | null
  dnc_status: boolean | null
  last_scrubbed_at: string | null
  status: string | null
  source: string | null
  tags: string[] | null
  notes: string | null
  assigned_to: string | null
  last_contact_at: string | null
  next_followup_at: string | null
  contact_count: number | null
  custom_fields: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

// ============================================================================
// POST - Bulk operations on leads
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, lead_ids, data } = body as {
      action: 'update_status' | 'add_tags' | 'remove_tags' | 'delete' | 'permanent_delete' | 'export'
      lead_ids: string[]
      data?: {
        status?: string
        tags?: string[]
      }
    }

    // Validate input
    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      )
    }

    if (!lead_ids || !Array.isArray(lead_ids) || lead_ids.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Lead IDs are required' },
        { status: 400 }
      )
    }

    // Limit bulk operations to prevent DoS
    const MAX_BULK_LEADS = 1000
    if (lead_ids.length > MAX_BULK_LEADS) {
      return NextResponse.json(
        { success: false, message: `Maximum ${MAX_BULK_LEADS} leads per bulk operation` },
        { status: 400 }
      )
    }

    // Verify all leads belong to user
    const { data: existingLeads, error: verifyError } = await supabase
      .from('crm_leads')
      .select('id, tags')
      .eq('user_id', user.id)
      .in('id', lead_ids)

    if (verifyError) {
      return NextResponse.json(
        { success: false, message: 'Failed to verify leads' },
        { status: 500 }
      )
    }

    const validIds = (existingLeads || []).map(l => l.id)
    const invalidCount = lead_ids.length - validIds.length

    if (validIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid leads found' },
        { status: 404 }
      )
    }

    let result: { success: boolean; affected: number; message: string; data?: unknown }

    switch (action) {
      case 'update_status': {
        if (!data?.status) {
          return NextResponse.json(
            { success: false, message: 'Status is required for update_status action' },
            { status: 400 }
          )
        }

        const { error: updateError, count } = await supabase
          .from('crm_leads')
          .update({
            status: data.status as LeadStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .in('id', validIds)
          .is('deleted_at', null)

        if (updateError) {
          return NextResponse.json(
            { success: false, message: 'Failed to update leads' },
            { status: 500 }
          )
        }

        result = {
          success: true,
          affected: count || validIds.length,
          message: `Updated status to "${data.status}" for ${count || validIds.length} leads`,
        }
        break
      }

      case 'add_tags': {
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { success: false, message: 'Tags array is required for add_tags action' },
            { status: 400 }
          )
        }

        // Update each lead's tags (merge with existing)
        let updated = 0
        for (const lead of existingLeads || []) {
          const currentTags = lead.tags || []
          const newTags = [...new Set([...currentTags, ...data.tags])]

          const { error } = await supabase
            .from('crm_leads')
            .update({
              tags: newTags,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)
            .eq('user_id', user.id)

          if (!error) updated++
        }

        result = {
          success: true,
          affected: updated,
          message: `Added tags to ${updated} leads`,
        }
        break
      }

      case 'remove_tags': {
        if (!data?.tags || !Array.isArray(data.tags)) {
          return NextResponse.json(
            { success: false, message: 'Tags array is required for remove_tags action' },
            { status: 400 }
          )
        }

        // Update each lead's tags (remove specified)
        let updated = 0
        for (const lead of existingLeads || []) {
          const currentTags = lead.tags || []
          const newTags = currentTags.filter((t: string) => !data.tags?.includes(t))

          const { error } = await supabase
            .from('crm_leads')
            .update({
              tags: newTags,
              updated_at: new Date().toISOString(),
            })
            .eq('id', lead.id)
            .eq('user_id', user.id)

          if (!error) updated++
        }

        result = {
          success: true,
          affected: updated,
          message: `Removed tags from ${updated} leads`,
        }
        break
      }

      case 'delete': {
        // Soft delete
        const { error: deleteError, count } = await supabase
          .from('crm_leads')
          .update({
            deleted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .in('id', validIds)
          .is('deleted_at', null)

        if (deleteError) {
          return NextResponse.json(
            { success: false, message: 'Failed to delete leads' },
            { status: 500 }
          )
        }

        result = {
          success: true,
          affected: count || validIds.length,
          message: `Deleted ${count || validIds.length} leads. They can be recovered within 30 days.`,
        }
        break
      }

      case 'permanent_delete': {
        const { error: deleteError, count } = await supabase
          .from('crm_leads')
          .delete()
          .eq('user_id', user.id)
          .in('id', validIds)

        if (deleteError) {
          return NextResponse.json(
            { success: false, message: 'Failed to permanently delete leads' },
            { status: 500 }
          )
        }

        result = {
          success: true,
          affected: count || validIds.length,
          message: `Permanently deleted ${count || validIds.length} leads.`,
        }
        break
      }

      case 'export': {
        // Fetch full lead data for export
        const { data: leadsToExport, error: fetchError } = await supabase
          .from('crm_leads')
          .select('*')
          .eq('user_id', user.id)
          .in('id', validIds)
          .is('deleted_at', null) as unknown as { data: CrmLeadRow[] | null; error: Error | null }

        if (fetchError) {
          return NextResponse.json(
            { success: false, message: 'Failed to fetch leads for export' },
            { status: 500 }
          )
        }

        // Convert database format to CrmLead type (convert null to undefined)
        const formattedLeads: CrmLead[] = (leadsToExport || []).map(l => ({
          id: l.id,
          userId: l.user_id,
          phoneNumber: l.phone_number,
          firstName: l.first_name ?? undefined,
          lastName: l.last_name ?? undefined,
          email: l.email ?? undefined,
          address: l.address ?? undefined,
          city: l.city ?? undefined,
          state: l.state ?? undefined,
          zipCode: l.zip_code ?? undefined,
          riskScore: l.risk_score ?? undefined,
          riskLevel: l.risk_level?.toUpperCase() as CrmLead['riskLevel'],
          dncStatus: Boolean(l.dnc_status),
          lastScrubbed: l.last_scrubbed_at ? new Date(l.last_scrubbed_at) : undefined,
          status: (l.status?.toUpperCase() || 'NEW') as CrmLead['status'],
          source: l.source ?? undefined,
          tags: l.tags || [],
          notes: l.notes ?? undefined,
          assignedTo: l.assigned_to ?? undefined,
          lastContactAt: l.last_contact_at ? new Date(l.last_contact_at) : undefined,
          nextFollowupAt: l.next_followup_at ? new Date(l.next_followup_at) : undefined,
          contactCount: l.contact_count || 0,
          customFields: l.custom_fields || {},
          createdAt: new Date(l.created_at),
          updatedAt: new Date(l.updated_at),
        }))

        const csvContent = leadsToCSV(formattedLeads)

        result = {
          success: true,
          affected: formattedLeads.length,
          message: `Exported ${formattedLeads.length} leads`,
          data: { csv: csvContent },
        }
        break
      }

      default:
        return NextResponse.json(
          { success: false, message: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_bulk_action',
      event_data: {
        action,
        lead_count: validIds.length,
        invalid_count: invalidCount,
      },
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
