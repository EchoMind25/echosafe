-- ============================================================================
-- CRM INTEGRATIONS TABLES MIGRATION
-- Creates tables for storing CRM integrations and sync logs
-- ============================================================================

-- ============================================================================
-- CRM INTEGRATIONS TABLE
-- Stores user's connected CRM integrations with encrypted credentials
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('FOLLOWUPBOSS', 'LOFTY', 'KVCORE')),
  credentials TEXT NOT NULL, -- Encrypted JSON containing tokens/API keys
  sync_settings JSONB NOT NULL DEFAULT '{
    "auto_sync": true,
    "sync_frequency": "immediate",
    "sync_clean_only": true,
    "max_risk_score": 20
  }'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'ERROR')),
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure each user can only have one integration per CRM type
  CONSTRAINT unique_user_crm_type UNIQUE (user_id, crm_type)
);

-- Indexes for crm_integrations
CREATE INDEX IF NOT EXISTS idx_crm_integrations_user_id ON public.crm_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_status ON public.crm_integrations(status);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_crm_type ON public.crm_integrations(crm_type);

-- ============================================================================
-- CRM SYNC LOGS TABLE
-- Records each sync attempt for auditing and debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.crm_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  lead_name TEXT, -- Stored separately in case lead is deleted
  sync_type TEXT NOT NULL CHECK (sync_type IN ('AUTO', 'MANUAL')),
  status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'PARTIAL', 'FAILED')),
  crm_record_id TEXT, -- ID of the record in the external CRM
  error_message TEXT, -- Error details (never include sensitive data)
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for crm_sync_logs
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_integration_id ON public.crm_sync_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_user_id ON public.crm_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_lead_id ON public.crm_sync_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_status ON public.crm_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_synced_at ON public.crm_sync_logs(synced_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;

-- CRM Integrations Policies
CREATE POLICY "Users can view their own integrations"
  ON public.crm_integrations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own integrations"
  ON public.crm_integrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
  ON public.crm_integrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
  ON public.crm_integrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- CRM Sync Logs Policies
CREATE POLICY "Users can view their own sync logs"
  ON public.crm_sync_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync logs"
  ON public.crm_sync_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: Sync logs should not be updated or deleted by users

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crm_integrations_updated_at
  BEFORE UPDATE ON public.crm_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS FOR SERVICE ROLE
-- ============================================================================

GRANT ALL ON public.crm_integrations TO service_role;
GRANT ALL ON public.crm_sync_logs TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.crm_integrations IS 'Stores user CRM integration configurations with encrypted credentials';
COMMENT ON TABLE public.crm_sync_logs IS 'Audit log of all CRM sync operations';

COMMENT ON COLUMN public.crm_integrations.credentials IS 'Encrypted JSON containing OAuth tokens or API keys - NEVER log or expose';
COMMENT ON COLUMN public.crm_integrations.sync_settings IS 'JSON object with auto_sync, sync_frequency, sync_clean_only, max_risk_score';
COMMENT ON COLUMN public.crm_integrations.consecutive_failures IS 'Counter for consecutive failures - integration paused at 10';

COMMENT ON COLUMN public.crm_sync_logs.error_message IS 'User-safe error message - NEVER include tokens, keys, or sensitive data';
