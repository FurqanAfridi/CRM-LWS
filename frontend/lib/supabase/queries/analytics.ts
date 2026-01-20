import { supabase } from '../client'

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
  // First, fetch all DNC company IDs and contact IDs (same logic as getLeads)
  const [dncCompaniesResult, dncContactsResult] = await Promise.all([
    supabase.from('companies').select('id').eq('is_dnc', true),
    supabase.from('contacts').select('id').eq('is_dnc', true),
  ])

  if (dncCompaniesResult.error) throw dncCompaniesResult.error
  if (dncContactsResult.error) throw dncContactsResult.error

  const dncCompanyIds = new Set((dncCompaniesResult.data || []).map((c: any) => c.id))
  const dncContactIds = new Set((dncContactsResult.data || []).map((c: any) => c.id))

  // Fetch all leads data to filter out DNC leads
  const [leadsResult, companiesResult, qualifiedLeadsResult, closedWonResult, pipelineValueResult] = await Promise.all([
    supabase.from('leads').select('id, company_id, contact_id'),
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('leads').select('id, company_id, contact_id, qualification_status').eq('qualification_status', 'qualified'),
    supabase.from('leads').select('id, company_id, contact_id, status').eq('status', 'closed_won'),
    supabase.from('leads').select('id, company_id, contact_id, estimated_value').not('estimated_value', 'is', null),
  ])

  if (leadsResult.error) throw leadsResult.error
  if (companiesResult.error) throw companiesResult.error
  if (qualifiedLeadsResult.error) throw qualifiedLeadsResult.error
  if (closedWonResult.error) throw closedWonResult.error
  if (pipelineValueResult.error) throw pipelineValueResult.error

  // Filter out DNC leads from all results
  const allLeads = (leadsResult.data || []).filter((lead: any) => {
    const companyIsDnc = lead.company_id && dncCompanyIds.has(lead.company_id)
    const contactIsDnc = lead.contact_id && dncContactIds.has(lead.contact_id)
    return !companyIsDnc && !contactIsDnc
  })

  const qualifiedLeads = (qualifiedLeadsResult.data || []).filter((lead: any) => {
    const companyIsDnc = lead.company_id && dncCompanyIds.has(lead.company_id)
    const contactIsDnc = lead.contact_id && dncContactIds.has(lead.contact_id)
    return !companyIsDnc && !contactIsDnc
  })

  const closedWon = (closedWonResult.data || []).filter((lead: any) => {
    const companyIsDnc = lead.company_id && dncCompanyIds.has(lead.company_id)
    const contactIsDnc = lead.contact_id && dncContactIds.has(lead.contact_id)
    return !companyIsDnc && !contactIsDnc
  })

  const pipelineValue = (pipelineValueResult.data || []).filter((lead: any) => {
    const companyIsDnc = lead.company_id && dncCompanyIds.has(lead.company_id)
    const contactIsDnc = lead.contact_id && dncContactIds.has(lead.contact_id)
    return !companyIsDnc && !contactIsDnc
  }).reduce((sum: number, lead: any) => {
    return sum + (Number(lead.estimated_value) || 0)
  }, 0)

  const totalLeads = allLeads.length
  const qualifiedLeadsCount = qualifiedLeads.length
  const totalCompanies = companiesResult.count || 0
  const closedWonCount = closedWon.length
  const conversionRate = totalLeads > 0 ? (closedWonCount / totalLeads) * 100 : 0

  return {
    totalLeads,
    qualifiedLeads: qualifiedLeadsCount,
    totalCompanies,
    pipelineValue,
    conversionRate,
  }
}

export async function getObjectionFrequency(): Promise<ObjectionFrequency[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('objections')
    .limit(1000) // Limit to prevent loading too much data

  if (error) throw error

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
  // Use count queries for each status instead of fetching all records
  const stages = ['new', 'qualified', 'contract_review', 'proposal', 'closed_won', 'closed_lost']
  
  const statusCounts = await Promise.all(
    stages.map(async (stage) => {
      const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', stage)
      
      if (error) throw error
      return { stage, count: count || 0 }
    })
  )

  const total = statusCounts.reduce((sum, s) => sum + s.count, 0)
  
  return statusCounts.map(({ stage, count }) => ({
    stage,
    count,
    percentage: total > 0 ? (count / total) * 100 : 0,
  }))
}

export async function getICPPerformance(): Promise<{
  totalCompanies: number
  qualifiedCompanies: number
  qualificationRate: number
  averageScore: number
}> {
  // Use count queries and aggregate for better performance
  const [totalResult, qualifiedResult, scoresResult] = await Promise.all([
    supabase.from('companies').select('id', { count: 'exact', head: true }),
    supabase.from('companies').select('id', { count: 'exact', head: true }).eq('icp_qualified', true),
    supabase.from('companies').select('icp_score').not('icp_score', 'is', null).limit(1000),
  ])

  if (totalResult.error) throw totalResult.error
  if (qualifiedResult.error) throw qualifiedResult.error
  if (scoresResult.error) throw scoresResult.error

  const totalCompanies = totalResult.count || 0
  const qualifiedCompanies = qualifiedResult.count || 0
  const qualificationRate = totalCompanies > 0 ? (qualifiedCompanies / totalCompanies) * 100 : 0
  
  const scores = (scoresResult.data || []) as Array<{ icp_score: number }>
  const averageScore = scores.length > 0
    ? scores.reduce((sum, c) => sum + (c.icp_score || 0), 0) / scores.length
      : 0

  return {
    totalCompanies,
    qualifiedCompanies,
    qualificationRate,
    averageScore,
  }
}

