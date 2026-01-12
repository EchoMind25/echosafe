# ECHO MIND COMPLIANCE - BUILD GUIDE
**Complete step-by-step instructions for building with Cursor AI**

Version: 2.0  
Last Updated: January 8, 2026  
Author: Braxton, Echo Mind Systems

---

## TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Week 1: Foundation](#week-1-foundation-days-1-7)
4. [Week 2: Core Features](#week-2-core-features-days-8-14)
5. [Week 3: Integrations & Polish](#week-3-integrations--polish-days-15-21)
6. [Testing & Deployment](#testing--deployment)
7. [Cursor Best Practices](#cursor-best-practices)
8. [Troubleshooting](#troubleshooting)

---

## PREREQUISITES

### Required Accounts
- [ ] Vercel account (for deployment)
- [ ] Supabase account (database & auth)
- [ ] Stripe account (payments)
- [ ] N8N instance (self-hosted or cloud)
- [ ] Anthropic API key (Claude AI)
- [ ] Resend account (email)
- [ ] Domain registered (echocompli.com)

### Local Environment
- [ ] Node.js 18.17.0 or higher
- [ ] npm 9.0.0 or higher
- [ ] Git installed
- [ ] Cursor IDE installed
- [ ] PostgreSQL (optional - for local testing)

---

## INITIAL SETUP

### Step 1: Create Project

```bash
# Create Next.js project with TypeScript
npx create-next-app@latest echo-mind-compliance --typescript --tailwind --app --no-src-dir

cd echo-mind-compliance
```

### Step 2: Copy Foundation Files

Copy all files from `/foundation-files/` to your project root:

```
/foundation-files/package.json         → /package.json
/foundation-files/.env.example         → /.env.example
/foundation-files/tailwind.config.ts   → /tailwind.config.ts
/foundation-files/prisma/schema.prisma → /prisma/schema.prisma
/foundation-files/src/                 → /src/
/foundation-files/docs/                → /docs/
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Set Up Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your actual values
# IMPORTANT: Never commit .env.local to git
```

**Required Variables for MVP:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL`
- `CLAUDE_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Step 5: Set Up Supabase

1. Create new project at https://app.supabase.com
2. Get API keys from Settings > API
3. Run database migration:

```bash
# Push Prisma schema to Supabase
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Step 6: Create Folder Structure

```bash
mkdir -p src/{app,components,core,lib,types}
mkdir -p src/app/{api,\(auth\),\(dashboard\)}
mkdir -p src/core/{services,hooks,utils,validation}
mkdir -p src/components/{scrub,crm,integrations,history,settings,layout,ui}
mkdir -p public/{images,icons}
```

---

## WEEK 1: FOUNDATION (Days 1-7)

### Day 1-2: Project Setup & Authentication

#### Cursor Prompt 1: Set Up Global Styles

```
Create src/app/globals.css with Echo Mind design tokens.

Use these colors from src/lib/constants.ts:
- Primary teal: #14b8a6
- Neutral slate: varying shades
- Semantic colors: success, warning, danger, info

Include:
- CSS variables for colors
- Tailwind directives
- Mobile-first responsive utilities
- Touch-friendly sizing (min 48px targets)

Reference: /docs/PRD.md Section 6 (Design System)
```

#### Cursor Prompt 2: Create Supabase Client

```
Create src/lib/supabase.ts with:
1. Browser client (for client components)
2. Server client (for server components & API routes)
3. Middleware client (for auth middleware)

Use @supabase/auth-helpers-nextjs
Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

Type-safe with TypeScript
```

#### Cursor Prompt 3: Build Auth Service

```
Create src/core/services/auth.service.ts with:
- signUp(email, password, fullName)
- signIn(email, password)
- signOut()
- resetPassword(email)
- updatePassword(newPassword)
- getCurrentUser()

Use Supabase Auth
Return typed responses with ApiResponse<User>
Handle errors gracefully

Reference types: src/types/index.ts
```

#### Cursor Prompt 4: Create Auth Pages

```
Build authentication pages in src/app/(auth):
1. /login - Email/password form with "Forgot password?" link
2. /signup - Registration form with terms acceptance
3. /reset-password - Password reset flow
4. /verify-email - Email verification success page

Requirements:
- Mobile-first responsive design (375px+)
- Echo Mind teal branding (#14b8a6)
- Touch-friendly form inputs (min 48px height)
- React Hook Form + Zod validation
- Loading states & error handling
- Redirect to /dashboard after success

Reference: /docs/PRD.md Section 7 (Mobile-First UI)
Use: src/core/services/auth.service.ts
```

#### Cursor Prompt 5: Set Up Auth Middleware

```
Create src/middleware.ts to:
1. Protect /dashboard routes (require authentication)
2. Redirect authenticated users from /login to /dashboard
3. Refresh auth tokens automatically
4. Handle session expiration

Use Supabase Auth middleware
Match patterns: /dashboard/*, /api/*, etc.
```

### Day 3-4: Layout & Navigation

#### Cursor Prompt 6: Create Dashboard Layout

```
Build src/app/(dashboard)/layout.tsx with:

Desktop (≥1024px):
- Fixed header (top)
- Collapsible sidebar (left, 256px wide)
- Main content area (max-width: 1280px, centered)

Mobile (<768px):
- Fixed header (top)
- Bottom navigation bar (fixed at bottom, 64px height)
- Full-width content
- Safe area insets for iOS

Branding:
- Echo Mind logo (top-left)
- Primary teal accents (#14b8a6)
- Clean, professional aesthetic

Navigation items:
- Home (dashboard overview)
- Scrub (upload & scrub leads)
- CRM (lead management)
- History (past uploads)
- Settings (account settings)

Reference: /docs/PRD.md Section 7.2 (Mobile Navigation)
Use: src/lib/constants.ts (BRAND, COLORS, LOGO)
```

#### Cursor Prompt 7: Build Header Component

```
Create src/components/layout/Header.tsx:

Features:
- Logo (left) - links to /dashboard
- Search bar (center) - for future use
- User menu (right) - dropdown with profile, settings, logout
- Notification bell icon - placeholder for now

Mobile:
- Hamburger menu (toggles mobile menu)
- Logo (center)
- Profile icon (right)

Styling:
- Sticky top position
- Echo Mind teal accents
- Smooth animations (200ms transitions)
- Drop shadow on scroll

Use: src/core/services/auth.service.ts (getCurrentUser)
```

#### Cursor Prompt 8: Build Sidebar Component

```
Create src/components/layout/Sidebar.tsx:

Features:
- Navigation links with icons (lucide-react)
- Active state highlighting (Echo Mind teal)
- Collapse/expand functionality
- User avatar & name at top
- "Upgrade" CTA button at bottom (if on trial)

Navigation items (same as layout):
- Home, Scrub, CRM, History, Settings

Desktop only (hidden on mobile)
Show: md:block (≥768px)
```

#### Cursor Prompt 9: Build Mobile Navigation

```
Create src/components/layout/MobileNav.tsx:

Features:
- Fixed bottom position (safe-area-inset-bottom)
- 5 navigation items max
- Icons + labels
- Active state (Echo Mind teal)
- Smooth tap animations

Items:
- Home (HomeIcon)
- Scrub (UploadIcon)
- CRM (UsersIcon)
- History (ClockIcon)
- Settings (CogIcon)

Show only on mobile: md:hidden
Height: 64px
Background: white with top border

Reference: /docs/PRD.md Section 7.2
```

### Day 5-7: Core UI Components

#### Cursor Prompt 10: Install shadcn/ui Components

```
Initialize shadcn/ui and install core components:

npx shadcn-ui@latest init

Install components:
- button
- input
- card
- dialog
- sheet (for mobile bottom sheets)
- toast
- badge
- progress
- dropdown-menu
- select
- label
- separator
- tabs
- avatar

Customize theme with Echo Mind teal (#14b8a6) in components.json
```

#### Cursor Prompt 11: Build Dashboard Home Page

```
Create src/app/(dashboard)/page.tsx (Dashboard home):

Layout:
1. Welcome header with user name
2. Quick stats cards (4 columns on desktop, 1 on mobile):
   - Total leads scrubbed
   - Clean leads (last 30 days)
   - Average compliance score
   - Active CRM integrations
3. Recent uploads list (last 5)
4. Quick action buttons:
   - "Scrub Leads" (primary CTA)
   - "View CRM"
   - "Upload History"

Mobile-optimized:
- Stack cards vertically
- Swipeable recent uploads
- Large touch targets

Use:
- src/components/ui/card.tsx
- src/lib/constants.ts (COLORS)
- Fetch data from API (create placeholder for now)

Reference: /docs/PRD.md Section 6 (Component Patterns)
```

---

## WEEK 2: CORE FEATURES (Days 8-14)

### Day 8-10: File Upload & Scrubbing

#### Cursor Prompt 12: Create Scrub Service

```
Create src/core/services/scrub.service.ts:

Functions:
- uploadAndScrub(file: File, areaCodes: string[], includeRisky: boolean)
  → Returns: ScrubResponse with jobId
  
- getScrubStatus(jobId: string)
  → Returns: { status, progress, message }
  
- getScrubResults(jobId: string)
  → Returns: ScrubResult with summary, leads, download URLs
  
- downloadFile(fileId: string, type: 'clean' | 'full' | 'risky')
  → Returns: Blob

API Integration:
- POST /api/scrub (upload file)
- GET /api/scrub/status/{jobId} (polling)
- GET /api/scrub/results/{jobId} (final results)
- GET /api/scrub/download/{fileId} (file download)

Use Axios for requests
Handle errors with try/catch
Return typed responses

Reference types: src/types/index.ts (ScrubRequest, ScrubResponse, ScrubResult)
```

#### Cursor Prompt 13: Build File Uploader Component

```
Create src/components/scrub/FileUploader.tsx:

Features:
- Drag & drop zone (react-dropzone)
- File type validation (.csv, .xlsx, .xls, .txt)
- File size validation (max 50MB)
- Preview of uploaded file (filename, size, lead count estimate)
- "Browse files" button as fallback
- Clear file button
- Mobile-friendly (full-width on small screens)

Visual Design:
- Dashed border (Echo Mind teal when active)
- Upload icon (centered)
- Clear instructions
- Error states (red border + message)

Props:
- onFileSelect(file: File) → void
- maxSize?: number
- acceptedTypes?: string[]

Reference: /docs/PRD.md Section 6.5 (Form Patterns)
Use: src/lib/constants.ts (LIMITS)
```

#### Cursor Prompt 14: Build Scrub Page

```
Create src/app/(dashboard)/scrub/page.tsx:

Layout (Desktop):
1. Page header: "Scrub Leads"
2. Area code selector (multi-select dropdown)
3. File uploader component
4. Options:
   - [ ] Include risky leads in download
   - [ ] Save clean leads to CRM
5. "Scrub Leads" button (primary, disabled until file selected)

Layout (Mobile):
- Stack all elements vertically
- Full-width components
- Sticky "Scrub Leads" button at bottom

Flow:
1. User uploads file
2. Selects area codes
3. Clicks "Scrub Leads"
4. Redirects to /scrub/{jobId} (results page)

Use:
- src/components/scrub/FileUploader.tsx
- src/core/services/scrub.service.ts
- src/components/ui/button.tsx
- src/components/ui/select.tsx

Handle validation & errors
Show loading state during upload
```

#### Cursor Prompt 15: Build Results Page

```
Create src/app/(dashboard)/scrub/[jobId]/page.tsx:

Features:
1. Real-time progress tracking (poll every 2 seconds)
2. Progress bar (animated)
3. Status updates: "Processing leads...", "Complete!"
4. Results summary (after completion):
   - Total uploaded
   - Clean leads (green badge)
   - Caution leads (yellow badge)
   - Blocked leads (red badge)
   - Duplicates removed
   - Average risk score
   - Compliance rate %
5. Download buttons:
   - Clean leads CSV
   - Full report CSV
   - Risky leads CSV (if opted in)
6. Action buttons:
   - "Save to CRM" (bulk save clean leads)
   - "Scrub More Leads"

Mobile:
- Stack summary cards vertically
- Full-width download buttons
- Bottom sheet for lead details

Use:
- src/core/services/scrub.service.ts
- src/components/scrub/ResultsSummary.tsx (create)
- src/components/scrub/ResultsTable.tsx (create)
- src/components/ui/progress.tsx
- src/components/ui/badge.tsx

Reference: /docs/PRD.md Section 3.1 (Feature 1)
Use: src/lib/constants.ts (RISK_COLORS)
```

#### Cursor Prompt 16: Create API Routes for Scrubbing

```
Create API routes in src/app/api/scrub:

1. POST /api/scrub/route.ts:
   - Accept file upload (multipart/form-data)
   - Validate file type & size
   - Parse leads from CSV/Excel
   - Check for duplicates
   - Send to N8N webhook
   - Return jobId

2. GET /api/scrub/status/[jobId]/route.ts:
   - Check job status in database
   - Return { status, progress, message }

3. GET /api/scrub/results/[jobId]/route.ts:
   - Fetch results from database (upload_history table)
   - Return ScrubResult with summary, leads, download URLs

4. GET /api/scrub/download/[fileId]/route.ts:
   - Fetch file from Supabase Storage
   - Stream file to client
   - Set Content-Disposition header

Error handling:
- 400: Bad request (invalid file)
- 404: Job not found
- 500: Internal server error

Use:
- Prisma client (src/lib/prisma.ts - create this)
- N8N webhook (src/lib/n8n.ts - create this)
- Supabase Storage (src/lib/supabase.ts)
- papaparse (CSV parsing)

Reference: /docs/PRD.md Section 3.1 (Technical Specs)
```

### Day 11-12: Built-in CRM

#### Cursor Prompt 17: Create CRM Service

```
Create src/core/services/crm.service.ts:

Functions:
- getLeads(filters?: LeadFilters, pagination?: PaginationParams)
  → Returns: PaginatedResponse<CrmLead>
  
- getLead(leadId: string)
  → Returns: CrmLead
  
- createLead(data: CreateCrmLeadInput)
  → Returns: CrmLead
  
- updateLead(leadId: string, data: UpdateCrmLeadInput)
  → Returns: CrmLead
  
- deleteLead(leadId: string, permanent?: boolean)
  → Returns: { success: boolean }
  
- bulkSaveLeads(leads: Lead[])
  → Returns: { saved: number, failed: number }
  
- searchLeads(query: string)
  → Returns: CrmLead[]

API Integration:
- GET /api/crm/leads (with query params)
- GET /api/crm/leads/{id}
- POST /api/crm/leads
- PUT /api/crm/leads/{id}
- DELETE /api/crm/leads/{id}
- POST /api/crm/leads/bulk
- GET /api/crm/leads/search?q={query}

Reference types: src/types/index.ts
```

#### Cursor Prompt 18: Build CRM Lead List Page

```
Create src/app/(dashboard)/crm/page.tsx:

Layout (Desktop):
1. Header with search bar & filters button
2. Stats row: Total leads, New, Qualified, Converted
3. Filters sidebar (collapsible):
   - Status (multi-select)
   - Risk level (multi-select)
   - Date range
   - Tags
4. Lead list (table format):
   - Columns: Name, Phone, Email, Status, Risk, Last Contact, Actions
   - Sortable columns
   - Pagination (20 per page)

Layout (Mobile):
- Search bar (top)
- Filter chips (horizontal scroll)
- Lead cards (vertical list):
  - Phone (large)
  - Name & email (small)
  - Status badge
  - Risk badge
  - Swipe actions: Edit, Delete

Features:
- Infinite scroll on mobile
- Click lead → open details (bottom sheet on mobile, sidebar on desktop)
- Bulk actions: Delete, Export, Change status

Use:
- src/core/services/crm.service.ts
- src/components/crm/LeadList.tsx (create)
- src/components/crm/LeadCard.tsx (create)
- src/components/crm/LeadFilters.tsx (create)
- src/components/ui/sheet.tsx (mobile bottom sheet)

Reference: /docs/PRD.md Section 7.3 (Mobile Components)
```

#### Cursor Prompt 19: Build Lead Details Component

```
Create src/components/crm/LeadDetails.tsx:

Display:
- Lead information (name, phone, email, address)
- Risk score with visual indicator (progress bar)
- Risk factors breakdown
- DNC status badge
- Lead status with dropdown to change
- Tags (editable)
- Notes (textarea)
- Custom fields (key-value pairs)
- Activity timeline:
  - Last contact date
  - Next follow-up date
  - Contact count

Actions:
- Call button (tel: link)
- Text button (sms: link)
- Email button (mailto: link)
- Edit button
- Delete button (with confirmation)
- Save to external CRM button

Mobile:
- Render as bottom sheet (vaul library)
- Swipe down to close
- Full-screen on small devices

Desktop:
- Render as sidebar or modal
- Smooth slide-in animation

Props:
- leadId: string
- onClose: () => void
- onUpdate: (lead: CrmLead) => void

Use: src/core/services/crm.service.ts
```

#### Cursor Prompt 20: Create CRM API Routes

```
Create API routes in src/app/api/crm/leads:

1. GET /api/crm/leads/route.ts:
   - Accept query params: page, limit, status, riskLevel, dateFrom, dateTo, search
   - Return paginated leads
   - Apply filters & sorting
   - Only return user's leads (check auth)

2. GET /api/crm/leads/[id]/route.ts:
   - Fetch single lead by ID
   - Verify ownership (userId matches)
   - Return lead details

3. POST /api/crm/leads/route.ts:
   - Create new lead
   - Validate input (Zod schema)
   - Check for duplicates (phone number)
   - Return created lead

4. PUT /api/crm/leads/[id]/route.ts:
   - Update existing lead
   - Validate input
   - Verify ownership
   - Return updated lead

5. DELETE /api/crm/leads/[id]/route.ts:
   - Soft delete by default (set deletedAt)
   - Permanent delete if ?permanent=true query param
   - Verify ownership

6. POST /api/crm/leads/bulk/route.ts:
   - Bulk create leads (from scrub results)
   - Check for duplicates
   - Return { saved, failed, duplicates }

7. GET /api/crm/leads/search/route.ts:
   - Search by phone, name, email
   - Return matching leads

Use:
- Prisma client
- Zod validation (src/core/validation/crm.schema.ts - create)
- Auth middleware (verify user)

Reference: /docs/PRD.md Section 4 (Database Schema)
```

### Day 13-14: Upload History & Analytics

#### Cursor Prompt 21: Build Upload History Page

```
Create src/app/(dashboard)/history/page.tsx:

Layout (Desktop):
1. Header: "Upload History"
2. Filter bar:
   - Date range picker
   - Status filter (All, Completed, Failed)
   - Compliance rate filter (slider: 0-100%)
3. History cards (grid: 2 columns):
   - Filename
   - Upload date/time
   - Total leads
   - Clean / Blocked / Caution breakdown
   - Compliance rate (progress bar)
   - Download buttons
   - "View Details" link

Layout (Mobile):
- Single column cards
- Horizontal date scroll
- Swipe to delete (with confirmation)

Empty state:
- "No uploads yet" message
- "Scrub Your First Leads" CTA button

Pagination:
- Load more button (desktop)
- Infinite scroll (mobile)

Use:
- API: GET /api/uploads (create)
- src/components/history/HistoryCard.tsx (create)
- src/components/history/ComplianceChart.tsx (create)
- src/components/ui/card.tsx

Reference: /docs/PRD.md Section 3.1 (Feature 6)
```

#### Cursor Prompt 22: Build History Detail Page

```
Create src/app/(dashboard)/history/[uploadId]/page.tsx:

Display:
1. Upload summary:
   - Filename
   - Upload date
   - Processing time
   - Area codes used
2. Results breakdown:
   - Pie chart (clean, caution, blocked)
   - Summary stats
3. Lead list (paginated):
   - Show all leads with risk scores
   - Filter by risk level
   - Search by phone/name
4. Download section:
   - Clean leads CSV
   - Full report CSV
   - Risky leads CSV (if available)

Actions:
- "Save Clean Leads to CRM" button
- "Scrub Again" button (same file)
- Delete upload button

Use:
- API: GET /api/uploads/{id}
- Chart.js or Recharts for visualization
- src/components/history/HistoryDetail.tsx (create)
```

#### Cursor Prompt 23: Create Upload History API Routes

```
Create API routes in src/app/api/uploads:

1. GET /api/uploads/route.ts:
   - List all uploads for current user
   - Accept query params: page, limit, status, dateFrom, dateTo
   - Return paginated results
   - Sort by createdAt desc

2. GET /api/uploads/[id]/route.ts:
   - Get single upload details
   - Include full results (leads, summary)
   - Verify ownership

Use:
- Prisma client (upload_history table)
- Pagination helper (create in src/core/utils/pagination.ts)
- Auth middleware

Reference: /docs/PRD.md Section 4 (Database Schema)
```

---

## WEEK 3: INTEGRATIONS & POLISH (Days 15-21)

### Day 15-17: CRM Integrations

#### Cursor Prompt 24: Create CRM Integration Service

```
Create src/core/services/crm-integration.service.ts:

Functions:
- listIntegrations()
  → Returns: CrmIntegration[]
  
- getIntegration(integrationId: string)
  → Returns: CrmIntegration
  
- createIntegration(crmType: CrmType, credentials: CrmCredentials)
  → Returns: CrmIntegration
  
- updateIntegration(integrationId: string, data: Partial<CrmIntegration>)
  → Returns: CrmIntegration
  
- deleteIntegration(integrationId: string)
  → Returns: { success: boolean }
  
- syncLeads(integrationId: string, leads: Lead[])
  → Returns: { synced: number, failed: number }
  
- testConnection(integrationId: string)
  → Returns: { success: boolean, message: string }

API Integration:
- GET /api/integrations
- POST /api/integrations
- PUT /api/integrations/{id}
- DELETE /api/integrations/{id}
- POST /api/integrations/{id}/sync

Reference types: src/types/index.ts
```

#### Cursor Prompt 25: Build OAuth Setup Wizards

```
Create integration setup wizards in src/components/integrations:

1. SetupWizard.tsx (parent component):
   - Step indicator (1/3, 2/3, 3/3)
   - Back/Next buttons
   - Cancel button

2. Follow Up Boss:
   - Step 1: Enter API key
   - Step 2: Test connection
   - Step 3: Map fields & configure sync

3. Lofty:
   - Step 1: OAuth consent (redirect to Lofty)
   - Step 2: Handle callback
   - Step 3: Map fields & configure sync

4. Kvcore:
   - Step 1: Enter API credentials
   - Step 2: Select list/tag
   - Step 3: Map fields & configure sync

Field Mapping:
- Drag & drop or dropdown selectors
- Map: phone_number, first_name, last_name, email, address
- Preview mapping with example data

Sync Settings:
- Auto-sync toggle (on by default)
- Sync risky leads toggle (off by default)
- Sync frequency: immediate, hourly, daily

Mobile-optimized:
- Full-screen wizard on mobile
- Large touch targets
- Progress bar at top

Use:
- src/core/services/crm-integration.service.ts
- src/components/ui/dialog.tsx (desktop)
- Full-screen on mobile

Reference: /docs/PRD.md Section 3.1 (Feature 4)
```

#### Cursor Prompt 26: Build Integrations Page

```
Create src/app/(dashboard)/integrations/page.tsx:

Layout:
1. Header: "CRM Integrations"
2. Available integrations (cards):
   - Follow Up Boss (logo, description, "Connect" button)
   - Lofty (logo, description, "Connect" button)
   - Kvcore (logo, description, "Connect" button)
3. Active integrations (cards):
   - CRM name & logo
   - Status badge (Active, Paused, Error)
   - Last sync time
   - "Configure" button
   - "Sync Now" button
   - "Remove" button (with confirmation)
4. Sync logs section:
   - Recent syncs with status
   - "View All Logs" link

Empty state:
- "No integrations connected"
- "Connect your CRM to auto-sync leads"
- Benefits list

Use:
- src/components/integrations/IntegrationCard.tsx (create)
- src/components/integrations/SetupWizard.tsx
- src/core/services/crm-integration.service.ts

Reference: /docs/PRD.md Section 3.1 (Feature 4)
```

#### Cursor Prompt 27: Create Integration API Routes

```
Create API routes in src/app/api/integrations:

1. GET /api/integrations/route.ts:
   - List user's integrations
   - Mask sensitive credentials
   - Return integration status

2. POST /api/integrations/route.ts:
   - Create new integration
   - Validate credentials (test connection)
   - Encrypt credentials before storing
   - Return integration (without credentials)

3. PUT /api/integrations/[id]/route.ts:
   - Update integration settings
   - Re-validate if credentials changed
   - Return updated integration

4. DELETE /api/integrations/[id]/route.ts:
   - Remove integration
   - Verify ownership
   - Return success

5. POST /api/integrations/[id]/sync/route.ts:
   - Trigger manual sync
   - Fetch leads to sync
   - Call external CRM API
   - Log sync result
   - Return { synced, failed }

6. GET /api/integrations/[id]/logs/route.ts:
   - Get sync logs for integration
   - Paginated results
   - Return logs with status

External CRM API helpers:
- Create src/lib/crm/followupboss.ts
- Create src/lib/crm/lofty.ts
- Create src/lib/crm/kvcore.ts

Encryption:
- Use crypto module to encrypt/decrypt credentials
- Store encryption key in environment variable

Reference: /docs/PRD.md Section 5.4 (API Design)
```

### Day 18-19: PWA & Mobile Optimization

#### Cursor Prompt 28: Configure PWA

```
Set up Progressive Web App with next-pwa:

1. Install next-pwa:
   npm install next-pwa

2. Update next.config.js:
   - Enable PWA in production
   - Configure service worker
   - Set up caching strategy

3. Create public/manifest.json:
   - App name: "Echo Mind Compliance"
   - Short name: "Echo Compliance"
   - Theme color: #14b8a6 (Echo Mind teal)
   - Background color: #ffffff
   - Display: standalone
   - Icons: 192x192, 512x512

4. Generate app icons:
   - Create icons in public/icons/
   - Sizes: 72, 96, 128, 144, 152, 192, 384, 512
   - Apple touch icon: 180x180
   - Favicon: 32x32

5. Add meta tags to app/layout.tsx:
   - viewport with safe-area-inset
   - theme-color
   - apple-mobile-web-app-capable
   - apple-mobile-web-app-status-bar-style

Reference: /docs/PRD.md Section 8 (PWA Specifications)
Use: Echo Mind logo from /public/images/
```

#### Cursor Prompt 29: Implement Service Worker

```
Create custom service worker for offline support:

1. Create public/sw.js:
   - Cache static assets (CSS, JS, images)
   - Network-first for API calls
   - Cache-first for images
   - Offline fallback page

2. Caching strategy:
   - Static assets: cache-first (30 days)
   - API calls: network-first (fallback to cache)
   - User uploads: network-only (no cache)

3. Background sync (future):
   - Queue failed requests
   - Retry when online

4. Push notifications (future - Phase 2):
   - Register for push
   - Handle notification clicks

Test offline functionality:
- Disconnect internet
- App should still load
- Show offline indicator
- Cached data accessible

Reference: /docs/PRD.md Section 8.3 (Service Worker Strategy)
```

#### Cursor Prompt 30: Build Install Prompt

```
Create src/components/layout/InstallPrompt.tsx:

Features:
- Detect if PWA is installable (beforeinstallprompt event)
- Show custom install banner (not browser default)
- Position: Fixed bottom (above mobile nav)
- Design:
  - Echo Mind logo icon
  - "Install Echo Compliance" text
  - "Install" button (teal)
  - "×" close button
- Hide after user dismisses or installs
- Store preference in localStorage (don't show again)

Mobile-specific:
- Full-width banner
- Large touch targets
- Slide-up animation

Desktop:
- Bottom-right corner
- Smaller size
- Fade-in animation

Use:
- useEffect to listen for beforeinstallprompt
- useState to manage visibility
- localStorage to remember dismissal

Reference: /docs/PRD.md Section 8.5 (Install Prompts)
```

#### Cursor Prompt 31: Add Touch Interactions

```
Enhance mobile interactions:

1. Swipe actions on lead cards:
   - Swipe left → Delete (red background)
   - Swipe right → Edit (blue background)
   - Use framer-motion for animations

2. Pull to refresh on lists:
   - CRM lead list
   - Upload history
   - Show spinner at top while refreshing

3. Bottom sheets for mobile:
   - Lead details
   - Filter options
   - Action menus
   - Use vaul library

4. Long press menus:
   - Hold on lead card → Show menu
   - Options: Edit, Delete, Call, Text

5. Haptic feedback (if supported):
   - Button taps
   - Successful actions
   - Errors

Test on:
- iOS Safari
- Android Chrome
- Various screen sizes (375px - 768px)

Reference: /docs/PRD.md Section 7.1 (Touch Interactions)
```

### Day 20-21: Testing & Launch Prep

#### Cursor Prompt 32: Set Up Stripe Integration

```
Integrate Stripe for payments:

1. Create src/lib/stripe.ts:
   - Initialize Stripe server client
   - Create checkout session function
   - Create customer portal function
   - Handle webhooks

2. Create Stripe products in dashboard:
   - Base Plan: $47/month
   - Utah's Elite Plan: $24/month
   - Team Plan: $147/month (future)

3. Create API routes:
   - POST /api/stripe/checkout
     * Create checkout session
     * Include trial period (14 days)
     * Redirect to Stripe
   
   - POST /api/stripe/portal
     * Create customer portal session
     * Manage subscription, payment methods
   
   - POST /api/stripe/webhook
     * Handle webhook events:
       - checkout.session.completed
       - customer.subscription.updated
       - customer.subscription.deleted
       - invoice.payment_failed
     * Update user subscription status in database

4. Create pricing page:
   - src/app/(dashboard)/settings/subscription/page.tsx
   - Show current plan
   - "Upgrade" / "Change Plan" buttons
   - Billing history

5. Add subscription checks:
   - Middleware to verify active subscription
   - Show upgrade prompts for expired trials
   - Disable features for non-subscribers

Environment variables:
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

Reference: /docs/PRD.md Section 11 (Pricing Strategy)
```

#### Cursor Prompt 33: End-to-End Testing

```
Test complete user flow:

1. Authentication:
   - Sign up with new account
   - Verify email
   - Log in
   - Reset password
   - Log out

2. Scrubbing:
   - Upload CSV file (test with 100 leads)
   - Select area codes (801, 385, 435)
   - Process scrub
   - View results
   - Download clean leads CSV

3. CRM:
   - Save leads from scrub results
   - View lead list
   - Filter by status
   - Search for lead
   - Edit lead details
   - Add notes & tags
   - Delete lead

4. Integrations:
   - Connect Follow Up Boss (test API key)
   - Test connection
   - Map fields
   - Sync leads
   - View sync logs

5. History:
   - View past uploads
   - Filter by date
   - Download past reports

6. Settings:
   - Update profile
   - Change password
   - View subscription
   - Manage area codes

7. Mobile:
   - Test on iPhone (Safari)
   - Test on Android (Chrome)
   - Install as PWA
   - Test offline functionality

8. Payments:
   - Start trial
   - Upgrade to paid plan
   - Change payment method
   - Cancel subscription

Document bugs in /docs/BUGS.md
```

#### Cursor Prompt 34: Performance Optimization

```
Optimize for production:

1. Image optimization:
   - Use next/image for all images
   - Compress PNG logo files
   - Generate webp versions
   - Lazy load below-the-fold images

2. Code splitting:
   - Dynamic imports for heavy components
   - Lazy load charts (Chart.js, Recharts)
   - Split vendor bundles

3. Database optimization:
   - Verify all indexes are in place
   - Optimize Prisma queries
   - Use connection pooling

4. API optimization:
   - Add response caching (5 min TTL for lists)
   - Compress responses (gzip)
   - Rate limiting (100 req/min per user)

5. Bundle analysis:
   - Run: npm run build
   - Check bundle sizes
   - Remove unused dependencies

6. Lighthouse audit:
   - Target scores:
     * Performance: 90+
     * Accessibility: 100
     * Best Practices: 100
     * SEO: 100
     * PWA: 100

Fix any issues found
```

---

## TESTING & DEPLOYMENT

### Pre-Deployment Checklist

```
Environment:
[ ] All environment variables set in Vercel
[ ] Supabase RLS policies configured
[ ] Stripe webhooks configured
[ ] Domain DNS pointing to Vercel
[ ] SSL certificate active

Testing:
[ ] All core features working
[ ] Mobile responsive (375px - 2560px)
[ ] PWA installable
[ ] Offline mode functional
[ ] Authentication secure
[ ] Payments processing
[ ] CRM integrations tested

Performance:
[ ] Lighthouse scores 90+
[ ] Page load <2 seconds
[ ] API responses <200ms
[ ] No console errors
[ ] No TypeScript errors

Security:
[ ] API routes authenticated
[ ] Sensitive data encrypted
[ ] Rate limiting enabled
[ ] CORS configured
[ ] XSS protection
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Post-Deployment

```
Monitoring:
[ ] Set up Sentry (error tracking)
[ ] Configure BetterStack (uptime monitoring)
[ ] Enable Plausible Analytics
[ ] Set up alert notifications

User Testing:
[ ] Invite Utah's Elite beta testers
[ ] Collect feedback
[ ] Fix critical bugs
[ ] Iterate based on feedback

Launch:
[ ] Announce at conference
[ ] Activate special pricing
[ ] Monitor for issues
[ ] Provide support
```

---

## CURSOR BEST PRACTICES

### Effective Prompting

**Be Specific:**
```
❌ Bad: "Create a button component"
✅ Good: "Create a primary button component in src/components/ui/button.tsx with Echo Mind teal background (#14b8a6), white text, rounded corners, hover state, loading state, and disabled state. Min height 48px for touch targets."
```

**Reference Existing Code:**
```
✅ "Create a lead card component similar to src/components/history/HistoryCard.tsx but for CRM leads. Include phone, name, status badge, and risk badge."
```

**Specify File Locations:**
```
✅ "Create src/core/services/auth.service.ts with the following functions..."
```

**Include Mobile Requirements:**
```
✅ "Build a responsive navigation bar that shows a sidebar on desktop (≥1024px) and bottom navigation on mobile (<768px)."
```

### Working with Large Features

**Break into smaller prompts:**
```
Instead of: "Build the entire CRM feature"

Use:
1. "Create CRM service with CRUD functions"
2. "Build lead list page with filtering"
3. "Create lead details component"
4. "Add API routes for CRM"
```

### Testing as You Build

After each major component:
```
1. "Add TypeScript types for this component"
2. "Add error handling for API failures"
3. "Test on mobile (375px width)"
4. "Verify accessibility (keyboard navigation)"
```

---

## TROUBLESHOOTING

### Common Issues

**Issue: "Module not found"**
```bash
Solution:
1. Check if dependency is installed: npm ls <package>
2. Install if missing: npm install <package>
3. Restart dev server: npm run dev
```

**Issue: "Prisma Client not generated"**
```bash
Solution:
npx prisma generate
```

**Issue: "Supabase connection failed"**
```
Solution:
1. Verify .env.local has correct values
2. Check Supabase project is not paused
3. Test connection: npx prisma db push
```

**Issue: "Type errors in Prisma queries"**
```bash
Solution:
1. Regenerate types: npx prisma generate
2. Restart TypeScript server in Cursor: Cmd+Shift+P → "Restart TS Server"
```

**Issue: "Stripe webhook signature invalid"**
```
Solution:
1. Use Stripe CLI for local testing: stripe listen --forward-to localhost:3000/api/stripe/webhook
2. Update STRIPE_WEBHOOK_SECRET in .env.local
3. Test webhook: stripe trigger checkout.session.completed
```

**Issue: "PWA not installing"**
```
Solution:
1. Check manifest.json is valid
2. Verify HTTPS is enabled (required for PWA)
3. Clear browser cache
4. Check browser console for errors
```

### Getting Help

1. Check /docs/PRD.md for feature specifications
2. Review /docs/API_REFERENCE.md for API details
3. Search GitHub issues
4. Ask in Echo Mind Slack channel

---

## CONCLUSION

This build guide provides a complete, step-by-step process for building Echo Mind Compliance with Cursor AI. Follow the prompts in order, test thoroughly, and reference the PRD for detailed specifications.

**Remember:**
- Mobile-first design (375px → 2560px)
- Echo Mind teal branding (#14b8a6)
- Touch targets 48px minimum
- Portable architecture (core logic in src/core/)
- Type-safe with TypeScript
- Test on real devices

**Ready to build!** 🚀

---

**Document Version:** 2.0  
**Last Updated:** January 8, 2026  
**Author:** Braxton, Echo Mind Systems  
**Next Steps:** Open Cursor, follow Week 1 prompts, ship MVP in 3 weeks
