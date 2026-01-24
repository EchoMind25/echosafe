import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeadStatus, RiskLevel } from '@/lib/supabase/types'
// Phase 2: CRM integration auto-sync
// import { processAutoSync } from '@/lib/integrations/sync-engine'

// ============================================================================
// GET - List leads with pagination, search, and filters
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const riskLevel = searchParams.get('riskLevel')
    const tags = searchParams.get('tags')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const minRisk = searchParams.get('minRisk')
    const maxRisk = searchParams.get('maxRisk')

    const offset = (page - 1) * limit

    // Build query - exclude soft deleted leads
    let query = supabase
      .from('crm_leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .is('deleted_at', null)

    // Apply search filter (searches name, phone, email)
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone_number.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    // Apply status filter
    if (status) {
      const statuses = status.split(',') as LeadStatus[]
      query = query.in('status', statuses)
    }

    // Apply risk level filter
    if (riskLevel) {
      const levels = riskLevel.split(',') as RiskLevel[]
      query = query.in('risk_level', levels)
    }

    // Apply risk score range filter
    if (minRisk) {
      query = query.gte('risk_score', parseInt(minRisk))
    }
    if (maxRisk) {
      query = query.lte('risk_score', parseInt(maxRisk))
    }

    // Apply tags filter (array contains)
    if (tags) {
      const tagArray = tags.split(',')
      query = query.overlaps('tags', tagArray)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'first_name', 'last_name', 'risk_score', 'status', 'phone_number']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: leads, error: leadsError, count } = await query

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get unique tags for filter dropdown
    const { data: allTags } = await supabase
      .from('crm_leads')
      .select('tags')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .not('tags', 'is', null)

    const uniqueTags = [...new Set((allTags || []).flatMap(t => t.tags || []))]

    return NextResponse.json({
      success: true,
      data: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      meta: {
        availableTags: uniqueTags,
      },
    })

  } catch (error) {
    console.error('CRM leads error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST - Create a new lead
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
    const {
      phone_number,
      first_name,
      last_name,
      email,
      address,
      city,
      state,
      zip_code,
      source,
      tags,
      notes,
      status = 'new',
    } = body

    // Validate required fields
    if (!phone_number) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number (remove non-digits)
    const normalizedPhone = phone_number.replace(/\D/g, '')

    // Check for duplicate phone number
    const { data: existing } = await supabase
      .from('crm_leads')
      .select('id, phone_number')
      .eq('user_id', user.id)
      .eq('phone_number', normalizedPhone)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'A lead with this phone number already exists',
          duplicate: { id: existing.id, phone_number: existing.phone_number }
        },
        { status: 409 }
      )
    }

    // Create lead
    const { data: lead, error: createError } = await supabase
      .from('crm_leads')
      .insert({
        user_id: user.id,
        phone_number: normalizedPhone,
        first_name: first_name || null,
        last_name: last_name || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        source: source || null,
        tags: tags || [],
        notes: notes || null,
        status,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating lead:', createError)
      return NextResponse.json(
        { success: false, message: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'crm_lead_created',
      event_data: { lead_id: lead.id, source },
    })

    // Phase 2: Trigger CRM auto-sync (non-blocking)
    // processAutoSync(user.id, {
    //   id: lead.id,
    //   phone_number: lead.phone_number,
    //   first_name: lead.first_name,
    //   last_name: lead.last_name,
    //   email: lead.email,
    //   address: lead.address,
    //   city: lead.city,
    //   state: lead.state,
    //   zip_code: lead.zip_code,
    //   risk_score: lead.risk_score,
    //   tags: lead.tags,
    //   notes: lead.notes,
    //   source: lead.source || 'Manual Entry',
    // }).catch(err => {
    //   console.error('CRM auto-sync error:', err)
    // })

    return NextResponse.json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
    }, { status: 201 })

  } catch (error) {
    console.error('Create lead error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
