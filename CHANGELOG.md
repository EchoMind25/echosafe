# Changelog

All notable changes to Echo Safe will be documented in this file.

## [Unreleased]

### Phase 1 Launch - Simplified Pricing (2026-01-25)

Complete website update for Phase 1 launch with simplified, honest pricing model.

#### Pricing Changes

- **Single tier**: Professional $47/month (no Team tier at launch)
- **Coverage**: 5 area codes included - Utah (801, 385, 435) + Nevada (702, 775)
- **Positioning**: Flat-rate unlimited scrubbing vs per-lead competitors

#### UI/UX Updates

**Landing Page (`src/app/page.tsx`):**
- Updated hero messaging: "Unlimited scrubbing, AI risk scoring, built-in CRM"
- Simplified pricing section with single Professional plan
- Added footer link to waitlist for expansion

**Pricing Page (`src/app/pricing/page.tsx`):**
- Removed Team tier (simplified to single plan)
- Updated FAQs with Utah + Nevada coverage info
- Added waitlist section with email signup form
- Removed contribution/Founder's Club sections

**Signup Flow (`src/app/(auth)/signup/page.tsx`):**
- Added coverage info banner (5 area codes)
- Updated pricing display ($47/month, 14-day trial)
- Removed area code selection

**Dashboard (`src/app/(dashboard)/dashboard/page.tsx`):**
- Added coverage banner showing Utah + Nevada area codes
- Link to Settings > Coverage tab

**Settings Page (`src/app/(dashboard)/dashboard/settings/page.tsx`):**
- **NEW** Coverage tab showing:
  - Utah area codes (801, 385, 435)
  - Nevada area codes (702, 775)
  - Link to expansion waitlist
- Added support for `?tab=coverage` query parameter

**Email Templates:**
- `src/lib/email/templates/welcome.ts` - Added coverage info box

#### Database Changes

- `supabase/migrations/20260125100000_update_default_area_codes.sql`:
  - Updated default `area_codes` to include Nevada (702, 775)
  - Updated all existing users to have 5 area codes
  - Updated `get_user_area_codes()` function fallback

---

### Temporarily Disabled - Contribution/Expansion System (2026-01-25)

The contribution/expansion system has been temporarily disabled for launch. We're starting with a simplified pricing model ($47/month, 5 area codes) to prove execution before introducing the community expansion model.

**Re-enable Date:** Q2 2026

**To Re-enable:** Set `ENABLE_CONTRIBUTIONS=true` in your environment variables.

#### Files Modified

**Feature Flag Configuration:**
- `src/lib/feature-flags.ts` - New centralized feature flag management
- `.env.example` - Added `ENABLE_CONTRIBUTIONS=false` flag

**Pages Hidden/Modified:**
- `src/app/expansion/page.tsx` - Redirects to /pricing when disabled, shows "Launching Q2 2026" message
- `src/app/expansion/layout.tsx` - No changes needed (layout preserved)
- `src/app/pricing/page.tsx` - Major updates:
  - Removed Founder's Club pricing card when disabled
  - Added waitlist signup form
  - Updated FAQs to remove contribution-related questions
  - Shows redirect banner when user comes from /expansion
  - Updated to 2-column layout (Professional + Team) when contributions disabled

**API Endpoints Updated:**
- `src/app/api/expansion/request/route.ts` - Returns 403 with redirect when disabled
- `src/app/api/pricing/unlock-founders-club/route.ts` - Returns disabled status when feature off

**New Files Created:**
- `src/app/api/waitlist/expansion/route.ts` - Waitlist signup endpoint
- `supabase/migrations/20260125000000_expansion_waitlist.sql` - Waitlist database table

#### What Was Hidden

| Component | Location | How Hidden |
|-----------|----------|------------|
| Expansion page | `/expansion` | Redirects to /pricing |
| Founder's Club card | `/pricing` | Conditional render |
| Area Code Expansion section | `/pricing` | Replaced with waitlist |
| Contribution FAQs | `/pricing` | Filtered out |
| Contribution progress | Dashboard widgets | Not rendered when disabled |

#### What Remains Active

- Professional plan ($47/month, 5 area codes)
- Team Members add-on ($15/month per seat)
- All core DNC scrubbing features
- Built-in CRM
- Upload history
- User settings
- Compliance audit logs

#### Database Tables Preserved

These tables remain in the database but are not actively used when contributions are disabled:
- `area_code_requests`
- `ftc_subscriptions.paid_by` (contribution tracking)
- User contribution counts in `users` table

#### New Database Table

- `expansion_waitlist` - Stores emails for users interested in the expansion feature

#### Re-enabling Checklist

When ready to re-enable contributions (Q2 2026):

1. Set `ENABLE_CONTRIBUTIONS=true` in environment variables
2. Deploy the change
3. Verify:
   - [ ] `/expansion` page loads correctly
   - [ ] `/pricing` shows Founder's Club card
   - [ ] Contribution APIs accept requests
   - [ ] FAQs include contribution-related questions
4. Notify waitlist subscribers via `expansion_waitlist` table
5. Consider promotional campaign for early contributors

---

## [1.0.0] - 2026-01-25

### Added
- Initial release of Echo Safe DNC Compliance Platform
- Professional plan: $47/month with 5 area codes
- Daily FTC DNC updates
- AI-powered risk scoring with Claude
- Built-in CRM with export capabilities
- CSV upload and processing
- Compliance audit logging (5-year retention)
- Privacy-first architecture (no data selling)
- Team member add-on support
