import { supabase, checkSupabaseConfig } from '../client'
import { Database } from '../types'

type Lead = Database['public']['Tables']['leads']['Row']
type LeadInsert = Database['public']['Tables']['leads']['Insert']
type LeadUpdate = Database['public']['Tables']['leads']['Update']

export interface LeadFilters {
  status?: Database['public']['Tables']['leads']['Row']['status']
  qualification_status?: Database['public']['Tables']['leads']['Row']['qualification_status']
  company_id?: string
  contact_id?: string
  icp_score_min?: number
}

export async function getLeads(filters?: LeadFilters) {
  try {
    const configCheck = checkSupabaseConfig()
    if (!configCheck.configured) {
      console.warn('Supabase not configured')
      return []
    }

    let query = supabase
      .from('leads')
      .select(`
        *,
        companies (*),
        contacts (*)
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.qualification_status) {
      query = query.eq('qualification_status', filters.qualification_status)
    }
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id)
    }
    if (filters?.contact_id) {
      query = query.eq('contact_id', filters.contact_id)
    }
    if (filters?.icp_score_min) {
      query = query.gte('icp_score', filters.icp_score_min)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return [] // Return empty array instead of throwing
    }
    return (data || []) as Lead[]
  } catch (error) {
    console.error('Error in getLeads:', error)
    return [] // Return empty array on error
  }
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      companies (*),
      contacts (*),
      interactions (*),
      contracts (*),
      qualification_responses (*),
      tasks (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Lead & {
    companies: Database['public']['Tables']['companies']['Row'] | null
    contacts: Database['public']['Tables']['contacts']['Row'] | null
    interactions: Database['public']['Tables']['interactions']['Row'][]
    contracts: Database['public']['Tables']['contracts']['Row'][]
    qualification_responses: Database['public']['Tables']['qualification_responses']['Row'][]
    tasks: Database['public']['Tables']['tasks']['Row'][]
  }
}

export async function createLead(lead: LeadInsert) {
  const { data, error } = await (supabase
    .from('leads') as any)
    .insert(lead)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

export async function updateLead(id: string, updates: LeadUpdate) {
  const { data, error } = await (supabase
    .from('leads') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Lead
}

export async function updateLeadStatus(id: string, status: Lead['status']) {
  return updateLead(id, { status, stage: status })
}

export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getQualificationData(leadId: string) {
  const { data, error } = await supabase
    .from('qualification_responses')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

