# Database Deployment Instructions

## Quick Deploy (Recommended)

For a fresh Supabase project, use the unified deployment script:

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Create a new query
3. **Copy the ENTIRE contents of `PRODUCTION_DEPLOY.sql`** (1000+ lines)
4. Paste into SQL Editor
5. Click **Run**

The script is idempotent - safe to run multiple times.

---

## Schema Overview

**21 Tables** | **12+ Functions** | **Full RLS Policies** | **Storage Buckets**

Key tables:
- `users` - User profiles (synced with Supabase Auth)
- `upload_history` - Upload job records (30-day retention)
- `crm_leads` - User's private CRM data
- `dnc_registry` - Federal DNC numbers
- `compliance_audit_logs` - TCPA audit trail (5-year retention)

---

## Prerequisites

1. Supabase project created at https://supabase.com
2. Access to Supabase SQL Editor
3. Supabase CLI installed (optional, for local development)

## Deployment Steps

### Step 1: Run Schema Migration

1. Go to **Supabase Dashboard** > **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase/PRODUCTION_DEPLOY.sql`
4. **Review the SQL** before executing
5. Click **Run** to execute

Expected output: No errors, tables created successfully.

### Step 2: Seed Test Data

1. In SQL Editor, create a new query
2. Copy contents of `supabase/migrations/20260121000001_seed_test_dnc_data.sql`
3. Execute the script

Expected output:
```
Generated ~1000 DNC records for area code 801
Generated ~500 DNC records for area code 385
Generated ~300 DNC records for area code 435
```

### Step 3: Verify Deployment

Run these verification queries in SQL Editor:

```sql
-- Check table counts
SELECT
  'users' as table_name, COUNT(*) as count FROM public.users
UNION ALL SELECT 'dnc_registry', COUNT(*) FROM public.dnc_registry
UNION ALL SELECT 'litigators', COUNT(*) FROM public.litigators
UNION ALL SELECT 'dnc_deleted_numbers', COUNT(*) FROM public.dnc_deleted_numbers
UNION ALL SELECT 'ftc_subscriptions', COUNT(*) FROM public.ftc_subscriptions;

-- Test check_dnc function
SELECT check_dnc('8015551234');  -- Should return true (litigator is in DNC)

-- Test get_risk_score function
SELECT get_risk_score('8015551234');  -- Should return 25+ (litigator)

-- Test bulk_check_dnc function
SELECT * FROM bulk_check_dnc(ARRAY['8015551234', '8015550000', '1234567890']);

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Step 4: Test RLS Policies

1. **Create a test user** via your app's signup flow
2. **Sign in** as the test user
3. **Verify** the user can only see their own data:

```sql
-- As authenticated user, should only see own profile
SELECT * FROM users;

-- Should be able to read DNC registry (public data)
SELECT COUNT(*) FROM dnc_registry;

-- Should NOT see other users' leads
SELECT * FROM crm_leads;  -- Should be empty or show only own leads
```

### Step 5: Test Storage Buckets

1. Go to **Supabase Dashboard** > **Storage**
2. Verify these buckets exist:
   - `uploads` (private)
   - `results` (private)
   - `admin-uploads` (private)

3. Test file upload via your app

### Step 6: Verify Foreign Keys

```sql
-- Check all foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

## Post-Deployment Checklist

- [ ] Schema migration executed without errors
- [ ] Test data seeded successfully
- [ ] `check_dnc()` function works correctly
- [ ] `get_risk_score()` function works correctly
- [ ] `bulk_check_dnc()` function works correctly
- [ ] RLS policies are enabled on all tables
- [ ] Storage buckets created
- [ ] Foreign keys verified
- [ ] Test user signup flow works
- [ ] Test lead upload and DNC check works

## Environment Variables

Ensure these are set in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Rollback

If needed, you can drop all tables and start fresh:

```sql
-- WARNING: This deletes ALL data!
-- Only use in development/staging

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;
```

## Importing Real FTC Data

After testing with seed data, import real FTC DNC data:

1. Download FTC data files from https://www.ftc.gov/policy-notices/open-government/data-sets/do-not-call-data
2. Use the admin upload feature or run:

```sql
-- Example: Import from CSV (adjust path)
COPY dnc_registry(phone_number, area_code, state, source)
FROM '/path/to/ftc_801_data.csv'
WITH (FORMAT csv, HEADER true);

-- Update subscription total
UPDATE ftc_subscriptions
SET total_records = (SELECT COUNT(*) FROM dnc_registry WHERE area_code = '801')
WHERE area_code = '801';
```

## Scheduled Cleanup

Set up a cron job to run daily cleanup:

```sql
-- Via Supabase pg_cron extension
SELECT cron.schedule(
  'daily-privacy-cleanup',
  '0 3 * * *',  -- 3 AM daily
  $$SELECT cleanup_expired_data()$$
);
```

Or configure via Supabase Dashboard > Database > Extensions > pg_cron.

## Support

For issues, check:
1. Supabase logs: Dashboard > Logs
2. Edge function logs: Dashboard > Edge Functions > Logs
3. RLS debugging: Enable `log_statement = 'all'` temporarily

---

## TypeScript Type Alignment

The TypeScript types in `src/lib/supabase/types.ts` are aligned with the SQL schema:

| TypeScript Type | SQL Table |
|-----------------|-----------|
| `User` | `users` |
| `UploadHistory` | `upload_history` |
| `CrmLead` | `crm_leads` |
| `CrmIntegration` | `crm_integrations` |
| `ComplianceAuditLog` | `compliance_audit_logs` |
| `DncRegistry` | `dnc_registry` |
| `DncDeletedNumber` | `dnc_deleted_numbers` |

### Key Field Names
- `full_name` (not `name`)
- `company_name` (not `company`)
- `phone_number` (not `phone`)
- `zip_code` (not `zip`)

---

**Document Version:** 2.0
**Last Updated:** January 21, 2026
