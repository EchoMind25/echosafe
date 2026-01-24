# CRM Integrations

This module provides real-time CRM synchronization for Echo Safe Compliance.

## Supported CRMs

1. **Follow Up Boss** - OAuth 2.0 authentication
2. **Lofty** - API Key authentication

## Environment Variables

Add these to your `.env.local` file:

```env
# Encryption key for storing credentials (generate with: openssl rand -hex 32)
INTEGRATION_ENCRYPTION_KEY=your-256-bit-hex-key-here

# Optional: Custom salt for key derivation
INTEGRATION_ENCRYPTION_SALT=echosafe-salt

# Webhook secret for internal API calls
WEBHOOK_SECRET=your-webhook-secret-here

# Follow Up Boss OAuth Configuration
FOLLOWUPBOSS_CLIENT_ID=your-client-id
FOLLOWUPBOSS_CLIENT_SECRET=your-client-secret
FOLLOWUPBOSS_SYSTEM_KEY=your-system-key  # Optional, for system identification

# Lofty API (no extra config needed - users provide their own API keys)
```

## Architecture

### Files

- `encryption.ts` - AES-256-GCM encryption for credentials
- `followupboss.ts` - Follow Up Boss OAuth flow and API client
- `lofty.ts` - Lofty API client with rate limiting
- `sync-engine.ts` - Core sync logic with retry and error handling

### Database Tables

- `crm_integrations` - Stores user's connected CRMs with encrypted credentials
- `crm_sync_logs` - Audit log of all sync operations

### API Routes

```
GET  /api/integrations              - List user's integrations
POST /api/integrations              - Connect new CRM (API key auth)
GET  /api/integrations/[id]         - Get integration details
PUT  /api/integrations/[id]         - Update settings
DELETE /api/integrations/[id]       - Disconnect CRM
POST /api/integrations/[id]/sync    - Manual sync trigger
GET  /api/integrations/[id]/logs    - Fetch sync logs
GET  /api/integrations/logs         - All sync logs

# OAuth Routes (Follow Up Boss)
GET  /api/integrations/followupboss/authorize  - Start OAuth flow
GET  /api/integrations/followupboss/callback   - Handle OAuth callback

# Webhook
POST /api/webhooks/lead-created     - Trigger auto-sync for new lead
```

## Sync Flow

1. Lead is created/updated in Echo Safe CRM
2. `processAutoSync()` is called with lead data
3. System checks for active integrations with `auto_sync: true`
4. Lead is filtered by risk score (default: only sync if ≤ 20)
5. For each integration:
   - Check for duplicate by phone number in CRM
   - Create or update contact
   - Log sync result
6. On failure: Retry 3 times with exponential backoff
7. After 10 consecutive failures: Integration paused

## Security

- All credentials encrypted with AES-256-GCM
- OAuth tokens auto-refreshed when expired
- Sensitive data never logged to sync_logs
- Row Level Security on all tables
- Webhook endpoints validate secret header

## Testing Locally

1. Set up ngrok for OAuth callback:
   ```bash
   ngrok http 3000
   ```

2. Update `NEXT_PUBLIC_APP_URL` to your ngrok URL

3. Register OAuth app with Follow Up Boss using ngrok callback URL

4. Test the flow:
   - Go to /dashboard/settings/integrations
   - Click "Connect" on Follow Up Boss
   - Complete OAuth flow
   - Create a lead and verify it syncs
