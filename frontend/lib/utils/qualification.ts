import { Database } from '@/lib/supabase/types'

type Lead = Database['public']['Tables']['leads']['Row']
type QualificationResponse = Database['public']['Tables']['qualification_responses']['Row']

export type TimelineCategory = '60_day' | '6_9_month' | 'beyond_9_month' | null

export interface QualificationResult {
  qualificationStatus: 'unqualified' | 'qualified' | 'disqualified'
  timelineCategory: TimelineCategory
  reasons: string[]
}

/**
 * Process qualification response and update lead status
 */
export function processQualificationResponse(
  responses: QualificationResponse[]
): QualificationResult {
  const reasons: string[] = []
  let decisionMaker = false
  let budgetInterest = false
  let contractStatus: 'single_vendor' | 'multi_vendor' | 'unknown' = 'unknown'
  let contractExpiration: Date | null = null

  // Extract responses
  responses.forEach((response) => {
    switch (response.question_key) {
      case 'decision_maker':
        decisionMaker = response.response === 'yes'
        if (!decisionMaker) {
          reasons.push('Not a decision maker - need to find correct contact')
        }
        break
      case 'budget_interest':
        budgetInterest = response.response === 'yes'
        if (!budgetInterest) {
          reasons.push('No budget interest - disqualified')
        }
        break
      case 'contract_status':
        if (response.response === 'single_vendor' || response.response === 'multi_vendor') {
          contractStatus = response.response as 'single_vendor' | 'multi_vendor'
        }
        break
      case 'contract_expiration':
        if (response.response) {
          contractExpiration = new Date(response.response)
        }
        break
    }
  })

  // Determine qualification status
  let qualificationStatus: 'unqualified' | 'qualified' | 'disqualified' = 'unqualified'

  if (!decisionMaker) {
    qualificationStatus = 'unqualified'
    reasons.push('Decision maker not identified')
  } else if (!budgetInterest) {
    qualificationStatus = 'disqualified'
    reasons.push('No budget interest')
  } else if (contractStatus === 'unknown') {
    qualificationStatus = 'unqualified'
    reasons.push('Contract status unknown')
  } else {
    qualificationStatus = 'qualified'
    reasons.push('All qualification criteria met')
  }

  // Determine timeline category
  const timelineCategory = determineTimelineCategory(contractStatus, contractExpiration)

  return {
    qualificationStatus,
    timelineCategory,
    reasons,
  }
}

/**
 * Determine timeline category based on contract status and expiration
 */
export function determineTimelineCategory(
  contractStatus: 'single_vendor' | 'multi_vendor' | 'unknown',
  expirationDate: Date | null
): TimelineCategory {
  if (contractStatus === 'multi_vendor') {
    return '60_day' // Can start saving in 60 days
  }

  if (contractStatus === 'single_vendor' && expirationDate) {
    const today = new Date()
    const expiration = new Date(expirationDate)
    const monthsUntilExpiration = 
      (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)

    if (monthsUntilExpiration >= 6 && monthsUntilExpiration <= 9) {
      return '6_9_month'
    } else if (monthsUntilExpiration > 9) {
      return 'beyond_9_month'
    } else if (monthsUntilExpiration < 6 && monthsUntilExpiration > 0) {
      return '60_day' // Less than 6 months, can help with transition
    }
  }

  return null
}

/**
 * Evaluate overall qualification status for a lead
 */
export function evaluateQualificationStatus(lead: Lead): QualificationResult {
  const reasons: string[] = []

  // Check if lead has required data
  if (!lead.contract_status || lead.contract_status === 'unknown') {
    return {
      qualificationStatus: 'unqualified',
      timelineCategory: null,
      reasons: ['Contract status unknown'],
    }
  }

  const timelineCategory = determineTimelineCategory(
    lead.contract_status,
    lead.contract_expiration_date ? new Date(lead.contract_expiration_date) : null
  )

  // Determine status based on existing data
  let qualificationStatus: 'unqualified' | 'qualified' | 'disqualified' = lead.qualification_status

  if (lead.qualification_status === 'qualified' && timelineCategory) {
    reasons.push(`Qualified - Timeline: ${timelineCategory}`)
  } else if (lead.qualification_status === 'unqualified') {
    reasons.push('Not yet qualified - need more information')
  } else if (lead.qualification_status === 'disqualified') {
    reasons.push('Disqualified - does not meet criteria')
  }

  return {
    qualificationStatus,
    timelineCategory,
    reasons,
  }
}

