import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDomainWarmup,
  getAllDomainWarmup,
  updateDomainWarmup,
  getEmailCampaigns,
  getCampaignById,
  createEmailCampaign,
  updateEmailCampaign,
  getCampaignMessages,
  getLeadMessages,
  createEmailMessage,
  updateEmailMessage,
  getOutreachMetrics,
  getSequenceTimeline,
  getCalendarBookings,
  createCalendarBooking,
  updateCalendarBooking,
  getEmailSequences,
  getEmailSequenceById,
  createEmailSequence,
  updateEmailSequence,
  getRespondedLeads,
  getLeadConversation,
  type CampaignFilters,
  type MetricsFilters,
  type BookingFilters,
  type DomainWarmupFilters,
} from '@/lib/supabase/queries/outreach'
import { Database } from '@/lib/supabase/types'

type CampaignStatus = Database['public']['Tables']['email_campaigns']['Row']['status']
type DomainWarmupUpdate = Database['public']['Tables']['domain_warmup']['Update']
type EmailCampaignUpdate = Database['public']['Tables']['email_campaigns']['Update']
type EmailMessageUpdate = Database['public']['Tables']['email_messages']['Update']
type CalendarBookingUpdate = Database['public']['Tables']['calendar_bookings']['Update']
type EmailSequenceInsert = Database['public']['Tables']['email_sequences']['Insert']
type EmailSequenceUpdate = Database['public']['Tables']['email_sequences']['Update']

// ============================================================================
// DOMAIN WARMUP HOOKS
// ============================================================================

export function useDomainWarmup(domain?: string) {
  return useQuery({
    queryKey: ['domain-warmup', domain],
    queryFn: () => getDomainWarmup(domain),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  })
}

export function useAllDomainWarmup(filters?: DomainWarmupFilters) {
  return useQuery({
    queryKey: ['domain-warmup-all', filters],
    queryFn: () => getAllDomainWarmup(filters),
    refetchInterval: 5 * 60 * 1000,
  })
}

export function useUpdateDomainWarmup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ domain, updates }: { domain: string; updates: DomainWarmupUpdate }) =>
      updateDomainWarmup(domain, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domain-warmup', variables.domain] })
      queryClient.invalidateQueries({ queryKey: ['domain-warmup-all'] })
    },
  })
}

// ============================================================================
// EMAIL CAMPAIGNS HOOKS
// ============================================================================

export function useEmailCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: ['email-campaigns', filters],
    queryFn: () => getEmailCampaigns(filters),
    staleTime: 30000,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => getCampaignById(id),
    enabled: !!id,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { lead_id: string; sequence_id: string }) =>
      createEmailCampaign({
        lead_id: data.lead_id,
        sequence_id: data.sequence_id,
        status: 'pending',
        current_step: 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmailCampaignUpdate }) =>
      updateEmailCampaign(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', variables.id] })
    },
  })
}

// ============================================================================
// EMAIL MESSAGES HOOKS
// ============================================================================

export function useCampaignMessages(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-messages', campaignId],
    queryFn: () => getCampaignMessages(campaignId),
    enabled: !!campaignId,
  })
}

export function useLeadMessages(leadId: string) {
  return useQuery({
    queryKey: ['lead-messages', leadId],
    queryFn: () => getLeadMessages(leadId),
    enabled: !!leadId,
  })
}

export function useRespondedLeads() {
  return useQuery({
    queryKey: ['responded-leads'],
    queryFn: () => getRespondedLeads(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute to catch new responses
  })
}

export function useLeadConversation(leadId: string) {
  return useQuery({
    queryKey: ['lead-conversation', leadId],
    queryFn: () => getLeadConversation(leadId),
    enabled: !!leadId,
  })
}

export function useCreateEmailMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (message: Parameters<typeof createEmailMessage>[0]) =>
      createEmailMessage(message),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-messages', data.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['lead-messages', data.lead_id] })
    },
  })
}

export function useUpdateEmailMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmailMessageUpdate }) =>
      updateEmailMessage(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-messages', data.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['lead-messages', data.lead_id] })
    },
  })
}

// ============================================================================
// OUTREACH METRICS HOOKS
// ============================================================================

export function useOutreachMetrics(filters?: MetricsFilters) {
  return useQuery({
    queryKey: ['outreach-metrics', filters],
    queryFn: () => getOutreachMetrics(filters),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  })
}

// ============================================================================
// SEQUENCE TIMELINE HOOKS
// ============================================================================

export function useSequenceTimeline(campaignId: string) {
  return useQuery({
    queryKey: ['sequence-timeline', campaignId],
    queryFn: () => getSequenceTimeline(campaignId),
    enabled: !!campaignId,
  })
}

// ============================================================================
// CALENDAR BOOKINGS HOOKS
// ============================================================================

export function useCalendarBookings(filters?: BookingFilters) {
  return useQuery({
    queryKey: ['calendar-bookings', filters],
    queryFn: () => getCalendarBookings(filters),
    staleTime: 30000,
  })
}

export function useCreateCalendarBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (booking: Parameters<typeof createCalendarBooking>[0]) =>
      createCalendarBooking(booking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] })
    },
  })
}

export function useUpdateCalendarBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CalendarBookingUpdate }) =>
      updateCalendarBooking(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-bookings'] })
    },
  })
}

// ============================================================================
// EMAIL SEQUENCES HOOKS
// ============================================================================

export function useEmailSequences(activeOnly = false) {
  return useQuery({
    queryKey: ['email-sequences', activeOnly],
    queryFn: () => getEmailSequences(activeOnly),
  })
}

export function useEmailSequence(id: string) {
  return useQuery({
    queryKey: ['email-sequence', id],
    queryFn: () => getEmailSequenceById(id),
    enabled: !!id,
  })
}

export function useCreateEmailSequence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sequence: EmailSequenceInsert) => createEmailSequence(sequence),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
    },
  })
}

export function useUpdateEmailSequence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: EmailSequenceUpdate }) =>
      updateEmailSequence(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      queryClient.invalidateQueries({ queryKey: ['email-sequence', variables.id] })
    },
  })
}

// ============================================================================
// N8N WEBHOOK ACTION HOOKS
// ============================================================================

export function useStartSequence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      lead_id, 
      sequence_id, 
      sequence_template_id 
    }: { 
      lead_id: string
      sequence_id: string
      sequence_template_id?: string | null
    }) => {
      const response = await fetch('/api/outreach/start-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lead_id, 
          sequence_id,
          sequence_template_id,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start sequence')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function usePauseSequence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaign_id }: { campaign_id: string }) => {
      const response = await fetch('/api/outreach/pause-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to pause sequence')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
  })
}

export function useResumeSequence() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ campaign_id }: { campaign_id: string }) => {
      const response = await fetch('/api/outreach/resume-sequence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign_id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to resume sequence')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] })
    },
  })
}

export function useSendManualEmail() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lead_id, subject, content }: { lead_id: string; subject: string; content: string }) => {
      const response = await fetch('/api/outreach/send-manual-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id, subject, content }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send email')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-messages'] })
    },
  })
}

export function usePersonalizeEmail() {
  return useMutation({
    mutationFn: async ({ lead_id, template_id }: { lead_id: string; template_id: string }) => {
      const response = await fetch('/api/outreach/personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id, template_id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to personalize email')
      }

      return response.json()
    },
  })
}

// ============================================================================
// SEQUENCE BUILDER HOOKS
// ============================================================================

export function useSequenceBuilder() {
  const queryClient = useQueryClient()

  return {
    create: useMutation({
      mutationFn: async (sequence: { name: string; description?: string; steps: any[]; is_active?: boolean }) => {
        const response = await fetch('/api/outreach/sequences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sequence),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create sequence')
        }

        return response.json()
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      },
    }),
    update: useMutation({
      mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
        const response = await fetch(`/api/outreach/sequences/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to update sequence')
        }

        return response.json()
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
        queryClient.invalidateQueries({ queryKey: ['email-sequence', variables.id] })
      },
    }),
    delete: useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/outreach/sequences/${id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete sequence')
        }

        return response.json()
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['email-sequences'] })
      },
    }),
    test: useMutation({
      mutationFn: async ({ id, lead_id, step_index }: { id: string; lead_id: string; step_index?: number }) => {
        const response = await fetch(`/api/outreach/sequences/${id}/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id, step_index }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to test sequence')
        }

        return response.json()
      },
    }),
  }
}

// ============================================================================
// PERSONALIZATION CONFIG HOOKS
// ============================================================================

export function usePersonalizationConfig(sequenceId: string, stepIndex?: number) {
  return useQuery({
    queryKey: ['personalization-config', sequenceId, stepIndex],
    queryFn: async () => {
      const params = new URLSearchParams({ sequence_id: sequenceId })
      if (stepIndex !== undefined) {
        params.append('step_index', stepIndex.toString())
      }

      const response = await fetch(`/api/outreach/personalization-config?${params}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch personalization config')
      }

      const data = await response.json()
      return data.config
    },
    enabled: !!sequenceId,
  })
}

export function useSavePersonalizationConfig() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (config: {
      sequence_id: string
      step_index: number
      prompt_template?: string
      strategy?: string
      variables?: any
      enabled?: boolean
    }) => {
      const response = await fetch('/api/outreach/personalization-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save personalization config')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['personalization-config', variables.sequence_id] })
    },
  })
}

// ============================================================================
// DOMAIN SETTINGS HOOKS
// ============================================================================

export function useDomainSettings(domain?: string) {
  return useQuery({
    queryKey: ['domain-settings', domain],
    queryFn: async () => {
      if (!domain) return null

      const response = await fetch(`/api/outreach/domain-settings?domain=${domain}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch domain settings')
      }

      const data = await response.json()
      return data.config
    },
    enabled: !!domain,
  })
}

export function useSaveDomainSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: {
      domain: string
      warmup_schedule?: any
      reputation_target?: number
      daily_volume_limits?: any
    }) => {
      const response = await fetch('/api/outreach/domain-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save domain settings')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domain-settings', variables.domain] })
    },
  })
}

export function useWarmupOverride() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ domain, action, reason }: { domain: string; action: 'pause' | 'resume'; reason?: string }) => {
      const response = await fetch('/api/outreach/domain-settings/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, action, reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to override warmup')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['domain-settings', variables.domain] })
      queryClient.invalidateQueries({ queryKey: ['domain-warmup', variables.domain] })
    },
  })
}

export function useDNSCheck() {
  return useMutation({
    mutationFn: async (domain: string) => {
      const response = await fetch(`/api/outreach/domain-settings/dns-check?domain=${domain}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to check DNS')
      }

      return response.json()
    },
  })
}

export function useDeliverabilitySafeguards(domain?: string) {
  return useQuery({
    queryKey: ['deliverability-safeguards', domain],
    queryFn: async () => {
      if (!domain) return null

      const response = await fetch(`/api/outreach/domain-settings/safeguards?domain=${domain}`)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch deliverability safeguards')
      }

      const data = await response.json()
      return data.thresholds
    },
    enabled: !!domain,
  })
}

export function useSaveDeliverabilitySafeguards() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (safeguards: {
      domain: string
      bounce_rate_warning?: number
      bounce_rate_critical?: number
      spam_complaint_warning?: number
      spam_complaint_critical?: number
      min_reputation_score?: number
      auto_pause_enabled?: boolean
      alert_emails?: string[]
      alert_in_app?: boolean
    }) => {
      const response = await fetch('/api/outreach/domain-settings/safeguards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeguards),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save deliverability safeguards')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deliverability-safeguards', variables.domain] })
    },
  })
}

// ============================================================================
// CALENDAR INTEGRATION HOOKS
// ============================================================================

export function useCalendarStatus() {
  return useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      const response = await fetch('/api/outreach/calendar/status')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch calendar status')
      }

      const data = await response.json()
      return data.status
    },
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useConnectCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (provider: 'calendly' | 'google' | 'outlook') => {
      const response = await fetch('/api/outreach/calendar/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to connect calendar')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-status'] })
    },
  })
}

export function useDisconnectCalendar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (provider: 'calendly' | 'google' | 'outlook') => {
      const response = await fetch(`/api/outreach/calendar/disconnect?provider=${provider}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to disconnect calendar')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-status'] })
    },
  })
}

// ============================================================================
// EMAIL ROUTING RULES HOOKS
// ============================================================================

export function useEmailRoutingRules() {
  return useQuery({
    queryKey: ['email-routing-rules'],
    queryFn: async () => {
      const response = await fetch('/api/outreach/email-routing')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch email routing rules')
      }

      const data = await response.json()
      return data.rules
    },
  })
}

export function useSaveEmailRoutingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rule: {
      id?: string
      trigger_event: string
      conditions?: any
      action_type: string
      recipient_email: string
      template_id?: string
      priority?: number
      is_active?: boolean
    }) => {
      const url = rule.id
        ? '/api/outreach/email-routing'
        : '/api/outreach/email-routing'
      const method = rule.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save email routing rule')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-routing-rules'] })
    },
  })
}

export function useDeleteEmailRoutingRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/outreach/email-routing?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete email routing rule')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-routing-rules'] })
    },
  })
}

export function useTestEmailRoutingRule() {
  return useMutation({
    mutationFn: async ({ rule_id, test_event }: { rule_id: string; test_event: any }) => {
      const response = await fetch('/api/outreach/email-routing/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule_id, test_event }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to test email routing rule')
      }

      return response.json()
    },
  })
}

// ============================================================================
// BOOKING TEMPLATES HOOKS
// ============================================================================

export function useBookingTemplates(provider?: string) {
  return useQuery({
    queryKey: ['booking-templates', provider],
    queryFn: async () => {
      const url = provider
        ? `/api/outreach/booking-templates?provider=${provider}`
        : '/api/outreach/booking-templates'

      const response = await fetch(url)
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch booking templates')
      }

      const data = await response.json()
      return data.templates
    },
  })
}

export function useSaveBookingTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (template: {
      id?: string
      name: string
      provider: string
      template_url: string
      variables?: any
      is_default?: boolean
    }) => {
      const method = template.id ? 'PUT' : 'POST'

      const response = await fetch('/api/outreach/booking-templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save booking template')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] })
      queryClient.invalidateQueries({ queryKey: ['booking-templates', variables.provider] })
    },
  })
}

export function useDeleteBookingTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/outreach/booking-templates?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete booking template')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-templates'] })
    },
  })
}

// ============================================================================
// PERSONALIZE PREVIEW HOOK
// ============================================================================

export function usePersonalizePreview() {
  return useMutation({
    mutationFn: async ({
      lead_id,
      sequence_id,
      step_index,
    }: {
      lead_id: string
      sequence_id: string
      step_index: number
    }) => {
      const response = await fetch('/api/outreach/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id,
          sequence_id,
          step_index,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate preview')
      }

      return response.json()
    },
  })
}

