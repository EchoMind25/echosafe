import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assessRisk, assessRiskBatch, isSafeToCall, DEFAULT_RISK_CONFIG } from '@/lib/risk-scoring'
import type { RiskScoringConfig } from '@/lib/risk-scoring'

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Merge partial config with defaults
 */
function mergeConfig(partial?: Partial<RiskScoringConfig>): RiskScoringConfig {
  if (!partial) return DEFAULT_RISK_CONFIG

  return {
    weights: {
      ...DEFAULT_RISK_CONFIG.weights,
      ...partial.weights,
    },
    thresholds: {
      ...DEFAULT_RISK_CONFIG.thresholds,
      ...partial.thresholds,
    },
    recentlyRemovedDays: partial.recentlyRemovedDays ?? DEFAULT_RISK_CONFIG.recentlyRemovedDays,
    suspiciousPatternThreshold: partial.suspiciousPatternThreshold ?? DEFAULT_RISK_CONFIG.suspiciousPatternThreshold,
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface SingleRiskRequest {
  phoneNumber: string
  config?: Partial<RiskScoringConfig>
}

interface BatchRiskRequest {
  phoneNumbers: string[]
  config?: Partial<RiskScoringConfig>
}

interface QuickCheckRequest {
  phoneNumber: string
}

// ============================================================================
// POST - Assess risk for single or batch phone numbers
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
    const { action = 'assess' } = body

    // Handle different actions
    switch (action) {
      case 'assess': {
        // Single phone number assessment
        const { phoneNumber, config } = body as SingleRiskRequest

        if (!phoneNumber) {
          return NextResponse.json(
            { success: false, message: 'phoneNumber is required' },
            { status: 400 }
          )
        }

        const assessment = await assessRisk(phoneNumber, mergeConfig(config))

        // Log analytics event
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'risk_assessment_single',
          event_data: {
            phone_number: assessment.phoneNumber,
            risk_level: assessment.level,
            risk_score: assessment.score,
            is_dnc_registered: assessment.isDncRegistered,
            was_recently_removed: assessment.wasRecentlyRemoved,
          },
        })

        return NextResponse.json({
          success: true,
          assessment,
        })
      }

      case 'batch': {
        // Batch phone number assessment
        const { phoneNumbers, config } = body as BatchRiskRequest

        if (!phoneNumbers || !Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
          return NextResponse.json(
            { success: false, message: 'phoneNumbers array is required' },
            { status: 400 }
          )
        }

        // Limit batch size to prevent abuse
        const MAX_BATCH_SIZE = 10000
        if (phoneNumbers.length > MAX_BATCH_SIZE) {
          return NextResponse.json(
            { success: false, message: `Batch size limited to ${MAX_BATCH_SIZE} numbers` },
            { status: 400 }
          )
        }

        const batchResult = await assessRiskBatch(phoneNumbers, mergeConfig(config))

        // Log analytics event
        await supabase.from('analytics_events').insert({
          user_id: user.id,
          event_type: 'risk_assessment_batch',
          event_data: {
            total_numbers: batchResult.summary.total,
            safe_count: batchResult.summary.safe,
            caution_count: batchResult.summary.caution,
            blocked_count: batchResult.summary.blocked,
            average_score: batchResult.summary.averageScore,
            processing_time_ms: batchResult.processingTimeMs,
          },
        })

        return NextResponse.json({
          success: true,
          ...batchResult,
        })
      }

      case 'quick-check': {
        // Quick safe-to-call check
        const { phoneNumber } = body as QuickCheckRequest

        if (!phoneNumber) {
          return NextResponse.json(
            { success: false, message: 'phoneNumber is required' },
            { status: 400 }
          )
        }

        const safeToCall = await isSafeToCall(phoneNumber)

        return NextResponse.json({
          success: true,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          safeToCall,
        })
      }

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action. Use: assess, batch, or quick-check' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Risk score error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get risk assessment for a single phone number (query param)
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get phone number from query params
    const searchParams = request.nextUrl.searchParams
    const phoneNumber = searchParams.get('phone')

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'phone query parameter is required' },
        { status: 400 }
      )
    }

    const assessment = await assessRisk(phoneNumber)

    return NextResponse.json({
      success: true,
      assessment,
    })

  } catch (error) {
    console.error('Risk score error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
