-- Migration: Add theme preference to user preferences
-- Date: 2026-01-21
-- Description: Adds theme preference ('light' or 'dark') to the preferences JSONB column
-- IDEMPOTENT: Safe to re-run

-- Update the default preferences for new users to include theme
-- This is idempotent - setting the same default multiple times is safe
ALTER TABLE public.users
ALTER COLUMN preferences
SET DEFAULT '{
  "email_notifications": true,
  "sync_to_crm_auto": true,
  "include_risky_in_downloads": false,
  "ai_insights_enabled": true,
  "duplicate_check_enabled": true,
  "theme": "light"
}'::jsonb;

-- Update existing users to have the theme preference if they don't already have it
-- The WHERE clause makes this idempotent - only updates users missing the theme key
UPDATE public.users
SET preferences = preferences || '{"theme": "light"}'::jsonb
WHERE preferences IS NOT NULL
  AND NOT (preferences ? 'theme');

-- Add a comment for documentation (idempotent - replaces existing comment)
COMMENT ON COLUMN public.users.preferences IS 'User preferences JSONB including: email_notifications, sync_to_crm_auto, include_risky_in_downloads, ai_insights_enabled, duplicate_check_enabled, theme (light/dark/system)';
