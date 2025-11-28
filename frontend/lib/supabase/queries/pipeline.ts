import { supabase } from '../client'
import { Database } from '../types'

type LeadStatus = Database['public']['Tables']['leads']['Row']['status']
type LeadRow = Database['public']['Tables']['leads']['Row']

export interface PipelineSummary {
  total: number
  byStatus: Record<LeadStatus, number>
  totalValue: number
  qualifiedCount: number
}

export interface StageBreakdown {
  stage: string
  count: number
  value: number
  leads: LeadRow[]
}

export async function getPipelineSummary(): Promise<PipelineSummary> {
  const { data, error } = await supabase
    .from('leads')
    .select('status, estimated_value, qualification_status')

  if (error) throw error

  const byStatus: Record<LeadStatus, number> = {
    new: 0,
    qualified: 0,
    contract_review: 0,
    proposal: 0,
    closed_won: 0,
    closed_lost: 0,
  }

  let totalValue = 0
  let qualifiedCount = 0

  const leads = (data || []) as Array<{
    status: LeadStatus
    estimated_value: number | null
    qualification_status: string
  }>

  leads.forEach((lead) => {
    byStatus[lead.status] = (byStatus[lead.status] || 0) + 1
    if (lead.estimated_value) {
      totalValue += Number(lead.estimated_value)
    }
    if (lead.qualification_status === 'qualified') {
      qualifiedCount++
    }
  })

  return {
    total: data?.length || 0,
    byStatus,
    totalValue,
    qualifiedCount,
  }
}

export async function getStageBreakdown(): Promise<StageBreakdown[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('stage, estimated_value, *')
    .order('created_at', { ascending: false })

  if (error) throw error

  const stageMap = new Map<string, { count: number; value: number; leads: LeadRow[] }>()

  const leads = (data || []) as LeadRow[]

  leads.forEach((lead) => {
    const stage = lead.stage || 'new'
    const existing = stageMap.get(stage) || { count: 0, value: 0, leads: [] }
    
    stageMap.set(stage, {
      count: existing.count + 1,
      value: existing.value + (Number(lead.estimated_value) || 0),
      leads: [...existing.leads, lead],
    })
  })

  return Array.from(stageMap.entries()).map(([stage, data]) => ({
    stage,
    ...data,
  }))
}

export async function getRevenueForecast(): Promise<{
  thisMonth: number
  nextMonth: number
  thisQuarter: number
  nextQuarter: number
}> {
  const { data, error } = await supabase
    .from('leads')
    .select('estimated_value, probability, status')
    .in('status', ['qualified', 'contract_review', 'proposal'])

  if (error) throw error

  let thisMonth = 0
  let nextMonth = 0
  let thisQuarter = 0
  let nextQuarter = 0

  const leads = (data || []) as Array<{
    estimated_value: number | null
    probability: number | null
    status: string
  }>

  leads.forEach((lead) => {
    const value = Number(lead.estimated_value) || 0
    const probability = lead.probability || 0
    const weightedValue = value * (probability / 100)

    // Simple distribution - in production, use actual dates
    thisMonth += weightedValue * 0.3
    nextMonth += weightedValue * 0.3
    thisQuarter += weightedValue * 0.2
    nextQuarter += weightedValue * 0.2
  })

  return {
    thisMonth,
    nextMonth,
    thisQuarter,
    nextQuarter,
  }
}

