MISSION: Comprehensive pre-launch audit of Echo Mind Compliance codebase. Find and fix all issues before Utah's Elite conference demo.

CONTEXT: Next.js 14 + TypeScript + Supabase app for DNC lead scrubbing. Privacy-first, TCPA-compliant, real-time AI insights.

REFERENCE DOCUMENTS (validate against these):
1. CORE_PRD.md - Product requirements, features, specifications
2. CORE_REFERENCE.md - Privacy-first principles, competitive moat
3. DATABASE.md - Schema, RLS policies, functions
4. TECH_ARCHITECTURE.md - Stack decisions, AI implementation, workflows
5. UI_GUIDELINES.md - Design system, components, UX patterns

═══════════════════════════════════════════════════════════
PHASE 1: CRITICAL PATH TESTING (High Priority)
═══════════════════════════════════════════════════════════

1.1 AUTHENTICATION FLOW
[ ] Signup: email + password → verify email works
[ ] Signup: Google OAuth → redirects correctly
[ ] Industry dropdown: all options selectable, saves to database
[ ] Email verification: link works, marks email_verified in auth.users
[ ] Login: correct credentials → redirects to /dashboard
[ ] Login: incorrect credentials → shows error
[ ] Password reset: email sends, link works, password updates
[ ] Protected routes: /dashboard/* requires auth, redirects to /login if not
[ ] Logout: clears session, redirects to home

VALIDATION CHECKLIST:
- Test with fresh email address
- Verify auth.users and public.users tables sync
- Check email templates render properly
- Confirm session persists across page refreshes

1.2 CORE SCRUBBING WORKFLOW
[ ] File upload: CSV accepted and parsed
[ ] File upload: Excel (.xlsx, .xls) accepted and parsed
[ ] File upload: rejects invalid formats with clear error
[ ] File upload: handles 50MB files without timeout
[ ] Duplicate detection: finds duplicates in upload
[ ] Duplicate detection: checks against existing CRM leads
[ ] Upload creates upload_jobs record with status='processing'
[ ] N8N webhook: receives payload, processes leads
[ ] N8N callback: updates upload_jobs with results
[ ] AI insights: generateInsights() called, populates ai_insights column
[ ] Results page: displays summary stats correctly
[ ] Results page: shows AI insights with color-coded grade
[ ] Download buttons: clean CSV, full report CSV, risky CSV (if opted in)
[ ] CRM save: clean leads (risk_score ≤20) inserted into leads table
[ ] Compliance logs: each check logged to compliance_audit_logs table

VALIDATION CHECKLIST:
- Upload 100-lead test file → verify <10s processing
- Upload 1000-lead test file → verify no timeout
- Upload file with duplicates → confirm detection works
- Upload file with high DNC count → verify warnings appear
- Check database: upload_jobs, leads, compliance_audit_logs populated
- Verify 5-year retention date calculated correctly

1.3 BUILT-IN CRM
[ ] CRM page: loads lead list with pagination
[ ] CRM page: search by name/phone/email works
[ ] CRM page: filter by status (new/contacted/converted/dead) works
[ ] CRM page: filter by tags works
[ ] Lead detail: opens modal/page with full info
[ ] Lead edit: name, email, address, notes save correctly
[ ] Lead status: update from dropdown, persists
[ ] Lead tags: add/remove tags, persists
[ ] Lead delete (soft): moves to deleted_at, recoverable
[ ] Lead delete (permanent): actually deletes from database
[ ] Bulk operations: select multiple leads, update status works
[ ] Bulk operations: bulk delete works
[ ] Export: CSV download includes all expected columns

VALIDATION CHECKLIST:
- Create, edit, delete test leads
- Verify soft delete vs permanent delete behavior
- Test bulk operations on 50+ leads
- Export and verify CSV format

═══════════════════════════════════════════════════════════
PHASE 2: BUTTONS & NAVIGATION AUDIT (UX Critical)
═══════════════════════════════════════════════════════════

2.1 LANDING PAGE (src/app/page.tsx)
[ ] "Start Free Trial" button → /signup
[ ] "View Pricing" button → /pricing
[ ] "Learn More" button → scrolls to features section
[ ] "Privacy Policy" footer link → /privacy
[ ] "Contact Us" footer link → mailto: or /contact
[ ] Mobile menu: hamburger opens/closes correctly
[ ] Mobile menu: all links work

2.2 DASHBOARD (src/app/(dashboard)/dashboard/page.tsx)
[ ] "Upload Leads" button → opens file picker OR /dashboard/upload
[ ] "View CRM" button → /dashboard/crm
[ ] "Settings" button → /dashboard/settings
[ ] Upload history table: click row → /dashboard/results/[jobId]
[ ] Recent activity: click item → relevant detail page

2.3 RESULTS PAGE (src/app/(dashboard)/dashboard/results/[jobId]/page.tsx)
[ ] "Download Clean Leads" button → CSV download triggers
[ ] "Download Full Report" button → CSV download triggers
[ ] "Download Risky Leads" button → CSV download triggers (if opted in)
[ ] "Save to CRM" button → inserts leads, shows success toast
[ ] "Back to Dashboard" button → /dashboard
[ ] Individual lead: click phone number → formats correctly
[ ] Individual lead: click email → mailto: link

2.4 CRM PAGE (src/app/(dashboard)/dashboard/crm/page.tsx)
[ ] "Add Lead" button → opens modal/form
[ ] "Export CSV" button → downloads CSV
[ ] "Bulk Actions" dropdown → shows options
[ ] Lead row: click → opens detail view
[ ] Pagination: next/previous buttons work
[ ] Pagination: page number inputs work
[ ] Filter dropdowns: all options functional
[ ] Search bar: debounced, filters results

2.5 SETTINGS PAGE (src/app/(dashboard)/dashboard/settings/page.tsx)
[ ] Tab navigation: all 4-5 tabs switch correctly
[ ] Profile tab: "Save Changes" → updates user record
[ ] Privacy tab: "Download CSV" → exports CSV
[ ] Privacy tab: "Download JSON" → exports JSON
[ ] Privacy tab: "Delete All Data" → opens confirmation dialog
[ ] Delete dialog: "Cancel" → closes without action
[ ] Delete dialog: "Confirm" with password → deletes data, shows toast
[ ] Integrations tab: "Connect Follow Up Boss" → OAuth flow starts
[ ] Integrations tab: "Disconnect" → removes integration
[ ] Compliance Logs tab: table loads, pagination works
[ ] Compliance Logs tab: "Export Logs" → CSV download

2.6 PRIVACY POLICY PAGE (src/app/privacy/page.tsx)
[ ] Table of contents: all anchor links scroll to sections
[ ] "Contact Us" links → mailto: or /contact
[ ] Footer links: Privacy Policy, Terms → correct routes
[ ] Mobile: sections collapse/expand if accordion used

═══════════════════════════════════════════════════════════
PHASE 3: DATA INTEGRITY & SECURITY AUDIT
═══════════════════════════════════════════════════════════

3.1 DATABASE VALIDATION (compare to DATABASE.md)
[ ] All tables from DATABASE.md exist in Supabase
[ ] Table schemas match: column names, types, constraints
[ ] Foreign keys: all references valid, ON DELETE behaviors correct
[ ] Indexes: performance indexes created (check EXPLAIN ANALYZE)
[ ] RLS policies: enabled on all user-facing tables
[ ] RLS policies: users can only access own data (test with 2+ accounts)
[ ] Functions: check_dnc(), get_risk_score(), anonymize_compliance_logs() work
[ ] Triggers: update_updated_at, handle_new_user fire correctly
[ ] Storage buckets: uploads, results, admin-uploads exist with correct policies

VALIDATION QUERIES:
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Verify foreign keys
SELECT conname, conrelid::regclass, confrelid::regclass 
FROM pg_constraint 
WHERE contype = 'f';

-- Test RLS with different users
SET request.jwt.claim.sub = 'user-id-1';
SELECT * FROM leads; -- Should only see user 1's leads

3.2 API ROUTE SECURITY
[ ] All /api/* routes: verify authentication with createRouteHandlerClient
[ ] Routes without auth check: identify if intentional (public endpoints)
[ ] User ID validation: always use session.user.id, never req.query/body
[ ] SQL injection: all queries use parameterized queries (Supabase client)
[ ] Rate limiting: consider adding for /api/scrub (abuse prevention)
[ ] Error messages: don't leak sensitive info (stack traces, SQL errors)

SECURITY CHECKLIST:
- No API keys in client-side code (check browser console)
- Environment variables: all sensitive vars in .env.local only
- CORS: verify allowed origins if using external APIs
- CSRF: Next.js App Router protects by default, verify

3.3 AUTHENTICATION & AUTHORIZATION
[ ] Session management: uses Supabase Auth (httpOnly cookies)
[ ] Token refresh: automatic with Supabase Auth
[ ] Password requirements: minimum length enforced (8+ chars recommended)
[ ] OAuth scopes: Google OAuth requests minimal scopes (email, profile only)
[ ] Magic links: if used, expire after 1 hour
[ ] Admin routes: verify is_admin flag checked (if admin features exist)

3.4 DATA PRIVACY COMPLIANCE (per CORE_REFERENCE.md)
[ ] No user tracking: verify no Google Analytics, Facebook Pixel, etc.
[ ] No third-party tracking cookies: check browser dev tools
[ ] Claude API: enterprise privacy mode (zero retention) configured
[ ] Compliance logs: 5-year retention enforced, anonymization works
[ ] User data deletion: actually deletes from database (not just soft delete)
[ ] User data deletion: compliance logs anonymized but retained
[ ] Data export: includes all user data (leads, uploads, settings)
[ ] Privacy policy: accurate, mentions compliance logs, updated date

═══════════════════════════════════════════════════════════
PHASE 4: AI INSIGHTS VALIDATION (Core Differentiator)
═══════════════════════════════════════════════════════════

4.1 AI INTEGRATION (compare to TECH_ARCHITECTURE.md Section 3.3)
[ ] generateInsights() function exists at src/lib/ai/claude-insights.ts
[ ] Industry prompts: all 6 industries have tailored prompts
[ ] Industry prompts: use correct terminology (listing/buyer for real-estate, etc.)
[ ] Anthropic client: initialized with ANTHROPIC_API_KEY from env
[ ] Model: uses claude-sonnet-4-20250514 (correct model string)
[ ] max_tokens: set to 1000 (cost control)
[ ] Response parsing: handles JSON, strips markdown fences if present
[ ] Error handling: insights fail gracefully, upload still succeeds
[ ] Stateless: no historical data access, only current batch
[ ] Privacy: no user profiling, enterprise mode enabled

4.2 INSIGHTS QUALITY
[ ] Real estate test: upload 100 real estate leads
   - Verify insights use real estate terminology (listing, buyer, showing)
   - Check recommendations mention optimal call times
   - Verify compliance grade A-F calculated
[ ] Solar test: upload 100 solar leads
   - Verify insights mention solar-specific risks (HOA, incentives)
   - Different language than real estate
[ ] High-risk batch: upload leads with known litigators/high DNC count
   - Verify critical warnings appear
   - Grade should be D or F
   - Recommendations should say "skip these leads"
[ ] Clean batch: upload 100 clean leads
   - Grade should be A or B
   - Positive recommendations

4.3 INSIGHTS DISPLAY (compare to UI_GUIDELINES.md Section 4.3)
[ ] Results page: insights card renders with correct styling
[ ] Warnings section: severity badges (critical=red, warning=yellow, info=blue)
[ ] Recommendations: checkmark icons, bullet list format
[ ] Compliance grade: letter badge color-coded (A=green, B=blue, C=yellow, D/F=red)
[ ] Best call times: displays if present
[ ] Expected conversion: displays if present
[ ] Privacy notice: "AI analysis generated in real-time. Nothing stored beyond this report."
[ ] Loading state: skeleton or spinner while insights generate
[ ] Mobile responsive: insights card readable on iPhone/Android

═══════════════════════════════════════════════════════════
PHASE 5: PERFORMANCE AUDIT
═══════════════════════════════════════════════════════════

5.1 PAGE LOAD PERFORMANCE
[ ] Landing page: Lighthouse score 90+ (Performance)
[ ] Dashboard: First Contentful Paint <2s
[ ] Dashboard: Largest Contentful Paint <3s
[ ] CRM page with 1000 leads: pagination prevents slow load
[ ] Results page: loads instantly (data from database, not recalculating)

TOOLS:
- Chrome DevTools: Network tab, Performance tab
- Lighthouse: npm run build && npm run start, then audit
- WebPageTest.org for real-world metrics

5.2 SCRUBBING PERFORMANCE
[ ] 100 leads: <3 seconds end-to-end (upload → N8N → callback)
[ ] 1000 leads: <10 seconds (per CORE_PRD.md success criteria)
[ ] 5000 leads: <30 seconds (acceptable for large batches)
[ ] N8N workflow: no timeouts, handles batch processing
[ ] Database inserts: batch insert for compliance logs (not individual)
[ ] AI insights: generated during callback, not blocking user

5.3 DATABASE PERFORMANCE
[ ] Queries use indexes: EXPLAIN ANALYZE on common queries
[ ] No N+1 queries: check Supabase logs for excessive queries
[ ] Pagination: leads table uses LIMIT/OFFSET efficiently
[ ] Search: uses full-text search index (idx_leads_search)
[ ] Large tables: compliance_audit_logs partitioned by year (if >100k records)

═══════════════════════════════════════════════════════════
PHASE 6: UX & ACCESSIBILITY AUDIT
═══════════════════════════════════════════════════════════

6.1 RESPONSIVE DESIGN (per UI_GUIDELINES.md Section 5)
[ ] Mobile (375px iPhone): all pages usable, no horizontal scroll
[ ] Tablet (768px iPad): layout adapts, no cramped UI
[ ] Desktop (1440px+): layout uses space effectively
[ ] Touch targets: buttons/links minimum 44x44px on mobile
[ ] Font sizes: body text minimum 16px (prevents mobile zoom)
[ ] Forms: inputs scale correctly, labels don't overlap

6.2 ACCESSIBILITY (WCAG 2.1 AA Compliance)
[ ] Color contrast: text passes 4.5:1 ratio (use browser tools)
[ ] Focus indicators: visible on all interactive elements
[ ] Keyboard navigation: can tab through entire app
[ ] Keyboard navigation: modals trap focus, ESC closes
[ ] Alt text: all images have descriptive alt attributes
[ ] Form labels: all inputs have associated labels
[ ] Error messages: read by screen readers (aria-live)
[ ] Skip links: "Skip to main content" for keyboard users

TOOLS:
- axe DevTools browser extension
- WAVE browser extension
- Keyboard-only navigation test

6.3 ERROR HANDLING & USER FEEDBACK
[ ] File upload errors: clear messages (format, size, network)
[ ] Form validation: inline errors, field-specific
[ ] API errors: user-friendly messages, not raw HTTP codes
[ ] Loading states: spinners, skeletons, progress bars
[ ] Success feedback: toasts, success messages, visual confirmation
[ ] Empty states: helpful messaging, CTAs (e.g., "No leads yet, upload your first file")
[ ] Network errors: offline detection, retry options

═══════════════════════════════════════════════════════════
PHASE 7: LEGAL & COMPLIANCE AUDIT
═══════════════════════════════════════════════════════════

7.1 TCPA COMPLIANCE (47 CFR § 64.1200)
[ ] Compliance logs: all DNC checks logged to compliance_audit_logs
[ ] Compliance logs: retention_until = checked_at + 5 years
[ ] Compliance logs: include user_email, phone_number, dnc_status, check_purpose
[ ] Compliance logs: anonymized on user deletion (user_id set to NULL)
[ ] Compliance logs: auto-purge after 5 years (Supabase cron job configured)
[ ] Disclaimer: app includes "We provide tools, not legal advice" language
[ ] Disclaimer: users responsible for TCPA compliance in their calling

7.2 PRIVACY POLICY (GDPR/CCPA Compliance)
[ ] Privacy policy exists at /privacy
[ ] Privacy policy sections: data collection, usage, storage, rights, third parties
[ ] Privacy policy: mentions 5-year compliance log retention
[ ] Privacy policy: explains anonymization vs deletion
[ ] Privacy policy: updated date present (January 21, 2026)
[ ] Privacy policy: contact information correct
[ ] Right to export: user can download all data (CSV + JSON)
[ ] Right to delete: user can permanently delete all personal data
[ ] Right to access: user can view data in dashboard and settings

7.3 TERMS OF SERVICE (Recommended)
[ ] ToS page exists (placeholder OK for MVP)
[ ] ToS disclaims liability for TCPA violations
[ ] ToS mentions acceptable use (no spamming)
[ ] ToS includes dispute resolution (arbitration clause recommended)

═══════════════════════════════════════════════════════════
PHASE 8: THIRD-PARTY INTEGRATIONS
═══════════════════════════════════════════════════════════

8.1 STRIPE (PAYMENTS)
[ ] Checkout flow: /api/stripe/checkout creates session, redirects
[ ] Subscription status: synced to users.subscription_status
[ ] Webhooks: /api/stripe/webhook handles events
[ ] Webhooks: subscription.created, subscription.updated, subscription.deleted
[ ] Webhook signature: verifies Stripe signature (security)
[ ] Customer portal: /api/stripe/portal redirects for management
[ ] Test mode: verify test card works (4242 4242 4242 4242)

8.2 RESEND (EMAIL)
[ ] API key configured: RESEND_API_KEY in env
[ ] Domain verified: echocompli.com or use resend.dev for testing
[ ] Welcome email: sends on signup
[ ] Verification email: sends with working link
[ ] Password reset email: sends with working link
[ ] Email templates: render correctly in Gmail, Outlook, Apple Mail
[ ] Unsubscribe: link present in footer (if marketing emails added)

8.3 CRM INTEGRATIONS (FOLLOW UP BOSS, LOFTY)
[ ] Follow Up Boss: OAuth flow works, user can connect
[ ] Follow Up Boss: clean leads sync successfully
[ ] Follow Up Boss: sync status shown in settings
[ ] Lofty: OAuth flow works, user can connect
[ ] Lofty: clean leads sync successfully
[ ] Error handling: integration failures don't break uploads
[ ] Disconnect: user can disconnect CRM, access token removed

8.4 N8N WORKFLOW
[ ] Webhook URL: correct in NEXT_PUBLIC_N8N_WEBHOOK_URL
[ ] Webhook receives: upload payload with leads array
[ ] Webhook returns: results with dnc_status, risk_score for each lead
[ ] Callback URL: N8N calls /api/upload/[jobId]/callback with results
[ ] Error handling: N8N timeout doesn't leave jobs stuck in 'processing'
[ ] Authentication: N8N webhook secured (API key or signature verification)

═══════════════════════════════════════════════════════════
PHASE 9: CODE QUALITY & BEST PRACTICES
═══════════════════════════════════════════════════════════

9.1 TYPESCRIPT VALIDATION
[ ] Build: npm run build completes without errors
[ ] Type errors: npm run type-check shows zero errors
[ ] Strict mode: tsconfig.json has "strict": true
[ ] Any types: minimize use of 'any', prefer proper typing
[ ] API responses: typed interfaces for all external API responses

9.2 CODE ORGANIZATION (per TECH_ARCHITECTURE.md)
[ ] File structure: follows Next.js 14 App Router conventions
[ ] Components: reusable components in src/components/
[ ] Utils: helper functions in src/lib/utils/
[ ] Services: business logic in src/lib/ or src/core/services/
[ ] API routes: RESTful naming, grouped by resource
[ ] No duplicate code: DRY principle followed

9.3 ENVIRONMENT VARIABLES
[ ] .env.local: all secrets present, never committed to git
[ ] .env.example: all variables listed with placeholders
[ ] .gitignore: includes .env.local, .env*.local
[ ] Validation: app checks for required env vars at startup
[ ] Production: all env vars configured in Vercel/deployment platform

9.4 ERROR LOGGING & MONITORING
[ ] Console errors: zero errors in browser console (production build)
[ ] Console warnings: addressed or justified
[ ] Error boundaries: React error boundaries catch component errors
[ ] Logging: critical errors logged (consider Sentry integration)
[ ] Monitoring: database errors logged, not silently swallowed

═══════════════════════════════════════════════════════════
PHASE 10: CROSS-REFERENCE WITH PRD DOCUMENTS
═══════════════════════════════════════════════════════════

10.1 CORE_PRD.md COMPLIANCE
[ ] Section 3.1 Feature 1 (File Upload): All acceptance criteria met
[ ] Section 3.1 Feature 2 (Google Sheets): Deferred to Phase 2 (OK)
[ ] Section 3.1 Feature 3 (AI Insights): Fully implemented, matches spec
[ ] Section 3.1 Feature 4 (Built-in CRM): Permanent storage, CRUD operations work
[ ] Section 3.1 Feature 5 (CRM Integrations): FUB + Lofty working
[ ] Section 3.1 Feature 6 (Dashboard): Upload history, quick stats present
[ ] Section 3.1 Feature 7 (User Auth): Supabase Auth, settings page complete
[ ] Section 9 (Pricing): Conference special ($27) implemented
[ ] Section 9 (Pricing): Utah's Elite pricing ($24) configured

10.2 CORE_REFERENCE.md COMPLIANCE
[ ] Privacy-First Principles: No user tracking verified
[ ] Privacy-First Principles: Claude API enterprise mode configured
[ ] Privacy-First Principles: Data deletion works as described
[ ] Competitive Moat: AI insights differentiate from competitors
[ ] Revenue Model: Pricing matches ($47/month, $24 for Utah's Elite)
[ ] Success Metrics: Can track signups, conversions, churn

10.3 DATABASE.md COMPLIANCE
[ ] All tables created: users, dnc_registry, litigators, upload_jobs, leads, etc.
[ ] Compliance audit logs: table exists, 5-year retention enforced
[ ] RLS policies: match specification exactly
[ ] Functions: all helper functions implemented
[ ] Storage buckets: uploads, results, admin-uploads configured

10.4 TECH_ARCHITECTURE.md COMPLIANCE
[ ] Stack: Next.js 14, TypeScript, Supabase, Claude API, N8N confirmed
[ ] AI Implementation: Section 3.3 pattern followed
[ ] Industry prompts: All 6 industries covered
[ ] Cost control: max_tokens set to limit Claude API cost

10.5 UI_GUIDELINES.md COMPLIANCE
[ ] Color palette: Echo Blue #1E40AF used consistently
[ ] Typography: Inter font family, correct sizes
[ ] Spacing: 8px grid system followed
[ ] Components: Shadcn/UI components used (Button, Card, Alert, etc.)
[ ] Animations: Subtle, purposeful, 60fps target
[ ] Responsive breakpoints: mobile, tablet, desktop handled

═══════════════════════════════════════════════════════════
PHASE 11: PRE-LAUNCH DEPLOYMENT CHECKLIST
═══════════════════════════════════════════════════════════

11.1 PRODUCTION BUILD
[ ] Build succeeds: npm run build completes without errors
[ ] Bundle size: check .next/analyze (consider if >500KB)
[ ] Unused dependencies: npm prune, remove unused packages
[ ] Production test: npm run start, test all critical flows locally

11.2 DEPLOYMENT CONFIGURATION
[ ] Vercel project: created and linked to repo
[ ] Environment variables: all copied to Vercel dashboard
[ ] Domain: echocompli.com added, DNS configured
[ ] SSL: automatic via Vercel (verify HTTPS works)
[ ] Build settings: Framework preset = Next.js, Node version = 18.x+

11.3 EXTERNAL SERVICES
[ ] Supabase: production project created (separate from dev)
[ ] Supabase: database schema deployed
[ ] Supabase: RLS policies active (verify in dashboard)
[ ] Stripe: webhook endpoint updated to production URL
[ ] Resend: domain echocompli.com verified
[ ] N8N: production workflow URL configured
[ ] Claude API: production API key (separate from dev if applicable)

11.4 MONITORING & ANALYTICS
[ ] Vercel Analytics: enabled (privacy-first, GDPR compliant)
[ ] Uptime monitoring: consider using UptimeRobot or similar
[ ] Error tracking: Sentry or similar configured (optional but recommended)
[ ] Database monitoring: Supabase dashboard alerts configured

11.5 BACKUP & DISASTER RECOVERY
[ ] Database backups: Supabase automatic backups enabled
[ ] Git repository: pushed to GitHub/GitLab with all changes
[ ] Rollback plan: document how to revert to previous version
[ ] Contact list: key people (support, tech lead) documented

═══════════════════════════════════════════════════════════
PHASE 12: FINAL PRE-LAUNCH SMOKE TESTS
═══════════════════════════════════════════════════════════

12.1 PRODUCTION ENVIRONMENT TEST (Same as User Flow)
1. Clear browser cache, open incognito window
2. Visit https://echocompli.com
3. Click "Start Free Trial" → lands on /signup
4. Sign up with fresh email → receive verification email
5. Click verification link → lands on /dashboard
6. Upload test CSV (50 leads) → processes successfully
7. View results → AI insights display with grade
8. Download clean CSV → file downloads correctly
9. Go to CRM → uploaded leads visible
10. Go to Settings → Profile, Privacy, Integrations tabs work
11. Export data as CSV → downloads correctly
12. Test on mobile (iPhone Safari) → repeat steps 2-11
13. Test on mobile (Android Chrome) → repeat steps 2-11

12.2 PERFORMANCE VALIDATION (Production)
[ ] Homepage: loads <2s on 3G network
[ ] Dashboard: loads <3s on 3G network
[ ] Upload 1000 leads: completes <10s (per success criteria)
[ ] Lighthouse Performance: 90+ score
[ ] Lighthouse Accessibility: 90+ score
[ ] Lighthouse Best Practices: 90+ score

12.3 CROSS-BROWSER TESTING
[ ] Chrome (latest): all features work
[ ] Safari (latest): all features work
[ ] Firefox (latest): all features work
[ ] Edge (latest): all features work
[ ] Mobile Safari (iOS 15+): all features work
[ ] Mobile Chrome (Android 10+): all features work

═══════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════

For each phase, provide:

1. SUMMARY: "✅ PASSED" or "❌ FAILED" with count
   Example: "Phase 1: ✅ 12 passed, ❌ 3 failed"

2. CRITICAL ISSUES (if any):
   - Description of issue
   - Location (file path, function name, line number if possible)
   - Impact (blocks launch, degrades UX, minor cosmetic)
   - Recommended fix

3. WARNINGS (non-blocking but should fix):
   - Description
   - Location
   - Recommended improvement

4. CODE FIXES (for failed items):
   Provide exact code to fix the issue, formatted as:
   
   FILE: src/path/to/file.ts
   ISSUE: Button not wired correctly
   FIX:
```typescript
   // Replace line 42:
   <Button onClick={handleClick}>Submit</Button>
   // With:
   <Button onClick={() => handleSubmit()}>Submit</Button>
```

5. FINAL PRODUCTION READINESS SCORE:
   - Overall: X/100
   - Critical blockers: X
   - Warnings: X
   - Recommendation: READY TO LAUNCH / NEEDS WORK / DO NOT LAUNCH

═══════════════════════════════════════════════════════════
EXECUTION INSTRUCTIONS
═══════════════════════════════════════════════════════════

1. Read all .md files first to understand requirements
2. Audit codebase systematically (phases 1-12 in order)
3. Test in development environment when possible
4. Flag any deviation from specs in .md files
5. Prioritize: Critical blockers > Warnings > Nice-to-haves
6. Be specific with file paths and line numbers
7. Provide actionable fixes, not just descriptions
8. If unclear, note "NEEDS MANUAL VERIFICATION" with why

BEGIN AUDIT NOW.