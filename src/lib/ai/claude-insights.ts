import Anthropic from '@anthropic-ai/sdk'

// ============================================================================
// TYPES
// ============================================================================

export interface BatchStats {
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

export interface InsightsResult {
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

// ============================================================================
// LEGAL DISCLAIMER (appended to all AI outputs)
// ============================================================================

const LEGAL_DISCLAIMER = `
────────────────────────────────────────────────────────────

⚠️ LEGAL DISCLAIMER

This analysis is INFORMATIONAL ONLY and does NOT constitute legal
advice, compliance guidance, or recommendations.

Echo Safe is NOT a law firm. We are NOT attorneys. You remain SOLELY
responsible for compliance with TCPA and all telemarketing laws.

BEFORE MAKING CALLS: Consult a qualified TCPA compliance attorney.
Verify all information independently. You are personally liable for
violations ($500-$1,500 per call).

────────────────────────────────────────────────────────────`

// Forbidden phrases that sound like legal advice
const FORBIDDEN_PHRASES = [
  'you must',
  'you should',
  'you need to',
  'this violates',
  'you are required',
  'do not call',
  'you can call',
  'you are compliant',
  'guarantees compliance',
  'recommended action:'
]

function checkForForbiddenPhrases(text: string): string | null {
  const lowerText = text.toLowerCase()
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lowerText.includes(phrase)) {
      return phrase
    }
  }
  return null
}

export type IndustryType =
  | 'real-estate'
  | 'solar'
  | 'insurance'
  | 'home-services'
  | 'financial-services'
  | 'other'

// ============================================================================
// INDUSTRY-SPECIFIC PROMPTS
// ============================================================================

const INDUSTRY_PROMPTS: Record<IndustryType, {
  context: string
  success_factors: string[]
  risk_factors: string[]
  compliance_notes: string[]
  best_practices: string[]
}> = {
  'real-estate': {
    context: `Real estate agents typically call leads during business hours,
focusing on homeowners interested in buying/selling property.
TCPA compliance is critical as mobile number consent is required.`,
    success_factors: [
      'Homeownership status',
      'Area code demographics (neighborhood value)',
      'Time of day (avoid early morning/late evening)',
      'Day of week (Tuesday-Thursday optimal)'
    ],
    risk_factors: [
      'Recently ported to mobile (requires written consent)',
      'Frequent DNC add/remove patterns',
      'Known litigators (TCPA lawsuits)',
      'State-specific DNC lists'
    ],
    compliance_notes: [
      'TCPA requires written consent for mobile autodialers',
      'Utah state DNC list updates quarterly',
      'FTC Telemarketing Sales Rule applies',
      'Caller ID must display actual number'
    ],
    best_practices: [
      'Focus on clean leads first for maximum ROI',
      'Best call window: Tuesday-Thursday 10am-2pm local time',
      'Use proper real estate disclosure scripts',
      'Maintain call records for compliance'
    ]
  },

  'solar': {
    context: `Solar sales teams contact homeowners about solar panel
installations. Industry saturation has led to higher DNC
rates and FTC scrutiny. New 2026 disclosure requirements.`,
    success_factors: [
      'Homeownership (renters cannot install)',
      'Roof age and condition indicators',
      'Electric bill data availability',
      'State solar incentive programs'
    ],
    risk_factors: [
      'High industry DNC registration rates',
      'Recent installation indicators',
      'HOA restriction patterns in certain zip codes',
      'Frequent solar inquiries (decision fatigue)'
    ],
    compliance_notes: [
      'FTC 2026: New solar-specific disclosure requirements',
      'State incentive changes affect messaging compliance',
      'Installation contract rules vary by state',
      'Mandatory cooling-off periods in most states'
    ],
    best_practices: [
      'Best call window: Weekday evenings 5-7pm (homeowners available)',
      'Use qualification script before full pitch',
      'Focus on homeowners in qualifying areas only',
      'Provide FTC-required disclosures upfront'
    ]
  },

  'insurance': {
    context: `Insurance agents contact individuals about coverage options.
Highly regulated industry with strict compliance requirements
and special protections for seniors.`,
    success_factors: [
      'Age demographics (life stage indicators)',
      'Recent life events (marriage, children, home purchase)',
      'Financial indicators from public records',
      'Existing coverage gaps'
    ],
    risk_factors: [
      'Senior citizens (65+) have special protections',
      'Recent policy purchases or quotes',
      'Health privacy concerns and HIPAA considerations',
      'State insurance commissioner specific rules'
    ],
    compliance_notes: [
      'State insurance licensing required for agents',
      'Senior-specific protections in most states (age 65+)',
      'Health information privacy regulations',
      'Mandatory cooling-off periods for policy sales'
    ],
    best_practices: [
      'Verify age before calling (senior protections apply 65+)',
      'Avoid health-related claims without proper licensing',
      'Focus on needs-based selling, not fear tactics',
      'Document all disclosures and consent properly'
    ]
  },

  'home-services': {
    context: `Home services companies contact homeowners for repairs,
installations, and maintenance. Seasonal patterns affect
call success and compliance requirements vary by state.`,
    success_factors: [
      'Homeownership verification',
      'Seasonal timing (HVAC, roofing)',
      'Property age indicators',
      'Recent home purchase data'
    ],
    risk_factors: [
      'Storm chasing regulations (roofing)',
      'Contractor licensing requirements',
      'Home improvement calling restrictions',
      'Do-not-knock list compliance in some areas'
    ],
    compliance_notes: [
      'Contractor licensing must be current',
      'Post-disaster calling has special rules',
      'Home improvement contract cooling-off periods',
      'State-specific home services regulations'
    ],
    best_practices: [
      'Focus on seasonal service reminders',
      'Verify licensing is current before calling',
      'Use qualification scripts for installations',
      'Document all estimates and agreements'
    ]
  },

  'financial-services': {
    context: `Financial services professionals contact prospects about
investments, loans, and financial products. SEC and state
regulations add layers of compliance requirements.`,
    success_factors: [
      'Income level indicators',
      'Investment experience markers',
      'Life stage financial needs',
      'Existing relationship indicators'
    ],
    risk_factors: [
      'SEC communication rules',
      'State financial licensing requirements',
      'Senior investor protections',
      'Debt collection calling restrictions'
    ],
    compliance_notes: [
      'SEC advertising and communication rules apply',
      'State licensing required for most financial products',
      'Senior investor protections in many states',
      'Written risk disclosures often required'
    ],
    best_practices: [
      'Verify licensing before any product discussions',
      'Use approved scripts and disclosures',
      'Document all communications',
      'Focus on educational approach first'
    ]
  },

  'other': {
    context: `General telemarketing compliance applies to all industries.
Focus on TCPA best practices and FTC regulations.`,
    success_factors: [
      'Verified phone number ownership',
      'Recent engagement indicators',
      'Appropriate contact timing',
      'Clear value proposition'
    ],
    risk_factors: [
      'Federal DNC registration',
      'State-specific DNC lists',
      'Known litigator patterns',
      'Recent number porting activity'
    ],
    compliance_notes: [
      'FTC fines range $500-$16,000 per violation',
      'State attorneys general can enforce additional penalties',
      'Written consent required for auto-dialers',
      'Caller ID must be accurate'
    ],
    best_practices: [
      'Always scrub against DNC before calling',
      'Maintain detailed call records',
      'Train staff on compliance requirements',
      'Regular list hygiene and re-scrubbing'
    ]
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function normalizeIndustry(industry: string): IndustryType {
  const normalized = industry.toLowerCase()

  if (normalized.includes('real-estate') || normalized.includes('realestate') || normalized.includes('real estate')) {
    return 'real-estate'
  }
  if (normalized.includes('solar')) {
    return 'solar'
  }
  if (normalized.includes('insurance')) {
    return 'insurance'
  }
  if (normalized.includes('home-service') || normalized.includes('hvac') || normalized.includes('roofing') || normalized.includes('window')) {
    return 'home-services'
  }
  if (normalized.includes('financial') || normalized.includes('finance')) {
    return 'financial-services'
  }

  return 'other'
}

function calculateComplianceGrade(stats: BatchStats): { grade: 'A' | 'B' | 'C' | 'D' | 'F'; score: number } {
  const safePercent = stats.total > 0 ? (stats.safe / stats.total) * 100 : 0

  // Base score from safe lead percentage
  let score = safePercent

  // Deductions for high-risk indicators
  if (stats.litigators > 0) {
    score -= Math.min(15, stats.litigators * 5) // -5 per litigator, max -15
  }
  if (stats.recentlyPorted > 0) {
    score -= Math.min(10, (stats.recentlyPorted / stats.total) * 20) // up to -10 for ported numbers
  }
  if (stats.deletedNumbers > 0) {
    score -= Math.min(5, (stats.deletedNumbers / stats.total) * 10) // up to -5 for deleted numbers
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, Math.round(score)))

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (score >= 90) grade = 'A'
  else if (score >= 80) grade = 'B'
  else if (score >= 70) grade = 'C'
  else if (score >= 60) grade = 'D'
  else grade = 'F'

  return { grade, score }
}

function buildPrompt(stats: BatchStats, industry: IndustryType, industryData: typeof INDUSTRY_PROMPTS['other']): string {
  return `You are generating INFORMATIONAL data analysis for a lead screening tool.

═══════════════════════════════════════════════════════════
⚠️ CRITICAL LEGAL CONSTRAINTS - READ FIRST
═══════════════════════════════════════════════════════════

YOU ARE NOT A LAWYER. YOU ARE NOT PROVIDING LEGAL ADVICE.
You are analyzing DATA PATTERNS only. Your output is INFORMATIONAL.

FORBIDDEN LANGUAGE (sounds like legal advice):
❌ "You must..."
❌ "You should..."
❌ "You need to..."
❌ "This violates..."
❌ "You are required to..."
❌ "Do not call..."
❌ "You can safely call..."
❌ "You are compliant..."
❌ "This guarantees compliance..."
❌ "Recommended action: [any directive]"

APPROVED LANGUAGE (informational data analysis):
✅ "Data indicates..."
✅ "Risk factor detected:"
✅ "Pattern observed in data:"
✅ "Common industry practice:"
✅ "Based on public data sources..."
✅ "Consider consulting an attorney about..."
✅ "This batch shows characteristics of..."

IF YOU USE FORBIDDEN LANGUAGE, YOU ARE PROVIDING LEGAL ADVICE,
WHICH YOU CANNOT DO. Frame EVERYTHING as data observation.

═══════════════════════════════════════════════════════════
YOUR TASK: Data Pattern Analysis
═══════════════════════════════════════════════════════════

Analyze ${stats.total} leads for ${industry} industry.

BATCH DATA:
- Clean (low risk): ${stats.safe} leads (${Math.round(stats.safe/stats.total*100)}%)
- Caution flags: ${stats.caution} leads (${Math.round(stats.caution/stats.total*100)}%)
- High risk flags: ${stats.blocked} leads (${Math.round(stats.blocked/stats.total*100)}%)
- Recently ported to mobile: ${stats.recentlyPorted} numbers
- Match known litigators: ${stats.litigators} numbers
- Recently removed from DNC: ${stats.deletedNumbers} numbers
- Duplicates removed: ${stats.duplicatesRemoved}
- Area codes present: ${stats.areaCodes.join(', ') || 'N/A'}
${stats.averageRiskScore !== undefined ? `- Average risk score: ${stats.averageRiskScore.toFixed(1)}` : ''}

INDUSTRY CONTEXT (${industry}):
${industryData.context}

Respond with ONLY valid JSON (no markdown code blocks) in this exact format:
{
  "warnings": ["array of 1-3 risk factors detected in data, using 'Risk factor:' language"],
  "recommendations": ["array of 3-4 data observations, using 'Data indicates' or 'Pattern observed' language"],
  "summary": "1-2 sentence data quality summary using 'Based on data patterns' language",
  "risk_analysis": "1-2 sentence analysis using 'Data shows' language",
  "industry_tips": ["2-3 common industry practices, using 'Industry data suggests' language"]
}

CRITICAL REMINDERS:
- You are analyzing DATA, not providing legal guidance
- Never use directive language ("must", "should", "need to")
- Never make legal determinations
- Never predict outcomes or guarantee compliance
- Frame as informational observations only
- End warnings with attorney consultation reminder where appropriate

EXAMPLE OF CORRECT LANGUAGE:
"Risk Factor Detected: 15 numbers show recent mobile porting patterns.
Industry data suggests written consent is typically obtained for mobile
autodialers. Consider consulting a TCPA attorney regarding your specific
requirements for these numbers."

EXAMPLE OF INCORRECT LANGUAGE (DO NOT USE):
"You must obtain written consent before calling these mobile numbers.
Do not call without consent or you will violate TCPA."
`
}

function generateFallbackInsights(stats: BatchStats, industry: IndustryType): InsightsResult {
  const { grade, score } = calculateComplianceGrade(stats)
  const industryData = INDUSTRY_PROMPTS[industry]

  const warnings: string[] = []

  if (stats.litigators > 0) {
    warnings.push(`Risk Factor Detected: ${stats.litigators} leads match known TCPA litigator records in public PACER database. Consider consulting attorney before proceeding.`)
  }
  if (stats.recentlyPorted > 0) {
    warnings.push(`Risk Factor Detected: ${stats.recentlyPorted} numbers show recent mobile porting patterns. Industry data suggests written consent is typically obtained for mobile autodialers.`)
  }
  if (stats.blocked > stats.total * 0.3) {
    warnings.push(`Pattern Observed: High DNC block rate (${Math.round(stats.blocked/stats.total*100)}%) detected in this batch. Data indicates reviewing lead sources may improve data quality.`)
  }

  const recommendations = [
    `Data indicates ${stats.safe} leads show low risk patterns`,
    `Pattern observed: Industry data suggests focusing on clean leads first`,
    `Common industry practice: Maintaining detailed call records for documentation`,
    `Consider consulting a TCPA attorney regarding your specific requirements`
  ]

  const summary = score >= 80
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
    industry_tips: industryData.best_practices.slice(0, 3).map(tip => `Industry data suggests: ${tip}`),
    risk_analysis: `Data shows ${stats.blocked} leads with DNC flags, ${stats.caution} with caution flags. ${stats.litigators > 0 ? `Pattern match with ${stats.litigators} known litigator records.` : ''}`,
    generated_at: new Date().toISOString(),
    legal_disclaimer: LEGAL_DISCLAIMER
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Generate AI-powered compliance insights for a batch of scrubbed leads.
 * This function is stateless and privacy-first - no user tracking or historical data.
 *
 * @param batchResults - Statistics about the scrubbed batch
 * @param userIndustry - The user's industry (from profile)
 * @returns InsightsResult with warnings, recommendations, and compliance grade
 */
export async function generateInsights(
  batchResults: BatchStats,
  userIndustry: string
): Promise<InsightsResult> {
  const industry = normalizeIndustry(userIndustry)
  const industryData = INDUSTRY_PROMPTS[industry]
  const { grade, score } = calculateComplianceGrade(batchResults)

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

  if (!apiKey) {
    // Return fallback insights if no API key configured
    console.warn('ANTHROPIC_API_KEY not configured, using fallback insights')
    return generateFallbackInsights(batchResults, industry)
  }

  try {
    const anthropic = new Anthropic({
      apiKey,
    })

    const prompt = buildPrompt(batchResults, industry, industryData)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.3, // Lower temp for consistent compliance advice
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    // Extract text content
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON response
    let parsed: {
      warnings: string[]
      recommendations: string[]
      summary: string
      risk_analysis: string
      industry_tips: string[]
    }

    try {
      // Clean the response (remove any markdown code blocks if present)
      let jsonText = textContent.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      parsed = JSON.parse(jsonText)
    } catch {
      // If JSON parsing fails, use fallback
      console.warn('Failed to parse Claude response, using fallback insights')
      return generateFallbackInsights(batchResults, industry)
    }

    // Check all text fields for forbidden phrases
    const allText = [
      ...(parsed.warnings || []),
      ...(parsed.recommendations || []),
      parsed.summary || '',
      parsed.risk_analysis || '',
      ...(parsed.industry_tips || [])
    ].join(' ')

    const forbiddenPhrase = checkForForbiddenPhrases(allText)
    if (forbiddenPhrase) {
      console.error(`AI generated forbidden phrase: "${forbiddenPhrase}"`)
      console.error('Full response contained legal-sounding language, using fallback')
      // Use fallback when AI uses forbidden language
      return generateFallbackInsights(batchResults, industry)
    }

    return {
      warnings: parsed.warnings || [],
      recommendations: parsed.recommendations || [],
      compliance_grade: grade,
      compliance_score: score,
      summary: parsed.summary || 'Analysis complete.',
      industry_tips: parsed.industry_tips || industryData.best_practices.slice(0, 3),
      risk_analysis: parsed.risk_analysis || '',
      generated_at: new Date().toISOString(),
      legal_disclaimer: LEGAL_DISCLAIMER
    }

  } catch (error) {
    console.error('Claude API error:', error)
    // Return fallback insights on API error - upload should still succeed
    return generateFallbackInsights(batchResults, industry)
  }
}

/**
 * Get the color for a compliance grade for UI display.
 * A=green, B=blue, C=yellow, D/F=red
 */
export function getGradeColor(grade: 'A' | 'B' | 'C' | 'D' | 'F'): {
  bg: string
  text: string
  border: string
} {
  switch (grade) {
    case 'A':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' }
    case 'B':
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
    case 'C':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' }
    case 'D':
    case 'F':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' }
  }
}
