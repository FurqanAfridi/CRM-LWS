import { supabase, checkSupabaseConfig } from '../client'

export interface DashboardMetrics {
  totalLeads: number
  qualifiedLeads: number
  totalCompanies: number
  pipelineValue: number
  conversionRate: number
}

export interface ObjectionFrequency {
  objection: string
  count: number
  percentage: number
}

export interface ConversionFunnel {
  stage: string
  count: number
  percentage: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const configCheck = checkSupabaseConfig()
    if (!configCheck.configured) {
      console.warn('Supabase not configured:', configCheck.error?.message)
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        totalCompanies: 0,
        pipelineValue: 0,
        conversionRate: 0,
      }
    }

    const [leadsResult, companiesResult] = await Promise.all([
      supabase.from('leads').select('id, qualification_status, estimated_value, status'),
      supabase.from('companies').select('id'),
    ])

    if (leadsResult.error) {
      console.error('Leads query error:', leadsResult.error)
      // Return default values instead of throwing
      return {
        totalLeads: 0,
        qualifiedLeads: 0,
        totalCompanies: 0,
        pipelineValue: 0,
        conversionRate: 0,
      }
    }
    
    if (companiesResult.error) {
      console.error('Companies query error:', companiesResult.error)
      // Continue with leads data if companies query fails
    }

  const leads = (leadsResult.data || []) as Array<{
    id: string
    qualification_status: string
    estimated_value: number | null
    status: string
  }>
  const companies = companiesResult.data || []

  const totalLeads = leads.length
  const qualifiedLeads = leads.filter((l) => l.qualification_status === 'qualified').length
  const totalCompanies = companies.length
  const pipelineValue = leads.reduce((sum, lead) => {
    return sum + (Number(lead.estimated_value) || 0)
  }, 0)

    const closedWon = leads.filter((l) => l.status === 'closed_won').length
    const conversionRate = totalLeads > 0 ? (closedWon / totalLeads) * 100 : 0

    return {
      totalLeads,
      qualifiedLeads,
      totalCompanies,
      pipelineValue,
      conversionRate,
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    // Return default values on error
    return {
      totalLeads: 0,
      qualifiedLeads: 0,
      totalCompanies: 0,
      pipelineValue: 0,
      conversionRate: 0,
    }
  }
}

export async function getObjectionFrequency(): Promise<ObjectionFrequency[]> {
  const configCheck = checkSupabaseConfig()
  if (!configCheck.configured) {
    console.warn('Supabase not configured')
    return []
  }

  const { data, error } = await supabase
    .from('leads')
    .select('objections')

  if (error) {
    console.error('Error fetching objection frequency:', error)
    return []
  }

  const objectionCounts = new Map<string, number>()
  let totalObjections = 0

  const leads = (data || []) as Array<{ objections: unknown }>

  leads.forEach((lead) => {
    const objections = (lead.objections as string[]) || []
    objections.forEach((obj) => {
      objectionCounts.set(obj, (objectionCounts.get(obj) || 0) + 1)
      totalObjections++
    })
  })

  return Array.from(objectionCounts.entries())
    .map(([objection, count]) => ({
      objection,
      count,
      percentage: totalObjections > 0 ? (count / totalObjections) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export async function getConversionFunnel(): Promise<ConversionFunnel[]> {
  const configCheck = checkSupabaseConfig()
  if (!configCheck.configured) {
    console.warn('Supabase not configured')
    return []
  }

  const { data, error } = await supabase
    .from('leads')
    .select('status')

  if (error) {
    console.error('Error fetching conversion funnel:', error)
    return []
  }

  const statusCounts = new Map<string, number>()
  const leads = (data || []) as Array<{ status: string }>
  const total = leads.length

  leads.forEach((lead) => {
    statusCounts.set(lead.status, (statusCounts.get(lead.status) || 0) + 1)
  })

  const stages = ['new', 'qualified', 'contract_review', 'proposal', 'closed_won', 'closed_lost']

  return stages.map((stage) => {
    const count = statusCounts.get(stage) || 0
    return {
      stage,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }
  })
}

export async function getICPPerformance(): Promise<{
  totalCompanies: number
  qualifiedCompanies: number
  qualificationRate: number
  averageScore: number
}> {
  const configCheck = checkSupabaseConfig()
  if (!configCheck.configured) {
    console.warn('Supabase not configured')
    return {
      totalCompanies: 0,
      qualifiedCompanies: 0,
      qualificationRate: 0,
      averageScore: 0,
    }
  }

  const { data, error } = await supabase
    .from('companies')
    .select('icp_qualified, icp_score')

  if (error) {
    console.error('Error fetching ICP performance:', error)
    return {
      totalCompanies: 0,
      qualifiedCompanies: 0,
      qualificationRate: 0,
      averageScore: 0,
    }
  }

  const companies = (data || []) as Array<{ icp_qualified: boolean; icp_score: number | null }>
  const totalCompanies = companies.length
  const qualifiedCompanies = companies.filter((c) => c.icp_qualified).length
  const qualificationRate = totalCompanies > 0 ? (qualifiedCompanies / totalCompanies) * 100 : 0
  const averageScore =
    companies.length > 0
      ? companies.reduce((sum, c) => sum + (c.icp_score || 0), 0) / companies.length
      : 0

  return {
    totalCompanies,
    qualifiedCompanies,
    qualificationRate,
    averageScore,
  }
}

