// supabase/functions/dnc-scrub/index.ts
// Edge Function for DNC scrubbing leads against the database.
// Replaces the N8N webhook flow — runs the same batch logic close to the DB.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// CORS
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================================
// TYPES
// ============================================================================

interface LeadInput {
  phone_number: string
  first_name?: string
  last_name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  [key: string]: unknown
}

interface ProcessedLead extends LeadInput {
  phone_number: string
  risk_score: number
  risk_flags: string[]
  dnc_status: 'clean' | 'caution' | 'blocked'
}

interface DncScrubRequest {
  job_id: string
  user_id: string
  leads: LeadInput[]
}

interface BatchStats {
  total: number
  safe: number
  caution: number
  blocked: number
  areaCodes: string[]
  recentlyPorted: number
  litigators: number
  deletedNumbers: number
  duplicatesRemoved: number
  averageRiskScore?: number
}

interface InsightsResult {
  warnings: string[]
  recommendations: string[]
  compliance_grade: 'A' | 'B' | 'C' | 'D' | 'F'
  compliance_score: number
  summary: string
  industry_tips: string[]
  risk_analysis: string
  generated_at: string
  legal_disclaimer: string
}

type IndustryType =
  | 'real-estate'
  | 'solar'
  | 'insurance'
  | 'home-services'
  | 'financial-services'
  | 'other'

// ============================================================================
// PHONE NORMALIZATION
// ============================================================================

function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/\D/g, '')
  if (normalized.length === 11 && normalized.startsWith('1')) {
    normalized = normalized.slice(1)
  }
  return normalized
}

// ============================================================================
// BATCH DNC CHECKING (ported from src/lib/utils/batch-dnc-check.ts)
// ============================================================================

async function processLeadsBatch(
  leads: LeadInput[],
  supabase: SupabaseClient
): Promise<ProcessedLead[]> {
  if (leads.length === 0) return []

  const normalizedLeads = leads.map(lead => ({
    ...lead,
    phone_number: normalizePhoneNumber(lead.phone_number),
  }))

  const phoneNumbers = [
    ...new Set(normalizedLeads.map(l => l.phone_number).filter(p => p.length === 10)),
  ]

  if (phoneNumbers.length === 0) {
    return normalizedLeads.map(lead => ({
      ...lead,
      risk_score: 0,
      risk_flags: ['invalid_phone_number'],
      dnc_status: 'caution' as const,
    }))
  }

  // Batch query: active DNC entries
  const { data: dncResults } = await supabase
    .from('dnc_registry')
    .select('phone_number')
    .in('phone_number', phoneNumbers)
    .eq('record_status', 'active')

  const dncSet = new Set(dncResults?.map((r: { phone_number: string }) => r.phone_number) || [])

  // Batch query: recently removed numbers
  const { data: deletedResults } = await supabase
    .from('dnc_deleted_numbers')
    .select('phone_number, times_added_removed')
    .in('phone_number', phoneNumbers)

  const deletedMap = new Map<string, number>(
    deletedResults?.map((r: { phone_number: string; times_added_removed: number }) => [
      r.phone_number,
      r.times_added_removed,
    ]) || []
  )

  // Batch query: known litigators
  const { data: litigatorResults } = await supabase
    .from('litigators')
    .select('phone_number, case_count, risk_level')
    .in('phone_number', phoneNumbers)

  const litigatorMap = new Map<
    string,
    { case_count: number; risk_level: string }
  >(
    litigatorResults?.map(
      (r: { phone_number: string; case_count: number; risk_level: string }) => [
        r.phone_number,
        { case_count: r.case_count, risk_level: r.risk_level },
      ]
    ) || []
  )

  // Score each lead in memory
  return normalizedLeads.map(lead => {
    const phone = lead.phone_number
    let score = 0
    const flags: string[] = []

    if (phone.length !== 10) {
      return {
        ...lead,
        risk_score: 0,
        risk_flags: ['invalid_phone_number'],
        dnc_status: 'caution' as const,
      }
    }

    if (dncSet.has(phone)) {
      score += 60
      flags.push('federal_dnc')
    }

    if (deletedMap.has(phone)) {
      score += 20
      flags.push('recently_removed_dnc')
      const timesRemoved = deletedMap.get(phone) || 0
      if (timesRemoved > 1) {
        score += 15
        flags.push('pattern_add_remove')
      }
    }

    if (litigatorMap.has(phone)) {
      const info = litigatorMap.get(phone)!
      score += 25
      flags.push('known_litigator')
      if (info.case_count > 5 || info.risk_level === 'critical') {
        score += 10
        flags.push('serial_litigator')
      }
    }

    let dnc_status: 'clean' | 'caution' | 'blocked'
    if (score >= 60) dnc_status = 'blocked'
    else if (score > 20) dnc_status = 'caution'
    else dnc_status = 'clean'

    return { ...lead, phone_number: phone, risk_score: score, risk_flags: flags, dnc_status }
  })
}

async function processLeadsInChunks(
  leads: LeadInput[],
  supabase: SupabaseClient,
  chunkSize = 1000
): Promise<ProcessedLead[]> {
  const results: ProcessedLead[] = []
  for (let i = 0; i < leads.length; i += chunkSize) {
    const chunk = leads.slice(i, i + chunkSize)
    const processed = await processLeadsBatch(chunk, supabase)
    results.push(...processed)
  }
  return results
}

// ============================================================================
// BATCH STATS
// ============================================================================

function calculateBatchStats(
  processedLeads: ProcessedLead[],
  duplicatesRemoved: number
): BatchStats {
  const total = processedLeads.length
  const safe = processedLeads.filter(l => l.dnc_status === 'clean').length
  const caution = processedLeads.filter(l => l.dnc_status === 'caution').length
  const blocked = processedLeads.filter(l => l.dnc_status === 'blocked').length
  const areaCodes = [...new Set(processedLeads.map(l => l.phone_number.substring(0, 3)))]
  const averageRiskScore =
    total > 0
      ? Math.round(processedLeads.reduce((sum, l) => sum + l.risk_score, 0) / total)
      : 0

  return {
    total,
    safe,
    caution,
    blocked,
    areaCodes,
    recentlyPorted: processedLeads.filter(l => l.risk_flags.includes('recently_ported')).length,
    litigators: processedLeads.filter(l => l.risk_flags.includes('known_litigator')).length,
    deletedNumbers: processedLeads.filter(l => l.risk_flags.includes('recently_removed_dnc')).length,
    duplicatesRemoved,
    averageRiskScore,
  }
}

// ============================================================================
// COMPLIANCE GRADE
// ============================================================================

function calculateComplianceGrade(stats: BatchStats): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; score: number } {
  const safePercent = stats.total > 0 ? (stats.safe / stats.total) * 100 : 0
  let score = safePercent

  if (stats.litigators > 0) score -= Math.min(15, stats.litigators * 5)
  if (stats.recentlyPorted > 0) score -= Math.min(10, (stats.recentlyPorted / stats.total) * 20)
  if (stats.deletedNumbers > 0) score -= Math.min(5, (stats.deletedNumbers / stats.total) * 10)

  score = Math.max(0, Math.min(100, Math.round(score)))

  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (score >= 90) grade = 'A'
  else if (score >= 80) grade = 'B'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'
  else grade = 'F'

  return { grade, score }
}

// ============================================================================
// INDUSTRY HELPERS
// ============================================================================

function normalizeIndustry(industry: string): IndustryType {
  const n = industry.toLowerCase()
  if (n.includes('real-estate') || n.includes('realestate') || n.includes('real estate')) return 'real-estate'
  if (n.includes('solar')) return 'solar'
  if (n.includes('insurance')) return 'insurance'
  if (n.includes('home-service') || n.includes('hvac') || n.includes('roofing') || n.includes('window')) return 'home-services'
  if (n.includes('financial') || n.includes('finance')) return 'financial-services'
  return 'other'
}

const INDUSTRY_BEST_PRACTICES: Record<IndustryType, string[]> = {
  'real-estate': [
    'Focus on clean leads first for maximum ROI',
    'Best call window: Tuesday-Thursday 10am-2pm local time',
    'Use proper real estate disclosure scripts',
  ],
  'solar': [
    'Best call window: Weekday evenings 5-7pm (homeowners available)',
    'Use qualification script before full pitch',
    'Focus on homeowners in qualifying areas only',
  ],
  'insurance': [
    'Verify age before calling (senior protections apply 65+)',
    'Avoid health-related claims without proper licensing',
    'Focus on needs-based selling, not fear tactics',
  ],
  'home-services': [
    'Focus on seasonal service reminders',
    'Verify licensing is current before calling',
    'Use qualification scripts for installations',
  ],
  'financial-services': [
    'Verify licensing before any product discussions',
    'Use approved scripts and disclosures',
    'Document all communications',
  ],
  'other': [
    'Always scrub against DNC before calling',
    'Maintain detailed call records',
    'Train staff on compliance requirements',
  ],
}

// ============================================================================
// LEGAL DISCLAIMER
// ============================================================================

const LEGAL_DISCLAIMER = `
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

\u26a0\ufe0f LEGAL DISCLAIMER

This analysis is INFORMATIONAL ONLY and does NOT constitute legal
advice, compliance guidance, or recommendations.

Echo Safe is NOT a law firm. We are NOT attorneys. You remain SOLELY
responsible for compliance with TCPA and all telemarketing laws.

BEFORE MAKING CALLS: Consult a qualified TCPA compliance attorney.
Verify all information independently. You are personally liable for
violations ($500-$1,500 per call).

\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`

// ============================================================================
// FALLBACK INSIGHTS (when Anthropic API key is not set)
// ============================================================================

function generateFallbackInsights(stats: BatchStats, industry: IndustryType): InsightsResult {
  const { grade, score } = calculateComplianceGrade(stats)
  const tips = INDUSTRY_BEST_PRACTICES[industry]

  const warnings: string[] = []
  if (stats.litigators > 0) {
    warnings.push(
      `Risk Factor Detected: ${stats.litigators} leads match known TCPA litigator records in public PACER database. Consider consulting attorney before proceeding.`
    )
  }
  if (stats.recentlyPorted > 0) {
    warnings.push(
      `Risk Factor Detected: ${stats.recentlyPorted} numbers show recent mobile porting patterns. Industry data suggests written consent is typically obtained for mobile autodialers.`
    )
  }
  if (stats.blocked > stats.total * 0.3) {
    warnings.push(
      `Pattern Observed: High DNC block rate (${Math.round((stats.blocked / stats.total) * 100)}%) detected in this batch. Data indicates reviewing lead sources may improve data quality.`
    )
  }

  const recommendations = [
    `Data indicates ${stats.safe} leads show low risk patterns`,
    `Pattern observed: Industry data suggests focusing on clean leads first`,
    `Common industry practice: Maintaining detailed call records for documentation`,
    `Consider consulting a TCPA attorney regarding your specific requirements`,
  ]

  const summary =
    score >= 80
      ? 'Based on data patterns, this batch shows low risk characteristics.'
      : score >= 60
        ? 'Based on data patterns, this batch shows moderate risk characteristics. Data indicates focusing on clean leads.'
        : 'Based on data patterns, this batch shows elevated risk characteristics. Consider consulting an attorney.'

  return {
    warnings,
    recommendations,
    compliance_grade: grade,
    compliance_score: score,
    summary,
    industry_tips: tips.map(tip => `Industry data suggests: ${tip}`),
    risk_analysis: `Data shows ${stats.blocked} leads with DNC flags, ${stats.caution} with caution flags. ${stats.litigators > 0 ? `Pattern match with ${stats.litigators} known litigator records.` : ''}`,
    generated_at: new Date().toISOString(),
    legal_disclaimer: LEGAL_DISCLAIMER,
  }
}

// ============================================================================
// AI INSIGHTS (via Anthropic API)
// ============================================================================

const FORBIDDEN_PHRASES = [
  'you must', 'you should', 'you need to', 'this violates',
  'you are required', 'do not call', 'you can call',
  'you are compliant', 'guarantees compliance', 'recommended action:',
]

async function generateInsights(
  stats: BatchStats,
  userIndustry: string
): Promise<InsightsResult> {
  const industry = normalizeIndustry(userIndustry)
  const { grade, score } = calculateComplianceGrade(stats)
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')

  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not configured, using fallback insights')
    return generateFallbackInsights(stats, industry)
  }

  try {
    const prompt = `You are generating INFORMATIONAL data analysis for a lead screening tool.

CRITICAL LEGAL CONSTRAINTS: YOU ARE NOT A LAWYER. You are analyzing DATA PATTERNS only.

FORBIDDEN: "You must", "You should", "You need to", "This violates", "You are required", "Do not call", "You can call", "You are compliant", "guarantees compliance", "Recommended action:"
USE INSTEAD: "Data indicates...", "Risk factor detected:", "Pattern observed:", "Common industry practice:", "Consider consulting an attorney about..."

Analyze ${stats.total} leads for ${industry} industry.

BATCH DATA:
- Clean (low risk): ${stats.safe} leads (${Math.round((stats.safe / stats.total) * 100)}%)
- Caution flags: ${stats.caution} leads (${Math.round((stats.caution / stats.total) * 100)}%)
- High risk flags: ${stats.blocked} leads (${Math.round((stats.blocked / stats.total) * 100)}%)
- Recently ported to mobile: ${stats.recentlyPorted} numbers
- Match known litigators: ${stats.litigators} numbers
- Recently removed from DNC: ${stats.deletedNumbers} numbers
- Duplicates removed: ${stats.duplicatesRemoved}
- Area codes present: ${stats.areaCodes.join(', ') || 'N/A'}
${stats.averageRiskScore !== undefined ? `- Average risk score: ${stats.averageRiskScore}` : ''}

Respond with ONLY valid JSON (no markdown code blocks):
{
  "warnings": ["1-3 risk factors using 'Risk factor:' language"],
  "recommendations": ["3-4 data observations using 'Data indicates' language"],
  "summary": "1-2 sentence data quality summary",
  "risk_analysis": "1-2 sentence analysis using 'Data shows' language",
  "industry_tips": ["2-3 common industry practices"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      console.error('Anthropic API error:', response.status, await response.text())
      return generateFallbackInsights(stats, industry)
    }

    const data = await response.json()
    const textBlock = data.content?.find((c: { type: string }) => c.type === 'text')
    if (!textBlock) {
      return generateFallbackInsights(stats, industry)
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
    }

    let parsed: {
      warnings: string[]
      recommendations: string[]
      summary: string
      risk_analysis: string
      industry_tips: string[]
    }

    try {
      parsed = JSON.parse(jsonText)
    } catch {
      console.warn('Failed to parse AI response JSON, using fallback')
      return generateFallbackInsights(stats, industry)
    }

    // Check for forbidden phrases
    const allText = [
      ...(parsed.warnings || []),
      ...(parsed.recommendations || []),
      parsed.summary || '',
      parsed.risk_analysis || '',
      ...(parsed.industry_tips || []),
    ].join(' ').toLowerCase()

    for (const phrase of FORBIDDEN_PHRASES) {
      if (allText.includes(phrase)) {
        console.error(`AI generated forbidden phrase: "${phrase}", using fallback`)
        return generateFallbackInsights(stats, industry)
      }
    }

    return {
      warnings: parsed.warnings || [],
      recommendations: parsed.recommendations || [],
      compliance_grade: grade,
      compliance_score: score,
      summary: parsed.summary || 'Analysis complete.',
      industry_tips: parsed.industry_tips || INDUSTRY_BEST_PRACTICES[industry],
      risk_analysis: parsed.risk_analysis || '',
      generated_at: new Date().toISOString(),
      legal_disclaimer: LEGAL_DISCLAIMER,
    }
  } catch (error) {
    console.error('AI insights error:', error)
    return generateFallbackInsights(stats, industry)
  }
}

// ============================================================================
// COMPLIANCE AUDIT LOGGING
// ============================================================================

async function logComplianceAudit(
  supabase: SupabaseClient,
  userId: string,
  jobId: string,
  processedLeads: ProcessedLead[]
): Promise<void> {
  try {
    const { data: userData } = await supabase
      .from('users')
      .select('email, company_name, industry')
      .eq('id', userId)
      .single()

    const retentionDate = new Date()
    retentionDate.setFullYear(retentionDate.getFullYear() + 5)
    const retentionUntil = retentionDate.toISOString().split('T')[0]

    const complianceLogs = processedLeads.map(lead => {
      const phoneDigits = lead.phone_number?.replace(/\D/g, '') || ''
      return {
        user_id: userId,
        user_email: userData?.email || 'unknown',
        company_name: userData?.company_name || 'Individual',
        phone_number: phoneDigits,
        area_code: phoneDigits.substring(0, 3),
        dnc_status: lead.dnc_status,
        risk_score: lead.risk_score ?? null,
        check_purpose: 'lead_scrubbing',
        industry: userData?.industry || 'other',
        upload_job_id: jobId,
        result_data: { risk_flags: lead.risk_flags || [] },
        retention_until: retentionUntil,
        source: 'web',
        ip_address: null,
      }
    })

    // Insert in batches of 500
    const BATCH_SIZE = 500
    for (let i = 0; i < complianceLogs.length; i += BATCH_SIZE) {
      const batch = complianceLogs.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from('compliance_audit_logs').insert(batch)
      if (error) {
        console.error(`Failed to log compliance audit batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error)
      }
    }
    console.log(`Logged ${complianceLogs.length} compliance audit entries for job ${jobId}`)
  } catch (err) {
    console.error('Compliance audit logging failed (non-blocking):', err)
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Parse request
  let payload: DncScrubRequest
  try {
    payload = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { job_id, user_id, leads } = payload

  if (!job_id || !user_id || !leads || !Array.isArray(leads)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Missing required fields: job_id, user_id, leads' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create admin Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const startTime = Date.now()

  try {
    // Process leads against DNC database
    const processedLeads = await processLeadsInChunks(leads, supabase)

    // Get the job to read duplicates_removed
    const { data: jobData } = await supabase
      .from('upload_history')
      .select('duplicates_removed')
      .eq('id', job_id)
      .single()

    const duplicatesRemoved = jobData?.duplicates_removed || 0
    const stats = calculateBatchStats(processedLeads, duplicatesRemoved)
    const processingTimeMs = Date.now() - startTime

    // Get user industry for AI insights
    const { data: authData } = await supabase.auth.admin.getUserById(user_id)
    const userIndustry = authData?.user?.user_metadata?.industry || 'other'

    // Generate AI insights (with fallback)
    let aiInsights: InsightsResult | null = null
    try {
      aiInsights = await generateInsights(stats, userIndustry)
    } catch (error) {
      console.error('AI insights generation failed (non-blocking):', error)
    }

    // Update upload_history with results
    await supabase
      .from('upload_history')
      .update({
        status: 'completed',
        clean_leads: stats.safe,
        dnc_blocked: stats.blocked,
        caution_leads: stats.caution,
        ai_insights: aiInsights,
        pending_leads: null, // Clear stored leads after processing
        completed_at: new Date().toISOString(),
      })
      .eq('id', job_id)

    // Update user stats
    const { data: currentUser } = await supabase
      .from('users')
      .select('total_leads_scrubbed')
      .eq('id', user_id)
      .single()

    const currentTotal = currentUser?.total_leads_scrubbed || 0
    await supabase
      .from('users')
      .update({
        total_leads_scrubbed: currentTotal + stats.total,
        last_scrub_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user_id)

    // Log TCPA compliance audit entries
    await logComplianceAudit(supabase, user_id, job_id, processedLeads)

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id,
      event_type: 'scrub_job_completed',
      event_data: {
        job_id,
        total_leads: stats.total,
        clean_leads: stats.safe,
        dnc_blocked: stats.blocked,
        caution_leads: stats.caution,
        processing_time_ms: processingTimeMs,
        compliance_rate: stats.total > 0 ? `${Math.round((stats.safe / stats.total) * 100)}%` : '100%',
      },
    })

    console.log(
      `Job ${job_id} completed: ${stats.total} leads processed (${stats.safe} clean, ${stats.caution} caution, ${stats.blocked} blocked) in ${processingTimeMs}ms`
    )

    return new Response(
      JSON.stringify({
        success: true,
        job_id,
        stats: { total: stats.total, clean: stats.safe, caution: stats.caution, blocked: stats.blocked },
        processing_time_ms: processingTimeMs,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error'
    console.error(`Job ${job_id} failed:`, error)

    // Mark job as failed
    try {
      await supabase
        .from('upload_history')
        .update({
          status: 'failed',
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq('id', job_id)
    } catch (updateError) {
      console.error('Failed to update job status to failed:', updateError)
    }

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
