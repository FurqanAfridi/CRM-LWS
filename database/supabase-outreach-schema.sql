-- Email Outreach Pipeline Schema
-- This file contains all tables and extensions needed for email warm-up and outreach functionality

-- ============================================================================
-- 1. EMAIL SEQUENCES TABLE
-- ============================================================================
-- Track email sequence templates and configurations
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of sequence step objects
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 2. EMAIL CAMPAIGNS TABLE
-- ============================================================================
-- Track active campaigns and their status
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_id uuid REFERENCES public.email_sequences(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
  current_step integer DEFAULT 0,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3. EMAIL MESSAGES TABLE
-- ============================================================================
-- Track individual email sends and their metrics
CREATE TABLE IF NOT EXISTS public.email_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_step integer NOT NULL,
  subject text,
  content text,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed')),
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  replied_at timestamp with time zone,
  bounce_reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 4. DOMAIN WARMUP TABLE
-- ============================================================================
-- Track domain warm-up progress and health
CREATE TABLE IF NOT EXISTS public.domain_warmup (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  domain text NOT NULL,
  day_number integer NOT NULL DEFAULT 1,
  daily_volume_sent integer DEFAULT 0,
  daily_volume_limit integer DEFAULT 0,
  reputation_score integer DEFAULT 0 CHECK (reputation_score >= 0 AND reputation_score <= 100),
  spf_status text CHECK (spf_status IN ('pass', 'fail', 'neutral', 'none')),
  dkim_status text CHECK (dkim_status IN ('pass', 'fail', 'neutral', 'none')),
  dmarc_status text CHECK (dmarc_status IN ('pass', 'fail', 'neutral', 'none')),
  bounce_rate numeric(5, 2) DEFAULT 0.00,
  spam_complaint_rate numeric(5, 2) DEFAULT 0.00,
  blacklist_status jsonb DEFAULT '[]'::jsonb, -- Array of blacklist check results
  last_updated timestamp with time zone DEFAULT now() NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(domain, day_number)
);

-- ============================================================================
-- 5. CALENDAR BOOKINGS TABLE
-- ============================================================================
-- Track calendar link sends and meeting bookings
CREATE TABLE IF NOT EXISTS public.calendar_bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  calendar_link text,
  booking_status text DEFAULT 'link_sent' CHECK (booking_status IN ('link_sent', 'confirmed', 'cancelled', 'no_show', 'completed')),
  scheduled_time timestamp with time zone,
  calendar_provider text, -- e.g., 'calendly', 'google', 'outlook'
  meeting_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- EXTEND EXISTING TABLES
-- ============================================================================

-- Extend interactions table
ALTER TABLE public.interactions 
ADD COLUMN IF NOT EXISTS email_message_id uuid REFERENCES public.email_messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS sequence_step integer,
ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;

-- Extend leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS outreach_status text DEFAULT 'not_started' CHECK (outreach_status IN ('not_started', 'queued', 'in_sequence', 'responded', 'booked', 'completed')),
ADD COLUMN IF NOT EXISTS current_campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Email sequences indexes
CREATE INDEX IF NOT EXISTS email_sequences_is_active_idx ON public.email_sequences(is_active);
CREATE INDEX IF NOT EXISTS email_sequences_created_at_idx ON public.email_sequences(created_at);

-- Email campaigns indexes
CREATE INDEX IF NOT EXISTS email_campaigns_lead_id_idx ON public.email_campaigns(lead_id);
CREATE INDEX IF NOT EXISTS email_campaigns_sequence_id_idx ON public.email_campaigns(sequence_id);
CREATE INDEX IF NOT EXISTS email_campaigns_status_idx ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS email_campaigns_started_at_idx ON public.email_campaigns(started_at);

-- Email messages indexes
CREATE INDEX IF NOT EXISTS email_messages_campaign_id_idx ON public.email_messages(campaign_id);
CREATE INDEX IF NOT EXISTS email_messages_lead_id_idx ON public.email_messages(lead_id);
CREATE INDEX IF NOT EXISTS email_messages_status_idx ON public.email_messages(status);
CREATE INDEX IF NOT EXISTS email_messages_sent_at_idx ON public.email_messages(sent_at);
CREATE INDEX IF NOT EXISTS email_messages_sequence_step_idx ON public.email_messages(sequence_step);

-- Domain warmup indexes
CREATE INDEX IF NOT EXISTS domain_warmup_domain_idx ON public.domain_warmup(domain);
CREATE INDEX IF NOT EXISTS domain_warmup_day_number_idx ON public.domain_warmup(day_number);
CREATE INDEX IF NOT EXISTS domain_warmup_last_updated_idx ON public.domain_warmup(last_updated);

-- Calendar bookings indexes
CREATE INDEX IF NOT EXISTS calendar_bookings_lead_id_idx ON public.calendar_bookings(lead_id);
CREATE INDEX IF NOT EXISTS calendar_bookings_campaign_id_idx ON public.calendar_bookings(campaign_id);
CREATE INDEX IF NOT EXISTS calendar_bookings_booking_status_idx ON public.calendar_bookings(booking_status);
CREATE INDEX IF NOT EXISTS calendar_bookings_scheduled_time_idx ON public.calendar_bookings(scheduled_time);

-- Interactions extended columns indexes
CREATE INDEX IF NOT EXISTS interactions_email_message_id_idx ON public.interactions(email_message_id);
CREATE INDEX IF NOT EXISTS interactions_campaign_id_idx ON public.interactions(campaign_id);

-- Leads extended columns indexes
CREATE INDEX IF NOT EXISTS leads_outreach_status_idx ON public.leads(outreach_status);
CREATE INDEX IF NOT EXISTS leads_current_campaign_id_idx ON public.leads(current_campaign_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp (reuse if exists, otherwise create)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_sequences_updated_at ON public.email_sequences;
CREATE TRIGGER update_email_sequences_updated_at
  BEFORE UPDATE ON public.email_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON public.email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_email_messages_updated_at ON public.email_messages;
CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_calendar_bookings_updated_at ON public.calendar_bookings;
CREATE TRIGGER update_calendar_bookings_updated_at
  BEFORE UPDATE ON public.calendar_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_warmup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users to read/write (can be refined later)
-- Email sequences
CREATE POLICY "Users can view email sequences"
  ON public.email_sequences FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email sequences"
  ON public.email_sequences FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update email sequences"
  ON public.email_sequences FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Email campaigns
CREATE POLICY "Users can view email campaigns"
  ON public.email_campaigns FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email campaigns"
  ON public.email_campaigns FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update email campaigns"
  ON public.email_campaigns FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Email messages
CREATE POLICY "Users can view email messages"
  ON public.email_messages FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert email messages"
  ON public.email_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update email messages"
  ON public.email_messages FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Domain warmup
CREATE POLICY "Users can view domain warmup"
  ON public.domain_warmup FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert domain warmup"
  ON public.domain_warmup FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update domain warmup"
  ON public.domain_warmup FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Calendar bookings
CREATE POLICY "Users can view calendar bookings"
  ON public.calendar_bookings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert calendar bookings"
  ON public.calendar_bookings FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update calendar bookings"
  ON public.calendar_bookings FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.email_sequences IS 'Email sequence templates for outreach campaigns';
COMMENT ON TABLE public.email_campaigns IS 'Active email outreach campaigns linked to leads';
COMMENT ON TABLE public.email_messages IS 'Individual email messages sent as part of campaigns with tracking metrics';
COMMENT ON TABLE public.domain_warmup IS 'Domain warm-up progress and deliverability health metrics';
COMMENT ON TABLE public.calendar_bookings IS 'Calendar booking links and meeting confirmations from outreach campaigns';

