# PRODUCT REQUIREMENTS DOCUMENT
## Echo Mind Compliance - Intelligent DNC Scrubbing Platform

**Version:** 1.1  
**Date:** January 8, 2026  
**Author:** Braxton, Echo Mind Systems  
**Status:** Pre-Development  
**Last Updated:** January 8, 2026

---

## DOCUMENT CHANGELOG

**v1.1 (January 8, 2026)**
- Switched from Clerk to Supabase Auth
- Updated Utah's Elite pricing: $24/month (from free)
- Changed CRM to permanent storage (from 30-day)
- Added CRM integrations to MVP phase
- Added duplicate detection feature
- Added user data deletion controls
- Updated clean file configuration (excludes risky by default)

---

## EXECUTIVE SUMMARY

Echo Mind Compliance is an intelligent DNC (Do Not Call) lead scrubbing platform built for real estate agents and small businesses. Unlike traditional pay-per-lead or complex enterprise solutions, Echo Mind Compliance offers unlimited scrubbing at a transparent flat rate with AI-powered compliance insights that competitors lack.

**Core Innovation:** Cooperative growth model where early adopters help fund area code expansion and benefit from network growth, combined with AI-powered risk scoring that goes beyond simple yes/no filtering.

**Target Market:** Regional real estate agents (Utah initially, expanding nationally)

**Revenue Model:** $47/month base + area code expansion fees

**Go-to-Market:** Real estate conference (Utah's Elite Realtors as founding partner at $24/month)

---

## TABLE OF CONTENTS

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [Target Users & Personas](#2-target-users--personas)
3. [Product Features & Specifications](#3-product-features--specifications)
4. [Database Schema](#4-database-schema)
5. [Technical Architecture](#5-technical-architecture)
6. [UI/UX Design Principles](#6-uiux-design-principles)
7. [Development Roadmap](#7-development-roadmap)
8. [Success Metrics (KPIs)](#8-success-metrics-kpis)
9. [Pricing Strategy](#9-pricing-strategy)
10. [Competitive Analysis](#10-competitive-analysis)
11. [Marketing & Go-to-Market](#11-marketing--go-to-market)
12. [Risk Mitigation](#12-risk-mitigation)
13. [Next Steps to Build](#13-next-steps-to-build)
14. [Open Questions / Decisions](#14-open-questions--decisions-needed)
15. [Success Criteria](#15-success-criteria)

---

## 1. PRODUCT VISION & POSITIONING

### Vision Statement
*"Make TCPA compliance effortless and intelligent for every real estate professional, while building the most transparent and community-driven compliance platform in the industry."*

### Mission
Transform DNC scrubbing from a painful, expensive checkbox into an intelligent workflow tool that agents actually want to use.

### Market Position

```
┌─────────────────────────────────────────────────────┐
│  PRICE vs VALUE POSITIONING                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  High Price                                         │
│    ▲                                                │
│    │  [Enterprise Solutions]                        │
│    │  $300+/mo                                      │
│    │                                                 │
│    │                   [PropStream]                 │
│    │                   $150/mo                      │
│    │                                                 │
│    │         ⭐ [ECHO MIND COMPLIANCE]              │
│    │            $47/mo                              │
│    │            • AI Insights                       │
│    │            • Google Sheets Native              │
│    │            • Permanent CRM                     │
│    │            • CRM Integrations                  │
│    │                                                 │
│    │  [Pay-per-lead]                                │
│    │  $0.08/lead                                    │
│    │                                                 │
│  Low Price                                          │
│    └────────────────────────────────────────────▶  │
│         Low Value              High Value           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Competitive Advantages
1. **AI Risk Scoring** - Only platform with predictive compliance intelligence
2. **Google Sheets Native** - Zero friction, works where agents already work
3. **Permanent CRM** - Store leads forever with built-in management
4. **Instant CRM Sync** - Direct integrations available from day one
5. **Cooperative Growth** - Community-funded expansion model
6. **Transparent Pricing** - No hidden fees, clear FTC cost pass-through
7. **Modern UX** - Apple-quality design vs clunky competitors
8. **Data Control** - Users can delete ALL data anytime

---

## 2. TARGET USERS & PERSONAS

### Primary Persona: "Active Agent Ashley"

**Demographics:**
- Age: 28-45
- Role: Real estate agent (independent or small brokerage)
- Market: Utah (initial), expanding regionally
- Tech savvy: Moderate (uses Google Sheets, CRM, basic automation)

**Pain Points:**
- Paying $0.08-0.12 per lead for DNC scrubbing ($1,500+/year)
- Clunky upload/download workflows
- Fear of TCPA violations ($16,000/incident)
- Doesn't understand which leads are "risky" beyond DNC yes/no
- Multiple tools for different tasks
- Losing track of leads across platforms
- No good affordable CRM options

**Goals:**
- Save money on lead scrubbing
- Work faster (no file uploads/downloads)
- Stay compliant without thinking about it
- Get smarter about which leads to prioritize
- Manage leads in one place
- Sync to CRM automatically

**Buying Triggers:**
- Conference attendee (warm intro from Utah's Elite)
- Sees ROI calculation (saves $1,200+/year)
- Tries demo (instant scrub in Google Sheets)
- Trusts transparent pricing
- Loves built-in CRM (no extra cost)

---

### Secondary Persona: "Brokerage Owner Bob"

**Demographics:**
- Age: 45-60
- Role: Brokerage owner (5-25 agents)
- Market: Multi-state operations
- Tech savvy: Low-moderate (delegates to office manager)

**Pain Points:**
- Needs compliance for entire team
- Expensive enterprise solutions ($300-500/month)
- Risk of agent TCPA violations reflects on brokerage
- Hard to track which agents are compliant
- Multiple tools = training nightmare

**Goals:**
- Cost-effective compliance for whole team
- Centralized monitoring
- Protect brokerage reputation
- Simple onboarding for agents
- One tool for everything

**Future Feature:** Team accounts (Phase 2)

---

## 3. PRODUCT FEATURES & SPECIFICATIONS

### 3.1 MVP FEATURES (Launch Day - Week 3)

#### Feature 1: File Upload & Scrubbing

**User Story:**
> "As an agent, I want to upload my lead file and get back clean leads in under 30 seconds, so I can start calling immediately."

**Acceptance Criteria:**
- Accepts CSV, Excel (.xlsx, .xls), TXT formats
- Max file size: 50MB (≈100,000 leads)
- Processes 1,000 leads in <10 seconds
- Shows real-time progress bar
- Returns downloadable CSV with results
- Displays summary statistics
- **NEW:** Checks for duplicate phone numbers
- **NEW:** Clean file excludes risky leads by default
- **NEW:** Option to include risky leads in download

**Technical Specs:**

```javascript
// File Upload API Endpoint
POST /api/scrub

Request:
{
  "file": <multipart/form-data>,
  "user_id": "string",
  "area_codes": ["801", "385", "435"], // user's subscribed codes
  "include_risky": false // default: exclude risky from clean file
}

Response:
{
  "success": true,
  "job_id": "uuid",
  "status": "processing",
  "progress_url": "/api/scrub/status/{job_id}",
  "duplicates_found": 12
}

// Processing (N8N Webhook)
POST {N8N_WEBHOOK_URL}
{
  "leads": [...],
  "user_id": "uuid",
  "job_id": "uuid",
  "check_duplicates": true
}

// Result
GET /api/scrub/results/{job_id}
{
  "success": true,
  "summary": {
    "total_uploaded": 150,
    "duplicates_removed": 12,
    "clean_leads": 112,
    "dnc_blocked": 23,
    "caution_leads": 15,
    "processing_time_ms": 8420,
    "scrubbed_at": "2026-01-08T10:30:00Z"
  },
  "clean_leads": [...], // Only safe leads (risk_score 0-20)
  "risky_leads": [...], // Caution leads (risk_score 21-60) - if included
  "blocked_leads": [...], // DNC blocked (risk_score 61+)
  "download_urls": {
    "clean": "/api/downloads/{uuid}_clean.csv",
    "full_report": "/api/downloads/{uuid}_full.csv",
    "risky": "/api/downloads/{uuid}_risky.csv" // optional
  }
}
```

**Duplicate Detection Logic:**

```javascript
// Check for duplicates in upload
function findDuplicates(leads) {
  const seen = new Set();
  const duplicates = [];
  
  leads.forEach((lead, index) => {
    const normalized = normalizePhoneNumber(lead.phone_number);
    
    if (seen.has(normalized)) {
      duplicates.push({
        line: index + 2, // Account for header
        phone: lead.phone_number,
        normalized: normalized
      });
    } else {
      seen.add(normalized);
    }
  });
  
  return duplicates;
}

// Also check against user's existing CRM leads
async function checkAgainstCRM(userId, leads) {
  const existingNumbers = await supabase
    .from('leads')
    .select('phone_number')
    .eq('user_id', userId);
  
  const existing = new Set(existingNumbers.map(l => l.phone_number));
  
  return leads.filter(lead => {
    const normalized = normalizePhoneNumber(lead.phone_number);
    return existing.has(normalized);
  });
}
```

**UI Flow:**

```
1. Dashboard → "Upload Leads" button
2. Drag-and-drop or click to browse
3. File validation (format, size)
4. Duplicate check (show count)
   └─ Option: "Remove duplicates" (checked by default)
5. Processing modal with progress bar
6. Results page with summary
7. Download options:
   ├─ Clean Leads Only (default)
   ├─ Full Report (all leads with scores)
   └─ Risky Leads (optional, for review)
8. Option: "Save to CRM" (auto-checked)
```

---

#### Feature 2: Google Sheets Integration

**User Story:**
> "As an agent, I want to scrub leads directly in my Google Sheet without uploading/downloading files, so I never leave my workflow."

**Acceptance Criteria:**
- Apps Script connects to Echo Mind API
- Scrubs selected rows or entire sheet
- Updates sheet with "Status" column (Clean/Blocked/Caution)
- Adds "Risk Score" column (0-100)
- Shows processing status in sidebar
- Works on mobile Google Sheets app
- Detects and flags duplicates
- Auto-saves clean leads to CRM

**Technical Specs:**

```javascript
// Google Apps Script
const CONFIG = {
  API_URL: 'https://echocompli.com/api/sheets/scrub',
  // User gets API key from dashboard
};

function scrubLeads() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Extract phone numbers
  const leads = data.slice(1).map((row, index) => ({
    row_number: index + 2,
    phone_number: row[1], // Column B
    name: row[0] // Column A
  }));
  
  // Check duplicates
  const duplicates = findDuplicates(leads);
  if (duplicates.length > 0) {
    const proceed = Browser.msgBox(
      `Found ${duplicates.length} duplicates. Continue?`,
      Browser.Buttons.YES_NO
    );
    if (proceed === 'no') return;
  }
  
  // Call API
  const response = UrlFetchApp.fetch(CONFIG.API_URL, {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + getUserToken(),
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({ 
      leads,
      save_to_crm: true // Auto-save to CRM
    })
  });
  
  // Update sheet with results
  const results = JSON.parse(response.getContentText());
  updateSheetWithResults(sheet, results);
  
  // Show summary
  showSummary(results);
}

function updateSheetWithResults(sheet, results) {
  // Add new columns if they don't exist
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (!headers.includes('Status')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('Status');
  }
  
  if (!headers.includes('Risk Score')) {
    sheet.insertColumnAfter(sheet.getLastColumn());
    sheet.getRange(1, sheet.getLastColumn()).setValue('Risk Score');
  }
  
  // Update each row
  results.leads.forEach(lead => {
    const row = lead.row_number;
    const statusCol = headers.indexOf('Status') + 1;
    const scoreCol = headers.indexOf('Risk Score') + 1;
    
    // Set status
    sheet.getRange(row, statusCol).setValue(lead.status);
    
    // Set risk score
    sheet.getRange(row, scoreCol).setValue(lead.risk_score);
    
    // Color code
    const color = lead.risk_score <= 20 ? '#D1FAE5' : // Green
                  lead.risk_score <= 60 ? '#FEF3C7' : // Yellow
                  '#FEE2E2'; // Red
    
    sheet.getRange(row, 1, 1, sheet.getLastColumn())
      .setBackground(color);
  });
}

function findDuplicates(leads) {
  const seen = new Map();
  const duplicates = [];
  
  leads.forEach(lead => {
    const normalized = normalizePhone(lead.phone_number);
    
    if (seen.has(normalized)) {
      duplicates.push({
        current: lead.row_number,
        original: seen.get(normalized),
        phone: lead.phone_number
      });
    } else {
      seen.set(normalized, lead.row_number);
    }
  });
  
  return duplicates;
}
```

**UI Components:**
- Custom menu: "Echo Mind Compliance"
  - Scrub Leads
  - View CRM
  - Settings
  - Help & Docs
- Sidebar with real-time progress
- Auto-added columns: Status, Risk Score, Notes
- Formatted with colors (green/yellow/red)
- Duplicate warning dialog

---

#### Feature 3: AI Compliance Insights (DIFFERENTIATOR)

**User Story:**
> "As an agent, I want to know which leads are risky beyond just DNC status, so I can prioritize safe calls and avoid potential lawsuits."

**Acceptance Criteria:**
- Each lead gets Risk Score (0-100)
- Batch analysis shows AI insights
- Flags litigators, recent porting, patterns
- Provides recommendations
- Natural language explanations
- Clean file excludes risky by default

**Technical Specs:**

```javascript
// AI Risk Scoring Logic
function calculateRiskScore(lead, dncStatus, metadata) {
  let score = 0;
  const flags = [];
  
  // Base DNC check (highest priority)
  if (dncStatus === 'blocked') {
    score += 60;
    flags.push('federal_dnc');
  }
  
  // Litigator database check (public PACER records)
  if (isKnownLitigator(lead.phone_number)) {
    score += 25;
    flags.push('known_litigator');
  }
  
  // Recent porting (landline → mobile) - TCPA violation risk
  if (recentlyPortedToMobile(lead.phone_number)) {
    score += 15;
    flags.push('recently_ported');
  }
  
  // Pattern matching (similar to past complainers)
  if (matchesComplainerPattern(lead)) {
    score += 10;
    flags.push('complainer_pattern');
  }
  
  // State-specific DNC lists
  if (onStateDNC(lead.phone_number)) {
    score += 20;
    flags.push('state_dnc');
  }
  
  // Phone number age (newly registered = higher risk)
  if (isNewNumber(lead.phone_number)) {
    score += 5;
    flags.push('new_number');
  }
  
  return {
    score: Math.min(score, 100),
    flags: flags,
    category: getCategory(score)
  };
}

function getCategory(score) {
  if (score <= 20) return 'safe';
  if (score <= 40) return 'low_risk';
  if (score <= 60) return 'caution';
  if (score <= 80) return 'blocked';
  return 'extreme';
}

// AI Insights Generation (Claude API)
async function generateInsights(batch) {
  const stats = {
    total: batch.length,
    safe: batch.filter(l => l.risk_score <= 20).length,
    caution: batch.filter(l => l.risk_score > 20 && l.risk_score <= 60).length,
    blocked: batch.filter(l => l.risk_score > 60).length,
    recently_ported: batch.filter(l => l.flags.includes('recently_ported')).length,
    litigators: batch.filter(l => l.flags.includes('known_litigator')).length,
    area_codes: [...new Set(batch.map(l => l.phone_number.substring(0, 3)))]
  };
  
  const prompt = `
    Analyze this batch of ${stats.total} real estate leads:
    
    Breakdown:
    - Safe to call: ${stats.safe} (${Math.round(stats.safe/stats.total*100)}%)
    - Caution (minor risks): ${stats.caution}
    - DNC blocked: ${stats.blocked}
    - Recently ported to mobile: ${stats.recently_ported}
    - Known litigators: ${stats.litigators}
    
    Area codes: ${stats.area_codes.join(', ')}
    
    Provide:
    1. Top 2-3 critical warnings (if any)
    2. Best practices for this specific batch
    3. Optimal call times (based on area codes/timezones)
    4. Expected conversion estimate (if safe leads > 50)
    
    Be concise, actionable, and prioritize compliance safety.
    Format as JSON with keys: warnings, recommendations, call_times, conversion_estimate
  `;
  
  const response = await callClaudeAPI(prompt);
  return JSON.parse(response);
}
```

**Risk Score Tiers:**

```
0-20:   ✅ SAFE - Not on any lists, low risk patterns
21-40:  ⚠️ LOW RISK - Minor risk indicators, proceed with caution  
41-60:  🔶 CAUTION - State lists or multiple risk factors
61-80:  🚫 BLOCKED - Federal DNC, do not call
81-100: ⚡ EXTREME - Litigator/serial complainer, avoid entirely
```

**Clean File Configuration:**

```
Default "Clean Leads" CSV includes:
├─ Risk Score: 0-20 only (SAFE)
├─ All lead information
└─ Compliance notes

Optional "Risky Leads" CSV:
├─ Risk Score: 21-60 (CAUTION)
├─ Detailed risk flags
├─ Recommendations for each lead
└─ User must opt-in to download

Blocked Leads CSV:
├─ Risk Score: 61-100 (BLOCKED/EXTREME)
├─ DNC status
├─ Why blocked
└─ Always available for record-keeping
```

**AI Insights Display:**

```
┌────────────────────────────────────────┐
│  🤖 AI COMPLIANCE INSIGHTS             │
├────────────────────────────────────────┤
│                                        │
│  ⚠️ CRITICAL WARNINGS (2)              │
│                                        │
│  1. Mobile Porting Risk                │
│     8 numbers recently ported to       │
│     mobile. These require written      │
│     consent under TCPA regulations.    │
│     Recommendation: Skip or get        │
│     explicit written permission.       │
│                                        │
│  2. Known Litigators                   │
│     3 leads match PACER litigation     │
│     records. These individuals have    │
│     filed TCPA lawsuits before.        │
│     Recommendation: DO NOT CALL.       │
│                                        │
│  💡 SMART RECOMMENDATIONS              │
│                                        │
│  • Focus on 112 safe leads first for   │
│    maximum ROI and zero risk           │
│                                        │
│  • Best call window: Tue-Thu 10am-2pm  │
│    PST (optimal for 801/385 codes)     │
│                                        │
│  • Expected conversion: 8-12 deals     │
│    (based on 95% compliance score)     │
│                                        │
│  📊 COMPLIANCE GRADE: A (94/100)       │
│  This batch is highly compliant and    │
│  safe to proceed with.                 │
│                                        │
└────────────────────────────────────────┘
```

---

#### Feature 4: Built-In CRM (Permanent Storage)

**User Story:**
> "As an agent, I want to store and manage all my clean leads in one place permanently, so I don't need multiple tools."

**Acceptance Criteria:**
- Permanent lead storage (not 30-day deletion)
- Lead table view (sortable, filterable)
- Search by name, phone, email
- Add notes to leads
- Status tracking (New/Contacted/Converted/Dead)
- Tags/labels system
- Export to CSV anytime
- Duplicate detection across all leads
- **User can delete ALL data anytime**
- **Bulk operations** (delete, tag, update status)

**Technical Specs:**

```sql
-- Enhanced leads table with permanent storage
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES upload_jobs(id) ON DELETE SET NULL,
  
  -- Lead data
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Additional fields
  company TEXT,
  source TEXT, -- where lead came from
  
  -- Compliance
  dnc_status TEXT, -- 'clean', 'blocked', 'caution'
  risk_score INTEGER DEFAULT 0,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  last_dnc_check TIMESTAMPTZ DEFAULT NOW(),
  
  -- CRM fields
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'converted', 'dead'
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Activity tracking
  last_contacted_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  conversion_date DATE,
  conversion_value DECIMAL(10, 2),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete (for data retention before permanent delete)
  deleted_at TIMESTAMPTZ,
  
  -- Prevent duplicates per user
  UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_leads_user ON leads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_phone ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_deleted ON leads(deleted_at) WHERE deleted_at IS NOT NULL;
```

**CRM Features:**

```javascript
// Lead Management API

// 1. Add lead (with duplicate check)
POST /api/crm/leads
{
  "phone_number": "8015551234",
  "name": "John Smith",
  "email": "john@example.com",
  "source": "conference_2026",
  "tags": ["hot-lead", "investor"]
}

Response:
{
  "success": true,
  "lead": {...},
  "is_duplicate": false
}

// 2. Update lead
PATCH /api/crm/leads/:id
{
  "status": "contacted",
  "notes": "Called, interested in 3BR homes",
  "priority": "high"
}

// 3. Bulk operations
POST /api/crm/leads/bulk
{
  "action": "update_status", // or "add_tag", "delete"
  "lead_ids": ["uuid1", "uuid2"],
  "data": { "status": "contacted" }
}

// 4. Search & filter
GET /api/crm/leads?status=new&tags=hot-lead&sort=created_at:desc

// 5. Delete lead (soft delete)
DELETE /api/crm/leads/:id
// Moves to deleted_at, can be recovered for 30 days

// 6. Permanent delete
DELETE /api/crm/leads/:id/permanent
// PERMANENT deletion, cannot be undone

// 7. Delete ALL user data
DELETE /api/user/data/all
// Deletes all leads, uploads, history - PERMANENT
```

**CRM UI Components:**

```
┌────────────────────────────────────────┐
│  MY LEADS                              │
├────────────────────────────────────────┤
│  [Search...] [Filter▾] [+ New Lead]   │
│                                        │
│  Showing: 1,247 leads                  │
│  New: 423 | Contacted: 687 | Won: 137 │
│                                        │
│  ┌────────────────────────────────┐   │
│  │☐ Name      Phone    Status Tags│   │
│  ├────────────────────────────────┤   │
│  │☐ John S.   8015551  New    🔥  │   │
│  │☐ Jane D.   8015552  Contact💼  │   │
│  │☐ Bob J.    8015553  Won    ✅  │   │
│  └────────────────────────────────┘   │
│                                        │
│  [Bulk Actions▾]                       │
│  • Update Status                       │
│  • Add Tags                            │
│  • Export Selected                     │
│  • Delete Selected                     │
│                                        │
└────────────────────────────────────────┘

LEAD DETAIL VIEW:

┌────────────────────────────────────────┐
│  ← Back to Leads                       │
├────────────────────────────────────────┤
│  JOHN SMITH                            │
│  📞 (801) 555-1234                     │
│  📧 john@example.com                   │
│  📍 Salt Lake City, UT                 │
│                                        │
│  Status: [New ▾]                       │
│  Priority: [Medium ▾]                  │
│  Tags: [🔥 hot-lead] [+ Add]           │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  COMPLIANCE INFO                       │
│  Risk Score: 15 (✅ SAFE)              │
│  DNC Status: Clean                     │
│  Last Checked: Jan 8, 2026             │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ACTIVITY                              │
│  Created: Jan 7, 2026                  │
│  Contacts: 0                           │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  NOTES                                 │
│  [Add note...]                         │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ACTIONS                               │
│  [Mark Contacted] [Mark Won]           │
│  [Export] [Delete]                     │
│                                        │
└────────────────────────────────────────┘
```

**Data Deletion Controls:**

```
USER SETTINGS → DATA & PRIVACY

┌────────────────────────────────────────┐
│  DATA MANAGEMENT                       │
├────────────────────────────────────────┤
│                                        │
│  Your Data:                            │
│  • 1,247 leads stored                  │
│  • 45 upload jobs                      │
│  • 89 days of history                  │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  DELETE INDIVIDUAL LEADS               │
│  Go to CRM → Select leads → Delete    │
│  (Can be recovered for 30 days)        │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  DELETE ALL DATA                       │
│  ⚠️ PERMANENT - Cannot be undone       │
│                                        │
│  This will delete:                     │
│  • All leads                           │
│  • All upload history                  │
│  • All compliance reports              │
│  • All notes and tags                  │
│                                        │
│  Your account and subscription will    │
│  remain active.                        │
│                                        │
│  [Delete All My Data]                  │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  EXPORT YOUR DATA                      │
│  Download all your data before         │
│  deleting.                             │
│                                        │
│  [Export as CSV] [Export as JSON]      │
│                                        │
└────────────────────────────────────────┘
```

**Data Deletion Implementation:**

```javascript
// Soft delete (can recover for 30 days)
async function softDeleteLeads(userId, leadIds) {
  await supabase
    .from('leads')
    .update({ deleted_at: new Date() })
    .eq('user_id', userId)
    .in('id', leadIds);
}

// Permanent delete
async function permanentDeleteLeads(userId, leadIds) {
  // Log for audit trail
  await logDeletion(userId, leadIds);
  
  // Delete permanently
  await supabase
    .from('leads')
    .delete()
    .eq('user_id', userId)
    .in('id', leadIds);
}

// Delete ALL user data (PERMANENT)
async function deleteAllUserData(userId) {
  // Require password confirmation + email verification
  
  // Log deletion
  await logMajorDeletion(userId);
  
  // Delete in order (respect foreign keys)
  await supabase.from('leads').delete().eq('user_id', userId);
  await supabase.from('upload_jobs').delete().eq('user_id', userId);
  await supabase.from('usage_logs').delete().eq('user_id', userId);
  await supabase.from('expansion_requests').delete().eq('user_id', userId);
  
  // Delete files from storage
  await deleteUserUploads(userId);
  
  // Keep user account (for subscription) but clear data
  await supabase
    .from('users')
    .update({ 
      data_deleted_at: new Date(),
      total_leads_deleted: (await getLeadCount(userId))
    })
    .eq('id', userId);
  
  // Send confirmation email
  await sendDataDeletionConfirmation(userId);
}
```

---

#### Feature 5: CRM Integrations (MVP - Immediate)

**User Story:**
> "As an agent, I want my clean leads automatically synced to my CRM, so I never manually export/import."

**Acceptance Criteria:**
- Direct integrations with top CRMs
- OAuth authentication flows
- Real-time sync (or scheduled)
- Field mapping configuration
- Sync status monitoring
- Ability to pause/resume sync

**Supported CRMs (MVP):**

1. **Follow Up Boss** (Real estate #1)
2. **Lofty (kvCORE)** (Real estate #2)
3. **Zapier** (Universal connector)

**Technical Implementation:**

```javascript
// CRM Integration Architecture

// 1. Follow Up Boss Integration
class FollowUpBossIntegration {
  constructor(accessToken) {
    this.apiUrl = 'https://api.followupboss.com/v1';
    this.accessToken = accessToken;
  }
  
  async syncLead(lead) {
    const payload = {
      firstName: lead.name?.split(' ')[0],
      lastName: lead.name?.split(' ')[1],
      phones: [{ value: lead.phone_number, type: 'Mobile' }],
      emails: lead.email ? [{ value: lead.email }] : [],
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
      source: 'Echo Mind Compliance',
      tags: lead.tags,
      notes: `Risk Score: ${lead.risk_score}\n${lead.notes}`
    };
    
    const response = await fetch(`${this.apiUrl}/people`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    return response.json();
  }
  
  async batchSync(leads) {
    // Follow Up Boss supports batch operations
    const results = await Promise.all(
      leads.map(lead => this.syncLead(lead))
    );
    return results;
  }
}

// 2. Lofty CRM Integration
class LoftyCRMIntegration {
  constructor(apiKey) {
    this.apiUrl = 'https://api.lofty.com/v1';
    this.apiKey = apiKey;
  }
  
  async syncLead(lead) {
    const payload = {
      contact: {
        firstName: lead.name?.split(' ')[0],
        lastName: lead.name?.split(' ')[1],
        phone: lead.phone_number,
        email: lead.email,
        address: {
          street: lead.address,
          city: lead.city,
          state: lead.state,
          zip: lead.zip
        },
        customFields: {
          dnc_status: lead.dnc_status,
          risk_score: lead.risk_score,
          echo_mind_id: lead.id
        },
        tags: lead.tags
      }
    };
    
    const response = await fetch(`${this.apiUrl}/contacts`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    return response.json();
  }
}

// 3. Zapier Integration
// User configures via Zapier dashboard
// We provide webhooks for triggers
class ZapierWebhook {
  static async triggerNewCleanLead(lead) {
    const hooks = await getUserZapierHooks(lead.user_id);
    
    for (const hook of hooks) {
      await fetch(hook.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_clean_lead',
          lead: {
            id: lead.id,
            name: lead.name,
            phone: lead.phone_number,
            email: lead.email,
            risk_score: lead.risk_score,
            dnc_status: lead.dnc_status,
            created_at: lead.created_at
          }
        })
      });
    }
  }
}
```

**Database Schema for Integrations:**

```sql
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Integration details
  crm_provider TEXT NOT NULL, -- 'followupboss', 'lofty', 'zapier'
  is_active BOOLEAN DEFAULT TRUE,
  
  -- OAuth tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- API keys (for non-OAuth)
  api_key TEXT,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb, -- field mappings, filters, etc.
  
  -- Sync settings
  sync_mode TEXT DEFAULT 'realtime', -- 'realtime', 'scheduled', 'manual'
  sync_frequency TEXT DEFAULT 'immediate', -- for scheduled: 'hourly', 'daily'
  last_sync_at TIMESTAMPTZ,
  
  -- Status
  sync_status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Stats
  total_synced INTEGER DEFAULT 0,
  last_sync_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, crm_provider)
);

CREATE INDEX idx_integrations_user ON crm_integrations(user_id);
CREATE INDEX idx_integrations_active ON crm_integrations(is_active) WHERE is_active = TRUE;

-- Sync logs
CREATE TABLE crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id) ON DELETE CASCADE,
  
  -- Sync details
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  sync_direction TEXT DEFAULT 'outbound', -- 'outbound', 'inbound'
  
  -- Status
  status TEXT, -- 'success', 'failed', 'skipped'
  error_message TEXT,
  
  -- Data
  payload JSONB,
  response JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER
);

CREATE INDEX idx_sync_logs_integration ON crm_sync_logs(integration_id);
CREATE INDEX idx_sync_logs_created ON crm_sync_logs(created_at DESC);
```

**CRM Integration UI:**

```
SETTINGS → INTEGRATIONS

┌────────────────────────────────────────┐
│  CRM INTEGRATIONS                      │
├────────────────────────────────────────┤
│                                        │
│  Connect your CRM to automatically     │
│  sync clean leads.                     │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  FOLLOW UP BOSS                        │
│  Status: ✅ Connected                  │
│  Last sync: 2 minutes ago              │
│  Total synced: 1,247 leads             │
│                                        │
│  Sync mode: Real-time                  │
│  [Configure] [Pause] [Disconnect]      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  LOFTY CRM (kvCORE)                    │
│  Status: Not connected                 │
│                                        │
│  [Connect to Lofty]                    │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  ZAPIER                                │
│  Status: ✅ Connected                  │
│  Active Zaps: 2                        │
│                                        │
│  [View Zaps] [Settings]                │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  COMING SOON                           │
│  • HubSpot                             │
│  • Salesforce                          │
│  • Pipedrive                           │
│                                        │
│  [Request Integration]                 │
│                                        │
└────────────────────────────────────────┘
```

**Sync Behavior:**

```javascript
// Auto-sync after scrubbing
async function afterScrubComplete(userId, cleanLeads) {
  // Check if user has active integrations
  const integrations = await supabase
    .from('crm_integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('sync_mode', 'realtime');
  
  for (const integration of integrations) {
    // Sync each lead
    for (const lead of cleanLeads) {
      await syncLeadToCRM(integration, lead);
    }
  }
}

// Sync single lead
async function syncLeadToCRM(integration, lead) {
  try {
    let result;
    
    switch(integration.crm_provider) {
      case 'followupboss':
        const fub = new FollowUpBossIntegration(integration.access_token);
        result = await fub.syncLead(lead);
        break;
        
      case 'lofty':
        const lofty = new LoftyCRMIntegration(integration.api_key);
        result = await lofty.syncLead(lead);
        break;
        
      case 'zapier':
        result = await ZapierWebhook.triggerNewCleanLead(lead);
        break;
    }
    
    // Log success
    await logSync(integration.id, lead.id, 'success', result);
    
    // Update integration stats
    await supabase
      .from('crm_integrations')
      .update({
        total_synced: integration.total_synced + 1,
        last_sync_at: new Date()
      })
      .eq('id', integration.id);
    
  } catch (error) {
    // Log error
    await logSync(integration.id, lead.id, 'failed', error);
    
    // Increment error count
    await supabase
      .from('crm_integrations')
      .update({
        error_count: integration.error_count + 1,
        error_message: error.message
      })
      .eq('id', integration.id);
    
    // Pause integration if too many errors
    if (integration.error_count + 1 >= 10) {
      await supabase
        .from('crm_integrations')
        .update({ 
          is_active: false,
          sync_status: 'error'
        })
        .eq('id', integration.id);
      
      // Notify user
      await sendIntegrationErrorEmail(integration.user_id, integration.crm_provider);
    }
  }
}
```

---

#### Feature 6: Dashboard & Upload History

**User Story:**
> "As an agent, I want to see my scrubbing history and usage stats, so I can track compliance and access past results."

**Acceptance Criteria:**
- Shows all uploads (not just last 30 days)
- Monthly usage statistics
- Quick re-download of past results
- Search/filter history
- Coverage map (which area codes user has)
- CRM sync status

**Dashboard Sections:**

1. **Quick Stats**
   - Total leads scrubbed this month
   - Total leads in CRM
   - Clean rate percentage
   - Current plan & coverage
   - CRM sync status

2. **Recent Uploads**
   - Table: Date, File Name, Total, Clean, Blocked, Actions
   - Click to view details
   - Re-download button
   - View in CRM button

3. **Coverage Map**
   - Visual map of subscribed area codes
   - "Request Expansion" button

4. **AI Insights History**
   - Past week's top insights
   - Compliance trends

**Dashboard UI:**

```
┌──────────────────────────────────────────────────┐
│  [Logo]  Dashboard    [Search]      [Avatar]▾    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Welcome back, Braxton                           │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  QUICK STATS                            │    │
│  ├─────────────────────────────────────────┤    │
│  │                                         │    │
│  │  This Month                             │    │
│  │  1,847 leads scrubbed                   │    │
│  │  1,723 stored in CRM                    │    │
│  │  94% clean rate                         │    │
│  │                                         │    │
│  │  Coverage: Utah (801, 385, 435)         │    │
│  │  Plan: Professional ($47/mo)            │    │
│  │                                         │    │
│  │  CRM: ✅ Follow Up Boss (synced 2m ago) │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  UPLOAD LEADS                           │    │
│  ├─────────────────────────────────────────┤    │
│  │                                         │    │
│  │  [📁 Drag & drop CSV or Excel file]     │    │
│  │                                         │    │
│  │  Or use:                                │    │
│  │  [📊 Google Sheets] [🔗 CRM Import]     │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  RECENT ACTIVITY                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Date      File        Total Clean  CRM  │    │
│  ├─────────────────────────────────────────┤    │
│  │ Jan 8    leads.csv     150   112   ✅  │    │
│  │ Jan 7    batch2.xlsx    89    81   ✅  │    │
│  │ Jan 6    new.csv       203   187   ✅  │    │
│  └─────────────────────────────────────────┘    │
│  [View all history]                              │
│                                                  │
│  🤖 AI INSIGHTS                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ Your compliance score is excellent      │    │
│  │ this month (96/100).                    │    │
│  │                                         │    │
│  │ 💡 Tip: Tuesday-Thursday 10am-2pm       │    │
│  │ continues to be your best window.       │    │
│  │                                         │    │
│  │ 📈 Trend: Your clean rate improved 3%   │    │
│  │ compared to last month.                 │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │  QUICK LINKS                            │    │
│  ├─────────────────────────────────────────┤    │
│  │  [📋 My CRM (1,723 leads)]              │    │
│  │  [⚙️ Integrations]                       │    │
│  │  [📊 Reports]                            │    │
│  │  [💳 Billing]                            │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

#### Feature 7: User Authentication & Account (Supabase Auth)

**User Story:**
> "As a user, I want to create an account and manage my subscription securely."

**Acceptance Criteria:**
- Sign up with email + password
- OAuth (Google sign-in)
- Email verification
- Password reset
- Account settings page
- Subscription management

**Technical Specs (Supabase Auth):**

```javascript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'securepassword',
  options: {
    data: {
      name: 'John Smith',
      company: 'Smith Realty'
    },
    emailRedirectTo: 'https://echocompli.com/auth/callback'
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'securepassword'
});

// OAuth (Google)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://echocompli.com/auth/callback'
  }
});

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Sign out
const { error } = await supabase.auth.signOut();

// Password reset
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  { redirectTo: 'https://echocompli.com/reset-password' }
);

// Update user metadata
const { data, error } = await supabase.auth.updateUser({
  data: { company: 'New Company Name' }
});
```

**User Profile Schema:**

```sql
-- Enhanced users table with Supabase Auth
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  
  -- Subscription info
  plan TEXT DEFAULT 'professional', -- 'professional', 'enterprise', 'custom'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'trial', 'past_due', 'canceled'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  
  -- Coverage
  area_codes JSONB DEFAULT '["801", "385", "435"]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sync_to_crm_auto": true,
    "include_risky_in_downloads": false,
    "ai_insights_enabled": true
  }'::jsonb,
  
  -- Data deletion tracking
  data_deleted_at TIMESTAMPTZ,
  total_leads_deleted INTEGER DEFAULT 0,
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE
);

-- Sync with auth.users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
```

**Account Settings Page:**

```
┌────────────────────────────────────────┐
│  ACCOUNT SETTINGS                      │
├────────────────────────────────────────┤
│                                        │
│  PROFILE                               │
│  Name: [Braxton]                       │
│  Email: [braxton@example.com] ✅       │
│  Company: [Echo Mind Automation]       │
│  Phone: [(801) 555-1234]               │
│                                        │
│  [Update Profile]                      │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  SECURITY                              │
│  Password: ••••••••                    │
│  [Change Password]                     │
│                                        │
│  Two-Factor Auth: ❌ Not enabled       │
│  [Enable 2FA]                          │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  SUBSCRIPTION                          │
│  Plan: Professional ($47/month)        │
│  Status: ✅ Active                     │
│  Coverage: Utah (801, 385, 435)        │
│  Next billing: Feb 8, 2026             │
│                                        │
│  [Manage Subscription] [Add Area Codes]│
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  PREFERENCES                           │
│  ☑ Email notifications                │
│  ☑ Auto-sync to CRM                   │
│  ☐ Include risky leads in downloads   │
│  ☑ AI insights enabled                │
│                                        │
│  [Save Preferences]                    │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  DATA & PRIVACY                        │
│  Total leads stored: 1,247             │
│  Storage used: 12.4 MB                 │
│                                        │
│  [Export My Data] [Delete All Data]    │
│                                        │
└────────────────────────────────────────┘
```

---

### 3.2 PHASE 2 FEATURES (Month 2-3)

#### Feature 8: Enhanced AI Features

- Historical trend analysis
- Predictive lead scoring (likelihood to convert)
- Automated tagging based on patterns
- Custom AI insights prompts

#### Feature 9: Team Accounts (Brokerage Plans)

- Multi-user support
- Role-based permissions (admin, agent, viewer)
- Centralized compliance dashboard
- Team usage analytics
- Shared lead pools

#### Feature 10: Advanced Reporting

- Compliance reports (PDF export)
- Monthly summaries
- Custom date ranges
- Lead source analysis
- Conversion tracking

---

### 3.3 PHASE 3 FEATURES (Month 4-6)

#### Feature 11: Mobile App

- React Native iOS/Android app
- Quick scrub on the go
- Push notifications
- Mobile CRM access

#### Feature 12: Public API

- RESTful API for developers
- Webhook support
- Rate limiting
- API documentation
- Developer dashboard

#### Feature 13: White-Label Options

- Custom branding for brokerages
- Custom domain support
- Branded reports
- Commission structure for resellers

---

## 4. DATABASE SCHEMA

### Complete Supabase Database Schema

```sql
-- ============================================
-- ENABLE EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================
-- USERS TABLE (Synced with Supabase Auth)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Profile
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  
  -- Subscription info
  plan TEXT DEFAULT 'professional',
  subscription_status TEXT DEFAULT 'trial',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  
  -- Coverage
  area_codes JSONB DEFAULT '["801", "385", "435"]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "sync_to_crm_auto": true,
    "include_risky_in_downloads": false,
    "ai_insights_enabled": true,
    "duplicate_check_enabled": true
  }'::jsonb,
  
  -- Data deletion tracking
  data_deleted_at TIMESTAMPTZ,
  total_leads_deleted INTEGER DEFAULT 0,
  
  -- Admin flag
  is_admin BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);

-- Trigger to create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DNC REGISTRY TABLE
-- ============================================
CREATE TABLE dnc_registry (
  phone_number TEXT PRIMARY KEY,
  area_code TEXT NOT NULL,
  state TEXT,
  date_added TIMESTAMPTZ DEFAULT NOW(),
  source TEXT DEFAULT 'ftc',
  
  -- Metadata
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_dnc_area_code ON dnc_registry(area_code);
CREATE INDEX idx_dnc_state ON dnc_registry(state);
CREATE INDEX idx_dnc_date_added ON dnc_registry(date_added DESC);

-- ============================================
-- LITIGATOR DATABASE (AI Feature)
-- ============================================
CREATE TABLE litigators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  name TEXT,
  case_count INTEGER DEFAULT 1,
  last_case_date DATE,
  risk_level TEXT DEFAULT 'high',
  notes TEXT,
  source TEXT DEFAULT 'pacer', -- 'pacer', 'ftc', 'manual'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_litigators_phone ON litigators(phone_number);
CREATE INDEX idx_litigators_risk ON litigators(risk_level);

-- ============================================
-- UPLOAD JOBS TABLE
-- ============================================
CREATE TABLE upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job info
  filename TEXT,
  status TEXT DEFAULT 'processing',
  
  -- Results
  total_leads INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  clean_leads INTEGER DEFAULT 0,
  dnc_blocked INTEGER DEFAULT 0,
  caution_leads INTEGER DEFAULT 0,
  
  -- Processing
  processing_time_ms INTEGER,
  error_message TEXT,
  
  -- File storage
  input_file_url TEXT,
  output_files JSONB DEFAULT '{}'::jsonb,
  
  -- AI insights
  ai_insights JSONB,
  compliance_score INTEGER,
  
  -- CRM sync
  synced_to_crm BOOLEAN DEFAULT FALSE,
  sync_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_uploads_user ON upload_jobs(user_id);
CREATE INDEX idx_uploads_created ON upload_jobs(created_at DESC);
CREATE INDEX idx_uploads_status ON upload_jobs(status);

-- ============================================
-- LEADS TABLE (Permanent CRM Storage)
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES upload_jobs(id) ON DELETE SET NULL,
  
  -- Lead data
  phone_number TEXT NOT NULL,
  name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  company TEXT,
  source TEXT,
  
  -- Compliance
  dnc_status TEXT,
  risk_score INTEGER DEFAULT 0,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  last_dnc_check TIMESTAMPTZ DEFAULT NOW(),
  
  -- CRM fields
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Activity
  last_contacted_at TIMESTAMPTZ,
  contact_count INTEGER DEFAULT 0,
  conversion_date DATE,
  conversion_value DECIMAL(10, 2),
  
  -- External CRM IDs
  external_crm_ids JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  -- Unique constraint per user
  UNIQUE(user_id, phone_number)
);

CREATE INDEX idx_leads_user ON leads(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_phone ON leads(phone_number);
CREATE INDEX idx_leads_status ON leads(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_deleted ON leads(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_leads_risk ON leads(risk_score);

-- Full-text search index
CREATE INDEX idx_leads_search ON leads USING GIN(
  to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(company, ''))
);

-- ============================================
-- CRM INTEGRATIONS
-- ============================================
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Integration details
  crm_provider TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- OAuth tokens (encrypted at app level)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- API keys
  api_key TEXT,
  api_secret TEXT,
  
  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Sync settings
  sync_mode TEXT DEFAULT 'realtime',
  sync_frequency TEXT DEFAULT 'immediate',
  last_sync_at TIMESTAMPTZ,
  
  -- Status
  sync_status TEXT DEFAULT 'active',
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  
  -- Stats
  total_synced INTEGER DEFAULT 0,
  last_sync_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, crm_provider)
);

CREATE INDEX idx_integrations_user ON crm_integrations(user_id);
CREATE INDEX idx_integrations_active ON crm_integrations(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_integrations_provider ON crm_integrations(crm_provider);

-- ============================================
-- CRM SYNC LOGS
-- ============================================
CREATE TABLE crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  
  -- Sync details
  sync_direction TEXT DEFAULT 'outbound',
  status TEXT,
  error_message TEXT,
  
  -- Data
  payload JSONB,
  response JSONB,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER
);

CREATE INDEX idx_sync_logs_integration ON crm_sync_logs(integration_id);
CREATE INDEX idx_sync_logs_created ON crm_sync_logs(created_at DESC);
CREATE INDEX idx_sync_logs_status ON crm_sync_logs(status);

-- ============================================
-- AREA CODE EXPANSION REQUESTS
-- ============================================
CREATE TABLE expansion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request details
  requested_area_codes TEXT[] NOT NULL,
  state TEXT,
  reason TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  
  -- Pricing
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  paid_at TIMESTAMPTZ,
  
  -- Admin notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_expansion_user ON expansion_requests(user_id);
CREATE INDEX idx_expansion_status ON expansion_requests(status);

-- ============================================
-- USAGE TRACKING
-- ============================================
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  upload_job_id UUID REFERENCES upload_jobs(id) ON DELETE SET NULL,
  
  -- Usage metrics
  leads_processed INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 1,
  
  -- Metadata
  source TEXT DEFAULT 'web',
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON usage_logs(user_id);
CREATE INDEX idx_usage_created ON usage_logs(created_at DESC);

-- ============================================
-- ADMIN BULK UPLOADS
-- ============================================
CREATE TABLE admin_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES users(id),
  
  -- Upload info
  area_codes TEXT[] NOT NULL,
  total_files INTEGER,
  total_records INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'processing',
  progress JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_admin_uploads_status ON admin_uploads(status);
CREATE INDEX idx_admin_uploads_created ON admin_uploads(created_at DESC);

-- ============================================
-- DELETION LOGS (Audit Trail)
-- ============================================
CREATE TABLE deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Deletion details
  deletion_type TEXT, -- 'single_lead', 'bulk_leads', 'all_data'
  items_deleted INTEGER,
  reason TEXT,
  
  -- Data snapshot (for recovery)
  data_snapshot JSONB,
  
  -- Can be recovered until this date
  recoverable_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deletion_logs_user ON deletion_logs(user_id);
CREATE INDEX idx_deletion_logs_recoverable ON deletion_logs(recoverable_until) WHERE NOT recovered;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Check if phone number is on DNC
CREATE OR REPLACE FUNCTION check_dnc(phone_num TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM dnc_registry 
    WHERE phone_number = phone_num 
    AND is_active = TRUE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_dnc(TEXT) TO anon, authenticated;

-- Get risk score for phone number
CREATE OR REPLACE FUNCTION get_risk_score(phone_num TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER := 0;
  is_dnc BOOLEAN;
  is_litigator BOOLEAN;
BEGIN
  -- Check DNC status (60 points)
  is_dnc := check_dnc(phone_num);
  IF is_dnc THEN
    score := score + 60;
  END IF;
  
  -- Check litigator database (25 points)
  SELECT EXISTS(
    SELECT 1 FROM litigators WHERE phone_number = phone_num
  ) INTO is_litigator;
  
  IF is_litigator THEN
    score := score + 25;
  END IF;
  
  RETURN score;
END;
$$;

GRANT EXECUTE ON FUNCTION get_risk_score(TEXT) TO authenticated;

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Track last login
CREATE OR REPLACE FUNCTION track_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users 
  SET last_login_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expansion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Upload jobs policies
CREATE POLICY "Users can view own uploads"
  ON upload_jobs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create uploads"
  ON upload_jobs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Leads policies
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Users can manage own leads"
  ON leads FOR ALL
  USING (user_id = auth.uid());

-- CRM integrations policies
CREATE POLICY "Users can manage own integrations"
  ON crm_integrations FOR ALL
  USING (user_id = auth.uid());

-- CRM sync logs (read-only for users)
CREATE POLICY "Users can view own sync logs"
  ON crm_sync_logs FOR SELECT
  USING (
    integration_id IN (
      SELECT id FROM crm_integrations WHERE user_id = auth.uid()
    )
  );

-- Expansion requests policies
CREATE POLICY "Users can manage own requests"
  ON expansion_requests FOR ALL
  USING (user_id = auth.uid());

-- Usage logs (read-only for users)
CREATE POLICY "Users can view own usage"
  ON usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- Deletion logs (read-only for users)
CREATE POLICY "Users can view own deletions"
  ON deletion_logs FOR SELECT
  USING (user_id = auth.uid());

-- DNC registry is publicly readable
ALTER TABLE dnc_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DNC registry is publicly readable"
  ON dnc_registry FOR SELECT
  TO authenticated
  USING (true);

-- Litigators table is publicly readable
ALTER TABLE litigators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Litigators table is publicly readable"
  ON litigators FOR SELECT
  TO authenticated
  USING (true);

-- Admin-only policies
CREATE POLICY "Admins can manage DNC registry"
  ON dnc_registry FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage litigators"
  ON litigators FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING ((SELECT is_admin FROM users WHERE id = auth.uid()));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('uploads', 'uploads', false),
  ('results', 'results', false),
  ('admin-uploads', 'admin-uploads', false);

-- Storage policies
CREATE POLICY "Users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'uploads' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can access own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('uploads', 'results')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can manage admin uploads"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'admin-uploads'
    AND (SELECT is_admin FROM users WHERE id = auth.uid())
  );
```

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Tech Stack

```
┌─────────────────────────────────────────┐
│  FRONTEND                               │
├─────────────────────────────────────────┤
│  • Next.js 14 (App Router)              │
│  • React 18                             │
│  • TypeScript                           │
│  • Tailwind CSS                         │
│  • Shadcn/UI components                 │
│  • Framer Motion (animations)           │
│  • React Query (data fetching)          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  BACKEND                                │
├─────────────────────────────────────────┤
│  • Next.js API Routes                   │
│  • N8N Cloud (workflow automation)      │
│  • Supabase PostgreSQL (database)       │
│  • Supabase Edge Functions              │
│  • Supabase Auth (authentication)       │
│  • Claude API (AI insights)             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  INFRASTRUCTURE                         │
├─────────────────────────────────────────┤
│  • Netlify (hosting, CDN, forms)        │
│  • Supabase (database, storage, auth)   │
│  • Stripe (payments)                    │
│  • N8N Cloud (automation)               │
│  • Resend (transactional email)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  INTEGRATIONS                           │
├─────────────────────────────────────────┤
│  • Google Apps Script (Sheets)          │
│  • Follow Up Boss API                   │
│  • Lofty CRM API                        │
│  • Zapier (future)                      │
└─────────────────────────────────────────┘
```

### 5.2 System Architecture Diagram

```
                    ┌──────────────┐
                    │    USER      │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
     │  Web    │    │   Google    │   │  Mobile │
     │  App    │    │   Sheets    │   │  (Soon) │
     └────┬────┘    └──────┬──────┘   └────┬────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                    ┌──────▼───────┐
                    │   NETLIFY    │
                    │   (Hosting)  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
     │Supabase │    │   Next.js   │   │ Stripe  │
     │  Auth   │    │   App       │   │ Payment │
     └────┬────┘    └──────┬──────┘   └────┬────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
     ┌────▼────┐    ┌──────▼──────┐   ┌────▼────┐
     │ Supabase│    │     N8N     │   │ Claude  │
     │   DB    │◄───┤   Workflow  │───►   API   │
     └─────────┘    └──────┬──────┘   └─────────┘
          │                │
          │         ┌──────▼──────┐
          │         │ CRM APIs    │
          │         │(FUB, Lofty) │
          │         └─────────────┘
          │
          └────────►│ DNC Check   │
                    │+ AI Score   │
                    └─────────────┘
```

### 5.3 Data Flow: Upload & Scrub

```
1. User uploads file (Web UI or Google Sheets)
   │
   ├─► Validate file format/size (Frontend)
   │
   ├─► Check for duplicates (Frontend preview)
   │
   ├─► Create upload_job record (Supabase)
   │
   └─► Send to N8N webhook (API Route)

2. N8N processes leads
   │
   ├─► Parse file (N8N: Parse Input node)
   │
   ├─► Normalize phone numbers (N8N: Code node)
   │
   ├─► Remove duplicates (N8N: Code node)
   │
   ├─► Split into batches of 50 (N8N: Split node)
   │
   └─► For each batch:
       │
       ├─► Check DNC (Supabase RPC: check_dnc)
       │
       ├─► Calculate risk score (Supabase RPC: get_risk_score)
       │
       └─► Categorize (safe/caution/blocked)

3. N8N aggregates results
   │
   ├─► Generate AI insights (Claude API)
   │
   ├─► Create output CSVs:
   │   ├─ Clean leads only (risk ≤ 20)
   │   ├─ Full report (all leads with scores)
   │   └─ Risky leads (if user opted in)
   │
   └─► Save to Supabase Storage

4. Save to CRM (if enabled)
   │
   ├─► Filter clean leads (risk ≤ 20)
   │
   ├─► Insert into leads table (skip duplicates)
   │
   └─► Trigger CRM sync (if integration active)

5. Update upload_job record
   │
   ├─► Set status = 'completed'
   │
   ├─► Store summary stats
   │
   ├─► Store AI insights JSON
   │
   └─► Store download URLs

6. Frontend polls for completion
   │
   └─► Display results + download links + CRM status
```

### 5.4 CRM Sync Flow

```
REAL-TIME SYNC (After Scrub):

1. Clean leads identified (risk ≤ 20)
   │
2. Check user's active integrations
   │
3. For each integration:
   │
   ├─► Get access token/API key
   │
   ├─► Transform lead data to CRM format
   │
   ├─► Send API request to CRM
   │
   ├─► Log sync result (success/failure)
   │
   └─► Update lead with external_crm_ids

4. Update integration stats
   │
   └─► total_synced, last_sync_at

5. Handle errors:
   │
   ├─► Retry 3 times with backoff
   │
   ├─► If still failing, increment error_count
   │
   └─► If error_count > 10, pause integration

SCHEDULED SYNC (For existing leads):

1. Cron job runs (every hour or daily)
   │
2. Find leads updated since last sync
   │
3. Batch sync (50 leads at a time)
   │
4. Update last_sync_at timestamp
```

### 5.5 Bulk Admin Upload System

**Problem:** Manually importing 2.2M+ DNC records takes hours.

**Solution:** Supabase Edge Function with background processing.

```
ADMIN UPLOAD FLOW:

1. Admin uploads multiple FTC CSV files
   │
   └─► Files stored in Supabase Storage (admin-uploads bucket)

2. Create admin_upload record
   │
   └─► Status: 'processing'

3. Invoke Supabase Edge Function
   │
   └─► Function processes in background:
       │
       ├─► Read CSV from storage
       │
       ├─► Parse phone numbers + area codes
       │
       ├─► Batch upsert (1000 rows at a time)
       │   │
       │   ├─► UPSERT handles duplicates automatically
       │   │
       │   └─► Update progress JSON after each batch
       │
       └─► Mark file complete

4. When all files complete
   │
   ├─► Update admin_upload status = 'completed'
   │
   ├─► Send notification email to admin
   │
   └─► Log total records imported
```

**Supabase Edge Function:**

```typescript
// supabase/functions/bulk-dnc-upload/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parse } from 'https://deno.land/std@0.168.0/encoding/csv.ts'

serve(async (req) => {
  try {
    const { admin_upload_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    // Get upload details
    const { data: upload, error } = await supabase
      .from('admin_uploads')
      .select('*')
      .eq('id', admin_upload_id)
      .single()
    
    if (error) throw error
    
    let totalProcessed = 0
    
    // Process each area code file
    for (const area_code of upload.area_codes) {
      try {
        const filename = `ftc_${area_code}_${Date.now()}.csv`
        
        // Download from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('admin-uploads')
          .download(filename)
        
        if (downloadError) {
          console.error(`Error downloading ${filename}:`, downloadError)
          continue
        }
        
        // Parse CSV
        const text = await fileData.text()
        const records = parse(text, { skipFirstRow: true })
        
        console.log(`Processing ${records.length} records for area code ${area_code}`)
        
        // Batch insert (1000 at a time)
        const batchSize = 1000
        for (let i = 0; i < records.length; i += batchSize) {
          const batch = records.slice(i, i + batchSize).map(row => ({
            phone_number: row[0],
            area_code: area_code,
            state: row[1] || null,
            source: 'ftc',
            date_added: new Date().toISOString(),
            is_active: true
          }))
          
          // UPSERT to handle duplicates
          const { error: insertError } = await supabase
            .from('dnc_registry')
            .upsert(batch, {
              onConflict: 'phone_number',
              ignoreDuplicates: false // Update if exists
            })
          
          if (insertError) {
            console.error(`Batch insert error:`, insertError)
            continue
          }
          
          totalProcessed += batch.length
          
          // Update progress
          const progress = (i + batchSize) / records.length * 100
          await supabase
            .from('admin_uploads')
            .update({
              progress: {
                ...upload.progress,
                [area_code]: Math.min(progress, 100)
              },
              total_records: totalProcessed
            })
            .eq('id', admin_upload_id)
        }
        
        console.log(`Completed ${area_code}: ${records.length} records`)
        
      } catch (areaError) {
        console.error(`Error processing area code ${area_code}:`, areaError)
        
        await supabase
          .from('admin_uploads')
          .update({
            error_message: `Error in ${area_code}: ${areaError.message}`
          })
          .eq('id', admin_upload_id)
      }
    }
    
    // Mark complete
    await supabase
      .from('admin_uploads')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_records: totalProcessed
      })
      .eq('id', admin_upload_id)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        total_processed: totalProcessed 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
```

**Admin UI (React Component):**

```tsx
// app/admin/uploads/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export default function AdminUploadsPage() {
  const [uploads, setUploads] = useState([])
  const [uploading, setUploading] = useState(false)
  const supabase = createClient()
  
  // Poll for updates every 2 seconds
  useEffect(() => {
    const fetchUploads = async () => {
      const { data } = await supabase
        .from('admin_uploads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setUploads(data || [])
    }
    
    fetchUploads()
    const interval = setInterval(fetchUploads, 2000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleUpload = async (files: FileList) => {
    setUploading(true)
    
    try {
      // Upload files to storage
      const uploadedFiles = []
      for (const file of Array.from(files)) {
        const { data, error } = await supabase.storage
          .from('admin-uploads')
          .upload(`${Date.now()}_${file.name}`, file)
        
        if (error) throw error
        uploadedFiles.push(data.path)
      }
      
      // Extract area codes from filenames (assuming format: ftc_801_data.csv)
      const areaCodes = uploadedFiles.map(path => {
        const match = path.match(/ftc_(\d{3})_/)
        return match ? match[1] : null
      }).filter(Boolean)
      
      // Create admin_upload record
      const { data: upload, error } = await supabase
        .from('admin_uploads')
        .insert({
          area_codes: areaCodes,
          total_files: uploadedFiles.length,
          status: 'processing'
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Invoke Edge Function
      await supabase.functions.invoke('bulk-dnc-upload', {
        body: { admin_upload_id: upload.id }
      })
      
      alert('Upload started! Processing in background.')
      
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">DNC Bulk Upload</h1>
      
      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Upload FTC CSV Files
        </label>
        <input
          type="file"
          multiple
          accept=".csv"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Uploads</h2>
        
        {uploads.map(upload => (
          <div key={upload.id} className="border rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <div>
                <span className="font-medium">Upload {upload.id.slice(0, 8)}</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                  upload.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {upload.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {upload.total_records?.toLocaleString()} records
              </div>
            </div>
            
            {upload.status === 'processing' && (
              <div className="space-y-2">
                {upload.area_codes.map(code => (
                  <div key={code}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Area Code {code}</span>
                      <span>{Math.round(upload.progress?.[code] || 0)}%</span>
                    </div>
                    <Progress value={upload.progress?.[code] || 0} />
                  </div>
                ))}
              </div>
            )}
            
            {upload.error_message && (
              <div className="mt-2 text-sm text-red-600">
                {upload.error_message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**This system allows:**
- ✅ Upload multiple files simultaneously
- ✅ Process in background (close browser, continues)
- ✅ Real-time progress tracking per area code
- ✅ Automatic duplicate handling (UPSERT)
- ✅ Error recovery (continues even if one file fails)
- ✅ Email notification when complete
- ✅ Audit trail of all uploads

---

## 6. UI/UX DESIGN PRINCIPLES

### 6.1 Design Philosophy

**Core Principle:** Apple-level simplicity with professional trust.

**Inspiration:**
- Apple.com (clean, spacious, confident)
- Linear.app (modern, fast, intuitive)
- Stripe (professional, trustworthy)

**NOT:**
- Cluttered enterprise dashboards
- Generic SaaS templates
- Overly technical interfaces

### 6.2 Visual Design System

```
COLOR PALETTE:

Primary Brand:
├─ Echo Blue: #1E40AF (trust, technology)
├─ Echo Dark: #0F172A (professional, text)
└─ Echo Light: #EFF6FF (backgrounds, hover states)

Status Colors:
├─ Safe Green: #059669 (clean leads)
├─ Caution Yellow: #F59E0B (risky leads)
├─ Blocked Red: #DC2626 (DNC blocked)
├─ Extreme Purple: #7C3AED (litigators)
└─ Success Teal: #14B8A6 (CRM synced)

Neutrals:
├─ Gray 900: #0F172A (primary text)
├─ Gray 600: #475569 (secondary text)
├─ Gray 400: #94A3B8 (placeholder text)
├─ Gray 300: #CBD5E1 (borders)
├─ Gray 100: #F1F5F9 (backgrounds)
└─ White: #FFFFFF (cards, backgrounds)

TYPOGRAPHY:

Font Family:
├─ Headings: Inter (600, 700, 800)
├─ Body: Inter (400, 500, 600)
└─ Code/Numbers: JetBrains Mono (400, 500)

Font Sizes:
├─ H1: 36px / 2.25rem (mobile: 28px / 1.75rem)
├─ H2: 28px / 1.75rem (mobile: 24px / 1.5rem)
├─ H3: 20px / 1.25rem (mobile: 18px / 1.125rem)
├─ Body: 16px / 1rem
├─ Small: 14px / 0.875rem
└─ Tiny: 12px / 0.75rem

Line Heights:
├─ Tight: 1.25 (headings)
├─ Normal: 1.5 (body)
└─ Relaxed: 1.75 (long-form content)

SPACING:

Grid: 8px base unit (0.5rem)
├─ XS: 4px / 0.25rem
├─ SM: 8px / 0.5rem
├─ MD: 16px / 1rem
├─ LG: 24px / 1.5rem
├─ XL: 32px / 2rem
├─ 2XL: 48px / 3rem
├─ 3XL: 64px / 4rem
└─ 4XL: 96px / 6rem

COMPONENTS:

Buttons:
├─ Primary: 
│   - Background: Echo Blue (#1E40AF)
│   - Text: White
│   - Padding: 12px 24px
│   - Border Radius: 8px
│   - Shadow: 0 1px 3px rgba(0,0,0,0.1)
│   - Hover: Darken 10%
│
├─ Secondary:
│   - Background: White
│   - Text: Echo Blue
│   - Border: 1px solid Gray 300
│   - Padding: 12px 24px
│   - Border Radius: 8px
│   - Hover: Gray 50 background
│
└─ Ghost:
    - Background: Transparent
    - Text: Gray 700
    - Padding: 8px 12px
    - Hover: Gray 100 background

Cards:
├─ Background: White
├─ Border: 1px solid Gray 200
├─ Border Radius: 12px
├─ Padding: 24px
├─ Shadow: 0 1px 3px rgba(0,0,0,0.05)
└─ Hover: Shadow 0 4px 6px rgba(0,0,0,0.07)

Inputs:
├─ Border: 1px solid Gray 300
├─ Border Radius: 8px
├─ Padding: 10px 12px
├─ Font Size: 16px (prevents zoom on mobile)
├─ Focus: Border Blue + Ring (0 0 0 3px rgba(30,64,175,0.1))
└─ Error: Border Red + Text Red below

Tables:
├─ Header: Gray 50 background, Gray 900 text, 600 weight
├─ Rows: White background, Gray 700 text
├─ Borders: Gray 200
├─ Hover: Gray 50 background
└─ Striped: Alternate rows Gray 50

Badges/Tags:
├─ Small: 6px 10px padding, 12px font, 12px radius
├─ Status colors based on context
└─ Uppercase text

Modals:
├─ Overlay: Black 50% opacity
├─ Content: White, 24px padding, 16px radius
├─ Max Width: 500px
└─ Animation: Fade in + scale from 95%

Toasts:
├─ Position: Top right
├─ Width: 400px max
├─ Auto-dismiss: 5 seconds
├─ Types: Success (green), Error (red), Info (blue), Warning (yellow)
└─ Animation: Slide in from right

ANIMATIONS:

Timing: 
├─ Fast: 150ms (hover, focus)
├─ Normal: 250ms (transitions)
└─ Slow: 350ms (modals, page transitions)

Easing:
├─ ease-in-out: Default
├─ ease-out: Exits
└─ ease-in: Entrances

Motion Principles:
├─ Subtle: No distracting animations
├─ Purposeful: Every animation has a reason
└─ Smooth: 60fps target

RESPONSIVE BREAKPOINTS:

├─ Mobile: < 640px
├─ Tablet: 640px - 1024px
├─ Desktop: 1024px - 1536px
└─ Large: > 1536px

Mobile-First:
- Design for mobile, enhance for desktop
- Touch targets: Minimum 44x44px
- Readable text: Minimum 16px body
- Thumb-friendly: Actions at bottom on mobile
```

### 6.3 Key Screens (Wireframes)

**See Section 3.1 for detailed UI mockups of:**
- Landing Page
- Dashboard
- Upload Results
- CRM Management
- Account Settings
- Integration Configuration

---

## 7. DEVELOPMENT ROADMAP

### Phase 1: MVP (Weeks 1-3) - LAUNCH READY

**Week 1: Foundation (Jan 8-14)**
- [x] Project setup (Next.js + TypeScript)
- [ ] Supabase project + database schema
- [ ] Supabase Auth implementation
- [ ] Basic UI components (Shadcn/UI)
- [ ] Landing page
- [ ] Sign up / Login flows
- [ ] Netlify deployment (staging)

**Deliverables:**
- Users can sign up and log in
- Landing page live
- Basic dashboard shell

---

**Week 2: Core Features (Jan 15-21)**
- [ ] File upload functionality
- [ ] N8N workflow (reuse existing + enhancements)
  - [ ] Add duplicate detection
  - [ ] Add clean file filtering
- [ ] Results display page
- [ ] Download files (clean, full, risky)
- [ ] AI insights display
- [ ] Upload history
- [ ] Basic CRM (leads table)
  - [ ] View leads
  - [ ] Add notes
  - [ ] Update status

**Deliverables:**
- End-to-end scrubbing works
- Users can download clean leads
- Leads saved to CRM automatically

---

**Week 3: Integrations & Polish (Jan 22-28)**
- [ ] Google Sheets Apps Script
- [ ] Stripe payment integration
- [ ] CRM integrations:
  - [ ] Follow Up Boss
  - [ ] Lofty CRM
  - [ ] Zapier webhooks
- [ ] User settings page
- [ ] Data deletion controls
- [ ] Email notifications (Resend)
- [ ] Testing with Utah's Elite
- [ ] Bug fixes & polish
- [ ] Production deployment

**Deliverables:**
- Google Sheets integration working
- CRM sync functioning
- Payment flow complete
- Ready for conference launch

**LAUNCH:** Conference weekend (Late January 2026)

---

### Phase 2: Enhanced Features (Weeks 4-8)

**Week 4-5: AI Enhancements**
- [ ] Historical trend analysis
- [ ] Predictive lead scoring
- [ ] Automated tagging
- [ ] Custom AI prompts

**Week 6-7: CRM Improvements**
- [ ] Advanced search/filters
- [ ] Bulk operations
- [ ] Lead import from other sources
- [ ] Custom fields
- [ ] Activity timeline

**Week 8: Admin Tools**
- [ ] Bulk upload system (Edge Functions)
- [ ] Admin dashboard
- [ ] User management
- [ ] Analytics & reporting

---

### Phase 3: Scale & Growth (Weeks 9-16)

**Week 9-10: Team Accounts**
- [ ] Multi-user support
- [ ] Role-based permissions
- [ ] Team dashboard
- [ ] Shared lead pools

**Week 11-12: Advanced Reporting**
- [ ] PDF compliance reports
- [ ] Custom date ranges
- [ ] Export to Excel
- [ ] Scheduled reports

**Week 13-14: Additional Integrations**
- [ ] HubSpot
- [ ] Salesforce
- [ ] Pipedrive
- [ ] More CRMs

**Week 15-16: API & Platform**
- [ ] Public REST API
- [ ] Developer documentation
- [ ] Webhooks
- [ ] Rate limiting

---

## 8. SUCCESS METRICS (KPIs)

### Launch Metrics (Month 1)

**Acquisition:**
- 20+ signups from conference
- 50%+ conversion from trial to paid
- $940+ MRR (20 clients × $47)

**Engagement:**
- Average 2+ uploads per user per week
- 80%+ of users connect Google Sheets or CRM
- 70%+ of leads saved to built-in CRM
- <5% churn rate

**Technical:**
- 99%+ uptime
- <10 second scrub time (1,000 leads)
- Zero TCPA violations reported by users
- <1% error rate on scrubs

**Customer Satisfaction:**
- NPS score: 50+
- 4.5+ star reviews
- 80%+ would recommend

---

### Growth Metrics (Month 3)

**Revenue:**
- $5,000+ MRR (100+ users)
- 15%+ M/M growth rate
- $200+ average revenue per user (ARPU)
- 5+ area code expansion purchases

**Product:**
- AI insights used by 70%+ of users
- CRM integrations: 60%+ adoption
- Google Sheets: 80%+ adoption
- Average 95%+ compliance score

**Expansion:**
- 10+ area codes added (client-funded)
- 5+ clients on multiple states
- 2+ upsells to higher plans

---

### Scale Metrics (Month 6)

**Revenue:**
- $15,000+ MRR (300+ users)
- 20%+ M/M growth rate
- Profitability achieved (85%+ gross margin)
- 10%+ revenue from area code expansions

**Market:**
- #1 Google ranking for "Utah DNC scrubbing"
- 50+ customer testimonials
- 3+ case studies published
- Mentioned by competitors

**Product Maturity:**
- 3+ CRM integrations live
- Team accounts launched
- API in beta
- Mobile app in development

---

## 9. PRICING STRATEGY

### 9.1 Product Pricing (Standard)

```
┌─────────────────────────────────────────┐
│  PROFESSIONAL PLAN                      │
│  $47/month                              │
│  $97 one-time setup                     │
│                                         │
│  What's Included:                       │
│  ✅ Unlimited scrubbing                 │
│  ✅ 5 area codes included               │
│     (Utah: 801, 385, 435 + 2 more)     │
│  ✅ AI risk scoring & insights          │
│  ✅ Built-in CRM (permanent storage)    │
│  ✅ Google Sheets integration           │
│  ✅ CRM sync (Follow Up Boss, Lofty)    │
│  ✅ Duplicate detection                 │
│  ✅ Upload history (unlimited)          │
│  ✅ Email support                       │
│  ✅ Data deletion controls              │
│                                         │
│  [Start 14-Day Free Trial]              │
│  No credit card required                │
└─────────────────────────────────────────┘
```

---

### 9.2 Area Code Expansion Pricing

```
┌─────────────────────────────────────────┐
│  AREA CODE EXPANSION                    │
│                                         │
│  Need Coverage Beyond Utah?             │
│                                         │
│  Pricing (Cooperative Model):           │
│  $100/year per area code (first year)   │
│  $8/month per code ongoing              │
│                                         │
│  Setup Fee: $97 per state               │
│  (One-time, covers data acquisition)    │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  EXAMPLE: California (6 metro codes)    │
│                                         │
│  First Year:                            │
│  • Setup: $97                           │
│  • Data: 6 codes × $100 = $600          │
│  • Total: $697                          │
│                                         │
│  Ongoing: $48/month ($8 × 6 codes)      │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  WHY THIS MODEL?                        │
│                                         │
│  The FTC charges us $82/year per area   │
│  code for DNC data access. When you     │
│  help us acquire new codes, they        │
│  become available to ALL future clients │
│  at no extra cost.                      │
│                                         │
│  You're building the network!           │
│                                         │
│  [Request Expansion Quote]              │
└─────────────────────────────────────────┘
```

---

### 9.3 Partnership Pricing (Utah's Elite Realtors)

**Updated Agreement:**

```
┌─────────────────────────────────────────┐
│  FOUNDING PARTNER AGREEMENT             │
│  Utah's Elite Realtors                  │
│                                         │
│  Monthly Cost: $24/month                │
│  Setup: FREE                            │
│                                         │
│  Coverage Included:                     │
│  • Utah (801, 385, 435)                 │
│  • Nevada (702, 775)                    │
│  • Unlimited scrubbing                  │
│  • All AI features                      │
│  • Built-in CRM                         │
│  • Priority support                     │
│  • Early access to new features         │
│                                         │
│  Additional Area Codes:                 │
│  Standard expansion pricing applies     │
│  ($100/year per code + $97 setup)       │
│                                         │
│  In Exchange For:                       │
│  ✅ Conference demo/promotion           │
│  ✅ Testimonial & case study            │
│  ✅ Referrals when possible             │
│  ✅ Product feedback                    │
│                                         │
│  This partnership rate locked in        │
│  forever ($24/month, no increases).     │
│                                         │
└─────────────────────────────────────────┘
```

**Why $24/month for Utah's Elite:**
- Covers N8N costs ($50/month ÷ 2+ clients)
- Shows value of partnership (50% discount)
- Still sustainable with 3+ paying clients
- Acknowledges their promotional value

---

### 9.4 Conference Special Pricing

```
┌─────────────────────────────────────────┐
│  CONFERENCE EXCLUSIVE 🎉                │
│  (This Weekend Only)                    │
│                                         │
│  Professional Plan:                     │
│  • First month: $27 (normally $47)      │
│  • Setup fee: WAIVED (save $97)         │
│  • Then $47/month after Day 30          │
│                                         │
│  Total First Month: $27                 │
│  (Save $117)                            │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  OR                                     │
│                                         │
│  Annual Prepay (Best Value):            │
│  • Pay $470 for full year               │
│    (=$39/month, save $96)               │
│  • Setup: FREE                          │
│  • Lock in this rate forever            │
│                                         │
│  ──────────────────────────────────     │
│                                         │
│  [Claim Conference Special]             │
│  Code: CONFERENCE2026                   │
│                                         │
│  Offer expires: Jan 31, 2026            │
│                                         │
└─────────────────────────────────────────┘
```

---

## 10. COMPETITIVE ANALYSIS

### 10.1 Competitor Feature Matrix

| Feature | Echo Mind Compliance | ProspectBoss | PropStream | Pay-Per-Lead | Enterprise (DNC.com) |
|---------|---------------------|--------------|------------|--------------|---------------------|
| **Pricing** | $47/mo | $79/mo | $150/mo | $0.08/lead ($160/mo for 2k) | $300+/mo |
| **Unlimited Scrubbing** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Google Sheets Native** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Built-in CRM** | ✅ Permanent | ❌ | ❌ | ❌ | ⚠️ Limited |
| **CRM Integrations** | ✅ Day 1 | ❌ | ⚠️ Zapier only | ❌ | ✅ |
| **AI Risk Scoring** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Duplicate Detection** | ✅ | ❌ | ❌ | ❌ | ⚠️ Basic |
| **Real-time Processing** | ✅ <10s | ⚠️ Slow | ⚠️ Batch | ⚠️ 5-30min | ✅ |
| **Transparent Pricing** | ✅ | ⚠️ | ⚠️ | ✅ | ❌ Contact sales |
| **Mobile Friendly** | ✅ | ❌ | ⚠️ | N/A | ❌ |
| **Modern UI** | ✅ | ❌ | ⚠️ | N/A | ❌ |
| **Data Deletion** | ✅ Full control | ❌ | ⚠️ Limited | N/A | ❌ |
| **Setup Time** | <15 min | 1-2 hours | 30 min | Instant | 2-5 days |

### 10.2 Competitive Advantages (Summary)

**Our Unique Strengths:**

1. **AI Intelligence** - Only platform with predictive risk scoring
2. **Built-in CRM** - Permanent lead storage with management tools
3. **Instant CRM Sync** - Follow Up Boss & Lofty from day one
4. **Workflow Integration** - Native Google Sheets (zero friction)
5. **Transparent Pricing** - Clear FTC cost breakdown
6. **Data Control** - Users own their data, delete anytime
7. **Modern Experience** - Apple-quality UX
8. **Community Growth** - Cooperative expansion model

**Price Comparison (2,000 leads/month):**
- Echo Mind: $47/month = **$564/year**
- Pay-per-lead: $160/month = **$1,920/year** (❌ 240% more expensive)
- ProspectBoss: $79/month = **$948/year** (❌ 68% more expensive)
- PropStream: $150/month = **$1,800/year** (❌ 219% more expensive)

**Savings: $1,356+/year vs average competitor**

---

## 11. MARKETING & GO-TO-MARKET

### 11.1 Launch Strategy

**Pre-Launch (Week 0):**
- [ ] Landing page live with email capture
- [ ] Utah's Elite onboarded & trained
- [ ] Conference materials ready:
  - [ ] Booth banner/signage
  - [ ] One-page handouts (250 printed)
  - [ ] QR code stickers (instant signup)
  - [ ] Business cards
  - [ ] Demo video (60 seconds)
- [ ] Social media teasers (LinkedIn, Facebook)

**Conference Launch (Week 1):**
- [ ] Utah's Elite demos at booth
- [ ] Live demonstrations on demand
- [ ] Conference special pricing active
- [ ] QR code for instant signup (no friction)
- [ ] Collect emails for follow-up
- [ ] Record video testimonials
- [ ] Take photos for marketing
- [ ] **Goal:** 20+ signups, 50+ emails

**Post-Conference (Week 2-4):**
- [ ] Email drip campaign to leads:
  - Day 1: Thank you + special offer reminder
  - Day 3: Case study from Utah's Elite
  - Day 7: ROI calculator + final reminder
- [ ] LinkedIn content (Braxton personal brand):
  - Behind-the-scenes build story
  - Utah's Elite success story
  - Compliance tips for agents
- [ ] Facebook ads to Utah real estate agents
- [ ] SEO content (blog posts):
  - "TCPA Compliance for Real Estate in 2026"
  - "How Much Does DNC Scrubbing Really Cost?"
  - "Why Real Estate Agents Need AI for Compliance"

---

### 11.2 Marketing Channels (Priority Order)

**1. Owned Media (Immediate)**
- Website + SEO blog
- Email list (from conference)
- LinkedIn (Braxton personal)
- YouTube (tutorial videos)

**2. Partnerships (Month 1-2)**
- Real estate brokerages (referral deals)
- Lead generation companies (affiliate program)
- Real estate coaches/trainers (sponsorships)

**3. Paid Media (Month 2-3)**
- Facebook Ads (Utah agents → expand to neighboring states)
- Google Ads (branded keywords + "DNC scrubbing Utah")
- LinkedIn Ads (real estate professionals)

**4. Community (Ongoing)**
- Real estate Facebook groups
- BiggerPockets forum
- Local real estate meetups
- Chamber of Commerce

---

### 11.3 Content Marketing Plan

**Blog Posts (SEO):**
1. "Complete TCPA Compliance Guide for Real Estate Agents 2026"
2. "DNC Scrubbing: What Every Utah Realtor Needs to Know"
3. "How AI is Changing Real Estate Compliance"
4. "The True Cost of TCPA Violations (And How to Avoid Them)"
5. "Cold Calling in Real Estate: Still Legal in 2026?"

**Video Content:**
1. Product demo (3 minutes)
2. Google Sheets tutorial (5 minutes)
3. Utah's Elite testimonial (2 minutes)
4. "Day in the Life" using Echo Mind Compliance
5. "Setting Up Your First Scrub" walkthrough

**Case Studies:**
1. Utah's Elite Realtors (conference launch partner)
2. [Client 2 - Month 2]
3. [Client 3 - Month 3]

---

## 12. RISK MITIGATION

### 12.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase performance degrades at scale | Medium | High | Implement database partitioning, monitor query performance, have migration plan to dedicated Postgres |
| N8N workflow fails at high volume | Low | High | Build redundant Supabase Edge Function, monitor execution costs, implement queue system |
| Claude API costs spiral | Low | Medium | Cache insights, rate limit (1 insight per upload), use cheaper models for simple tasks, budget $5/100 clients |
| CRM integration breaks | Medium | Medium | Implement error handling with retries, maintain error logs, notify users immediately, have manual export fallback |

---

### 12.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Conference launch flops (<10 signups) | Low | Medium | Pre-sell to 5 agents before conference, have backup online launch plan, leverage Utah's Elite testimonial regardless |
| Competitors copy AI features | Medium | Low | First-mover advantage (6-12 month lead), focus on UX and integrations (harder to copy), build community moat |
| FTC changes DNC access rules | Low | High | Monitor FTC announcements weekly, maintain $5k reserve for emergency data purchase, add state DNC lists as backup |
| Utah's Elite cancels partnership | Very Low | Low | Maintain professional relationship, deliver exceptional value, have contract in writing, nurture other early adopters |
| Key CRM APIs change/break | Medium | Medium | Monitor API changelogs, maintain relationships with CRM dev teams, have versioning strategy |

---

### 12.3 Legal Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| User violates TCPA using our platform | Medium | High | Clear disclaimers (we don't provide legal advice), compliance reports show we did our part, E&O insurance ($1M), terms of service with user responsibility clause |
| Litigator database violates privacy | Low | Medium | Only use public PACER records, don't store PII beyond phone numbers, clear privacy policy, consult attorney before launch |
| Data breach / unauthorized access | Low | Very High | Supabase RLS policies, encrypt sensitive data, regular security audits, penetration testing (Month 6), incident response plan |
| GDPR/CCPA compliance issues | Low | Medium | Implement data deletion, user data export, privacy policy compliant with regulations, consent management |

---

## 13. NEXT STEPS TO BUILD

### Immediate Actions (This Week)

1. **Confirm domain:**
   - Check echocompli.com, echocompli.net availability
   - Purchase primary + backup domains
   - Point to Netlify

2. **Set up development:**
   ```bash
   # Create Next.js project
   npx create-next-app@latest echo-mind-compliance --typescript
   cd echo-mind-compliance
   
   # Install dependencies
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install stripe @stripe/stripe-js
   npm install @radix-ui/react-* # Shadcn UI components
   npm install tailwindcss autoprefixer
   npm install framer-motion
   npm install @tanstack/react-query
   npm install recharts # For charts/analytics
   ```

3. **Create Supabase project:**
   - Sign up at supabase.com
   - Create new project: "echo-mind-compliance"
   - Run SQL schema from Section 4
   - Test check_dnc() function
   - Verify existing 2.2M DNC records

4. **Set up Supabase Auth:**
   - Enable email authentication
   - Configure OAuth providers (Google)
   - Set up email templates
   - Add redirect URLs

5. **Environment variables:**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   
   STRIPE_PUBLIC_KEY=your_stripe_public
   STRIPE_SECRET_KEY=your_stripe_secret
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   CLAUDE_API_KEY=your_claude_key
   
   N8N_WEBHOOK_URL=your_n8n_webhook
   ```

---

### Development Sprint Plan

**Week 1 Checklist:**

**Day 1-2: Project Setup**
- [ ] Next.js project initialized
- [ ] Tailwind CSS configured
- [ ] Shadcn UI components installed
- [ ] Supabase client configured
- [ ] Auth flow scaffolded
- [ ] Basic routing structure
- [ ] Git repository created
- [ ] Netlify deployment configured (staging)

**Day 3-4: Authentication & User Management**
- [ ] Sign up page
- [ ] Login page
- [ ] Email verification flow
- [ ] Password reset flow
- [ ] OAuth (Google) integration
- [ ] User profile creation
- [ ] Protected routes (middleware)
- [ ] Test auth flows

**Day 5-7: Landing Page & Marketing**
- [ ] Landing page hero
- [ ] Features section
- [ ] Pricing section
- [ ] Testimonials (prepare for Utah's Elite)
- [ ] CTA buttons
- [ ] Mobile responsive
- [ ] SEO optimization
- [ ] Deploy to production domain

**Deliverables:** 
- ✅ Users can sign up/log in
- ✅ Landing page live
- ✅ Basic protected dashboard route

---

**Week 2 Checklist:**

**Day 8-9: File Upload System**
- [ ] File upload component (drag-and-drop)
- [ ] File validation (format, size)
- [ ] Duplicate detection preview
- [ ] Upload to Supabase Storage
- [ ] Create upload_job record
- [ ] Trigger N8N webhook
- [ ] Real-time progress polling

**Day 10-11: Results & Downloads**
- [ ] Results page layout
- [ ] Summary statistics display
- [ ] AI insights component
- [ ] Download buttons (clean, full, risky)
- [ ] Risk score visualization
- [ ] Lead detail view

**Day 12-13: Built-in CRM**
- [ ] Leads table component
- [ ] Search & filter functionality
- [ ] Lead detail modal
- [ ] Notes & status updates
- [ ] Tags system
- [ ] Bulk operations
- [ ] Data deletion flows

**Day 14: Upload History & Dashboard**
- [ ] Dashboard overview
- [ ] Upload history table
- [ ] Quick stats cards
- [ ] Coverage map
- [ ] Recent activity feed

**Deliverables:**
- ✅ End-to-end scrubbing flow works
- ✅ Leads saved to CRM
- ✅ Users can download results
- ✅ Basic CRM functionality

---

**Week 3 Checklist:**

**Day 15-16: Google Sheets Integration**
- [ ] Apps Script code
- [ ] API endpoint for Sheets
- [ ] Authentication via API key
- [ ] Test scrubbing from Sheets
- [ ] Documentation for users

**Day 17-18: CRM Integrations**
- [ ] Follow Up Boss integration
- [ ] Lofty CRM integration
- [ ] OAuth flows
- [ ] Sync status monitoring
- [ ] Error handling & retries
- [ ] Integration settings UI

**Day 19: Stripe Payments**
- [ ] Stripe Checkout integration
- [ ] Subscription management
- [ ] Webhooks (subscription events)
- [ ] Billing page
- [ ] Invoice emails

**Day 20-21: Polish & Testing**
- [ ] Bug fixes
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states
- [ ] Email notifications (Resend)
- [ ] User onboarding flow
- [ ] Help documentation
- [ ] Analytics (Plausible)

**Day 22-23: Utah's Elite Setup & Testing**
- [ ] Create Utah's Elite account
- [ ] Configure special pricing
- [ ] Training session
- [ ] Test all workflows
- [ ] Gather feedback
- [ ] Make adjustments

**Day 24: Production Deployment**
- [ ] Environment variables set
- [ ] Database migrations
- [ ] SSL certificates
- [ ] Performance testing
- [ ] Security review
- [ ] Launch checklist complete

**Deliverables:**
- ✅ All integrations working
- ✅ Payment flow complete
- ✅ Utah's Elite trained
- ✅ **READY FOR CONFERENCE LAUNCH**

---

### Post-Launch Priorities (Week 4+)

**Week 4: Monitor & Iterate**
- [ ] Monitor user signups daily
- [ ] Track conversion metrics
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Improve onboarding based on feedback

**Week 5-6: AI Enhancements**
- [ ] Enhance risk scoring algorithm
- [ ] Add historical trend analysis
- [ ] Implement predictive scoring
- [ ] Custom AI prompts

**Week 7-8: Admin Tools**
- [ ] Bulk upload system (Edge Functions)
- [ ] Admin dashboard
- [ ] User management interface
- [ ] Analytics & reports

---

## 14. OPEN QUESTIONS / DECISIONS NEEDED

### High Priority Decisions

1. **Domain Selection**
   - [ ] First choice: echocompli.com
   - [ ] Backup: echomindcompliance.com
   - [ ] Backup: echocompliance.co
   - **Action:** Check availability and purchase

2. **Litigator Database**
   - [ ] Include in MVP (more complete AI)
   - [ ] Add in Phase 2 (faster launch)
   - **Recommendation:** Phase 2 (focus on core features first)

3. **Google Sheets Approach**
   - [ ] Standalone script (share link)
   - [ ] Published Google Workspace Add-on (more discoverable)
   - **Recommendation:** Start with standalone, add Add-on in Phase 2

4. **Conference Special Details**
   - [ ] Option A: $27 first month, then $47
   - [ ] Option B: $47/month, waive $97 setup
   - [ ] Option C: Both
   - **Recommendation:** Option A (lower barrier to entry)

5. **AI Model Selection**
   - [ ] Claude Sonnet 4 (best quality, $15 per 1M tokens)
   - [ ] Claude Haiku (faster, cheaper, $0.25 per 1M tokens)
   - [ ] Mix (Sonnet for complex, Haiku for simple)
   - **Recommendation:** Mix approach

---

### Medium Priority Decisions

6. **Email Provider**
   - [ ] Resend (modern, developer-friendly)
   - [ ] SendGrid (established, more features)
   - **Recommendation:** Resend ($20/month for 50k emails)

7. **Analytics**
   - [ ] Plausible (privacy-first, $9/month)
   - [ ] Google Analytics (free, more features)
   - [ ] PostHog (product analytics, free tier)
   - **Recommendation:** Plausible + PostHog

8. **Error Tracking**
   - [ ] Sentry (free tier: 5k errors/month)
   - [ ] LogRocket (session replay + errors)
   - **Recommendation:** Sentry for MVP

---

### Low Priority Decisions (Can Decide Later)

9. **Mobile App Timeline**
   - When to start building?
   - **Recommendation:** Month 6+ (after PMF)

10. **API Public Launch**
    - When to open to developers?
    - **Recommendation:** Month 4+ (after core features stable)

11. **White-Label Option**
    - Should we offer to brokerages?
    - **Recommendation:** Month 6+ (if demand exists)

---

## 15. SUCCESS CRITERIA

### Launch is Successful If:

✅ **20+ paying customers** within 30 days of conference  
✅ **Zero critical bugs** in production (severity 1 or 2)  
✅ **4.5+ star rating** from early users (testimonials, reviews)  
✅ **Utah's Elite actively referring** (3+ referrals in Month 1)  
✅ **$940+ MRR** by end of Month 1  
✅ **99%+ uptime** (no major outages)  
✅ **<10 second scrub time** for 1,000 leads  

---

### Product is Validated If:

✅ **80%+ trial-to-paid conversion** rate  
✅ **<5% monthly churn** rate  
✅ **Net Promoter Score: 50+**  
✅ **Users upload 2+ times per week** (average)  
✅ **70%+ of leads saved to built-in CRM**  
✅ **60%+ adoption of CRM integrations** (Follow Up Boss or Lofty)  
✅ **Google Sheets: 75%+ of users connect**  
✅ **Average risk score: 90+** (high compliance)  

---

### Ready to Scale If:

✅ **Profitability achieved** (revenue > costs by 3x)  
✅ **Competitors asking about us** (market awareness)  
✅ **Inbound leads from SEO/word-of-mouth** (10+ per month)  
✅ **Clear product-market fit signals** (customers can't live without it)  
✅ **Team can handle 10x growth** (systems, processes, support)  
✅ **2+ months cash runway** for expansion  
✅ **Unit economics work** ($200+ LTV:CAC ratio)  

---

## APPENDIX A: TECHNICAL REFERENCE

### API Endpoints Reference

```typescript
// Authentication
POST   /api/auth/signup              // Create new user
POST   /api/auth/login               // Login user
POST   /api/auth/logout              // Logout user
POST   /api/auth/reset-password      // Request password reset
PUT    /api/auth/update-password     // Update password

// Users
GET    /api/user/profile             // Get current user
PUT    /api/user/profile             // Update profile
DELETE /api/user/data                // Delete all user data
GET    /api/user/usage               // Get usage stats

// Scrubbing
POST   /api/scrub                    // Upload & scrub leads
GET    /api/scrub/status/:jobId      // Get scrub status
GET    /api/scrub/results/:jobId     // Get results
GET    /api/scrub/download/:fileId   // Download file

// CRM (Built-in)
GET    /api/crm/leads                // List leads (paginated)
GET    /api/crm/leads/:id            // Get lead details
POST   /api/crm/leads                // Create lead
PUT    /api/crm/leads/:id            // Update lead
DELETE /api/crm/leads/:id            // Soft delete lead
DELETE /api/crm/leads/:id/permanent  // Permanent delete
POST   /api/crm/leads/bulk           // Bulk operations
GET    /api/crm/leads/search         // Search leads

// CRM Integrations
GET    /api/integrations             // List integrations
POST   /api/integrations             // Create integration
PUT    /api/integrations/:id         // Update integration
DELETE /api/integrations/:id         // Delete integration
POST   /api/integrations/:id/sync    // Manual sync trigger
GET    /api/integrations/:id/logs    // Sync logs

// Upload History
GET    /api/uploads                  // List uploads
GET    /api/uploads/:id              // Get upload details

// Area Code Expansion
POST   /api/expansion/request        // Request new area codes
GET    /api/expansion/requests       // List requests

// Payments (Stripe)
POST   /api/stripe/checkout          // Create checkout session
POST   /api/stripe/portal            // Customer portal
POST   /api/stripe/webhook           // Stripe webhooks

// Admin
GET    /api/admin/users              // List all users
POST   /api/admin/bulk-upload        // Bulk DNC upload
GET    /api/admin/analytics          // Platform analytics
```

---

### Environment Variables Checklist

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

# N8N
N8N_WEBHOOK_URL=
N8N_API_KEY=

# Email (Resend)
RESEND_API_KEY=

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
POSTHOG_API_KEY=

# Error Tracking
SENTRY_DSN=

# App
NEXT_PUBLIC_APP_URL=https://echocompli.com
NODE_ENV=production
```

---

### Deployment Checklist

**Pre-Deployment:**
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] Supabase RLS policies tested
- [ ] Stripe webhooks configured
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] Error tracking configured
- [ ] Analytics configured

**Post-Deployment:**
- [ ] Smoke tests passed
- [ ] Health check endpoint working
- [ ] User signup flow tested
- [ ] Payment flow tested
- [ ] CRM integrations tested
- [ ] Monitoring alerts configured
- [ ] Backup strategy in place
- [ ] Incident response plan documented

---

## APPENDIX B: BRAND ASSETS

### Logo Usage

```
Primary Logo: "Echo Mind Compliance"
├─ Full color (on white background)
├─ White version (on dark backgrounds)
└─ Icon only (for favicons, app icons)

Logo Files Needed:
├─ logo-full-color.svg
├─ logo-white.svg
├─ logo-icon.svg
├─ favicon.ico (32x32)
└─ apple-touch-icon.png (180x180)
```

### Brand Voice

**Tone:**
- Professional but approachable
- Confident without arrogance
- Clear and transparent
- Helpful and educational

**Voice Characteristics:**
- Direct: Get to the point quickly
- Honest: No hiding fees or complexity
- Empowering: Users are smart, we're here to help
- Compliance-focused: Serious about TCPA, but not scary

**Example Copy:**

❌ Bad: "Revolutionize your lead management with our cutting-edge AI-powered platform!"
✅ Good: "Scrub your leads, stay compliant, and never worry about TCPA violations."

❌ Bad: "Our proprietary algorithms leverage machine learning..."
✅ Good: "Our AI checks every lead for risk patterns beyond just DNC status."

---

## CONCLUSION

Echo Mind Compliance is positioned to disrupt the DNC scrubbing market with three key differentiators:

1. **AI Intelligence** - First platform with predictive risk scoring
2. **Built-in CRM + Instant Integrations** - All-in-one solution
3. **Transparent Community Growth** - Cooperative expansion model

With a refined pricing strategy ($47/month unlimited, $24/month for Utah's Elite), modern UX, permanent CRM storage, and day-one CRM integrations, we can capture 100+ customers in Year 1 and achieve $15k+ MRR by Month 6.

**The technical architecture is:**
- ✅ Sound and scalable
- ✅ Built on proven technologies (Next.js, Supabase, N8N)
- ✅ Bootstrappable (total cost: $50-100/month)
- ✅ Ready for 3-week MVP build using Cursor + Claude

**This PRD provides:**
- Complete database schema with all tables
- Detailed feature specifications
- UI/UX wireframes and design system
- Development roadmap with weekly sprints
- Risk mitigation strategies
- Go-to-market plan
- Success metrics and KPIs

---

**Next Steps:**
1. Confirm domain availability (echocompli.com)
2. Set up development environment
3. Begin Week 1 sprint (Foundation)
4. Launch at conference (Week 3)

**Ready to build!** 🚀

---

**Document Version:** 1.1  
**Last Updated:** January 8, 2026  
**Author:** Braxton, Echo Mind Systems  
**For:** Claude Opus (Cursor AI) - Complete build reference  

**File Location in Project:** `/docs/PRD.md`