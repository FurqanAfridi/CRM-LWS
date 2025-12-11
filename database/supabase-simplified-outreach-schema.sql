-- ============================================================================
-- SIMPLIFIED OUTREACH SCHEMA
-- ============================================================================
-- This schema adds simplified outreach tracking views and tables
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. LEAD OUTREACH STATUS VIEW
-- ============================================================================
-- This view makes it easy to see lead outreach status at a glance
CREATE OR REPLACE VIEW public.lead_outreach_status AS
SELECT 
  l.id as lead_id,
  l.name as lead_name,
  l.email as lead_email,
  l.company_name,
  l.outreach_status,
  ec.id as campaign_id,
  ec.status as campaign_status,
  ec.current_step,
  ec.started_at,
  ec.completed_at,
  (SELECT COUNT(*) FROM public.email_messages em WHERE em.lead_id = l.id) as total_emails_sent,
  (SELECT MAX(sent_at) FROM public.email_messages em WHERE em.lead_id = l.id) as last_email_sent_at,
  (SELECT MAX(replied_at) FROM public.email_messages em WHERE em.lead_id = l.id AND em.status = 'replied') as last_replied_at,
  (SELECT COUNT(*) FROM public.email_messages em WHERE em.lead_id = l.id AND em.status = 'replied') as reply_count,
  cb.id as booking_id,
  cb.booking_status,
  cb.scheduled_time
FROM public.leads l
LEFT JOIN public.email_campaigns ec ON l.id = ec.lead_id AND ec.status IN ('active', 'pending')
LEFT JOIN public.calendar_bookings cb ON l.id = cb.lead_id AND cb.booking_status IN ('link_sent', 'confirmed')
WHERE l.email IS NOT NULL;

-- ============================================================================
-- 2. FOLLOW-UP QUEUE TABLE
-- ============================================================================
-- Track scheduled follow-up emails
CREATE TABLE IF NOT EXISTS public.followup_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  scheduled_for timestamp with time zone NOT NULL,
  followup_number integer DEFAULT 1, -- 1st follow-up, 2nd follow-up, etc.
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'skipped')),
  email_template text, -- Optional: template to use for this follow-up
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indexes for followup_queue
CREATE INDEX IF NOT EXISTS followup_queue_lead_id_idx ON public.followup_queue(lead_id);
CREATE INDEX IF NOT EXISTS followup_queue_campaign_id_idx ON public.followup_queue(campaign_id);
CREATE INDEX IF NOT EXISTS followup_queue_scheduled_for_idx ON public.followup_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS followup_queue_status_idx ON public.followup_queue(status);
CREATE INDEX IF NOT EXISTS followup_queue_status_scheduled_idx ON public.followup_queue(status, scheduled_for);

-- ============================================================================
-- 3. TRIGGER: Update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to followup_queue
DROP TRIGGER IF EXISTS update_followup_queue_updated_at ON public.followup_queue;
CREATE TRIGGER update_followup_queue_updated_at
  BEFORE UPDATE ON public.followup_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 4. FUNCTION: Auto-update lead outreach_status based on campaign
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_lead_outreach_status_campaign()
RETURNS TRIGGER AS $$
BEGIN
  -- If campaign is active, set lead status to in_sequence
  IF NEW.status = 'active' THEN
    UPDATE public.leads
    SET outreach_status = 'in_sequence'
    WHERE id = NEW.lead_id;
  END IF;
  
  -- If campaign is completed, check if there's a reply
  IF NEW.status = 'completed' THEN
    IF EXISTS (
      SELECT 1 FROM public.email_messages 
      WHERE campaign_id = NEW.id AND status = 'replied'
    ) THEN
      UPDATE public.leads
      SET outreach_status = 'responded'
      WHERE id = NEW.lead_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. FUNCTION: Auto-update lead outreach_status based on booking
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_lead_outreach_status_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- If booking is confirmed, set lead status to booked
  IF NEW.booking_status = 'confirmed' THEN
    UPDATE public.leads
    SET outreach_status = 'booked'
    WHERE id = NEW.lead_id;
    
    -- Cancel pending follow-ups for this lead
    UPDATE public.followup_queue
    SET status = 'cancelled'
    WHERE lead_id = NEW.lead_id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. FUNCTION: Auto-update lead outreach_status based on email message
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_lead_outreach_status_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If email is replied, set lead status to responded
  IF NEW.status = 'replied' THEN
    UPDATE public.leads
    SET outreach_status = 'responded'
    WHERE id = NEW.lead_id;
    
    -- Cancel pending follow-ups for this lead
    UPDATE public.followup_queue
    SET status = 'cancelled'
    WHERE lead_id = NEW.lead_id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS trigger_update_lead_outreach_status_campaign ON public.email_campaigns;
CREATE TRIGGER trigger_update_lead_outreach_status_campaign
  AFTER INSERT OR UPDATE OF status ON public.email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_outreach_status_campaign();

DROP TRIGGER IF EXISTS trigger_update_lead_outreach_status_booking ON public.calendar_bookings;
CREATE TRIGGER trigger_update_lead_outreach_status_booking
  AFTER INSERT OR UPDATE OF booking_status ON public.calendar_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_outreach_status_booking();

DROP TRIGGER IF EXISTS trigger_update_lead_outreach_status_message ON public.email_messages;
CREATE TRIGGER trigger_update_lead_outreach_status_message
  AFTER INSERT OR UPDATE OF status ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lead_outreach_status_message();

-- ============================================================================
-- 7. FUNCTION: Get leads needing follow-up
-- ============================================================================
-- Helper function for n8n workflow to find leads that need follow-ups
CREATE OR REPLACE FUNCTION public.get_leads_needing_followup()
RETURNS TABLE (
  lead_id uuid,
  lead_name text,
  lead_email text,
  campaign_id uuid,
  days_since_last_email integer,
  last_email_sent_at timestamp with time zone,
  followup_number integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    l.id as lead_id,
    l.name as lead_name,
    l.email as lead_email,
    ec.id as campaign_id,
    EXTRACT(DAY FROM (now() - COALESCE(MAX(em.sent_at), ec.started_at)))::integer as days_since_last_email,
    MAX(em.sent_at) as last_email_sent_at,
    COALESCE(MAX(fq.followup_number), 0) + 1 as followup_number
  FROM public.leads l
  INNER JOIN public.email_campaigns ec ON l.id = ec.lead_id
  LEFT JOIN public.email_messages em ON l.id = em.lead_id AND em.status IN ('sent', 'delivered', 'opened')
  LEFT JOIN public.followup_queue fq ON l.id = fq.lead_id
  WHERE 
    l.email IS NOT NULL
    AND ec.status = 'active'
    AND l.outreach_status NOT IN ('responded', 'booked', 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM public.email_messages 
      WHERE lead_id = l.id AND status = 'replied'
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.calendar_bookings
      WHERE lead_id = l.id AND booking_status = 'confirmed'
    )
  GROUP BY l.id, l.name, l.email, ec.id, ec.started_at
  HAVING 
    -- 3+ days since last email for 1st follow-up
    (EXTRACT(DAY FROM (now() - COALESCE(MAX(em.sent_at), ec.started_at))) >= 3 
     AND COALESCE(MAX(fq.followup_number), 0) = 0)
    OR
    -- 5+ days since last email for 2nd follow-up
    (EXTRACT(DAY FROM (now() - COALESCE(MAX(em.sent_at), ec.started_at))) >= 5 
     AND COALESCE(MAX(fq.followup_number), 0) = 1)
    OR
    -- 7+ days since last email for 3rd follow-up
    (EXTRACT(DAY FROM (now() - COALESCE(MAX(em.sent_at), ec.started_at))) >= 7 
     AND COALESCE(MAX(fq.followup_number), 0) = 2)
  ORDER BY days_since_last_email DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================
-- Grant access to the view and tables
GRANT SELECT ON public.lead_outreach_status TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.followup_queue TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leads_needing_followup() TO authenticated;

-- ============================================================================
-- NOTES FOR USAGE:
-- ============================================================================
-- 1. The lead_outreach_status view provides a quick overview of all leads
-- 2. The followup_queue table tracks scheduled follow-up emails
-- 3. Triggers automatically update lead.outreach_status when:
--    - Campaign status changes
--    - Booking is confirmed
--    - Email is replied to
-- 4. Use get_leads_needing_followup() function in n8n workflow to:
--    - Find leads needing follow-ups
--    - Send automatic follow-up emails
-- 5. Follow-up schedule:
--    - 3 days after last email: Follow-up #1
--    - 5 days after last email: Follow-up #2
--    - 7 days after last email: Follow-up #3
-- ============================================================================

