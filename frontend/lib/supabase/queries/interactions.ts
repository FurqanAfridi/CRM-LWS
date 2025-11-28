import { supabase } from '../client'
import { Database } from '../types'

type Interaction = Database['public']['Tables']['interactions']['Row']
type InteractionInsert = Database['public']['Tables']['interactions']['Insert']

export interface InteractionFilters {
  lead_id?: string
  contact_id?: string
  interaction_type?: Database['public']['Tables']['interactions']['Row']['interaction_type']
}

export async function getInteractions(filters?: InteractionFilters) {
  let query = supabase
    .from('interactions')
    .select(`
      *,
      leads (*),
      contacts (*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.lead_id) {
    query = query.eq('lead_id', filters.lead_id)
  }
  if (filters?.contact_id) {
    query = query.eq('contact_id', filters.contact_id)
  }
  if (filters?.interaction_type) {
    query = query.eq('interaction_type', filters.interaction_type)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Interaction[]
}

export async function createInteraction(interaction: InteractionInsert) {
  const { data, error } = await (supabase
    .from('interactions') as any)
    .insert(interaction)
    .select()
    .single()

  if (error) throw error
  return data as Interaction
}

export async function getLeadInteractions(leadId: string) {
  return getInteractions({ lead_id: leadId })
}

