import { supabase } from '../client'
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

/**
 * Check if a title represents a corporate role (not a single-location owner)
 */
function isCorporateRole(title: string | null): boolean {
  if (!title) return false
  const t = title.toLowerCase().trim()
  
  // Exclude single-location owner titles
  if (t === 'owner' || t === 'business owner' || t === 'local owner') {
    return false
  }
  // Exclude if it's just "owner" without other corporate indicators
  if (t.includes('owner') && !t.includes('coo') && !t.includes('co-owner')) {
    // Check if it's ONLY "owner" or "business owner" or "local owner"
    const ownerOnlyPatterns = /^(local\s+)?(business\s+)?owner$/i
    if (ownerOnlyPatterns.test(t)) {
      return false
    }
  }
  
  // Include corporate roles
  const corporateRoles = [
    'ceo', 'chief executive officer',
    'cfo', 'chief financial officer',
    'coo', 'chief operating officer',
    'cto', 'chief technology officer',
    'cmo', 'chief marketing officer',
    'svp', 'senior vice president',
    'vp', 'vice president',
    'president', 'executive',
    'director', 'head of',
    'finance', 'operations', 'facilities', 'procurement',
    'manager', 'general manager'
  ]
  return corporateRoles.some(role => t.includes(role))
}

export async function getLeads(filters?: LeadFilters) {
  // First, fetch all DNC company IDs and contact IDs
  const { data: dncCompanies } = await supabase
    .from('companies')
    .select('id')
    .eq('is_dnc', true)

  const { data: dncContacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('is_dnc', true)

  const dncCompanyIds = new Set((dncCompanies || []).map((c: any) => c.id))
  const dncContactIds = new Set((dncContacts || []).map((c: any) => c.id))

  // For qualified leads, we need to join with companies to check industry_type
  const needsIndustryCheck = filters?.qualification_status === 'qualified'
  
  // Now fetch leads with filters
  let query = supabase
    .from('leads')
    .select(needsIndustryCheck 
      ? '*, companies!leads_company_id_fkey(industry_type)' 
      : '*')
    .order('created_at', { ascending: false })
    .limit(2000) // Increased limit to ensure we have enough after deduplication

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

  const { data, error } = await query as { data: any[] | null; error: any }

  if (error) throw error

  // Deduplication logic: Keep the most recent lead for each unique email
  // If no email, use name + company_name as key
  const seen = new Set<string>()
  const uniqueLeads: any[] = []

  for (const lead of (data || [])) {
    const key = lead.email
      ? `email:${lead.email.toLowerCase().trim()}`
      : `name:${(lead.name || '').toLowerCase().trim()}|company:${(lead.company_name || '').toLowerCase().trim()}`

    if (!seen.has(key)) {
      seen.add(key)
      uniqueLeads.push(lead)
    }
  }

  // Filter out leads where the company or contact is marked as DNC
  let filteredData = uniqueLeads.filter((lead: any) => {
    const companyIsDnc = lead.company_id && dncCompanyIds.has(lead.company_id)
    const contactIsDnc = lead.contact_id && dncContactIds.has(lead.contact_id)

    // Exclude lead if either company or contact is DNC
    return !companyIsDnc && !contactIsDnc
  })

  // For qualified leads, apply additional filters:
  // 1. Industry filtering: Only Restaurant or Hotel companies
  // 2. Title filtering: Only corporate roles (exclude Owner, Business Owner, Local Owner)
  if (filters?.qualification_status === 'qualified') {
    // Fetch company industry types for leads that have company_id
    const companyIds = new Set(
      filteredData
        .map((lead: any) => lead.company_id)
        .filter((id: string | null): id is string => id !== null)
    )
    
    let companyIndustryMap = new Map<string, string | null>()
    if (companyIds.size > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, industry_type')
        .in('id', Array.from(companyIds))
      
      if (companies) {
        companies.forEach((company: any) => {
          companyIndustryMap.set(company.id, company.industry_type)
        })
      }
    }
    
    filteredData = filteredData.filter((lead: any) => {
      // Industry filtering: Check if company is restaurant or hotel
      if (lead.company_id) {
        const industryType = companyIndustryMap.get(lead.company_id)
        // Only include if industry_type is 'restaurant' or 'hotel'
        if (industryType !== 'restaurant' && industryType !== 'hotel') {
          return false
        }
      } else {
        // If no company_id, we can't verify industry - exclude for safety
        return false
      }
      
      // Title filtering: Only include corporate roles
      if (!isCorporateRole(lead.title)) {
        return false
      }
      
      return true
    })
  }

  return filteredData as Lead[]
}

export async function getLeadById(id: string) {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Lead
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

