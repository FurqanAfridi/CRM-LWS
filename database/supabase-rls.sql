-- ============================================================================
-- RLS POLICY FIXES FOR EMAIL_CAMPAIGNS
-- ============================================================================
-- This file contains RLS policy fixes for the email_campaigns table
-- Run this in Supabase SQL Editor if you encounter RLS policy errors
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view email campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can insert email campaigns" ON public.email_campaigns;
DROP POLICY IF EXISTS "Users can update email campaigns" ON public.email_campaigns;

-- Recreate policies with proper authentication check
-- Using auth.uid() IS NOT NULL instead of auth.role() = 'authenticated'
-- This is more reliable for checking authenticated users

CREATE POLICY "Users can view email campaigns"
  ON public.email_campaigns FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert email campaigns"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update email campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Optional: Add delete policy if needed
CREATE POLICY "Users can delete email campaigns"
  ON public.email_campaigns FOR DELETE
  USING (auth.uid() IS NOT NULL);
