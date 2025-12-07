-- ============================================
-- MIGRATION: Add consent and preference fields to profiles table
-- Run this in Supabase SQL Editor
-- ============================================

-- Add consent_server_storage column
-- Legal basis: User consent for processing & storing sensitive app data on the server
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_server_storage BOOLEAN NOT NULL DEFAULT false;

-- Add marketing_opt_in column
-- Legal basis: User consent for sending marketing emails; must be optional
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

-- Add notifications_enabled column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add locale column if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale TEXT;

-- ============================================
-- FERTIG!
-- ============================================
-- After running this migration:
-- - Existing profiles will have consent_server_storage = false (opt-in)
-- - Existing profiles will have marketing_opt_in = false (opt-in)
-- - Existing profiles will have notifications_enabled = true (default)
-- - RLS policies remain unchanged

