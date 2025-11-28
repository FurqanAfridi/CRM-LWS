import { supabase } from '../client'
import { Database } from '../types'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export interface ContactFilters {
  company_id?: string
  is_decision_maker?: boolean
}

export async function getContacts(filters?: ContactFilters) {
  let query = supabase
    .from('contacts')
    .select(`
      *,
      companies (*)
    `)
    .order('created_at', { ascending: false })

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id)
  }
  if (filters?.is_decision_maker !== undefined) {
    query = query.eq('is_decision_maker', filters.is_decision_maker)
  }

  const { data, error } = await query

  if (error) throw error
  return data as Contact[]
}

export async function getContactById(id: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select(`
      *,
      companies (*),
      interactions (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Contact & {
    companies: Database['public']['Tables']['companies']['Row'] | null
    interactions: Database['public']['Tables']['interactions']['Row'][]
  }
}

export async function createContact(contact: ContactInsert) {
  const { data, error } = await (supabase
    .from('contacts') as any)
    .insert(contact)
    .select()
    .single()

  if (error) throw error
  return data as Contact
}

export async function updateContact(id: string, updates: ContactUpdate) {
  const { data, error } = await (supabase
    .from('contacts') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Contact
}

export async function deleteContact(id: string) {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getContactInteractions(contactId: string) {
  const { data, error } = await supabase
    .from('interactions')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

