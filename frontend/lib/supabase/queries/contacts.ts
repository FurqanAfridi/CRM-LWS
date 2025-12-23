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
    .select('*, companies(name)')
    .order('created_at', { ascending: false })
    .limit(1000)

  if (filters?.company_id) {
    query = query.eq('company_id', filters.company_id)
  }
  if (filters?.is_decision_maker !== undefined) {
    query = query.eq('is_decision_maker', filters.is_decision_maker)
  }

  const { data, error } = await query
  if (error) throw error

  // Transform data to include company_name flattened
  return (data || []).map((contact: any) => ({
    ...contact,
    company_name: contact.companies?.name || null
  })) as (Contact & { company_name?: string | null })[]
}

export async function getContactById(id: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('*, companies(name)')
    .eq('id', id)
    .single()

  if (error) throw error

  const contact = data as any
  return {
    ...contact,
    company_name: contact.companies?.name || null
  } as Contact & { company_name?: string | null }
}

export async function createContact(contact: ContactInsert & { company_name?: string | null }) {
  // Remove company_name from payload as it's not a column in contacts table
  const { company_name, ...dbContact } = contact

  const { data, error } = await (supabase
    .from('contacts') as any)
    .insert(dbContact)
    .select()
    .single()

  if (error) throw error
  return data as Contact
}

export async function updateContact(id: string, updates: ContactUpdate & { company_name?: string | null }) {
  // Remove company_name from payload
  const { company_name, ...dbUpdates } = updates

  const { data, error } = await (supabase
    .from('contacts') as any)
    .update(dbUpdates)
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

