import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// TYPES
// ============================================================================

interface InsightsRequest {
  jobId: string
  stats: {
    totalLeads: number
    cleanLeads: number
    dncBlocked: number
    cautionLeads: number
    duplicatesRemoved: number
    complianceRate: number
    averageRiskScore?: number
  }
}

interface InsightsResponse {
  success: boolean
  insights?: {
    summary: string
    recommendations: string[]
    riskAnalysis: string
    industryTips: string[]
    complianceNotes: string[]
  }
  privacyNotice: string
  error?: string
}

// ============================================================================
// INDUSTRY-SPECIFIC PROMPTS
// ============================================================================

const INDUSTRY_PROMPTS: Record<string, string> = {
  'real-estate-residential': `You are an AI compliance analyst specializing in real estate residential cold calling.
Focus on: TCPA regulations for real estate, best times to call homeowners, seller vs buyer lead differences,
expired listing considerations, and state-specific real estate calling laws.`,

  'real-estate-commercial': `You are an AI compliance analyst specializing in commercial real estate outreach.
Focus on: B2B exemptions under TCPA, commercial property owner contact rules, broker-to-broker communications,
and commercial real estate specific compliance considerations.`,

  'solar': `You are an AI compliance analyst specializing in solar sales compliance.
Focus on: Solar-specific TCPA enforcement actions, state solar incentive communication rules,
door-to-door vs phone sales regulations, and utility company data usage compliance.`,

  'insurance-life': `You are an AI compliance analyst specializing in life insurance sales compliance.
Focus on: Insurance-specific TCPA exemptions, state insurance commissioner requirements,
licensed agent calling rules, and Medicare/senior-targeted calling restrictions.`,

  'insurance-health': `You are an AI compliance analyst specializing in health insurance compliance.
Focus on: ACA enrollment period rules, Medicare calling restrictions, state health insurance regulations,
and HIPAA considerations when discussing health coverage.`,

  'insurance-auto-home': `You are an AI compliance analyst specializing in auto and home insurance compliance.
Focus on: Property/casualty insurance calling rules, state-specific insurance regulations,
claims-related contact rules, and multi-policy upselling compliance.`,

  'financial-services': `You are an AI compliance analyst specializing in financial services compliance.
Focus on: TCPA and financial services, SEC communication rules, debt collection calling rules,
investment-related solicitation regulations, and state financial services laws.`,

  'home-services-hvac': `You are an AI compliance analyst specializing in HVAC service calls.
Focus on: Home services TCPA compliance, emergency service exceptions, maintenance reminder rules,
and seasonal promotion calling best practices.`,

  'home-services-roofing': `You are an AI compliance analyst specializing in roofing service outreach.
Focus on: Storm chasing regulations, post-disaster calling rules, contractor licensing requirements,
and home improvement calling restrictions.`,

  'home-services-windows': `You are an AI compliance analyst specializing in windows and siding sales.
Focus on: Home improvement TCPA rules, do-not-knock list compliance, showroom invitation rules,
and in-home appointment setting regulations.`,

  'b2b-services': `You are an AI compliance analyst specializing in B2B services compliance.
Focus on: B2B exemptions under TCPA, business decision-maker outreach rules, trade show follow-up compliance,
and commercial relationship establishment.`,

  'other': `You are an AI compliance analyst specializing in TCPA and DNC compliance.
Focus on: General TCPA best practices, FTC telemarketing rules, state-specific calling regulations,
and industry-neutral compliance recommendations.`,
}

// ============================================================================
// POST - Generate AI Insights
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse<InsightsResponse>> {
  try {
    const supabase = await createClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', privacyNotice: '' },
        { status: 401 }
      )
    }

    // Get user's industry from user metadata (stored during signup)
    const industry = user.user_metadata?.industry || 'other'
    const industryCustom = user.user_metadata?.industry_custom

    // Parse request
    const body: InsightsRequest = await request.json()
    const { stats, jobId } = body

    if (!stats) {
      return NextResponse.json(
        { success: false, error: 'Stats are required', privacyNotice: '' },
        { status: 400 }
      )
    }

    // Check for Claude API key
    const anthropicKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
    if (!anthropicKey) {
      // Return default insights if no API key
      return NextResponse.json({
        success: true,
        insights: {
          summary: `Your scrub completed with a ${stats.complianceRate}% compliance rate. ${stats.cleanLeads} leads are safe to call.`,
          recommendations: [
            'Review DNC-blocked leads to ensure they are removed from your calling lists',
            'Consider re-scrubbing leads monthly to catch new DNC registrations',
            'Document your scrubbing process for compliance records',
          ],
          riskAnalysis: `${stats.dncBlocked} leads were on the Do Not Call registry. ${stats.cautionLeads} leads have elevated risk factors.`,
          industryTips: [
            'Always verify consent before calling',
            'Keep records of all scrubbing activities',
            'Update your lists regularly',
          ],
          complianceNotes: [
            'FTC fines for DNC violations range from $500-$1,500 per call',
            'State DNC lists may have additional requirements',
            'Maintaining scrub records helps in case of complaints',
          ],
        },
        privacyNotice: 'This analysis was generated locally and not stored.',
      })
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: anthropicKey,
    })

    // Get industry-specific prompt
    const basePrompt = INDUSTRY_PROMPTS[industry] || INDUSTRY_PROMPTS['other']
    const industryContext = industryCustom ? `The user specified their industry as: ${industryCustom}` : ''

    // Build the prompt
    const prompt = `${basePrompt}

${industryContext}

Analyze the following lead scrubbing results and provide compliance insights:

SCRUB RESULTS:
- Total Leads Processed: ${stats.totalLeads.toLocaleString()}
- Clean Leads (Safe to Call): ${stats.cleanLeads.toLocaleString()}
- DNC Blocked: ${stats.dncBlocked.toLocaleString()}
- Caution/Risky Leads: ${stats.cautionLeads.toLocaleString()}
- Duplicates Removed: ${stats.duplicatesRemoved.toLocaleString()}
- Compliance Rate: ${stats.complianceRate}%
${stats.averageRiskScore !== undefined ? `- Average Risk Score: ${stats.averageRiskScore}` : ''}

Provide a JSON response with this exact structure (no markdown, just JSON):
{
  "summary": "A 2-3 sentence executive summary of these results",
  "recommendations": ["3-4 specific actionable recommendations"],
  "riskAnalysis": "A brief analysis of the risk profile of this batch",
  "industryTips": ["2-3 industry-specific tips for this user"],
  "complianceNotes": ["2-3 compliance reminders relevant to these results"]
}

Keep responses concise and actionable. Focus on practical advice, not generic warnings.`

    // Call Claude
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let insights
    try {
      // Clean the response (remove any markdown code blocks if present)
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      insights = JSON.parse(jsonText)
    } catch {
      // If JSON parsing fails, create structured response from text
      insights = {
        summary: textContent.text.slice(0, 200),
        recommendations: ['Review your DNC-blocked leads', 'Update your calling lists regularly', 'Maintain compliance documentation'],
        riskAnalysis: `${stats.dncBlocked} leads blocked, ${stats.cautionLeads} require caution`,
        industryTips: ['Follow industry best practices', 'Stay updated on regulations'],
        complianceNotes: ['Document all scrubbing activities', 'Maintain consent records'],
      }
    }

    // Log analytics event (without storing the actual insights)
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'ai_insights_generated',
      event_data: {
        job_id: jobId,
        industry,
        stats_summary: {
          total: stats.totalLeads,
          compliance_rate: stats.complianceRate,
        },
      },
    })

    return NextResponse.json({
      success: true,
      insights,
      privacyNotice: 'This AI analysis was generated in real-time and was not stored. Your lead data was not sent to AI—only aggregate statistics.',
    })

  } catch (error) {
    console.error('AI Insights error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate insights',
        privacyNotice: '',
      },
      { status: 500 }
    )
  }
}
