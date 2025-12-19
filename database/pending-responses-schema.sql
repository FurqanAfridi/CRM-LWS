-- ============================================================================
-- PENDING AI RESPONSES TABLE
-- ============================================================================
-- Stores AI-generated responses that are pending user approval before sending
CREATE TABLE IF NOT EXISTS public.pending_responses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  email_message_id uuid REFERENCES public.email_messages(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.email_campaigns(id) ON DELETE SET NULL,
  subject text NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'sent')) NOT NULL,
  user_changes text, -- User modifications to the AI-generated response
  generated_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS pending_responses_lead_id_idx ON public.pending_responses(lead_id);
CREATE INDEX IF NOT EXISTS pending_responses_status_idx ON public.pending_responses(status);
CREATE INDEX IF NOT EXISTS pending_responses_email_message_id_idx ON public.pending_responses(email_message_id);
CREATE INDEX IF NOT EXISTS pending_responses_campaign_id_idx ON public.pending_responses(campaign_id);
CREATE INDEX IF NOT EXISTS pending_responses_generated_at_idx ON public.pending_responses(generated_at);
CREATE INDEX IF NOT EXISTS pending_responses_lead_status_idx ON public.pending_responses(lead_id, status);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

DROP TRIGGER IF EXISTS update_pending_responses_updated_at ON public.pending_responses;
CREATE TRIGGER update_pending_responses_updated_at
  BEFORE UPDATE ON public.pending_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.pending_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view/update their own pending responses
CREATE POLICY "Users can view pending responses"
  ON public.pending_responses FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert pending responses"
  ON public.pending_responses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update pending responses"
  ON public.pending_responses FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete pending responses"
  ON public.pending_responses FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.pending_responses IS 'AI-generated email responses pending user approval before sending';
COMMENT ON COLUMN public.pending_responses.lead_id IS 'Lead this response is for';
COMMENT ON COLUMN public.pending_responses.email_message_id IS 'The email message that triggered this response';
COMMENT ON COLUMN public.pending_responses.subject IS 'AI-generated email subject';
COMMENT ON COLUMN public.pending_responses.content IS 'AI-generated email content';
COMMENT ON COLUMN public.pending_responses.status IS 'Status: pending (awaiting review), approved (ready to send), rejected (discarded), sent (already sent)';
COMMENT ON COLUMN public.pending_responses.user_changes IS 'User modifications to the AI-generated response';
COMMENT ON COLUMN public.pending_responses.generated_at IS 'When the AI generated this response';
COMMENT ON COLUMN public.pending_responses.reviewed_at IS 'When the user reviewed/approved/rejected this response';
COMMENT ON COLUMN public.pending_responses.sent_at IS 'When the response was actually sent';

