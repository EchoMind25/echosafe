# ECHO MIND COMPLIANCE - TECHNICAL ARCHITECTURE
**Version:** 1.3 | **Date:** January 17, 2026 | **Privacy-First Edition**

---

## ARCHITECTURE PHILOSOPHY

**Privacy-First Technical Principles:**
1. **Stateless AI Analysis** - Real-time only, nothing stored
2. **Enterprise Privacy APIs** - Claude API with zero retention
3. **Public Data Sources** - DNC registry, PACER, etc. (no user tracking)
4. **User Data Sovereignty** - User owns and controls all their data
5. **Minimal Tracking** - Only what's needed for service delivery

---

## SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────┐
│                   USER                       │
└─────────────────┬────────────────────────────┘
                  │
      ┌───────────┼───────────────┐
      │           │               │
┌─────▼────┐ ┌────▼──────┐  ┌────▼──────┐
│   Web    │ │  Google   │  │  Mobile   │
│   App    │ │  Sheets   │  │  (Future) │
└─────┬────┘ └────┬──────┘  └────┬──────┘
      │           │              │
      └───────────┼──────────────┘
                  │
           ┌──────▼───────┐
           │   NETLIFY    │
           │  (Next.js)   │
           └──────┬───────┘
                  │
      ┌───────────┼───────────────┐
      │           │               │
┌─────▼────┐ ┌────▼──────┐  ┌────▼──────┐
│ Supabase │ │  Stripe   │  │  Resend   │
│ Auth+DB  │ │  Payment  │  │   Email   │
└─────┬────┘ └───────────┘  └───────────┘
      │
      │
┌─────▼────────────────────────────────────┐
│              N8N WORKFLOW                │
│         (Railway Hosting)                │
│                                          │
│  1. Receive Upload                       │
│  2. Check DNC (Supabase RPC)             │
│  3. Calculate Risk Score (Public Data)   │
│  4. Generate AI Insights (Claude API)    │
│     └─> Real-time, stateless            │
│     └─> Industry-specific prompts       │
│     └─> ZERO retention                  │
│  5. Return Results (nothing stored)     │
│                                          │
└──────────────────────────────────────────┘
```

---

## TECH STACK

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** Shadcn/UI (Radix primitives)
- **State:** React Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Icons:** Lucide React
- **Hosting:** Netlify (with Edge Functions)

### Backend
- **Runtime:** Next.js API Routes + Netlify Functions
- **Database:** Supabase PostgreSQL
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage
- **Edge Functions:** Supabase (for admin bulk uploads)
- **Automation:** N8N (Railway hosting)

### Privacy-First APIs
- **AI:** Claude API (Anthropic)
  - Model: `claude-sonnet-4-20250514`
  - Privacy: Enterprise guarantee, zero retention
  - Cost: ~$0.03 per upload analysis
- **DNC Data:** FTC (public data, manual import)
- **Litigator Data:** PACER (public court records)

### Infrastructure
- **Hosting:** Netlify (web app + CDN + forms)
- **Database:** Supabase (PostgreSQL + RLS)
- **Automation:** Railway (N8N workflows)
- **Payments:** Stripe
- **Email:** Resend
- **Analytics:** Plausible (privacy-first, no cookies)

---

## DATA FLOW: UPLOAD & SCRUB

### Step-by-Step Process

```
1. USER UPLOADS FILE
   ├─> Next.js validates file (format, size)
   ├─> Checks for duplicates (client-side preview)
   ├─> Creates upload_job record (Supabase)
   └─> Triggers N8N webhook

2. N8N PROCESSES BATCH (Railway)
   ├─> Parse file (CSV/Excel)
   ├─> Normalize phone numbers
   ├─> Remove duplicates
   ├─> Split into batches of 50
   └─> For each batch:
       ├─> Check DNC registry (Supabase RPC)
       ├─> Check deleted numbers (90-day tracking)
       ├─> Check litigators (PACER data)
       ├─> Calculate risk score (public data only)
       └─> Categorize (safe/caution/blocked)

3. AI INSIGHTS GENERATION (Privacy-First)
   ├─> Get user's industry (from profile)
   ├─> Load industry-specific prompt template
   ├─> Aggregate batch statistics
   ├─> Call Claude API (stateless, zero retention)
   │   └─> NO user history
   │   └─> NO cross-user data
   │   └─> NO performance tracking
   │   └─> ONLY current batch context
   ├─> Return insights text
   └─> Display to user (NOT stored permanently)

4. SAVE TO CRM (User Choice)
   ├─> Filter clean leads (risk ≤ 20)
   ├─> Insert into leads table (user's private CRM)
   ├─> Skip duplicates
   └─> Trigger CRM sync (if integration active)

5. RETURN RESULTS
   ├─> Update upload_job record
   ├─> Generate download files:
   │   ├─> Clean leads CSV (risk ≤ 20)
   │   ├─> Risky leads CSV (21-60, optional)
   │   └─> Blocked leads CSV (61-100, for records)
   ├─> Store in Supabase Storage (30-day lifecycle)
   └─> Display results + AI insights
```

---

## AI IMPLEMENTATION (PRIVACY-FIRST)

### Industry-Specific Prompt Templates

```typescript
// constants/industryPrompts.ts

export const INDUSTRY_PROMPTS = {
  'real-estate-residential': {
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
  
  'insurance-life': {
    context: `Life insurance agents contact individuals about coverage. 
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
  
  // Add more industries as needed
}

export type IndustryKey = keyof typeof INDUSTRY_PROMPTS

export function getIndustryPrompt(industry: string): typeof INDUSTRY_PROMPTS['real-estate-residential'] | null {
  return INDUSTRY_PROMPTS[industry as IndustryKey] || null
}
```

### Real-Time AI Analysis Function

```typescript
// lib/ai/generateInsights.ts

import Anthropic from '@anthropic-ai/sdk'
import { getIndustryPrompt } from '@/constants/industryPrompts'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

interface BatchStats {
  total: number
  safe: number
  caution: number
  blocked: number
  areaCodes: string[]
  recentlyPorted: number
  litigators: number
  deletedNumbers: number
}

export async function generateInsights(
  stats: BatchStats,
  userIndustry: string
): Promise<string> {
  const industryData = getIndustryPrompt(userIndustry)
  
  if (!industryData) {
    // Fallback for unknown industries
    return generateGenericInsights(stats)
  }
  
  const prompt = buildIndustryPrompt(stats, userIndustry, industryData)
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.3, // Lower temp for consistent compliance advice
      messages: [{
        role: 'user',
        content: prompt
      }]
    })
    
    const insights = response.content[0].text
    
    // Add privacy disclaimer
    return `${insights}

---
Privacy Note: This analysis was generated in real-time 
and is not stored. No user profiling or tracking.`
    
  } catch (error) {
    console.error('Claude API error:', error)
    throw new Error('Failed to generate AI insights')
  }
}

function buildIndustryPrompt(
  stats: BatchStats,
  industry: string,
  industryData: any
): string {
  return `
Analyze this batch of ${stats.total} leads for ${industry}.

BATCH BREAKDOWN:
- Safe to call: ${stats.safe} (${Math.round(stats.safe/stats.total*100)}%)
- Caution (minor risks): ${stats.caution} (${Math.round(stats.caution/stats.total*100)}%)
- DNC blocked: ${stats.blocked} (${Math.round(stats.blocked/stats.total*100)}%)
- Recently ported to mobile: ${stats.recentlyPorted}
- Known litigators: ${stats.litigators}
- Recently removed from DNC: ${stats.deletedNumbers}
- Area codes: ${stats.areaCodes.join(', ')}

INDUSTRY CONTEXT:
${industryData.context}

SUCCESS FACTORS FOR THIS INDUSTRY:
${industryData.success_factors.map((f: string) => `- ${f}`).join('\n')}

RISK FACTORS FOR THIS INDUSTRY:
${industryData.risk_factors.map((r: string) => `- ${r}`).join('\n')}

COMPLIANCE NOTES:
${industryData.compliance_notes.map((n: string) => `- ${n}`).join('\n')}

TASK:
Provide concise, actionable compliance insights for THIS SPECIFIC batch.

Format your response as:

⚠️ CRITICAL WARNINGS (if any)
[List top 2 critical issues this batch has, if any. Be specific to the numbers found.]

💡 ${industry.toUpperCase()} BEST PRACTICES
[3-4 specific recommendations for THIS batch based on industry context]

📊 COMPLIANCE GRADE: [A/B/C/D] ([score]/100)
[1-2 sentence summary of overall compliance quality]

IMPORTANT CONSTRAINTS:
- Do NOT reference historical performance (we don't track this)
- Do NOT predict conversion rates (we don't have outcome data)
- Do NOT mention user's past uploads (we don't store history)
- Do NOT compare to other users (privacy violation)
- Focus ONLY on this batch's characteristics
- Be specific to the ${industry} industry
- Prioritize compliance safety over sales optimization
`
}

function generateGenericInsights(stats: BatchStats): string {
  // Fallback for unknown industries
  const grade = stats.safe / stats.total >= 0.8 ? 'A' : 
                stats.safe / stats.total >= 0.6 ? 'B' : 
                stats.safe / stats.total >= 0.4 ? 'C' : 'D'
  
  const score = Math.round((stats.safe / stats.total) * 100)
  
  return `
🤖 COMPLIANCE INSIGHTS

BATCH ANALYSIS: ${stats.total} leads processed
- Clean: ${stats.safe} (${Math.round(stats.safe/stats.total*100)}%)
- Caution: ${stats.caution}
- Blocked: ${stats.blocked}

${stats.litigators > 0 ? `⚠️ CRITICAL WARNING
${stats.litigators} leads match TCPA litigation records. DO NOT CALL these numbers under any circumstances.` : ''}

${stats.recentlyPorted > 0 ? `⚠️ MOBILE PORTING RISK
${stats.recentlyPorted} numbers recently ported to mobile. These require written consent under TCPA.` : ''}

💡 BEST PRACTICES
• Focus on ${stats.safe} clean leads for maximum ROI and zero risk
• Area codes: ${stats.areaCodes.join(', ')}
• Avoid calling blocked leads to prevent violations

📊 COMPLIANCE GRADE: ${grade} (${score}/100)
${score >= 80 ? 'This batch is highly compliant and safe to proceed.' : 
  score >= 60 ? 'This batch has moderate compliance. Focus on clean leads only.' :
  'This batch requires careful attention. Only call verified clean leads.'}

---
Privacy Note: This analysis was generated in real-time 
and is not stored. No user profiling or tracking.
`
}
```

### N8N Workflow Integration

```typescript
// app/api/n8n/webhook/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInsights } from '@/lib/ai/generateInsights'

export async function POST(req: NextRequest) {
  try {
    const { leads, userId, uploadJobId } = await req.json()
    
    const supabase = createClient()
    
    // Get user's industry
    const { data: user } = await supabase
      .from('users')
      .select('industry, industry_custom')
      .eq('id', userId)
      .single()
    
    const userIndustry = user?.industry || 'real-estate-residential'
    
    // Process leads (risk scoring via public data)
    const processed = await processLeads(leads, supabase)
    
    // Calculate batch statistics
    const stats = {
      total: processed.length,
      safe: processed.filter(l => l.risk_score <= 20).length,
      caution: processed.filter(l => l.risk_score > 20 && l.risk_score <= 60).length,
      blocked: processed.filter(l => l.risk_score > 60).length,
      areaCodes: [...new Set(processed.map(l => l.phone_number.substring(0, 3)))],
      recentlyPorted: processed.filter(l => l.risk_flags.includes('recently_ported')).length,
      litigators: processed.filter(l => l.risk_flags.includes('known_litigator')).length,
      deletedNumbers: processed.filter(l => l.risk_flags.includes('recently_removed_dnc')).length,
    }
    
    // Generate AI insights (real-time, stateless)
    const aiInsights = await generateInsights(stats, userIndustry)
    
    // Calculate compliance score
    const complianceScore = Math.round((stats.safe / stats.total) * 100)
    
    // Update upload job
    await supabase
      .from('upload_jobs')
      .update({
        status: 'completed',
        total_leads: stats.total,
        clean_leads: stats.safe,
        caution_leads: stats.caution,
        dnc_blocked: stats.blocked,
        ai_insights: aiInsights, // Stored for 30 days only
        compliance_score: complianceScore,
        completed_at: new Date().toISOString()
      })
      .eq('id', uploadJobId)
    
    return NextResponse.json({
      success: true,
      stats,
      insights: aiInsights,
      processed
    })
    
  } catch (error) {
    console.error('N8N webhook error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}

async function processLeads(leads: any[], supabase: any) {
  // Implementation of risk scoring using public data
  // (DNC registry, litigators, deleted numbers, etc.)
  // See DATABASE.md for get_risk_score() function
  
  const processed = await Promise.all(
    leads.map(async (lead) => {
      const normalized = normalizePhoneNumber(lead.phone_number)
      
      // Call Supabase RPC function (uses public data only)
      const { data: riskScore } = await supabase
        .rpc('get_risk_score', { phone_num: normalized })
      
      return {
        ...lead,
        phone_number: normalized,
        risk_score: riskScore || 0,
        risk_flags: await getRiskFlags(normalized, supabase),
        dnc_status: riskScore > 60 ? 'blocked' : riskScore > 20 ? 'caution' : 'clean'
      }
    })
  )
  
  return processed
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // If 11 digits and starts with 1, remove the 1
  if (digits.length === 11 && digits[0] === '1') {
    return digits.substring(1)
  }
  
  // If 10 digits, return as-is
  if (digits.length === 10) {
    return digits
  }
  
  // Invalid number
  throw new Error(`Invalid phone number: ${phone}`)
}

async function getRiskFlags(phone: string, supabase: any): Promise<string[]> {
  const flags: string[] = []
  
  // Check DNC
  const { data: isDNC } = await supabase
    .rpc('check_dnc', { phone_num: phone })
  
  if (isDNC) flags.push('federal_dnc')
  
  // Check deleted numbers
  const { data: deleted } = await supabase
    .from('dnc_deleted_numbers')
    .select('*')
    .eq('phone_number', phone)
    .single()
  
  if (deleted) {
    flags.push('recently_removed_dnc')
    if (deleted.times_added_removed > 1) {
      flags.push('pattern_add_remove')
    }
  }
  
  // Check litigators
  const { data: litigator } = await supabase
    .from('litigators')
    .select('*')
    .eq('phone_number', phone)
    .single()
  
  if (litigator) flags.push('known_litigator')
  
  return flags
}
```

---

## CRM SYNC FLOW (PRIVACY-RESPECTING)

### Real-Time Sync After Scrub

```typescript
// lib/crm/syncToIntegrations.ts

import { createClient } from '@/lib/supabase/server'

export async function syncCleanLeads(userId: string, cleanLeads: any[]) {
  const supabase = createClient()
  
  // Get user's active integrations
  const { data: integrations } = await supabase
    .from('crm_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('sync_mode', 'realtime')
  
  if (!integrations || integrations.length === 0) {
    return { synced: false, reason: 'no_active_integrations' }
  }
  
  // Sync to each integration
  const results = await Promise.all(
    integrations.map(async (integration) => {
      try {
        return await syncToProvider(integration, cleanLeads)
      } catch (error) {
        console.error(`Sync failed for ${integration.crm_provider}:`, error)
        await logSyncError(integration.id, error)
        return { success: false, provider: integration.crm_provider }
      }
    })
  )
  
  return { synced: true, results }
}

async function syncToProvider(integration: any, leads: any[]) {
  switch (integration.crm_provider) {
    case 'followupboss':
      return await syncToFollowUpBoss(integration, leads)
    case 'lofty':
      return await syncToLofty(integration, leads)
    case 'zapier':
      return await syncToZapier(integration, leads)
    default:
      throw new Error(`Unknown provider: ${integration.crm_provider}`)
  }
}

async function syncToFollowUpBoss(integration: any, leads: any[]) {
  // OAuth implementation
  const response = await fetch('https://api.followupboss.com/v1/people', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      people: leads.map(lead => ({
        name: lead.name,
        phones: [{ value: lead.phone_number, type: 'Mobile' }],
        emails: lead.email ? [{ value: lead.email }] : [],
        source: 'Echo Mind Compliance',
        customFields: {
          risk_score: lead.risk_score,
          dnc_status: lead.dnc_status
        }
      }))
    })
  })
  
  return await response.json()
}

async function logSyncError(integrationId: string, error: any) {
  const supabase = createClient()
  
  await supabase
    .from('crm_integrations')
    .update({
      error_count: supabase.raw('error_count + 1'),
      error_message: error.message,
      sync_status: 'error'
    })
    .eq('id', integrationId)
}
```

---

## NETLIFY DEPLOYMENT

### Netlify Configuration

```toml
# netlify.toml

[build]
  command = "npm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[dev]
  command = "npm run dev"
  port = 3000
  targetPort = 3000

# Privacy-first redirects (no tracking)
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "interest-cohort=()"  # Disable FLoC tracking
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"

# Cache static assets
[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

# Forms (for contact/support)
[functions]
  node_bundler = "esbuild"
```

### Environment Variables (Netlify)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Claude AI
CLAUDE_API_KEY=

# N8N (Railway)
N8N_WEBHOOK_URL=
N8N_API_KEY=

# Email (Resend)
RESEND_API_KEY=

# Analytics (Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=

# App
NEXT_PUBLIC_APP_URL=https://echocompli.com
NODE_ENV=production
```

### Netlify Functions (Serverless)

```typescript
// netlify/functions/stripe-webhook.ts

import { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature']!
  
  try {
    const stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
    
    // Handle subscription events
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(stripeEvent.data.object)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(stripeEvent.data.object)
        break
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true })
    }
    
  } catch (error) {
    console.error('Webhook error:', error)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook failed' })
    }
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  await supabase
    .from('users')
    .update({
      subscription_status: subscription.status,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', subscription.customer as string)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  // Start 60-day grace period
  await supabase
    .from('users')
    .update({
      subscription_status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', subscription.customer as string)
}
```

---

## PRIVACY COMPLIANCE

### Data Retention Policies

```typescript
// lib/privacy/dataRetention.ts

import { createClient } from '@/lib/supabase/server'

export async function enforceDataRetention() {
  const supabase = createClient()
  
  // 1. Cleanup old uploads (30 days)
  await supabase.rpc('cleanup_old_uploads')
  
  // 2. Cleanup old sync logs (30 days)
  await supabase.rpc('cleanup_old_sync_logs')
  
  // 3. Cleanup old usage logs (90 days)
  await supabase.rpc('cleanup_old_usage_logs')
  
  // 4. Cleanup old error logs (30 days)
  await supabase.rpc('cleanup_old_error_logs')
  
  // 5. Cleanup expired deleted numbers (90 days)
  await supabase.rpc('cleanup_expired_deleted_numbers')
  
  // 6. Cleanup cancelled user data (60 days)
  await supabase.from('leads').delete().match({
    user_id: supabase.from('users')
      .select('id')
      .eq('subscription_status', 'cancelled')
      .lt('updated_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
  })
  
  console.log('Privacy cleanup completed:', new Date().toISOString())
}

// Run daily via Netlify Scheduled Functions
// Or external cron job
```

### User Data Export

```typescript
// app/api/user/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Export ALL user data
  const [profile, leads, uploads, integrations] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id),
    supabase.from('upload_jobs').select('*').eq('user_id', user.id),
    supabase.from('crm_integrations').select('*').eq('user_id', user.id)
  ])
  
  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      ...profile.data
    },
    leads: leads.data || [],
    uploads: uploads.data || [],
    integrations: integrations.data?.map(i => ({
      ...i,
      // Remove sensitive tokens
      access_token: '[REDACTED]',
      refresh_token: '[REDACTED]',
      api_key: '[REDACTED]'
    })) || []
  }
  
  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="echo-mind-export-${user.id}.json"`
    }
  })
}
```

### User Data Deletion

```typescript
// app/api/user/delete-all/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verify password (require confirmation)
  const { password } = await req.json()
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password
  })
  
  if (authError) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }
  
  // Call RPC function to delete ALL user data
  await supabase.rpc('delete_all_user_data', { target_user_id: user.id })
  
  // Send confirmation email
  await sendDeletionConfirmationEmail(user.email!)
  
  return NextResponse.json({
    success: true,
    message: 'All data has been permanently deleted'
  })
}
```

---

## MONITORING & ALERTS

### Privacy Compliance Monitoring

```typescript
// lib/monitoring/privacyCheck.ts

import { createClient } from '@/lib/supabase/server'

export async function checkPrivacyCompliance() {
  const supabase = createClient()
  
  const checks = await supabase.rpc('check_privacy_compliance')
  
  const failures = checks.data?.filter((c: any) => c.status === 'FAIL')
  
  if (failures && failures.length > 0) {
    // Alert admin
    await sendPrivacyAlert(failures)
  }
  
  return {
    status: failures && failures.length > 0 ? 'FAIL' : 'PASS',
    checks: checks.data
  }
}

async function sendPrivacyAlert(failures: any[]) {
  // Send email to admin
  console.error('Privacy compliance failures:', failures)
  // TODO: Implement email alert via Resend
}
```

---

## DEPLOYMENT CHECKLIST

### Pre-Deploy (Netlify)

- [ ] All environment variables set in Netlify dashboard
- [ ] Supabase database schema deployed
- [ ] Supabase RLS policies tested
- [ ] Stripe webhooks configured (Netlify function URL)
- [ ] Domain DNS configured (Netlify)
- [ ] SSL certificates auto-provisioned
- [ ] Plausible analytics configured
- [ ] N8N workflows deployed on Railway
- [ ] N8N webhook URLs updated in env vars

### Post-Deploy

- [ ] Smoke tests passed
- [ ] User signup flow tested
- [ ] Payment flow tested (Stripe test mode)
- [ ] Upload & scrub flow tested
- [ ] CRM integrations tested
- [ ] Privacy compliance checks pass
- [ ] Data retention policies active
- [ ] Monitoring alerts configured

---

**Document:** Technical Architecture  
**Version:** 1.3 (Privacy-First Edition)  
**For:** Claude Opus 4.5 (Cursor AI)  
**Deployment:** Netlify + Railway  
**See Also:** CORE_REFERENCE.md, CORE_PRD.md, DATABASE.md, UI_GUIDELINES.md
