import { supabase } from '../client'
import { Database } from '../types'
import { calculateICPScore } from '@/lib/utils/icp-scoring'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export interface CompanyFilters {
  industry_type?: 'restaurant' | 'hotel'
  icp_qualified?: boolean
  location_count_min?: number
  location_count_max?: number
}

export async function getCompanies(filters?: CompanyFilters) {
  let query = supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000) // Add reasonable limit to prevent fetching too many records

  if (filters?.industry_type) {
    query = query.eq('industry_type', filters.industry_type)
  }
  if (filters?.icp_qualified !== undefined) {
    query = query.eq('icp_qualified', filters.icp_qualified)
  }
  if (filters?.location_count_min) {
    query = query.gte('location_count', filters.location_count_min)
  }
  if (filters?.location_count_max) {
    query = query.lte('location_count', filters.location_count_max)
  }

  const { data, error } = await query

  if (error) throw error
  return (data || []) as Company[]
}

export async function getCompanyById(id: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Company
}

export async function createCompany(company: CompanyInsert) {
  const { data, error } = await (supabase
    .from('companies') as any)
    .insert(company)
    .select()
    .single()

  if (error) throw error

  const companyData = data as Company

  // Calculate ICP score after creation
  if (companyData) {
    const score = calculateICPScore(companyData)
    await updateCompany(companyData.id, {
      icp_score: score.totalScore,
      icp_qualified: score.isQualified,
      qualification_reason: score.reasons.join('; '),
    })
  }

  return companyData
}

export async function updateCompany(id: string, updates: CompanyUpdate) {
  const { data, error } = await (supabase
    .from('companies') as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  const companyData = data as Company

  // Recalculate ICP score if relevant fields changed
  if (companyData && (updates.location_count !== undefined || 
               updates.employee_count !== undefined || 
               updates.revenue_range !== undefined ||
               updates.industry_type !== undefined)) {
    const score = calculateICPScore(companyData)
    await (supabase
      .from('companies') as any)
      .update({
        icp_score: score.totalScore,
        icp_qualified: score.isQualified,
        qualification_reason: score.reasons.join('; '),
      })
      .eq('id', id)
  }

  return companyData
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function calculateCompanyICPScore(companyId: string) {
  const company = await getCompanyById(companyId)
  const score = calculateICPScore(company)
  
  await updateCompany(companyId, {
    icp_score: score.totalScore,
    icp_qualified: score.isQualified,
    qualification_reason: score.reasons.join('; '),
  })

  return score
}

