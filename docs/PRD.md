# PRODUCT REQUIREMENTS DOCUMENT
## Echo Mind Compliance - Intelligent DNC Scrubbing Platform

**Version:** 2.0  
**Date:** January 8, 2026  
**Author:** Braxton, Echo Mind Systems  
**Status:** Pre-Development  
**Last Updated:** January 8, 2026

---

## DOCUMENT CHANGELOG

**v2.0 (January 8, 2026)**
- **Architecture:** Refactored for portable, app-ready structure
- **Design System:** Added Echo Mind brand identity (distinct from generic SaaS)
- **Mobile-First:** Redesigned all UI for 375px+ with touch-first interactions
- **PWA Support:** Added progressive web app specifications
- **Folder Structure:** Separated core logic for future React Native conversion
- **API Layer:** Standardized RESTful endpoints for web + future mobile app
- **Components:** Designed for reusability across web and native platforms

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

**Technical Approach:** Website-first with portable architecture for future iOS/Android native apps

---

## TABLE OF CONTENTS

1. [Product Vision & Positioning](#1-product-vision--positioning)
2. [Target Users & Personas](#2-target-users--personas)
3. [Product Features & Specifications](#3-product-features--specifications)
4. [Database Schema](#4-database-schema)
5. [Technical Architecture](#5-technical-architecture)
6. [Design System & Brand Identity](#6-design-system--brand-identity)
7. [Mobile-First UI/UX Patterns](#7-mobile-first-uiux-patterns)
8. [Progressive Web App (PWA) Specifications](#8-progressive-web-app-pwa-specifications)
9. [Development Roadmap](#9-development-roadmap)
10. [Success Metrics (KPIs)](#10-success-metrics-kpis)
11. [Pricing Strategy](#11-pricing-strategy)
12. [Competitive Analysis](#12-competitive-analysis)
13. [Marketing & Go-to-Market](#13-marketing--go-to-market)
14. [Risk Mitigation](#14-risk-mitigation)
15. [Next Steps to Build](#15-next-steps-to-build)
16. [Open Questions / Decisions](#16-open-questions--decisions-needed)
17. [Success Criteria](#17-success-criteria)

---

## 1. PRODUCT VISION & POSITIONING

### Vision Statement
*"Make TCPA compliance effortless and intelligent for every real estate professional, while building the most transparent and community-driven compliance platform in the industry."*

### Mission
Transform DNC scrubbing from a painful, expensive checkbox into an intelligent workflow tool that agents actually want to use—on any device, anywhere.

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
│    │            • Mobile-First PWA                  │
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
7. **Mobile-First PWA** - Works flawlessly on phone, tablet, desktop
8. **Unique Design** - Echo Mind brand identity, not generic SaaS clone
9. **Data Control** - Users can delete ALL data anytime
10. **Future-Proof** - Built to convert to native iOS/Android apps

---

## 2. TARGET USERS & PERSONAS

### Primary Persona: "Active Agent Ashley"

**Demographics:**
- Age: 28-45
- Role: Real estate agent (independent or small brokerage)
- Market: Utah (initial), expanding regionally
- Tech savvy: Moderate (uses Google Sheets, CRM, basic automation)
- **Device Usage:** 70% mobile, 30% desktop
- **Work Style:** On-the-go, between showings, in car

**Pain Points:**
- Paying $0.08-0.12 per lead for DNC scrubbing ($1,500+/year)
- Clunky upload/download workflows
- Fear of TCPA violations ($16,000/incident)
- Doesn't understand which leads are "risky" beyond DNC yes/no
- Multiple tools for different tasks
- Losing track of leads across platforms
- No good affordable CRM options
- **Mobile-specific:** Desktop-only tools don't work on phone

**Goals:**
- Save money on lead scrubbing
- Work faster (no file uploads/downloads)
- Stay compliant without thinking about it
- Get smarter about which leads to prioritize
- Manage leads in one place
- Sync to CRM automatically
- **Mobile-specific:** Scrub leads from phone while driving between showings

**Buying Triggers:**
- Conference attendee (warm intro from Utah's Elite)
- Sees ROI calculation (saves $1,200+/year)
- Tries demo (instant scrub in Google Sheets)
- Tests on phone (works perfectly)
- Trusts transparent pricing
- Loves built-in CRM (no extra cost)

---

### Secondary Persona: "Brokerage Owner Bob"

**Demographics:**
- Age: 45-60
- Role: Brokerage owner (5-25 agents)
- Market: Multi-state operations
- Tech savvy: Low-moderate (delegates to office manager)
- **Device Usage:** 60% desktop, 40% tablet/mobile

**Pain Points:**
- Needs compliance for entire team
- Expensive enterprise solutions ($300-500/month)
- Risk of agent TCPA violations reflects on brokerage
- Hard to track which agents are compliant
- Multiple tools = training nightmare
- **Mobile-specific:** Agents need tools that work on the go

**Goals:**
- Cost-effective compliance for whole team
- Centralized monitoring
- Protect brokerage reputation
- Simple onboarding for agents
- One tool for everything
- **Mobile-specific:** Agents can use from anywhere

**Future Feature:** Team accounts (Phase 2)

---

## 3. PRODUCT FEATURES & SPECIFICATIONS

### 3.1 MVP FEATURES (Launch Day - Week 3)

#### Feature 1: File Upload & Scrubbing

**User Story:**
> "As an agent, I want to upload my lead file from my phone and get back clean leads in under 30 seconds, so I can start calling immediately."

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
- **MOBILE:** Works seamlessly on 375px+ screens
- **MOBILE:** Touch-optimized file picker

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
    const normalized = normalizePhone(lead.phone_number);
    if (seen.has(normalized)) {
      duplicates.push({ index, phone: normalized });
    }
    seen.add(normalized);
  });
  
  return duplicates;
}
```

---

#### Feature 2: Google Sheets Add-on

**User Story:**
> "As an agent, I want to scrub leads directly in my existing Google Sheet without downloading or uploading files, so I can work faster."

**Acceptance Criteria:**
- Installable from Google Workspace Marketplace
- One-click "Scrub Leads" button in toolbar
- Processes leads in-place (new "Clean Leads" tab)
- Preserves original data
- Shows branded UI with Echo Mind colors
- Works on mobile Google Sheets app
- Same duplicate detection as web app

**Technical Implementation:**
- Apps Script with N8N webhook integration
- OAuth 2.0 with Supabase auth
- Branded sidebar UI
- Real-time progress updates

---

#### Feature 3: Built-in CRM

**User Story:**
> "As an agent, I want to save promising leads to my personal CRM so I can follow up without juggling multiple tools."

**Acceptance Criteria:**
- Save individual leads from scrub results
- Bulk save all clean leads
- Permanent storage (no 30-day limit)
- Search and filter by status, date, risk score
- Add notes and tags
- Track call history
- **MOBILE:** Swipe actions for quick operations
- **MOBILE:** Bottom sheet for lead details

**Mobile-Optimized Features:**
- Pull-to-refresh lead list
- Infinite scroll
- Quick actions: Call, Text, Email
- One-tap status changes
- Voice notes (future: Phase 2)

---

#### Feature 4: CRM Integrations

**User Story:**
> "As an agent, I want to automatically push clean leads to Follow Up Boss or Lofty so I don't have to manually import."

**Supported CRMs (MVP):**
- Follow Up Boss
- Lofty
- Kvcore

**Acceptance Criteria:**
- One-time OAuth setup
- Auto-sync clean leads after scrub
- Manual sync button
- Sync logs with error handling
- Field mapping configuration
- **MOBILE:** Simple 3-step setup wizard

**Technical Implementation:**

```javascript
// CRM Integration Service (Portable)
// Location: src/core/services/crm-integration.service.ts

interface CRMIntegration {
  id: string;
  user_id: string;
  crm_type: 'followupboss' | 'lofty' | 'kvcore';
  credentials: {
    api_key?: string;
    oauth_token?: string;
    refresh_token?: string;
  };
  field_mapping: {
    phone_number: string;
    first_name: string;
    last_name: string;
    email: string;
    address: string;
    custom_fields: Record<string, string>;
  };
  sync_settings: {
    auto_sync: boolean;
    sync_risky: boolean;
    sync_frequency: 'immediate' | 'hourly' | 'daily';
  };
  status: 'active' | 'paused' | 'error';
  last_sync_at: string;
  created_at: string;
  updated_at: string;
}

// API Endpoints
POST   /api/integrations             // Create integration
PUT    /api/integrations/:id         // Update integration
DELETE /api/integrations/:id         // Delete integration
POST   /api/integrations/:id/sync    // Manual sync trigger
GET    /api/integrations/:id/logs    // Sync logs
```

---

#### Feature 5: AI Risk Scoring

**User Story:**
> "As an agent, I want to know which leads are high-risk beyond just DNC status, so I can prioritize safe calls."

**Risk Factors:**
- DNC registry match (federal + state)
- Number type (landline, mobile, VOIP)
- Area code mismatch
- Recent litigation history
- Repeated registrations

**Risk Score Ranges:**
- **0-20:** Safe (green) - Clear to call
- **21-60:** Caution (yellow) - Review before calling
- **61-100:** Blocked (red) - Do not call

**Technical Implementation:**

```javascript
// Risk Calculation Service (Portable)
// Location: src/core/services/risk-calculator.service.ts

interface RiskScore {
  score: number; // 0-100
  factors: {
    dnc_match: boolean;
    phone_type: 'mobile' | 'landline' | 'voip' | 'unknown';
    area_code_mismatch: boolean;
    recent_violations: number;
    repeated_registrations: number;
  };
  recommendation: 'safe' | 'caution' | 'blocked';
  explanation: string;
}

function calculateRiskScore(lead, dncRecords): RiskScore {
  let score = 0;
  const factors = {
    dnc_match: false,
    phone_type: 'unknown',
    area_code_mismatch: false,
    recent_violations: 0,
    repeated_registrations: 0
  };
  
  // DNC Match (50 points)
  if (dncRecords.includes(lead.phone_number)) {
    score += 50;
    factors.dnc_match = true;
  }
  
  // Phone Type (20 points if VOIP)
  if (lead.phone_type === 'voip') {
    score += 20;
    factors.phone_type = 'voip';
  }
  
  // Area Code Mismatch (15 points)
  if (lead.area_code !== lead.billing_zip_area_code) {
    score += 15;
    factors.area_code_mismatch = true;
  }
  
  // Additional logic...
  
  return {
    score,
    factors,
    recommendation: score <= 20 ? 'safe' : score <= 60 ? 'caution' : 'blocked',
    explanation: generateExplanation(factors)
  };
}
```

---

#### Feature 6: Upload History & Analytics

**User Story:**
> "As an agent, I want to see my past scrubs and track compliance over time, so I can report to my broker."

**Acceptance Criteria:**
- List all past uploads with date, summary stats
- Downloadable reports for each scrub
- Compliance score trend chart
- Total leads scrubbed counter
- **MOBILE:** Card-based history view
- **MOBILE:** Swipe to download report

**Dashboard Metrics:**
- Total leads scrubbed (lifetime)
- Average compliance score
- Clean rate percentage
- Blocked leads saved (TCPA violations prevented)
- Most recent scrub date

---

#### Feature 7: Area Code Expansion Requests

**User Story:**
> "As an agent expanding to new markets, I want to request additional area codes and track progress, so I can call leads in new territories."

**Acceptance Criteria:**
- Form to request new area codes
- Show cost estimate ($50-200 based on FTC data availability)
- Track request status (pending, funded, completed)
- Show community funding progress
- **MOBILE:** Simple 2-step request flow

**Cooperative Funding Model:**

```
User requests 970 area code ($150 FTC cost)
├─ User contributes $75 (50%)
├─ Echo Mind matches $75 (50%)
└─ All users in Colorado gain access once complete

Future requests for 970:
├─ Users pay $0 (already funded)
└─ Incentivizes early adopters
```

---

#### Feature 8: User Profile & Settings

**User Story:**
> "As an agent, I want to manage my subscription, area codes, and account settings in one place."

**Acceptance Criteria:**
- View/edit profile information
- Manage subscribed area codes
- View billing history
- Update payment method (Stripe)
- Delete all user data (GDPR compliance)
- **MOBILE:** Bottom navigation for quick access

**Settings Sections:**
- **Account:** Name, email, password, phone
- **Subscription:** Plan, billing, invoices
- **Area Codes:** Active codes, request new
- **Integrations:** Connected CRMs, Google Sheets
- **Privacy:** Data deletion, export data
- **Preferences:** Email notifications, default settings

---

### 3.2 POST-MVP FEATURES (Month 2+)

#### Feature 9: Team Accounts (Month 2)

**User Story:**
> "As a brokerage owner, I want to manage compliance for my entire team with centralized billing and monitoring."

**Acceptance Criteria:**
- Admin dashboard with team overview
- Add/remove team members
- Centralized billing (one charge for all agents)
- Individual usage tracking
- Team compliance reports
- Role-based permissions

---

#### Feature 10: Advanced Analytics (Month 3)

**User Story:**
> "As an agent, I want to see which lead sources have the highest DNC rates, so I can optimize my marketing spend."

**Features:**
- Lead source tracking
- DNC rate by source
- Risk score distribution charts
- Time-series compliance trends
- Export data to CSV

---

#### Feature 11: Webhooks & API Access (Month 4+)

**User Story:**
> "As a power user, I want to integrate Echo Mind into my custom automation workflows."

**Features:**
- RESTful API with authentication
- Webhooks for scrub completion
- Developer documentation
- Rate limiting (fair use)

---

## 4. DATABASE SCHEMA

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Subscription
  subscription_status TEXT CHECK (subscription_status IN ('active', 'trialing', 'canceled', 'past_due', 'paused')) DEFAULT 'trialing',
  subscription_tier TEXT CHECK (subscription_tier IN ('base', 'utah_elite', 'team')) DEFAULT 'base',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferences JSONB DEFAULT '{
    "email_notifications": true,
    "auto_sync_crm": true,
    "include_risky_in_download": false,
    "default_area_codes": []
  }',
  
  -- Usage Tracking
  total_leads_scrubbed INTEGER DEFAULT 0,
  last_scrub_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_count INTEGER DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
```

---

### Area Code Subscriptions Table

```sql
CREATE TABLE area_code_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  area_code TEXT NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
  status TEXT CHECK (status IN ('active', 'expired', 'pending')) DEFAULT 'active',
  
  UNIQUE(user_id, area_code)
);

CREATE INDEX idx_area_code_subs_user ON area_code_subscriptions(user_id);
CREATE INDEX idx_area_code_subs_code ON area_code_subscriptions(area_code);
```

---

### DNC Registry Table

```sql
CREATE TABLE dnc_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  area_code TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT CHECK (source IN ('federal', 'utah_state', 'manual')) NOT NULL,
  metadata JSONB DEFAULT '{}',
  
  -- Indexes for fast lookup
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dnc_phone ON dnc_registry(phone_number);
CREATE INDEX idx_dnc_area_code ON dnc_registry(area_code);
CREATE INDEX idx_dnc_source ON dnc_registry(source);
```

---

### Upload History Table

```sql
CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Upload Details
  filename TEXT NOT NULL,
  file_size INTEGER, -- bytes
  total_leads INTEGER NOT NULL,
  
  -- Results
  clean_leads INTEGER NOT NULL,
  dnc_blocked INTEGER NOT NULL,
  caution_leads INTEGER NOT NULL,
  duplicates_removed INTEGER DEFAULT 0,
  
  -- Risk Scoring
  average_risk_score DECIMAL(5,2),
  compliance_rate DECIMAL(5,2), -- percentage clean
  
  -- Files
  clean_file_url TEXT,
  full_report_url TEXT,
  risky_file_url TEXT,
  
  -- Processing
  processing_time_ms INTEGER,
  n8n_job_id TEXT,
  status TEXT CHECK (status IN ('processing', 'completed', 'failed')) DEFAULT 'processing',
  error_message TEXT,
  
  -- Metadata
  source TEXT, -- 'web', 'google_sheets', 'api'
  area_codes_used TEXT[], -- array of area codes checked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_upload_user ON upload_history(user_id);
CREATE INDEX idx_upload_created ON upload_history(created_at DESC);
CREATE INDEX idx_upload_status ON upload_history(status);
```

---

### CRM Leads Table (Built-in CRM)

```sql
CREATE TABLE crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Lead Information
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Risk & Compliance
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT CHECK (risk_level IN ('safe', 'caution', 'blocked')),
  dnc_status BOOLEAN DEFAULT FALSE,
  last_scrubbed_at TIMESTAMP WITH TIME ZONE,
  
  -- CRM Fields
  status TEXT CHECK (status IN ('new', 'contacted', 'qualified', 'nurturing', 'converted', 'dead')) DEFAULT 'new',
  source TEXT, -- where lead came from
  tags TEXT[], -- array of tags
  notes TEXT,
  assigned_to TEXT, -- for team accounts
  
  -- Activity Tracking
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_followup_at TIMESTAMP WITH TIME ZONE,
  contact_count INTEGER DEFAULT 0,
  
  -- Metadata
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- soft delete
);

CREATE INDEX idx_crm_user ON crm_leads(user_id);
CREATE INDEX idx_crm_phone ON crm_leads(phone_number);
CREATE INDEX idx_crm_status ON crm_leads(status);
CREATE INDEX idx_crm_risk_level ON crm_leads(risk_level);
CREATE INDEX idx_crm_created ON crm_leads(created_at DESC);
CREATE INDEX idx_crm_deleted ON crm_leads(deleted_at);
```

---

### CRM Integrations Table

```sql
CREATE TABLE crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Integration Details
  crm_type TEXT CHECK (crm_type IN ('followupboss', 'lofty', 'kvcore')) NOT NULL,
  crm_name TEXT NOT NULL, -- user-friendly name
  
  -- Credentials (encrypted)
  credentials JSONB NOT NULL, -- { api_key, oauth_token, refresh_token, etc }
  
  -- Field Mapping
  field_mapping JSONB NOT NULL DEFAULT '{
    "phone_number": "phone",
    "first_name": "firstName",
    "last_name": "lastName",
    "email": "email",
    "address": "address",
    "custom_fields": {}
  }',
  
  -- Sync Settings
  sync_settings JSONB DEFAULT '{
    "auto_sync": true,
    "sync_risky": false,
    "sync_frequency": "immediate"
  }',
  
  -- Status
  status TEXT CHECK (status IN ('active', 'paused', 'error')) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, crm_type) -- One integration per CRM type per user
);

CREATE INDEX idx_crm_int_user ON crm_integrations(user_id);
CREATE INDEX idx_crm_int_status ON crm_integrations(status);
```

---

### CRM Integration Logs Table

```sql
CREATE TABLE crm_integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES crm_integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type TEXT CHECK (sync_type IN ('manual', 'auto')) NOT NULL,
  leads_synced INTEGER NOT NULL,
  leads_failed INTEGER DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('success', 'partial', 'failed')) NOT NULL,
  error_message TEXT,
  
  -- Metadata
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER
);

CREATE INDEX idx_crm_logs_integration ON crm_integration_logs(integration_id);
CREATE INDEX idx_crm_logs_user ON crm_integration_logs(user_id);
CREATE INDEX idx_crm_logs_started ON crm_integration_logs(started_at DESC);
```

---

### Area Code Expansion Requests Table

```sql
CREATE TABLE area_code_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_code TEXT NOT NULL,
  
  -- Requester
  requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Funding
  ftc_cost DECIMAL(10,2) NOT NULL, -- cost to acquire data from FTC
  user_contribution DECIMAL(10,2) NOT NULL, -- typically 50%
  echo_mind_contribution DECIMAL(10,2) NOT NULL, -- typically 50%
  total_funded DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('pending', 'funding', 'processing', 'completed', 'failed')) DEFAULT 'pending',
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100) DEFAULT 0,
  
  -- Completion
  records_added INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_area_requests_code ON area_code_requests(area_code);
CREATE INDEX idx_area_requests_status ON area_code_requests(status);
CREATE INDEX idx_area_requests_requester ON area_code_requests(requested_by);
```

---

### Payments Table (Stripe Events)

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stripe Details
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_invoice_id TEXT,
  
  -- Payment Info
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT CHECK (status IN ('succeeded', 'pending', 'failed', 'refunded')) NOT NULL,
  
  -- Description
  description TEXT,
  payment_type TEXT CHECK (payment_type IN ('subscription', 'area_code', 'one_time')) NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe_pi ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_created ON payments(created_at DESC);
```

---

### Analytics Table (Optional - For Advanced Tracking)

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event Details
  event_type TEXT NOT NULL, -- 'scrub_completed', 'crm_sync', 'login', etc
  event_data JSONB DEFAULT '{}',
  
  -- Context
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  platform TEXT CHECK (platform IN ('web', 'ios', 'android', 'google_sheets')),
  user_agent TEXT,
  ip_address INET,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
```

---

## 5. TECHNICAL ARCHITECTURE

### 5.1 Architecture Philosophy

**Portable-First Design:**
- Separate business logic from UI layer
- Prepare for React Native conversion
- Share 70-80% code between web and mobile apps

**API-Centric:**
- All features accessible via REST API
- Web app and future mobile app use same endpoints
- Third-party integrations possible

**Progressive Enhancement:**
- Core features work without JavaScript (where possible)
- PWA capabilities added progressively
- Offline-first for read operations

---

### 5.2 Technology Stack

#### **Frontend (Web)**
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** TailwindCSS 3+ (mobile-first utility classes)
- **Components:** shadcn/ui (customized with Echo Mind theme)
- **State Management:** Zustand (lightweight, portable)
- **Forms:** React Hook Form + Zod validation
- **API Calls:** Axios (portable service layer)
- **PWA:** next-pwa plugin

#### **Backend (API)**
- **Runtime:** Next.js API routes (serverless functions)
- **Database:** Supabase (PostgreSQL)
- **ORM:** Prisma (type-safe queries)
- **Auth:** Supabase Auth (JWT tokens)
- **File Storage:** Supabase Storage (CSV files, reports)
- **Payments:** Stripe (subscriptions, one-time charges)

#### **Scrubbing Engine**
- **Orchestration:** N8N (self-hosted workflow automation)
- **AI Risk Scoring:** Claude API (Anthropic)
- **Phone Validation:** libphonenumber-js
- **Data Processing:** Node.js workers

#### **External Integrations**
- **CRMs:** Follow Up Boss, Lofty, Kvcore (OAuth 2.0)
- **Google Sheets:** Apps Script + OAuth 2.0
- **Email:** Resend (transactional emails)
- **Analytics:** PostHog (self-hosted) + Plausible (privacy-focused)

#### **DevOps**
- **Hosting:** Vercel (web) + Railway (N8N)
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry (errors) + BetterStack (uptime)
- **Domain:** echocompli.com (SSL via Vercel)

---

### 5.3 Folder Structure (Portable Architecture)

```
echo-mind-compliance/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── .env.example
├── .env.local
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker
│   ├── icons/
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   └── images/
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data
│   └── migrations/
│
├── supabase/
│   ├── config.toml
│   ├── schema.sql              # Initial schema
│   └── seed.sql                # Test data
│
├── src/
│   │
│   ├── core/                   # ← PORTABLE LOGIC (reusable in mobile app)
│   │   │
│   │   ├── services/           # Business logic services
│   │   │   ├── scrub.service.ts
│   │   │   ├── crm.service.ts
│   │   │   ├── crm-integration.service.ts
│   │   │   ├── risk-calculator.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── subscription.service.ts
│   │   │   ├── area-code.service.ts
│   │   │   └── analytics.service.ts
│   │   │
│   │   ├── hooks/              # React hooks (business logic)
│   │   │   ├── useScrub.ts
│   │   │   ├── useCRM.ts
│   │   │   ├── useCRMIntegration.ts
│   │   │   ├── useAuth.ts
│   │   │   ├── useSubscription.ts
│   │   │   └── useUploadHistory.ts
│   │   │
│   │   ├── utils/              # Pure utility functions
│   │   │   ├── phone-parser.ts
│   │   │   ├── date-formatter.ts
│   │   │   ├── csv-parser.ts
│   │   │   ├── file-validator.ts
│   │   │   └── risk-calculator.ts
│   │   │
│   │   └── validation/         # Zod schemas
│   │       ├── scrub.schema.ts
│   │       ├── crm.schema.ts
│   │       ├── auth.schema.ts
│   │       └── user.schema.ts
│   │
│   ├── app/                    # ← WEB-SPECIFIC (Next.js App Router)
│   │   │
│   │   ├── (auth)/             # Auth routes (public)
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── reset-password/
│   │   │   └── verify-email/
│   │   │
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Dashboard home
│   │   │   ├── scrub/
│   │   │   │   ├── page.tsx    # Upload & scrub
│   │   │   │   └── [jobId]/
│   │   │   │       └── page.tsx # Results page
│   │   │   ├── crm/
│   │   │   │   ├── page.tsx    # Lead list
│   │   │   │   └── [leadId]/
│   │   │   │       └── page.tsx # Lead details
│   │   │   ├── integrations/
│   │   │   │   ├── page.tsx    # CRM integrations list
│   │   │   │   └── [id]/
│   │   │   │       ├── setup/
│   │   │   │       └── logs/
│   │   │   ├── history/
│   │   │   │   ├── page.tsx    # Upload history
│   │   │   │   └── [uploadId]/
│   │   │   │       └── page.tsx # Upload details
│   │   │   ├── expansion/
│   │   │   │   └── page.tsx    # Request area codes
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx    # Account settings
│   │   │   │   ├── profile/
│   │   │   │   ├── subscription/
│   │   │   │   ├── area-codes/
│   │   │   │   └── privacy/
│   │   │   └── analytics/      # Advanced analytics (Phase 2)
│   │   │
│   │   ├── api/                # API routes (shared with future mobile app)
│   │   │   ├── auth/
│   │   │   │   ├── signup/route.ts
│   │   │   │   ├── login/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── reset-password/route.ts
│   │   │   ├── user/
│   │   │   │   ├── profile/route.ts
│   │   │   │   ├── usage/route.ts
│   │   │   │   └── data/route.ts     # Delete all data
│   │   │   ├── scrub/
│   │   │   │   ├── route.ts          # POST upload
│   │   │   │   ├── status/[jobId]/route.ts
│   │   │   │   ├── results/[jobId]/route.ts
│   │   │   │   └── download/[fileId]/route.ts
│   │   │   ├── crm/
│   │   │   │   ├── leads/
│   │   │   │   │   ├── route.ts      # GET list, POST create
│   │   │   │   │   ├── [id]/route.ts # GET, PUT, DELETE
│   │   │   │   │   ├── bulk/route.ts
│   │   │   │   │   └── search/route.ts
│   │   │   ├── integrations/
│   │   │   │   ├── route.ts          # GET list, POST create
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts      # GET, PUT, DELETE
│   │   │   │   │   ├── sync/route.ts
│   │   │   │   │   └── logs/route.ts
│   │   │   ├── uploads/
│   │   │   │   ├── route.ts          # GET history
│   │   │   │   └── [id]/route.ts     # GET details
│   │   │   ├── expansion/
│   │   │   │   ├── request/route.ts
│   │   │   │   └── requests/route.ts
│   │   │   ├── stripe/
│   │   │   │   ├── checkout/route.ts
│   │   │   │   ├── portal/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   └── admin/            # Admin endpoints (Phase 2)
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Global styles
│   │   └── not-found.tsx
│   │
│   ├── components/               # ← MOSTLY PORTABLE
│   │   │
│   │   ├── scrub/                # Scrubbing feature components
│   │   │   ├── FileUploader.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── ResultsSummary.tsx
│   │   │   ├── ResultsTable.tsx
│   │   │   └── DownloadButton.tsx
│   │   │
│   │   ├── crm/                  # CRM components
│   │   │   ├── LeadList.tsx
│   │   │   ├── LeadCard.tsx
│   │   │   ├── LeadDetails.tsx
│   │   │   ├── LeadFilters.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── AddLeadForm.tsx
│   │   │
│   │   ├── integrations/         # CRM integration components
│   │   │   ├── IntegrationCard.tsx
│   │   │   ├── SetupWizard.tsx
│   │   │   ├── FieldMapper.tsx
│   │   │   └── SyncLogs.tsx
│   │   │
│   │   ├── history/              # Upload history components
│   │   │   ├── HistoryList.tsx
│   │   │   ├── HistoryCard.tsx
│   │   │   └── ComplianceChart.tsx
│   │   │
│   │   ├── expansion/            # Area code expansion
│   │   │   ├── RequestForm.tsx
│   │   │   ├── FundingProgress.tsx
│   │   │   └── AreaCodeList.tsx
│   │   │
│   │   ├── settings/             # Settings components
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── PasswordForm.tsx
│   │   │   ├── BillingInfo.tsx
│   │   │   ├── AreaCodeManager.tsx
│   │   │   └── DataDeletion.tsx
│   │   │
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx     # Bottom nav for mobile
│   │   │   ├── Footer.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   └── ui/                   # shadcn/ui components (customized)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── sheet.tsx         # Bottom sheet for mobile
│   │       ├── toast.tsx
│   │       ├── badge.tsx
│   │       ├── progress.tsx
│   │       └── ... (all shadcn components)
│   │
│   ├── lib/                      # Utilities & configurations
│   │   ├── supabase.ts           # Supabase client
│   │   ├── stripe.ts             # Stripe client
│   │   ├── axios.ts              # Axios instance
│   │   ├── n8n.ts                # N8N webhook calls
│   │   ├── prisma.ts             # Prisma client
│   │   └── utils.ts              # shadcn utils (cn, etc)
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts              # Central exports
│   │   ├── user.types.ts
│   │   ├── scrub.types.ts
│   │   ├── crm.types.ts
│   │   ├── integration.types.ts
│   │   ├── upload.types.ts
│   │   ├── payment.types.ts
│   │   └── api.types.ts
│   │
│   └── middleware.ts             # Next.js middleware (auth, redirects)
│
├── docs/
│   ├── PRD.md                    # This document
│   ├── BUILD_GUIDE.md            # Step-by-step build instructions
│   ├── API_REFERENCE.md          # API documentation
│   ├── DEPLOYMENT.md             # Deployment guide
│   └── APP_MIGRATION.md          # Future: React Native migration guide
│
├── scripts/
│   ├── seed-db.ts                # Database seeding
│   ├── migrate-db.ts             # Manual migrations
│   └── generate-types.ts         # Generate TypeScript types from Prisma
│
├── tests/                        # Tests (future)
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # Continuous integration
│       └── deploy.yml            # Deployment workflow
│
└── README.md
```

---

### 5.4 API Design Principles

**RESTful Structure:**
- `GET /api/resource` - List resources
- `GET /api/resource/:id` - Get single resource
- `POST /api/resource` - Create resource
- `PUT /api/resource/:id` - Update resource
- `DELETE /api/resource/:id` - Delete resource

**Consistent Response Format:**

```typescript
// Success response
{
  success: true,
  data: { ... },
  message?: string,
  meta?: { pagination, timestamp, etc }
}

// Error response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Phone number is invalid",
    details: { field: "phone_number", value: "123" }
  }
}
```

**Authentication:**
- JWT tokens from Supabase Auth
- Bearer token in Authorization header
- Automatic refresh with Supabase SDK

**Rate Limiting:**
- 100 requests per minute per user (authenticated)
- 10 requests per minute per IP (unauthenticated)
- Scrub endpoint: 10 uploads per hour per user

---

### 5.5 Data Flow

**Scrubbing Workflow:**

```
User uploads file (web or Google Sheets)
  ↓
Next.js API receives file
  ↓
Validate file format & size
  ↓
Parse leads (CSV → JSON)
  ↓
Check for duplicates
  ↓
Send to N8N webhook
  ↓
N8N queries DNC registry (Supabase)
  ↓
N8N sends leads to Claude API for risk scoring
  ↓
N8N saves results to Supabase
  ↓
N8N triggers callback to Next.js API
  ↓
Next.js API generates download files
  ↓
User receives clean leads + reports
  ↓
(Optional) Auto-sync to CRM integration
```

**CRM Integration Workflow:**

```
User connects CRM (OAuth)
  ↓
Store credentials in Supabase (encrypted)
  ↓
User scrubs leads
  ↓
Clean leads generated
  ↓
Trigger CRM sync (if auto_sync enabled)
  ↓
Map fields (phone_number → phone, etc)
  ↓
Call CRM API (batch create leads)
  ↓
Log sync results
  ↓
Notify user of success/failure
```

---

### 5.6 Security Considerations

**Authentication:**
- Supabase Auth (email/password, magic links)
- JWT tokens with short expiration
- Refresh tokens for long sessions
- Rate limiting on auth endpoints

**Data Protection:**
- CRM credentials encrypted at rest
- HTTPS everywhere (SSL via Vercel)
- No PII in logs
- User data deletion on request (GDPR)

**File Upload Security:**
- File type validation (CSV, XLSX only)
- Max file size: 50MB
- Virus scanning (ClamAV integration - Phase 2)
- Temporary storage (deleted after 24 hours)

**API Security:**
- CORS configured for echocompli.com only
- CSRF protection (Next.js built-in)
- SQL injection prevention (Prisma parameterized queries)
- XSS protection (React escaping)

**Payment Security:**
- Stripe handles all card data
- No PCI compliance needed
- Webhook signature verification

---

### 5.7 Performance Optimization

**Frontend:**
- Next.js Image optimization
- Code splitting (dynamic imports)
- Lazy loading below-the-fold content
- Service worker caching (PWA)
- Gzip compression

**Backend:**
- Database indexing (see schema)
- Connection pooling (Prisma)
- Caching (Redis - Phase 2)
- CDN for static assets (Vercel Edge)

**Scrubbing Engine:**
- Batch processing (1000 leads per batch)
- Parallel N8N workers
- Cached DNC lookups (10-minute TTL)

---

## 6. DESIGN SYSTEM & BRAND IDENTITY

### 6.1 Echo Mind Brand Philosophy

**Core Principle:** *"Precision meets humanity"*

Echo Mind Systems is not generic SaaS. Our design reflects:
- **Confidence:** Bold, decisive, trustworthy
- **Simplicity:** No clutter, clear hierarchy
- **Intelligence:** Smart features presented elegantly
- **Warmth:** Professional but approachable

**NOT:**
- ❌ Generic gradient SaaS
- ❌ Corporate blue boredom
- ❌ Overly rounded "friendly" shapes
- ❌ Cluttered dashboards

**YES:**
- ✅ Strong typography
- ✅ Strategic use of space
- ✅ Purposeful color
- ✅ Touch-first interactions

---

### 6.2 Color System

**Primary Palette (Echo Mind Brand):**

```css
/* Primary - Echo Mind Teal (from logo) */
--echo-primary-50:  #f0fdfa;
--echo-primary-100: #ccfbf1;
--echo-primary-200: #99f6e4;
--echo-primary-300: #5eead4;
--echo-primary-400: #2dd4bf;
--echo-primary-500: #14b8a6;  /* Main brand color - logo teal */
--echo-primary-600: #0d9488;
--echo-primary-700: #0f766e;
--echo-primary-800: #115e59;
--echo-primary-900: #134e4a;
--echo-primary-950: #042f2e;

/* Secondary - Slate (Neutral) */
--echo-neutral-50:  #f8fafc;
--echo-neutral-100: #f1f5f9;
--echo-neutral-200: #e2e8f0;
--echo-neutral-300: #cbd5e1;
--echo-neutral-400: #94a3b8;
--echo-neutral-500: #64748b;
--echo-neutral-600: #475569;
--echo-neutral-700: #334155;
--echo-neutral-800: #1e293b;
--echo-neutral-900: #0f172a;
--echo-neutral-950: #020617;

/* Semantic Colors */
--echo-success:  #10b981; /* Green - clean leads */
--echo-warning:  #f59e0b; /* Amber - caution leads */
--echo-danger:   #ef4444; /* Red - blocked leads */
--echo-info:     #06b6d4; /* Cyan - informational (matches logo accent) */
```

**Usage:**
- **Primary Teal:** CTAs, focus states, active nav, brand touchpoints
- **Neutral Slate:** Text, backgrounds, borders
- **Success Green:** Clean leads, positive actions
- **Warning Amber:** Caution leads, warnings
- **Danger Red:** Blocked leads, destructive actions

**Color Rules:**
1. **60-30-10 Rule:**
   - 60% Neutral (backgrounds, text)
   - 30% Primary (UI elements, accents)
   - 10% Semantic (status, actions)

2. **Accessibility:**
   - All text: minimum 4.5:1 contrast ratio
   - Interactive elements: minimum 3:1
   - Focus states: always visible

3. **Dark Mode** (Phase 2):
   - Invert neutral scale
   - Reduce primary saturation by 10%
   - Maintain semantic colors

---

### 6.3 Typography

**Font Family:**

```css
/* Primary Font - System Font Stack (Performance) */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
             "Helvetica Neue", Arial, sans-serif;

/* Optional: Google Font - Inter (if branding requires) */
font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
```

**Type Scale:**

```css
/* Mobile-First Scale (375px+) */
--font-xs:   0.75rem;  /* 12px */
--font-sm:   0.875rem; /* 14px */
--font-base: 1rem;     /* 16px */
--font-lg:   1.125rem; /* 18px */
--font-xl:   1.25rem;  /* 20px */
--font-2xl:  1.5rem;   /* 24px */
--font-3xl:  1.875rem; /* 30px */
--font-4xl:  2.25rem;  /* 36px */

/* Desktop Scale (768px+) */
@media (min-width: 768px) {
  --font-xl:   1.5rem;   /* 24px */
  --font-2xl:  1.875rem; /* 30px */
  --font-3xl:  2.25rem;  /* 36px */
  --font-4xl:  3rem;     /* 48px */
}
```

**Font Weights:**

```css
--font-normal:  400;
--font-medium:  500;
--font-semibold: 600;
--font-bold:    700;
```

**Typography Rules:**
1. **Body text:** 16px (font-base), line-height 1.5
2. **Headings:** Bold weight, tight line-height (1.2)
3. **UI elements:** Medium weight, uppercase for labels
4. **Mobile:** Never below 14px for body text

---

### 6.4 Spacing System

**8px Grid:**

```css
--spacing-0:  0;
--spacing-1:  0.25rem;  /* 4px */
--spacing-2:  0.5rem;   /* 8px */
--spacing-3:  0.75rem;  /* 12px */
--spacing-4:  1rem;     /* 16px */
--spacing-5:  1.25rem;  /* 20px */
--spacing-6:  1.5rem;   /* 24px */
--spacing-8:  2rem;     /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-20: 5rem;     /* 80px */
--spacing-24: 6rem;     /* 96px */
```

**Component Spacing:**
- **Cards:** padding-6 (24px)
- **Buttons:** padding-4 (16px horizontal), padding-3 (12px vertical)
- **Sections:** margin-12 (48px vertical)
- **Mobile adjustments:** Reduce by 25% on screens <768px

---

### 6.5 Component Design Patterns

#### **Buttons**

```tsx
// Primary Button
<button className="
  px-6 py-3 
  bg-echo-primary-500 hover:bg-echo-primary-600 active:bg-echo-primary-700
  text-white font-medium
  rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-200
  focus:ring-2 focus:ring-echo-primary-500 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  min-h-[48px] min-w-[48px] /* Touch-friendly */
">
  Scrub Leads
</button>

// Secondary Button
<button className="
  px-6 py-3
  bg-echo-neutral-100 hover:bg-echo-neutral-200
  text-echo-neutral-900 font-medium
  rounded-lg
  border border-echo-neutral-300
  transition-all duration-200
  focus:ring-2 focus:ring-echo-primary-500 focus:ring-offset-2
  min-h-[48px] min-w-[48px]
">
  Cancel
</button>

// Danger Button
<button className="
  px-6 py-3
  bg-echo-danger hover:bg-red-600
  text-white font-medium
  rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-200
  focus:ring-2 focus:ring-echo-danger focus:ring-offset-2
  min-h-[48px] min-w-[48px]
">
  Delete Data
</button>
```

**Button Rules:**
- Minimum 48px × 48px (touch target)
- Clear visual hierarchy (primary > secondary > tertiary)
- Loading states with spinners
- Disabled states visually distinct

---

#### **Cards**

```tsx
// Standard Card
<div className="
  bg-white
  border border-echo-neutral-200
  rounded-xl
  shadow-sm hover:shadow-md
  transition-shadow duration-200
  overflow-hidden
">
  <div className="p-6">
    {/* Card content */}
  </div>
</div>

// Interactive Card (clickable)
<div className="
  bg-white
  border-2 border-echo-neutral-200
  hover:border-echo-primary-500
  rounded-xl
  shadow-sm hover:shadow-lg
  transition-all duration-200
  cursor-pointer
  active:scale-[0.98]
  overflow-hidden
">
  <div className="p-6">
    {/* Card content */}
  </div>
</div>

// Status Card (with colored accent)
<div className="
  bg-white
  border-l-4 border-echo-success
  rounded-r-xl
  shadow-sm
  overflow-hidden
">
  <div className="p-6">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-echo-success/10 flex items-center justify-center">
        <CheckIcon className="w-5 h-5 text-echo-success" />
      </div>
      <div>
        <h3 className="font-semibold text-echo-neutral-900">Clean Leads</h3>
        <p className="text-sm text-echo-neutral-600">127 leads ready to call</p>
      </div>
    </div>
  </div>
</div>
```

---

#### **Forms & Inputs**

```tsx
// Text Input
<div className="space-y-2">
  <label className="block text-sm font-medium text-echo-neutral-700">
    Phone Number
  </label>
  <input
    type="text"
    className="
      w-full
      px-4 py-3
      bg-white
      border border-echo-neutral-300
      focus:border-echo-primary-500 focus:ring-2 focus:ring-echo-primary-500/20
      rounded-lg
      text-echo-neutral-900
      placeholder:text-echo-neutral-400
      transition-all duration-200
      min-h-[48px] /* Touch-friendly */
    "
    placeholder="(801) 555-1234"
  />
  <p className="text-xs text-echo-neutral-500">
    Enter phone number to scrub
  </p>
</div>

// File Upload (Drag & Drop)
<div className="
  border-2 border-dashed border-echo-neutral-300
  hover:border-echo-primary-500
  rounded-xl
  p-12
  text-center
  transition-all duration-200
  cursor-pointer
  bg-echo-neutral-50
  min-h-[200px]
  flex flex-col items-center justify-center
">
  <UploadIcon className="w-12 h-12 text-echo-neutral-400 mb-4" />
  <p className="font-medium text-echo-neutral-900 mb-2">
    Drop your lead file here
  </p>
  <p className="text-sm text-echo-neutral-600 mb-4">
    or click to browse
  </p>
  <p className="text-xs text-echo-neutral-500">
    Supports CSV, Excel (.xlsx, .xls), TXT
  </p>
</div>
```

---

#### **Tables (Mobile-Optimized)**

**Desktop View:**
```tsx
<table className="w-full">
  <thead className="bg-echo-neutral-50 border-b border-echo-neutral-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-medium text-echo-neutral-600 uppercase tracking-wider">
        Phone Number
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-echo-neutral-600 uppercase tracking-wider">
        Name
      </th>
      <th className="px-6 py-3 text-left text-xs font-medium text-echo-neutral-600 uppercase tracking-wider">
        Risk Score
      </th>
      <th className="px-6 py-3 text-right text-xs font-medium text-echo-neutral-600 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-echo-neutral-200">
    <tr className="hover:bg-echo-neutral-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-echo-neutral-900">
        (801) 555-1234
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-echo-neutral-900">
        John Doe
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-echo-success/10 text-echo-success">
          Safe (12)
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <button className="text-echo-primary-600 hover:text-echo-primary-700">
          Save to CRM
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

**Mobile View (Cards):**
```tsx
<div className="space-y-4 md:hidden">
  <div className="bg-white border border-echo-neutral-200 rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-medium text-echo-neutral-900">(801) 555-1234</p>
        <p className="text-sm text-echo-neutral-600">John Doe</p>
      </div>
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-echo-success/10 text-echo-success">
        Safe (12)
      </span>
    </div>
    <button className="w-full py-2 text-sm font-medium text-echo-primary-600 border border-echo-primary-200 rounded-lg hover:bg-echo-primary-50">
      Save to CRM
    </button>
  </div>
</div>
```

---

#### **Status Badges**

```tsx
// Safe Lead
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-echo-success/10 text-echo-success text-sm font-medium">
  <CheckCircleIcon className="w-4 h-4" />
  Safe (12)
</span>

// Caution Lead
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-echo-warning/10 text-echo-warning text-sm font-medium">
  <ExclamationTriangleIcon className="w-4 h-4" />
  Caution (45)
</span>

// Blocked Lead
<span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-echo-danger/10 text-echo-danger text-sm font-medium">
  <XCircleIcon className="w-4 h-4" />
  Blocked (87)
</span>
```

---

#### **Progress Indicators**

```tsx
// Linear Progress Bar
<div className="w-full">
  <div className="flex justify-between items-center mb-2">
    <span className="text-sm font-medium text-echo-neutral-900">
      Processing leads...
    </span>
    <span className="text-sm text-echo-neutral-600">
      78%
    </span>
  </div>
  <div className="h-2 bg-echo-neutral-200 rounded-full overflow-hidden">
    <div 
      className="h-full bg-echo-primary-500 transition-all duration-300 ease-out"
      style={{ width: '78%' }}
    />
  </div>
</div>

// Circular Spinner
<div className="flex items-center justify-center">
  <svg className="animate-spin h-8 w-8 text-echo-primary-500" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
</div>
```

---

### 6.6 Iconography

**Icon Library:** Heroicons (v2) - consistent, professional, MIT licensed

**Icon Usage:**
- **16px:** Inline with text
- **20px:** Buttons, cards
- **24px:** Headers, main actions
- **48px:** Empty states, hero sections

**Icon Colors:**
- Match text color by default
- Use semantic colors for status icons
- 20% opacity for disabled state

---

### 6.7 Layout Patterns

#### **Dashboard Layout**

**Desktop (≥1024px):**
```
┌──────────────────────────────────────────┐
│ Header (Navigation)                      │
├────────┬─────────────────────────────────┤
│        │                                 │
│ Side-  │  Main Content Area             │
│ bar    │  - Cards, tables, forms        │
│        │  - Max width: 1280px           │
│        │  - Padding: 24px               │
│        │                                 │
└────────┴─────────────────────────────────┘
```

**Mobile (<768px):**
```
┌─────────────────┐
│ Header          │
├─────────────────┤
│                 │
│ Main Content    │
│ - Full width    │
│ - Padding: 16px │
│                 │
├─────────────────┤
│ Bottom Nav      │
└─────────────────┘
```

---

#### **Responsive Breakpoints**

```css
/* Mobile First */
/* xs: 0px - 639px (default) */

/* sm: 640px */
@media (min-width: 640px) { ... }

/* md: 768px */
@media (min-width: 768px) { ... }

/* lg: 1024px */
@media (min-width: 1024px) { ... }

/* xl: 1280px */
@media (min-width: 1280px) { ... }

/* 2xl: 1536px */
@media (min-width: 1536px) { ... }
```

**Design Strategy:**
1. Design for 375px mobile first
2. Enhance for tablets (768px+)
3. Optimize for desktop (1024px+)
4. Cap content width at 1280px

---

## 7. MOBILE-FIRST UI/UX PATTERNS

### 7.1 Touch Interactions

**Touch Targets:**
- Minimum size: 48px × 48px
- Spacing between targets: 8px minimum
- Active states: immediate visual feedback

**Gestures:**
- **Swipe left/right:** Navigate, delete, archive
- **Pull to refresh:** Reload lead list, history
- **Long press:** Show contextual menu
- **Pinch to zoom:** View risk score details (Phase 2)

---

### 7.2 Mobile Navigation

#### **Bottom Navigation Bar**

```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-echo-neutral-200 safe-area-inset-bottom md:hidden">
  <div className="flex justify-around items-center h-16">
    <NavButton icon={HomeIcon} label="Home" active />
    <NavButton icon={UploadIcon} label="Scrub" />
    <NavButton icon={UsersIcon} label="CRM" />
    <NavButton icon={ClockIcon} label="History" />
    <NavButton icon={CogIcon} label="Settings" />
  </div>
</nav>
```

**Rules:**
- 3-5 items maximum
- Current page highlighted
- Icons + labels
- Fixed position at bottom

---

### 7.3 Mobile-Specific Components

#### **Bottom Sheet (for modals on mobile)**

```tsx
// Instead of centered modals, use bottom sheets
<div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl animate-slide-up md:hidden">
  <div className="p-6 max-h-[80vh] overflow-y-auto">
    {/* Sheet content */}
  </div>
</div>

// Desktop: use standard centered modal
<div className="hidden md:block fixed inset-0 z-50 flex items-center justify-center">
  <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
    {/* Modal content */}
  </div>
</div>
```

---

#### **Swipe Actions**

```tsx
// Lead card with swipe actions
<div className="relative overflow-hidden">
  {/* Swipe left reveals actions */}
  <div className="absolute inset-y-0 right-0 flex items-center gap-2 bg-echo-danger px-4">
    <button className="text-white">
      <TrashIcon className="w-5 h-5" />
    </button>
  </div>
  
  {/* Main card content */}
  <div className="bg-white p-4 relative" data-swipeable>
    <p className="font-medium">(801) 555-1234</p>
    <p className="text-sm text-echo-neutral-600">John Doe</p>
  </div>
</div>
```

---

#### **Pull to Refresh**

```tsx
// Implement with framer-motion or native browser APIs
<div className="relative">
  <div className="absolute top-0 left-0 right-0 flex justify-center pt-4 opacity-0 transition-opacity" data-pull-to-refresh>
    <svg className="animate-spin h-6 w-6 text-echo-primary-500" />
  </div>
  
  <div className="pt-16" data-refresh-content>
    {/* Scrollable content */}
  </div>
</div>
```

---

### 7.4 Mobile Form Patterns

**Optimizations:**
- Large input fields (min 48px height)
- Native keyboard types (tel, email, number)
- Auto-focus first field
- Clear field button (× icon)
- Submit button at bottom (always visible)

```tsx
<form className="space-y-4">
  <input
    type="tel"
    inputMode="tel"
    className="w-full h-12 px-4 border rounded-lg"
    placeholder="(801) 555-1234"
  />
  
  <button 
    type="submit"
    className="w-full h-12 bg-echo-primary-500 text-white rounded-lg font-medium"
  >
    Scrub Lead
  </button>
</form>
```

---

### 7.5 Loading States (Mobile)

**Skeleton Screens:**
```tsx
// Show content shape while loading
<div className="space-y-4">
  <div className="h-20 bg-echo-neutral-200 rounded-lg animate-pulse" />
  <div className="h-20 bg-echo-neutral-200 rounded-lg animate-pulse" />
  <div className="h-20 bg-echo-neutral-200 rounded-lg animate-pulse" />
</div>
```

**Progressive Loading:**
- Show critical content first
- Lazy load images
- Defer non-critical JS

---

## 8. PROGRESSIVE WEB APP (PWA) SPECIFICATIONS

### 8.1 PWA Features

**Core Capabilities:**
- ✅ Installable on home screen (iOS, Android, Desktop)
- ✅ Works offline (cached static assets)
- ✅ Push notifications (Phase 2)
- ✅ Background sync (Phase 2)
- ✅ Share target (receive files from other apps)

---

### 8.2 Manifest Configuration

**Location:** `/public/manifest.json`

```json
{
  "name": "Echo Mind Compliance",
  "short_name": "Echo Compliance",
  "description": "Intelligent DNC lead scrubbing for real estate professionals",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "Scrub Leads",
      "short_name": "Scrub",
      "description": "Upload and scrub leads",
      "url": "/scrub",
      "icons": [{ "src": "/icons/scrub-icon.png", "sizes": "96x96" }]
    },
    {
      "name": "CRM",
      "short_name": "CRM",
      "description": "View saved leads",
      "url": "/crm",
      "icons": [{ "src": "/icons/crm-icon.png", "sizes": "96x96" }]
    }
  ],
  "categories": ["business", "productivity", "utilities"],
  "prefer_related_applications": false
}
```

---

### 8.3 Service Worker Strategy

**Caching Strategy:**
- **Static assets:** Cache-first (HTML, CSS, JS, images)
- **API calls:** Network-first, fallback to cache
- **User uploads:** Network-only (no cache)

**Implementation:** Using `next-pwa` plugin

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.echocompliance\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    }
  ]
});

module.exports = withPWA({
  // Next.js config
});
```

---

### 8.4 Offline Experience

**Offline Indicator:**
```tsx
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 bg-echo-warning text-white py-2 px-4 text-center text-sm font-medium z-50">
      You're offline. Some features may not work.
    </div>
  );
}
```

**Offline Fallback Pages:**
- `/offline` - Custom offline page
- Cached lead list (read-only)
- Cached upload history

---

### 8.5 Install Prompts

**Custom Install Button:**
```tsx
export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstall(false);
    }
    
    setDeferredPrompt(null);
  };
  
  if (!showInstall) return null;
  
  return (
    <button 
      onClick={handleInstall}
      className="fixed bottom-20 left-4 right-4 bg-echo-primary-500 text-white py-3 px-6 rounded-lg shadow-lg font-medium flex items-center justify-center gap-2"
    >
      <DownloadIcon className="w-5 h-5" />
      Install App
    </button>
  );
}
```

---

## 9. DEVELOPMENT ROADMAP

### Week 1: Foundation (Days 1-7)

**Day 1-2: Project Setup**
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Install dependencies (Tailwind, shadcn/ui, Supabase, Prisma, etc)
- [ ] Configure Tailwind with Echo Mind design tokens
- [ ] Set up folder structure (portable architecture)
- [ ] Create environment variable template
- [ ] Initialize Git repository
- [ ] Set up Supabase project
- [ ] Create Prisma schema from PRD
- [ ] Run initial database migration

**Day 3-4: Authentication**
- [ ] Implement Supabase Auth (email/password)
- [ ] Create auth service layer (`src/core/services/auth.service.ts`)
- [ ] Build login page (`/app/(auth)/login`)
- [ ] Build signup page (`/app/(auth)/signup`)
- [ ] Build password reset flow
- [ ] Set up middleware for protected routes
- [ ] Create auth hooks (`useAuth`, `useUser`)

**Day 5-7: Core Layout & Navigation**
- [ ] Build dashboard layout (`/app/(dashboard)/layout.tsx`)
- [ ] Create Header component
- [ ] Create Sidebar component (desktop)
- [ ] Create MobileNav component (bottom nav)
- [ ] Implement responsive breakpoints
- [ ] Build settings pages (profile, subscription, area codes)
- [ ] Test navigation across all screen sizes

---

### Week 2: Core Features (Days 8-14)

**Day 8-10: File Upload & Scrubbing**
- [ ] Build file uploader component (`FileUploader.tsx`)
- [ ] Implement drag & drop
- [ ] Add file validation (type, size)
- [ ] Create scrub API route (`/api/scrub/route.ts`)
- [ ] Integrate N8N webhook
- [ ] Build progress tracking (`/api/scrub/status/[jobId]`)
- [ ] Create results page (`/app/(dashboard)/scrub/[jobId]`)
- [ ] Implement duplicate detection
- [ ] Add download functionality

**Day 11-12: Built-in CRM**
- [ ] Create CRM database models (Prisma)
- [ ] Build CRM API routes (`/api/crm/leads`)
- [ ] Create lead list page (`/app/(dashboard)/crm`)
- [ ] Build lead card component (mobile-optimized)
- [ ] Implement lead details sheet (bottom sheet on mobile)
- [ ] Add search and filters
- [ ] Implement save-to-CRM from scrub results
- [ ] Add lead status management

**Day 13-14: Upload History & Analytics**
- [ ] Create upload history API (`/api/uploads`)
- [ ] Build history list page (`/app/(dashboard)/history`)
- [ ] Design history cards (mobile-first)
- [ ] Add compliance charts (Chart.js)
- [ ] Implement download reports
- [ ] Create dashboard home with summary stats

---

### Week 3: Integrations & Polish (Days 15-21)

**Day 15-17: CRM Integrations**
- [ ] Build CRM integration service (`crm-integration.service.ts`)
- [ ] Implement Follow Up Boss OAuth
- [ ] Implement Lofty OAuth
- [ ] Implement Kvcore OAuth
- [ ] Create integration setup wizard
- [ ] Build field mapping UI
- [ ] Add manual sync button
- [ ] Create sync logs page
- [ ] Implement auto-sync on scrub completion

**Day 18-19: PWA & Mobile Optimization**
- [ ] Configure `next-pwa`
- [ ] Create manifest.json
- [ ] Generate app icons (all sizes)
- [ ] Implement service worker
- [ ] Add offline indicator
- [ ] Create custom install prompt
- [ ] Test PWA on iOS Safari
- [ ] Test PWA on Android Chrome
- [ ] Optimize touch targets (48px minimum)
- [ ] Implement swipe actions
- [ ] Add pull-to-refresh

**Day 20-21: Testing & Launch Prep**
- [ ] End-to-end testing (scrub → CRM → integrations)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile device testing (iOS, Android)
- [ ] Performance audit (Lighthouse)
- [ ] Security audit (OWASP checklist)
- [ ] Set up Stripe webhooks
- [ ] Configure domain (echocompli.com)
- [ ] Deploy to Vercel
- [ ] Set up monitoring (Sentry, BetterStack)
- [ ] Create user documentation
- [ ] Prepare demo for conference

---

### Post-Launch (Month 2+)

**Month 2: Team Accounts**
- [ ] Multi-user database schema
- [ ] Admin dashboard
- [ ] Team billing
- [ ] Usage tracking per agent
- [ ] Team compliance reports

**Month 3: Advanced Analytics**
- [ ] Lead source tracking
- [ ] DNC rate by source
- [ ] Time-series charts
- [ ] Export to CSV
- [ ] Scheduled reports

**Month 4+: API & Webhooks**
- [ ] RESTful API documentation
- [ ] API key management
- [ ] Rate limiting
- [ ] Webhook endpoints
- [ ] Developer portal

---

## 10. SUCCESS METRICS (KPIs)

### Product Metrics

**User Acquisition:**
- Sign-ups per week
- Trial-to-paid conversion rate (target: 80%)
- Referrals from Utah's Elite (target: 3+ in Month 1)

**User Engagement:**
- Average uploads per user per week (target: 2+)
- CRM usage rate (target: 70% of users save leads)
- CRM integration adoption (target: 60%)
- Google Sheets add-on installs
- Mobile vs desktop usage ratio

**Product Quality:**
- Average scrub time (target: <10 seconds per 1,000 leads)
- Uptime (target: 99.9%)
- Error rate (target: <0.1%)
- User satisfaction (NPS target: 50+)
- 4.5+ star rating

**Revenue:**
- MRR (Monthly Recurring Revenue)
- Churn rate (target: <5%)
- LTV:CAC ratio (target: 200:1)
- Area code expansion revenue

---

### Technical Metrics

**Performance:**
- Page load time (target: <2 seconds)
- Time to Interactive (target: <3 seconds)
- Largest Contentful Paint (target: <2.5 seconds)
- API response time (target: <200ms)

**Mobile:**
- Mobile traffic percentage
- PWA install rate
- Mobile bounce rate (target: <40%)
- Touch interaction success rate

**Reliability:**
- 99.9% uptime
- Zero critical bugs in production
- <1 hour mean time to recovery (MTTR)

---

## 11. PRICING STRATEGY

### Pricing Tiers

**Base Plan:** $47/month
- Unlimited lead scrubbing
- 3 area codes included (Utah: 801, 385, 435)
- Built-in CRM (unlimited leads)
- 1 CRM integration
- Google Sheets add-on
- Email support

**Utah's Elite Plan:** $24/month (Founding Partner)
- All Base Plan features
- Priority support
- Early access to new features
- Referral rewards ($10/referral)

**Team Plan:** $147/month (Phase 2)
- Up to 10 agents
- All Base Plan features
- Team dashboard
- Centralized billing
- Usage reports
- Dedicated account manager

---

### Add-Ons

**Area Code Expansion:**
- $50-200 one-time fee (based on FTC data cost)
- Permanent access once funded
- Community funding model (50% user, 50% Echo Mind)

**Additional CRM Integrations:**
- $10/month per integration (after first one)

---

### Trial Period

**14-Day Free Trial:**
- Full access to all features
- No credit card required for signup
- Credit card required to continue after trial
- Email reminders at Day 7 and Day 13

---

## 12. COMPETITIVE ANALYSIS

### Direct Competitors

**1. PropStream ($150/month)**
- **Strengths:** Established brand, comprehensive data
- **Weaknesses:** Expensive, clunky UI, desktop-only, no AI risk scoring
- **Our Advantage:** 3x cheaper, mobile-first, AI-powered

**2. REISift ($97/month)**
- **Strengths:** Real estate focus, skip tracing
- **Weaknesses:** No built-in CRM, no mobile app, limited integrations
- **Our Advantage:** Built-in CRM, CRM integrations, PWA

**3. DNC Solutions ($0.08-0.12 per lead)**
- **Strengths:** Pay-as-you-go, no commitment
- **Weaknesses:** Expensive at scale, manual uploads, no intelligence
- **Our Advantage:** Unlimited flat rate, automated workflows, risk scoring

---

### Indirect Competitors

**4. Follow Up Boss ($69/month)**
- Full-featured CRM with basic compliance
- **Our Advantage:** Better DNC scrubbing, cheaper for compliance-focused agents

**5. Lofty ($399/month)**
- All-in-one real estate platform
- **Our Advantage:** 8x cheaper, focused on compliance, lightweight

---

### Competitive Moat

**Defensibility:**
1. **Community-funded expansion:** Network effects (more users = more area codes = more value)
2. **AI risk scoring:** Proprietary algorithm (trade secret)
3. **Vertical focus:** Built specifically for real estate (not generic)
4. **Integration depth:** Native CRM + external CRM sync (competitors pick one)
5. **Mobile-first design:** Optimized for on-the-go agents (competitors ignore mobile)

---

## 13. MARKETING & GO-TO-MARKET

### Launch Strategy

**Phase 1: Soft Launch (Week 1-2)**
- Utah's Elite Realtors (private beta)
- 20 handpicked agents
- Weekly check-ins for feedback
- Iterate rapidly based on input

**Phase 2: Conference Launch (Week 3)**
- Utah's Elite conference booth
- Live demos (2-minute scrub)
- Printed handouts with QR codes
- Special pricing: First month free
- Collect testimonials

**Phase 3: Regional Expansion (Month 2-6)**
- Utah Valley real estate groups
- Facebook ads (Utah real estate agents)
- SEO content (blog posts on TCPA compliance)
- Referral program (Utah's Elite agents)

---

### Marketing Channels

**Owned:**
- Website (echocompli.com)
- Blog (TCPA compliance tips)
- Email newsletter
- YouTube (tutorials, demos)

**Paid:**
- Facebook Ads (Utah real estate agents lookalike)
- Google Ads (keywords: "DNC scrubbing", "TCPA compliance")
- LinkedIn Ads (brokerage owners)

**Earned:**
- PR outreach (local real estate publications)
- Podcast interviews (real estate shows)
- Guest posts (real estate blogs)

**Partnerships:**
- Utah's Elite Realtors (founding partner)
- CRM companies (co-marketing)
- Real estate coaches (affiliates)

---

### Content Marketing

**Blog Topics:**
- "The Complete Guide to TCPA Compliance for Real Estate Agents"
- "5 Mistakes Agents Make with DNC Scrubbing"
- "How to Save $1,500/Year on Lead Scrubbing"
- "What is a DNC Risk Score? (And Why You Need One)"

**YouTube Videos:**
- "How to Scrub Leads in 10 Seconds (Google Sheets Demo)"
- "Setting Up Follow Up Boss Integration"
- "Understanding Your Risk Score"

---

## 14. RISK MITIGATION

### Technical Risks

**Risk:** N8N workflow downtime
- **Mitigation:** Self-host N8N on Railway with auto-restart, uptime monitoring, backup instance
- **Fallback:** Manual scrubbing via direct Supabase query

**Risk:** Supabase performance issues at scale
- **Mitigation:** Database indexing, connection pooling, read replicas (if needed)
- **Fallback:** Migrate to self-hosted PostgreSQL

**Risk:** Stripe payment failures
- **Mitigation:** Dunning management, retry logic, grace period (7 days)
- **Fallback:** Manual invoice processing

**Risk:** Google Sheets API rate limits
- **Mitigation:** Batch requests, exponential backoff, user quotas
- **Fallback:** Direct CSV upload

---

### Business Risks

**Risk:** Low conference conversion
- **Mitigation:** Strong demo, special pricing, follow-up email campaign
- **Fallback:** Facebook ads to Utah agents

**Risk:** High churn rate
- **Mitigation:** Onboarding emails, usage monitoring, proactive outreach
- **Fallback:** Annual billing discount (10% off)

**Risk:** Competitor undercuts pricing
- **Mitigation:** Lock in early adopters with annual plans, focus on AI/CRM differentiation
- **Fallback:** Team plan upsell

**Risk:** FTC regulation changes
- **Mitigation:** Monitor FTC website, legal consultation, adapt quickly
- **Fallback:** Pivot to "lead management" positioning

---

### Legal Risks

**Risk:** TCPA liability
- **Mitigation:** Terms of Service (users responsible for compliance), insurance ($1M liability)
- **Fallback:** Shut down if sued

**Risk:** Data breach
- **Mitigation:** Encryption at rest/transit, security audits, incident response plan
- **Fallback:** Cyber insurance ($500K coverage)

**Risk:** User data deletion request (GDPR)
- **Mitigation:** One-click data deletion in settings, automated process
- **Fallback:** Manual deletion within 30 days

---

## 15. NEXT STEPS TO BUILD

### Before You Start Coding

**1. Domain & Infrastructure**
- [ ] Purchase echocompli.com
- [ ] Set up Vercel account
- [ ] Create Supabase project
- [ ] Set up Stripe account
- [ ] Configure Resend (email service)

**2. Development Environment**
- [ ] Install Cursor
- [ ] Clone repository
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in environment variables
- [ ] Run `npm install`
- [ ] Run `npx prisma migrate dev`
- [ ] Run `npm run dev`

**3. Design Assets**
- [ ] Create logo (Echo Mind Compliance)
- [ ] Generate app icons (Figma export or Canva)
- [ ] Create brand color palette in Tailwind config
- [ ] Design sample screenshots for PWA manifest

---

### Development Order (Cursor Prompts)

**Week 1:**
```
1. "Set up Next.js 14 project with TypeScript, Tailwind, and shadcn/ui. 
    Use the folder structure from /docs/PRD.md Section 5.3"

2. "Create Prisma schema from the database tables in /docs/PRD.md Section 4"

3. "Implement Supabase Auth with email/password. Create auth service in 
    src/core/services/auth.service.ts and auth pages in src/app/(auth)"

4. "Build dashboard layout with responsive Header, Sidebar (desktop), and 
    MobileNav (mobile). Use Echo Mind design tokens from /docs/PRD.md Section 6"
```

**Week 2:**
```
5. "Create file upload scrubbing feature in src/app/(dashboard)/scrub. 
    Implement drag & drop, validation, and N8N webhook integration"

6. "Build built-in CRM with lead list, lead details, and save functionality. 
    Use mobile-first design with bottom sheets"

7. "Create upload history page with past scrubs, compliance charts, and 
    downloadable reports"
```

**Week 3:**
```
8. "Implement CRM integrations (Follow Up Boss, Lofty, Kvcore) with OAuth 
    setup wizard and field mapping"

9. "Configure PWA with next-pwa, create manifest.json, and implement 
    service worker caching"

10. "Add Stripe checkout integration for subscriptions and area code expansion"
```

---

## 16. OPEN QUESTIONS / DECISIONS NEEDED

### Product Decisions

**1. Free Trial Length**
- 7 days vs 14 days vs 30 days?
- **Recommendation:** 14 days (industry standard, enough time to test)

**2. Area Code Expansion Pricing**
- Fixed $100 vs variable based on FTC cost?
- **Recommendation:** Variable (transparent, fair)

**3. Team Plan Pricing**
- Per-agent vs flat team fee?
- **Recommendation:** Flat fee (simpler billing, encourages larger teams)

**4. Google Sheets Monetization**
- Included in base plan vs separate $10/month?
- **Recommendation:** Included (competitive advantage, acquisition tool)

---

### Technical Decisions

**5. Database Hosting**
- Supabase (hosted Postgres) vs self-hosted?
- **Recommendation:** Supabase (faster to launch, scales well)

**6. N8N Hosting**
- Railway vs self-hosted VPS?
- **Recommendation:** Railway (easier, auto-scaling)

**7. File Storage**
- Supabase Storage vs Cloudflare R2?
- **Recommendation:** Supabase Storage (integrated, simpler)

**8. Analytics Platform**
- PostHog (self-hosted) vs Mixpanel vs Amplitude?
- **Recommendation:** PostHog (privacy-friendly, cheaper)

**9. Error Tracking**
- Sentry vs Rollbar vs Bugsnag?
- **Recommendation:** Sentry (free tier, great DX)

**10. Email Service**
- Resend vs SendGrid vs Postmark?
- **Recommendation:** Resend (modern, great DX, affordable)

---

### Design Decisions

**11. Dark Mode**
- Launch with dark mode vs add in Phase 2?
- **Recommendation:** Phase 2 (focus on core features first)

---

## 17. SUCCESS CRITERIA

### Launch is Successful If:

✅ **20+ paying customers** within 30 days of conference  
✅ **Zero critical bugs** in production (severity 1 or 2)  
✅ **4.5+ star rating** from early users (testimonials, reviews)  
✅ **Utah's Elite actively referring** (3+ referrals in Month 1)  
✅ **$940+ MRR** by end of Month 1  
✅ **99%+ uptime** (no major outages)  
✅ **<10 second scrub time** for 1,000 leads  
✅ **Mobile traffic >50%** (validates mobile-first design)  
✅ **PWA installs: 30% of mobile users**

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
✅ **Mobile users complete scrubs at same rate as desktop**

---

### Ready to Scale If:

✅ **Profitability achieved** (revenue > costs by 3x)  
✅ **Competitors asking about us** (market awareness)  
✅ **Inbound leads from SEO/word-of-mouth** (10+ per month)  
✅ **Clear product-market fit signals** (customers can't live without it)  
✅ **Team can handle 10x growth** (systems, processes, support)  
✅ **2+ months cash runway** for expansion  
✅ **Unit economics work** ($200+ LTV:CAC ratio)  
✅ **Mobile experience: 4.8+ stars** (app store quality)

---

## CONCLUSION

Echo Mind Compliance is positioned to disrupt the DNC scrubbing market with four key differentiators:

1. **AI Intelligence** - First platform with predictive risk scoring
2. **Built-in CRM + Instant Integrations** - All-in-one solution
3. **Mobile-First PWA** - Works flawlessly on any device
4. **Transparent Community Growth** - Cooperative expansion model

**Technical Architecture:**
- ✅ Portable codebase (70-80% reusable for mobile apps)
- ✅ API-first design (supports web + future native apps)
- ✅ PWA-enabled (installable, offline-capable)
- ✅ Built on proven technologies (Next.js 14, Supabase, N8N)
- ✅ Bootstrappable (total cost: $50-100/month)

**Design System:**
- ✅ Unique Echo Mind brand identity (not generic SaaS)
- ✅ Mobile-first responsive design (375px → 2560px)
- ✅ Touch-optimized interactions (48px minimum targets)
- ✅ Apple-quality polish (smooth animations, purposeful hierarchy)

**Go-to-Market:**
- ✅ Refined pricing strategy ($47/month, $24/month Utah's Elite)
- ✅ Strong founding partner (Utah's Elite Realtors)
- ✅ Conference launch (Week 3)
- ✅ Referral-driven growth model

**This PRD provides:**
- Complete portable architecture with future-proof structure
- Mobile-first design system with Echo Mind brand identity
- PWA specifications for app-like experience
- Detailed component patterns and UI guidelines
- Complete database schema and API design
- 3-week build plan with Cursor AI
- Success metrics and KPIs

---

**Next Steps:**
1. Set up infrastructure (Vercel, Supabase, Stripe, domain)
2. Create design assets (logo, icons, brand colors in code)
3. Begin Week 1 development in Cursor
4. Launch at conference (Week 3)
5. Convert to native apps (Month 4+)

**Ready to build a best-in-class mobile-first compliance platform!** 🚀

---

**Document Version:** 2.0  
**Last Updated:** January 8, 2026  
**Author:** Braxton, Echo Mind Systems  
**For:** Cursor AI (Claude Opus) - Complete build reference  
**Architecture:** Portable, mobile-first, PWA-enabled

**File Location in Project:** `/docs/PRD.md`
