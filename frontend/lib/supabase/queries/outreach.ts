import { supabase } from '../client'
import { Database } from '../types'

type EmailSequence = Database['public']['Tables']['email_sequences']['Row']
type EmailSequenceInsert = Database['public']['Tables']['email_sequences']['Insert']
type EmailSequenceUpdate = Database['public']['Tables']['email_sequences']['Update']

type EmailCampaign = Database['public']['Tables']['email_campaigns']['Row']
type EmailCampaignInsert = Database['public']['Tables']['email_campaigns']['Insert']
type EmailCampaignUpdate = Database['public']['Tables']['email_campaigns']['Update']

type EmailMessage = Database['public']['Tables']['email_messages']['Row']
type EmailMessageInsert = Database['public']['Tables']['email_messages']['Insert']
type EmailMessageUpdate = Database['public']['Tables']['email_messages']['Update']

type DomainWarmup = Database['public']['Tables']['domain_warmup']['Row']
type DomainWarmupInsert = Database['public']['Tables']['domain_warmup']['Insert']
type DomainWarmupUpdate = Database['public']['Tables']['domain_warmup']['Update']

type CalendarBooking = Database['public']['Tables']['calendar_bookings']['Row']
type CalendarBookingInsert = Database['public']['Tables']['calendar_bookings']['Insert']
type CalendarBookingUpdate = Database['public']['Tables']['calendar_bookings']['Update']

// ============================================================================
// DOMAIN WARMUP QUERIES
// ============================================================================

export interface DomainWarmupFilters {
  domain?: string
}

export async function getDomainWarmup(domain?: string): Promise<DomainWarmup | null> {
  let query = supabase
    .from('domain_warmup')
    .select('*')
    .order('day_number', { ascending: false })
    .limit(1)

  if (domain) {
    query = query.eq('domain', domain)
  }

  const { data, error } = await query

  if (error) throw error
  return (data && data.length > 0 ? data[0] : null) as DomainWarmup | null
}

export async function getAllDomainWarmup(filters?: DomainWarmupFilters) {
  let query = supabase
    .from('domain_warmup')
    .select('*')
    .order('last_updated', { ascending: false })

  if (filters?.domain) {
    query = query.eq('domain', filters.domain)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as DomainWarmup[]
}

export async function updateDomainWarmup(domain: string, updates: DomainWarmupUpdate) {
  // First try to find existing record for today
  const existing = await getDomainWarmup(domain)
  
  if (existing) {
    const { data, error } = await (supabase
      .from('domain_warmup') as any)
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data as DomainWarmup
  } else {
    // Create new record
    const insertData: DomainWarmupInsert = {
      domain,
      ...updates,
    }
    const { data, error } = await (supabase
      .from('domain_warmup') as any)
      .insert(insertData)
      .select()
      .single()

    if (error) throw error
    return data as DomainWarmup
  }
}

// ============================================================================
// EMAIL CAMPAIGNS QUERIES
// ============================================================================

export interface CampaignFilters {
  status?: Database['public']['Tables']['email_campaigns']['Row']['status']
  lead_id?: string
  sequence_id?: string
  date_from?: string
  date_to?: string
}

export async function getEmailCampaigns(filters?: CampaignFilters) {
  let query = supabase
    .from('email_campaigns')
    .select(`
      *,
      leads (*),
      email_sequences (*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id)
  }
  if (filters?.sequence_id) {
    query = query.eq('sequence_id', filters.sequence_id)
  }
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as EmailCampaign[]
}

export async function getCampaignById(id: string) {
  const { data, error } = await supabase
    .from('email_campaigns')
    .select(`
      *,
      leads (*),
      email_sequences (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EmailCampaign
}

export async function createEmailCampaign(campaign: EmailCampaignInsert) {
  const { data, error } = await (supabase
    .from('email_campaigns') as any)
    .insert(campaign)
    .select()
    .single()

  if (error) throw error
  return data as EmailCampaign
}

export async function updateEmailCampaign(id: string, updates: EmailCampaignUpdate) {
  const { data, error } = await (supabase
    .from('email_campaigns') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as EmailCampaign
}

// ============================================================================
// EMAIL MESSAGES QUERIES
// ============================================================================

export async function getCampaignMessages(campaignId: string) {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('sequence_step', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as EmailMessage[]
}

export async function getLeadMessages(leadId: string) {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as EmailMessage[]
}

export async function createEmailMessage(message: EmailMessageInsert) {
  const { data, error } = await (supabase
    .from('email_messages') as any)
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data as EmailMessage
}

export async function updateEmailMessage(id: string, updates: EmailMessageUpdate) {
  const { data, error } = await (supabase
    .from('email_messages') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as EmailMessage
}

// Get all leads that have replied to emails
export async function getRespondedLeads() {
  // First get all unique lead_ids from email_messages with status 'replied'
  const { data: repliedMessages, error: repliedError } = await supabase
    .from('email_messages')
    .select('lead_id, campaign_id, replied_at')
    .eq('status', 'replied')
    .not('replied_at', 'is', null)
    .order('replied_at', { ascending: false })

  if (repliedError) throw repliedError

  // Get unique lead IDs
  const leadIds = (repliedMessages || [])
    .map((m: { lead_id: string | null }) => m.lead_id)
    .filter((id): id is string => Boolean(id))
  const uniqueLeadIds = Array.from(new Set(leadIds))

  if (uniqueLeadIds.length === 0) return []

  // Get all campaigns for these leads
  const { data: campaignsData, error: campaignsError } = await supabase
    .from('email_campaigns')
    .select(`
      *,
      email_sequences (
        id,
        name
      )
    `)
    .in('lead_id', uniqueLeadIds)

  if (campaignsError) throw campaignsError

  // Type the campaigns with the sequence relation
  // Supabase returns relations as objects (not arrays) when selecting nested data
  type CampaignWithSequence = EmailCampaign & {
    email_sequences: { id: string; name: string } | null | { id: string; name: string }[]
  }
  const campaigns = (campaignsData || []) as CampaignWithSequence[]

  // Get leads
  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .select('id, name, email, company_name, outreach_status')
    .in('id', uniqueLeadIds)

  if (leadsError) throw leadsError

  // Type the leads
  type LeadBasic = {
    id: string
    name: string | null
    email: string | null
    company_name: string | null
    outreach_status: string | null
  }
  const leads = (leadsData || []) as LeadBasic[]

  // For each lead, combine the data
  const leadsWithStats = await Promise.all(
    leads.map(async (lead) => {
      // Find active campaign for this lead
      const campaign: CampaignWithSequence | null = campaigns.find((c) => 
        c.lead_id === lead.id && 
        (c.status === 'active' || c.status === 'paused' || c.status === 'pending')
      ) || campaigns.find((c) => c.lead_id === lead.id) || null

      // Get all messages for this lead
      const { data: messagesData, error: messagesError } = await supabase
        .from('email_messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: false })

      if (messagesError) throw messagesError

      const messages = (messagesData || []) as EmailMessage[]
      const totalEmailsSent = messages.length || 0
      const replyCount = messages.filter((m: EmailMessage) => m.status === 'replied').length || 0
      const repliedMessagesList = messages.filter((m: EmailMessage) => m.status === 'replied') || []
      const lastRepliedAt = repliedMessagesList.length > 0 
        ? repliedMessagesList[0]?.replied_at || null
        : null
      const lastEmailSentAt = messages?.[0]?.sent_at || null

      return {
        lead_id: lead.id,
        lead_name: lead.name || lead.email || 'Unknown',
        lead_email: lead.email || '',
        company_name: lead.company_name,
        campaign_id: campaign?.id || null,
        sequence_id: campaign?.sequence_id || null,
        sequence_name: campaign?.email_sequences && !Array.isArray(campaign.email_sequences)
          ? (campaign.email_sequences as { name: string }).name
          : Array.isArray(campaign?.email_sequences) && campaign.email_sequences.length > 0
          ? campaign.email_sequences[0].name
          : null,
        campaign_status: campaign?.status || 'unknown',
        current_step: campaign?.current_step || 0,
        total_emails_sent: totalEmailsSent,
        reply_count: replyCount,
        last_replied_at: lastRepliedAt,
        last_email_sent_at: lastEmailSentAt,
        started_at: campaign?.started_at || null,
        replied_messages: repliedMessagesList.map((m: any) => ({
          id: m.id,
          subject: m.subject,
          content: m.content,
          sequence_step: m.sequence_step,
          sent_at: m.sent_at,
          replied_at: m.replied_at,
        })),
      }
    })
  )

  // Sort by last_replied_at (most recent first)
  return leadsWithStats.sort((a, b) => {
    if (!a.last_replied_at && !b.last_replied_at) return 0
    if (!a.last_replied_at) return 1
    if (!b.last_replied_at) return -1
    return new Date(b.last_replied_at).getTime() - new Date(a.last_replied_at).getTime()
  })
}

// Get full conversation thread for a lead
export async function getLeadConversation(leadId: string) {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('lead_id', leadId)
    .order('sequence_step', { ascending: true })
    .order('sent_at', { ascending: true })

  if (error) throw error
  return (data || []) as EmailMessage[]
}

// ============================================================================
// FOLLOWUP QUEUE QUERIES
// ============================================================================

export interface FollowupQueueItem {
  id: string
  lead_id: string
  campaign_id: string | null
  scheduled_for: string
  followup_number: number
  status: 'pending' | 'sent' | 'cancelled' | 'skipped'
  email_template: string | null
  created_at: string
  updated_at: string
  responded: boolean
  lead?: {
    id: string
    name: string | null
    email: string | null
    company_name: string | null
  }
  campaign?: {
    id: string
    sequence_id: string | null
    status: string
  } | null
  sequence?: {
    id: string
    name: string
  } | null
}

export async function getFollowupQueue(filters?: { status?: string }) {
  let query = supabase
    .from('followup_queue')
    .select(`
      *,
      leads:lead_id (
        id,
        name,
        email,
        company_name
      ),
      email_campaigns:campaign_id (
        id,
        sequence_id,
        status,
        email_sequences:sequence_id (
          id,
          name
        )
      )
    `)
    .order('scheduled_for', { ascending: true })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query

  if (error) throw error

  // Transform the data to a cleaner structure
  const transformed = (data || []).map((item: any) => {
    const lead = Array.isArray(item.leads) ? item.leads[0] : item.leads
    const campaign = Array.isArray(item.email_campaigns) ? item.email_campaigns[0] : item.email_campaigns
    const sequence = campaign?.email_sequences 
      ? (Array.isArray(campaign.email_sequences) ? campaign.email_sequences[0] : campaign.email_sequences)
      : null

    return {
      id: item.id,
      lead_id: item.lead_id,
      campaign_id: item.campaign_id,
      scheduled_for: item.scheduled_for,
      followup_number: item.followup_number,
      status: item.status,
      email_template: item.email_template,
      created_at: item.created_at,
      updated_at: item.updated_at,
      responded: item.responded || false,
      lead: lead ? {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        company_name: lead.company_name,
      } : undefined,
      campaign: campaign ? {
        id: campaign.id,
        sequence_id: campaign.sequence_id,
        status: campaign.status,
      } : null,
      sequence: sequence ? {
        id: sequence.id,
        name: sequence.name,
      } : null,
    }
  })

  return transformed as FollowupQueueItem[]
}

// ============================================================================
// OUTREACH METRICS QUERIES
// ============================================================================

export interface OutreachMetrics {
  open_rate: number
  reply_rate: number
  bounce_rate: number
  deliverability_score: number
  total_sent: number
  total_delivered: number
  total_opened: number
  total_replied: number
  total_bounced: number
}

export interface MetricsFilters {
  date_from?: string
  date_to?: string
  campaign_id?: string
}

export async function getOutreachMetrics(filters?: MetricsFilters): Promise<OutreachMetrics> {
  let query = supabase
    .from('email_messages')
    .select('status, sent_at')

  if (filters?.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id)
  }
  if (filters?.date_from) {
    query = query.gte('sent_at', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('sent_at', filters.date_to)
  }

  const { data, error } = await query

  if (error) throw error

  const messages = (data || []) as EmailMessage[]
  const total_sent = messages.filter(m => m.status !== 'queued' && m.status !== 'failed').length
  const total_delivered = messages.filter(m => 
    ['delivered', 'opened', 'replied'].includes(m.status)
  ).length
  const total_opened = messages.filter(m => m.status === 'opened' || m.status === 'replied').length
  const total_replied = messages.filter(m => m.status === 'replied').length
  const total_bounced = messages.filter(m => m.status === 'bounced').length

  const open_rate = total_sent > 0 ? (total_opened / total_sent) * 100 : 0
  const reply_rate = total_sent > 0 ? (total_replied / total_sent) * 100 : 0
  const bounce_rate = total_sent > 0 ? (total_bounced / total_sent) * 100 : 0
  const deliverability_score = total_sent > 0 ? (total_delivered / total_sent) * 100 : 0

  return {
    open_rate: Math.round(open_rate * 100) / 100,
    reply_rate: Math.round(reply_rate * 100) / 100,
    bounce_rate: Math.round(bounce_rate * 100) / 100,
    deliverability_score: Math.round(deliverability_score * 100) / 100,
    total_sent,
    total_delivered,
    total_opened,
    total_replied,
    total_bounced,
  }
}

// ============================================================================
// SEQUENCE TIMELINE QUERIES
// ============================================================================

export interface TimelineStep {
  sequence_step: number
  scheduled_date: string | null
  sent_date: string | null
  status: EmailMessage['status']
  subject: string | null
  message_id: string | null
}

export async function getSequenceTimeline(campaignId: string): Promise<TimelineStep[]> {
  const messages = await getCampaignMessages(campaignId)
  
  return messages.map(msg => ({
    sequence_step: msg.sequence_step,
    scheduled_date: msg.created_at,
    sent_date: msg.sent_at,
    status: msg.status,
    subject: msg.subject,
    message_id: msg.id,
  }))
}

// ============================================================================
// CALENDAR BOOKINGS QUERIES
// ============================================================================

export interface BookingFilters {
  lead_id?: string
  campaign_id?: string
  booking_status?: Database['public']['Tables']['calendar_bookings']['Row']['booking_status']
  date_from?: string
  date_to?: string
}

export async function getCalendarBookings(filters?: BookingFilters) {
  let query = supabase
    .from('calendar_bookings')
    .select(`
      *,
      leads (*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id)
  }
  if (filters?.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id)
  }
  if (filters?.booking_status) {
    query = query.eq('booking_status', filters.booking_status)
  }
  if (filters?.date_from) {
    query = query.gte('scheduled_time', filters.date_from)
  }
  if (filters?.date_to) {
    query = query.lte('scheduled_time', filters.date_to)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as CalendarBooking[]
}

export async function createCalendarBooking(booking: CalendarBookingInsert) {
  const { data, error } = await (supabase
    .from('calendar_bookings') as any)
    .insert(booking)
    .select()
    .single()

  if (error) throw error
  return data as CalendarBooking
}

export async function updateCalendarBooking(id: string, updates: CalendarBookingUpdate) {
  const { data, error } = await (supabase
    .from('calendar_bookings') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CalendarBooking
}

// ============================================================================
// EMAIL SEQUENCES QUERIES
// ============================================================================

export async function getEmailSequences(activeOnly = false) {
  let query = supabase
    .from('email_sequences')
    .select('*')
    .order('created_at', { ascending: false })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as EmailSequence[]
}

export async function getEmailSequenceById(id: string) {
  const { data, error } = await supabase
    .from('email_sequences')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as EmailSequence
}

export async function createEmailSequence(sequence: EmailSequenceInsert) {
  const { data, error } = await (supabase
    .from('email_sequences') as any)
    .insert(sequence)
    .select()
    .single()

  if (error) throw error
  return data as EmailSequence
}

export async function updateEmailSequence(id: string, updates: EmailSequenceUpdate) {
  const { data, error } = await (supabase
    .from('email_sequences') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as EmailSequence
}

export async function deleteEmailSequence(id: string) {
  const { error } = await supabase
    .from('email_sequences')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// DOMAIN WARMUP CONFIG QUERIES
// ============================================================================

export interface DomainWarmupConfig {
  id: string
  domain: string
  warmup_schedule: any
  reputation_target: number
  daily_volume_limits: any
  manual_override?: string | null
  override_reason?: string | null
  override_at?: string | null
  created_at: string
  updated_at: string
}

export async function getDomainWarmupConfig(domain: string): Promise<DomainWarmupConfig | null> {
  const { data, error } = await supabase
    .from('domain_warmup_config')
    .select('*')
    .eq('domain', domain)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as DomainWarmupConfig
}

export async function createDomainWarmupConfig(config: {
  domain: string
  warmup_schedule: any
  reputation_target: number
  daily_volume_limits: any
}): Promise<DomainWarmupConfig> {
  const { data, error } = await (supabase
    .from('domain_warmup_config') as any)
    .insert(config)
    .select()
    .single()

  if (error) throw error
  return data as DomainWarmupConfig
}

export async function updateDomainWarmupConfig(domain: string, updates: Partial<DomainWarmupConfig>): Promise<DomainWarmupConfig> {
  const { data, error } = await (supabase
    .from('domain_warmup_config') as any)
    .update(updates)
    .eq('domain', domain)
    .select()
    .single()

  if (error) throw error
  return data as DomainWarmupConfig
}

// ============================================================================
// DELIVERABILITY THRESHOLDS QUERIES
// ============================================================================

export interface DeliverabilityThresholds {
  id: string
  domain: string
  bounce_rate_warning: number
  bounce_rate_critical: number
  spam_complaint_warning: number
  spam_complaint_critical: number
  min_reputation_score: number
  auto_pause_enabled: boolean
  alert_emails: string[]
  alert_in_app: boolean
  created_at: string
  updated_at: string
}

export async function getDeliverabilityThresholds(domain: string): Promise<DeliverabilityThresholds | null> {
  const { data, error } = await supabase
    .from('deliverability_thresholds')
    .select('*')
    .eq('domain', domain)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as DeliverabilityThresholds
}

export async function createDeliverabilityThresholds(thresholds: Omit<DeliverabilityThresholds, 'id' | 'created_at' | 'updated_at'>): Promise<DeliverabilityThresholds> {
  const { data, error } = await (supabase
    .from('deliverability_thresholds') as any)
    .insert(thresholds)
    .select()
    .single()

  if (error) throw error
  return data as DeliverabilityThresholds
}

export async function updateDeliverabilityThresholds(domain: string, updates: Partial<DeliverabilityThresholds>): Promise<DeliverabilityThresholds> {
  const { data, error } = await (supabase
    .from('deliverability_thresholds') as any)
    .update(updates)
    .eq('domain', domain)
    .select()
    .single()

  if (error) throw error
  return data as DeliverabilityThresholds
}

// ============================================================================
// CALENDAR INTEGRATIONS QUERIES
// ============================================================================

export interface CalendarIntegration {
  id: string
  provider: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  calendar_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getCalendarIntegration(provider: string): Promise<CalendarIntegration | null> {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .eq('provider', provider)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as CalendarIntegration
}

export async function getAllCalendarIntegrations(): Promise<CalendarIntegration[]> {
  const { data, error } = await supabase
    .from('calendar_integrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as CalendarIntegration[]
}

export async function createCalendarIntegration(integration: Omit<CalendarIntegration, 'id' | 'created_at' | 'updated_at'>): Promise<CalendarIntegration> {
  const { data, error } = await (supabase
    .from('calendar_integrations') as any)
    .insert(integration)
    .select()
    .single()

  if (error) throw error
  return data as CalendarIntegration
}

export async function updateCalendarIntegration(id: string, updates: Partial<CalendarIntegration>): Promise<CalendarIntegration> {
  const { data, error } = await (supabase
    .from('calendar_integrations') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as CalendarIntegration
}

// ============================================================================
// EMAIL ROUTING RULES QUERIES
// ============================================================================

export interface EmailRoutingRule {
  id: string
  trigger_event: string
  conditions: any
  action_type: string
  recipient_email: string
  template_id: string | null
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getEmailRoutingRules(): Promise<EmailRoutingRule[]> {
  const { data, error } = await supabase
    .from('email_routing_rules')
    .select('*')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as EmailRoutingRule[]
}

export async function getEmailRoutingRuleById(id: string): Promise<EmailRoutingRule | null> {
  const { data, error } = await supabase
    .from('email_routing_rules')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as EmailRoutingRule
}

export async function createEmailRoutingRule(rule: Omit<EmailRoutingRule, 'id' | 'created_at' | 'updated_at'>): Promise<EmailRoutingRule> {
  const { data, error } = await (supabase
    .from('email_routing_rules') as any)
    .insert(rule)
    .select()
    .single()

  if (error) throw error
  return data as EmailRoutingRule
}

export async function updateEmailRoutingRule(id: string, updates: Partial<EmailRoutingRule>): Promise<EmailRoutingRule> {
  const { data, error } = await (supabase
    .from('email_routing_rules') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as EmailRoutingRule
}

export async function deleteEmailRoutingRule(id: string) {
  const { error } = await supabase
    .from('email_routing_rules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================================================
// PERSONALIZATION CONFIG QUERIES
// ============================================================================

export interface PersonalizationConfig {
  id: string
  sequence_id: string
  step_index: number
  prompt_template: string
  strategy: string
  variables: any
  enabled: boolean
  created_at: string
  updated_at: string
}

export async function getPersonalizationConfig(sequence_id: string, step_index?: number): Promise<PersonalizationConfig | null> {
  let query = supabase
    .from('email_sequence_templates')
    .select('*')
    .eq('sequence_id', sequence_id)

  if (step_index !== undefined) {
    query = query.eq('step_index', step_index)
  }

  const { data, error } = await query.order('step_index', { ascending: true }).limit(1)

  if (error) throw error
  return (data && data.length > 0 ? data[0] : null) as PersonalizationConfig | null
}

export async function createPersonalizationConfig(config: Omit<PersonalizationConfig, 'id' | 'created_at' | 'updated_at'>): Promise<PersonalizationConfig> {
  const { data, error } = await (supabase
    .from('email_sequence_templates') as any)
    .insert(config)
    .select()
    .single()

  if (error) throw error
  return data as PersonalizationConfig
}

export async function updatePersonalizationConfig(id: string, updates: Partial<PersonalizationConfig>): Promise<PersonalizationConfig> {
  const { data, error } = await (supabase
    .from('email_sequence_templates') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PersonalizationConfig
}

// ============================================================================
// BOOKING TEMPLATES QUERIES
// ============================================================================

export interface BookingTemplate {
  id: string
  name: string
  provider: string
  template_url: string
  variables: any
  is_default: boolean
  created_at: string
  updated_at: string
}

export async function getBookingTemplates(provider?: string): Promise<BookingTemplate[]> {
  let query = supabase
    .from('booking_templates')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (provider) {
    query = query.eq('provider', provider)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as BookingTemplate[]
}

export async function createBookingTemplate(template: Omit<BookingTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<BookingTemplate> {
  const { data, error } = await (supabase
    .from('booking_templates') as any)
    .insert(template)
    .select()
    .single()

  if (error) throw error
  return data as BookingTemplate
}

export async function updateBookingTemplate(id: string, updates: Partial<BookingTemplate>): Promise<BookingTemplate> {
  const { data, error } = await (supabase
    .from('booking_templates') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as BookingTemplate
}

export async function deleteBookingTemplate(id: string) {
  const { error } = await supabase
    .from('booking_templates')
    .delete()
    .eq('id', id)

  if (error) throw error
}

