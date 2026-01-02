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
    .select('id, lead_id, campaign_id, sequence_step, subject, content, status, sent_at, delivered_at, opened_at, replied_at, bounce_reason, created_at, updated_at, sent_to')
    .eq('campaign_id', campaignId)
    .order('sent_at', { ascending: false })
    .limit(200) // Limit to last 200 messages per campaign

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

  // Optimize: Get message counts and last replied message in a single query per lead
  // Instead of fetching all messages, we'll get aggregated data
  const leadsWithStats = await Promise.all(
    leads.map(async (lead) => {
      // Find active campaign for this lead
      const campaign: CampaignWithSequence | null = campaigns.find((c) =>
        c.lead_id === lead.id &&
        (c.status === 'active' || c.status === 'paused' || c.status === 'pending')
      ) || campaigns.find((c) => c.lead_id === lead.id) || null

      // Get only the last replied message (most recent) and count stats
      const { data: lastRepliedMessageData, error: repliedError } = await supabase
        .from('email_messages')
        .select('id, subject, content, sequence_step, sent_at, replied_at')
        .eq('lead_id', lead.id)
        .eq('status', 'replied')
        .not('replied_at', 'is', null)
        .order('replied_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (repliedError && repliedError.code !== 'PGRST116') throw repliedError
      const lastRepliedMessage = lastRepliedMessageData as { id: string; subject: string; content: string; sequence_step: number; sent_at: string; replied_at: string } | null

      // Get total message count and last sent message (optimized - only get what we need)
      const { data: lastSentMessageData, error: sentError } = await supabase
        .from('email_messages')
        .select('sent_at, status')
        .eq('lead_id', lead.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sentError && sentError.code !== 'PGRST116') throw sentError
      const lastSentMessage = lastSentMessageData as { sent_at: string; status: string } | null

      // Get reply count (use count instead of fetching all)
      const { count: replyCount, error: countError } = await supabase
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('status', 'replied')

      if (countError) throw countError

      // Get total sent count
      const { count: totalEmailsSent, error: totalCountError } = await supabase
        .from('email_messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .in('status', ['sent', 'delivered', 'opened', 'replied'])

      if (totalCountError) throw totalCountError

      const lastRepliedAt = lastRepliedMessage ? lastRepliedMessage.replied_at : null
      const lastEmailSentAt = lastSentMessage ? lastSentMessage.sent_at : null
      const repliedMessagesList = lastRepliedMessage ? [lastRepliedMessage] : []

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
        total_emails_sent: totalEmailsSent || 0,
        reply_count: replyCount || 0,
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

// Get full conversation thread for a lead from lead_email_conversations table
export interface LeadEmailConversation {
  id: string
  lead_id: string
  campaign_id: string | null
  sequence_step: number | null
  direction: 'inbound' | 'outbound'
  subject: string | null
  body: string | null
  from_email: string | null
  to_email: string | null
  cc_email: string[] | null
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'replied' | 'failed'
  sent_at: string | null
  delivered_at: string | null
  opened_at: string | null
  replied_at: string | null
  message_id: string | null
  in_reply_to: string | null
  thread_id: string | null
  created_at: string
}

export async function getLeadConversation(leadId: string) {
  // Fallback to interactions table since lead_email_conversations view might be missing
  const { data, error } = await supabase
    .from('interactions')
    .select('id, lead_id, campaign_id, sequence_step, direction, subject, content, created_at, email_message_id')
    .eq('lead_id', leadId)
    .eq('interaction_type', 'email')
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    throw error
  }

  // Map to LeadEmailConversation format
  return (data || []).map((item: any) => ({
    id: item.id,
    lead_id: item.lead_id,
    campaign_id: item.campaign_id,
    sequence_step: item.sequence_step,
    direction: item.direction,
    subject: item.subject,
    body: item.content,
    from_email: null,
    to_email: null,
    cc_email: [],
    status: item.direction === 'outbound' ? 'sent' : 'replied',
    sent_at: item.created_at,
    delivered_at: null,
    opened_at: null,
    replied_at: null,
    message_id: item.email_message_id,
    in_reply_to: null,
    thread_id: null,
    created_at: item.created_at
  })) as LeadEmailConversation[]
}

// Legacy function - kept for backwards compatibility but now uses interactions
export async function getLeadMessages(leadId: string) {
  const { data, error } = await supabase
    .from('interactions')
    .select('id, lead_id, campaign_id, sequence_step, direction, subject, content, created_at, email_message_id')
    .eq('lead_id', leadId)
    .eq('interaction_type', 'email')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw error
  }

  // Map to LeadEmailConversation format
  return (data || []).map((item: any) => ({
    id: item.id,
    lead_id: item.lead_id,
    campaign_id: item.campaign_id,
    sequence_step: item.sequence_step,
    direction: item.direction,
    subject: item.subject,
    body: item.content,
    from_email: null,
    to_email: null,
    cc_email: [],
    status: item.direction === 'outbound' ? 'sent' : 'replied',
    sent_at: item.created_at,
    delivered_at: null,
    opened_at: null,
    replied_at: null,
    message_id: item.email_message_id,
    in_reply_to: null,
    thread_id: null,
    created_at: item.created_at
  })) as LeadEmailConversation[]
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
    .limit(500) // Limit to 500 follow-ups to prevent loading too much data

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

  // Add limit to prevent loading too much data
  query = query.limit(10000)

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
      leads (
        id,
        name,
        email,
        company_name
      )
    `)
    .order('scheduled_time', { ascending: true })
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

// ============================================================================
// AI RESPONDER CONFIG QUERIES
// ============================================================================

export interface AIResponderConfig {
  id: string
  user_id: string | null
  enabled: boolean
  auto_send: boolean
  strategy: 'aggressive' | 'moderate' | 'conservative'
  response_prompt: string
  response_delay_minutes: number
  created_at: string
  updated_at: string
}

export async function getAIResponderConfig(userId?: string | null): Promise<AIResponderConfig | null> {
  let query = supabase
    .from('ai_responder_config')
    .select('*')
    .limit(1)

  if (userId) {
    query = query.eq('user_id', userId)
  } else {
    query = query.is('user_id', null)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) throw error
  return (data && data.length > 0 ? data[0] : null) as AIResponderConfig | null
}

export async function createAIResponderConfig(config: Omit<AIResponderConfig, 'id' | 'created_at' | 'updated_at'>): Promise<AIResponderConfig> {
  const { data, error } = await (supabase
    .from('ai_responder_config') as any)
    .insert(config)
    .select()
    .single()

  if (error) throw error
  return data as AIResponderConfig
}

export async function updateAIResponderConfig(id: string, updates: Partial<AIResponderConfig>): Promise<AIResponderConfig> {
  const { data, error } = await (supabase
    .from('ai_responder_config') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as AIResponderConfig
}

export async function upsertAIResponderConfig(config: {
  user_id?: string | null
  enabled: boolean
  auto_send: boolean
  strategy: 'aggressive' | 'moderate' | 'conservative'
  response_prompt: string
  response_delay_minutes: number
}): Promise<AIResponderConfig> {
  // Check if config exists
  const existing = await getAIResponderConfig(config.user_id || null)

  if (existing) {
    return await updateAIResponderConfig(existing.id, config)
  } else {
    // Ensure user_id is provided (can be null)
    return await createAIResponderConfig({
      user_id: config.user_id ?? null,
      enabled: config.enabled,
      auto_send: config.auto_send,
      strategy: config.strategy,
      response_prompt: config.response_prompt,
      response_delay_minutes: config.response_delay_minutes,
    })
  }
}

// ============================================================================
// PENDING RESPONSES QUERIES
// ============================================================================

export interface PendingResponse {
  id: string
  lead_id: string
  email_message_id: string | null
  campaign_id: string | null
  subject: string
  content: string
  status: 'pending' | 'approved' | 'rejected' | 'sent'
  user_changes: string | null
  generated_at: string
  reviewed_at: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
  leads?: {
    id: string
    name: string | null
    email: string | null
    company_name: string | null
  } | null
}

export async function getPendingResponses(leadId?: string, status?: string): Promise<PendingResponse[]> {
  let query = supabase
    .from('pending_responses')
    .select(`
      *,
      leads:lead_id (
        id,
        name,
        email,
        company_name
      )
    `)
    .order('generated_at', { ascending: false })
    .limit(500) // Limit to prevent loading too much data

  if (leadId) {
    query = query.eq('lead_id', leadId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) throw error

  // Transform the data to handle Supabase relation format
  const transformed = (data || []).map((item: any) => {
    const lead = Array.isArray(item.leads) ? item.leads[0] : item.leads
    return {
      ...item,
      leads: lead || null,
    }
  })

  return transformed as PendingResponse[]
}

export async function getPendingResponseById(id: string): Promise<PendingResponse | null> {
  const { data, error } = await supabase
    .from('pending_responses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as PendingResponse | null
}

export async function getPendingResponseByLead(leadId: string): Promise<PendingResponse | null> {
  const { data, error } = await supabase
    .from('pending_responses')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'pending')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data || null) as PendingResponse | null
}

export async function createPendingResponse(response: Omit<PendingResponse, 'id' | 'created_at' | 'updated_at'>): Promise<PendingResponse> {
  const { data, error } = await (supabase
    .from('pending_responses') as any)
    .insert(response)
    .select()
    .single()

  if (error) throw error
  return data as PendingResponse
}

export async function updatePendingResponse(id: string, updates: Partial<PendingResponse>): Promise<PendingResponse> {
  const updateData: any = { ...updates }

  // Set reviewed_at when status changes to approved or rejected
  if (updates.status === 'approved' || updates.status === 'rejected') {
    updateData.reviewed_at = new Date().toISOString()
  }

  // Set sent_at when status changes to sent
  if (updates.status === 'sent') {
    updateData.sent_at = new Date().toISOString()
  }

  const { data, error } = await (supabase
    .from('pending_responses') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PendingResponse
}

export async function deletePendingResponse(id: string) {
  const { error } = await supabase
    .from('pending_responses')
    .delete()
    .eq('id', id)

  if (error) throw error
}

