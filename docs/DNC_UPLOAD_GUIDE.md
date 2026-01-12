# DNC Registry Manual Upload Guide

## Overview

After running `SUPABASE_SETUP.sql`, the `dnc_registry` table is ready for data. This guide explains how to manually upload DNC data from your existing source.

## Prerequisites

1. Supabase project created and schema deployed
2. Access to Supabase Dashboard or `psql` client
3. DNC data in CSV format (or ability to export to CSV)

---

## Data Format Required

### CSV Format

The CSV file should have the following columns:

```csv
phone_number,area_code,state,registered_at,source
8015551234,801,UT,2024-01-15,federal
3855552345,385,UT,2024-02-20,utah_state
4355553456,435,UT,2024-03-10,federal
8015559999,801,UT,2024-04-01,manual
```

### Column Specifications

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `phone_number` | TEXT | Yes | 10-digit phone number (no dashes, spaces, or country code) |
| `area_code` | TEXT | Yes | First 3 digits of phone number |
| `state` | TEXT | No | Two-letter state code (e.g., UT, AZ, NV). Auto-detected from area code if not provided |
| `registered_at` | TIMESTAMP | Yes | Date the number was added to DNC registry |
| `source` | ENUM | Yes | One of: `federal`, `utah_state`, `manual` |

### Source Values

- **federal** - Number from the National Do Not Call Registry (FTC)
- **utah_state** - Number from Utah State DNC list
- **manual** - Manually added number (customer request, internal list, etc.)

### State Column Notes

The `state` column is **optional** and will be automatically populated based on the area code if not provided:
- A database trigger automatically maps common area codes to states
- Supported states: UT, AZ, NV, CO, ID, WY, NM
- If you provide a state value, it will be used as-is (no override)
- Unknown area codes will have `state` set to `NULL`

---

## Upload Methods

### Method 1: Supabase Dashboard (Small Datasets < 10,000 rows)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** > **dnc_registry**
3. Click **Import data from CSV**
4. Select your CSV file
5. Map columns to match the table schema
6. Click **Import**

**Note:** Dashboard imports are limited. For large datasets, use SQL or CLI.

---

### Method 2: SQL INSERT (Medium Datasets)

Use the Supabase SQL Editor for direct inserts:

```sql
-- Single record insert (state is optional - auto-populated via trigger)
INSERT INTO dnc_registry (phone_number, area_code, state, registered_at, source)
VALUES ('8015551234', '801', 'UT', '2024-01-15', 'federal');

-- Single record insert (omit state - will be auto-populated)
INSERT INTO dnc_registry (phone_number, area_code, registered_at, source)
VALUES ('8015551234', '801', '2024-01-15', 'federal');

-- Bulk insert (recommended for batches)
INSERT INTO dnc_registry (phone_number, area_code, state, registered_at, source)
VALUES
  ('8015551234', '801', 'UT', '2024-01-15', 'federal'),
  ('3855552345', '385', 'UT', '2024-02-20', 'utah_state'),
  ('4355553456', '435', 'UT', '2024-03-10', 'federal'),
  ('8015559999', '801', 'UT', '2024-04-01', 'manual');

-- Insert with ON CONFLICT (upsert - updates existing records)
INSERT INTO dnc_registry (phone_number, area_code, state, registered_at, source)
VALUES ('8015551234', '801', 'UT', '2024-01-15', 'federal')
ON CONFLICT (phone_number)
DO UPDATE SET
  state = EXCLUDED.state,
  registered_at = EXCLUDED.registered_at,
  source = EXCLUDED.source,
  updated_at = NOW();
```

---

### Method 3: COPY Command (Large Datasets - Recommended)

For large CSV files (10,000+ records), use PostgreSQL's COPY command:

#### Option A: Supabase SQL Editor

```sql
-- First, create a temporary table with TEXT columns
CREATE TEMP TABLE dnc_import (
  phone_number TEXT,
  area_code TEXT,
  state TEXT,
  registered_at TEXT,
  source TEXT
);

-- Import data (run this from Supabase CLI or direct connection)
-- Note: COPY requires superuser or direct DB access
\copy dnc_import FROM '/path/to/your/dnc_data.csv' WITH (FORMAT csv, HEADER true);

-- Insert into main table with proper type casting
-- State will be auto-populated by trigger if NULL
INSERT INTO dnc_registry (phone_number, area_code, state, registered_at, source)
SELECT
  phone_number,
  area_code,
  NULLIF(state, ''),  -- Convert empty strings to NULL for auto-population
  registered_at::TIMESTAMPTZ,
  source::dnc_source_enum
FROM dnc_import
ON CONFLICT (phone_number) DO UPDATE SET
  state = EXCLUDED.state,
  registered_at = EXCLUDED.registered_at,
  source = EXCLUDED.source,
  updated_at = NOW();

-- Clean up
DROP TABLE dnc_import;
```

#### Option B: Using Supabase CLI

```bash
# Connect to your database
supabase db connect

# Then run COPY command (state will be auto-populated if not in CSV)
\copy dnc_registry(phone_number, area_code, state, registered_at, source) FROM 'dnc_data.csv' WITH (FORMAT csv, HEADER true);
```

---

### Method 4: Node.js Script (Programmatic Upload)

For automated or repeated uploads:

```javascript
// upload-dnc.js
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const csv = require('csv-parser')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin access
)

async function uploadDNC(csvPath) {
  const records = []

  // Parse CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        records.push({
          phone_number: row.phone_number,
          area_code: row.area_code,
          state: row.state || null,  // Optional - auto-populated if null
          registered_at: row.registered_at,
          source: row.source
        })
      })
      .on('end', resolve)
      .on('error', reject)
  })

  console.log(`Parsed ${records.length} records`)

  // Upload in batches of 1000
  const batchSize = 1000
  let uploaded = 0

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    const { error } = await supabase
      .from('dnc_registry')
      .upsert(batch, {
        onConflict: 'phone_number',
        ignoreDuplicates: false
      })

    if (error) {
      console.error(`Error uploading batch ${i / batchSize + 1}:`, error)
      continue
    }

    uploaded += batch.length
    console.log(`Uploaded ${uploaded} / ${records.length}`)
  }

  console.log('Upload complete!')
}

// Run: SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx node upload-dnc.js data.csv
uploadDNC(process.argv[2])
```

---

## Data Validation

### Before Upload

Ensure your data meets these requirements:

1. **Phone numbers must be unique** - The table has a unique constraint
2. **Phone numbers must be 10 digits** - No formatting characters
3. **Area codes must match** - First 3 digits of phone number
4. **Valid source values** - Only `federal`, `utah_state`, or `manual`
5. **Valid dates** - ISO format recommended (YYYY-MM-DD)

### Validation Script

```sql
-- Check for duplicate phone numbers in your CSV before import
-- (Run this after loading into a temp table)

SELECT phone_number, COUNT(*) as count
FROM dnc_import
GROUP BY phone_number
HAVING COUNT(*) > 1;

-- Check for invalid area codes
SELECT *
FROM dnc_import
WHERE area_code != LEFT(phone_number, 3);

-- Check for invalid sources
SELECT DISTINCT source
FROM dnc_import
WHERE source NOT IN ('federal', 'utah_state', 'manual');
```

---

## Post-Upload Verification

After uploading, verify the data:

```sql
-- Count total records
SELECT COUNT(*) as total_records FROM dnc_registry;

-- Count by area code
SELECT area_code, COUNT(*) as count
FROM dnc_registry
GROUP BY area_code
ORDER BY count DESC;

-- Count by source
SELECT source, COUNT(*) as count
FROM dnc_registry
GROUP BY source;

-- Verify indexes are working (should be fast)
EXPLAIN ANALYZE
SELECT * FROM dnc_registry WHERE phone_number = '8015551234';

-- Check recent additions
SELECT *
FROM dnc_registry
ORDER BY created_at DESC
LIMIT 10;
```

---

## Updating Existing Records

### Update a single record

```sql
UPDATE dnc_registry
SET
  state = 'UT',
  source = 'federal',
  registered_at = '2024-06-01',
  updated_at = NOW()
WHERE phone_number = '8015551234';
```

### Bulk update from CSV

```sql
-- Load updates to temp table
CREATE TEMP TABLE dnc_updates (
  phone_number TEXT,
  state TEXT,
  registered_at TEXT,
  source TEXT
);

-- Import updates
\copy dnc_updates FROM 'updates.csv' WITH (FORMAT csv, HEADER true);

-- Apply updates
UPDATE dnc_registry d
SET
  state = COALESCE(u.state, d.state),  -- Keep existing if not provided
  registered_at = u.registered_at::TIMESTAMPTZ,
  source = u.source::dnc_source_enum,
  updated_at = NOW()
FROM dnc_updates u
WHERE d.phone_number = u.phone_number;

DROP TABLE dnc_updates;
```

---

## Deleting Records

### Delete a single record

```sql
DELETE FROM dnc_registry
WHERE phone_number = '8015551234';
```

### Bulk delete (by source)

```sql
-- Delete all manual entries
DELETE FROM dnc_registry
WHERE source = 'manual';
```

### Delete by area code

```sql
-- Remove all records for area code 435
DELETE FROM dnc_registry
WHERE area_code = '435';
```

---

## Performance Considerations

### Index Optimization

The schema includes these indexes for fast lookups:

- `idx_dnc_phone` - Primary phone number lookup (unique)
- `idx_dnc_area_code` - Filter by area code
- `idx_dnc_source` - Filter by source
- `idx_dnc_area_phone` - Composite for area code + phone queries

### Query Performance Tips

1. **Always query by phone_number first** - It's the primary lookup index
2. **Use area_code for filtering** - Before full table scans
3. **Batch operations** - Use batches of 1,000 for inserts/updates
4. **Avoid SELECT *** - Only select columns you need

### Expected Performance

With proper indexes:
- Single phone lookup: < 1ms
- Batch of 1,000 lookups: < 100ms
- Area code filter (50,000 records): < 50ms

---

## Troubleshooting

### Error: Duplicate key violation

```
ERROR: duplicate key value violates unique constraint "idx_dnc_phone"
```

**Solution:** Use UPSERT instead of INSERT:

```sql
INSERT INTO dnc_registry (phone_number, area_code, registered_at, source)
VALUES ('8015551234', '801', '2024-01-15', 'federal')
ON CONFLICT (phone_number) DO UPDATE SET
  registered_at = EXCLUDED.registered_at,
  source = EXCLUDED.source;
```

### Error: Invalid enum value

```
ERROR: invalid input value for enum dnc_source_enum: "FEDERAL"
```

**Solution:** Enum values are case-sensitive. Use lowercase: `federal`, not `FEDERAL`

### Error: Permission denied

```
ERROR: permission denied for table dnc_registry
```

**Solution:** Use the service role key, not the anon key. The anon key only has SELECT access.

---

## N8N Integration Notes

The DNC registry is designed for N8N webhook queries:

### N8N Query Example

```javascript
// In N8N HTTP Request node
{
  "method": "POST",
  "url": "https://your-project.supabase.co/rest/v1/rpc/bulk_check_dnc",
  "headers": {
    "apikey": "{{$env.SUPABASE_SERVICE_ROLE_KEY}}",
    "Authorization": "Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}",
    "Content-Type": "application/json"
  },
  "body": {
    "phones": ["8015551234", "3855552345", "4355553456"]
  }
}
```

### Response Format

```json
[
  {
    "phone_number": "8015551234",
    "is_dnc": true,
    "dnc_source": "federal",
    "registered_at": "2024-01-15T00:00:00Z"
  },
  {
    "phone_number": "3855552345",
    "is_dnc": true,
    "dnc_source": "utah_state",
    "registered_at": "2024-02-20T00:00:00Z"
  },
  {
    "phone_number": "4355553456",
    "is_dnc": false,
    "dnc_source": null,
    "registered_at": null
  }
]
```

---

## Sample Data for Testing

Use this sample data to test your upload process:

```csv
phone_number,area_code,state,registered_at,source
8015550001,801,UT,2024-01-01,federal
8015550002,801,UT,2024-01-02,federal
8015550003,801,UT,2024-01-03,utah_state
3855550001,385,UT,2024-02-01,federal
3855550002,385,UT,2024-02-02,utah_state
4355550001,435,UT,2024-03-01,federal
4355550002,435,UT,2024-03-02,manual
```

Save this as `test_dnc_data.csv` and use any upload method to test.

---

## Next Steps

After uploading DNC data:

1. Verify record counts match your source data
2. Test phone number lookups via Supabase dashboard
3. Configure N8N webhook to query the `bulk_check_dnc` function
4. Set up periodic updates for fresh DNC data

---

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify service role key permissions
3. Review RLS policies if getting permission errors

For schema issues, re-run `SUPABASE_SETUP.sql` in a fresh project.
