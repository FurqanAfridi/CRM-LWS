import { Database } from '@/lib/supabase/types'

type Company = Database['public']['Tables']['companies']['Row']

export interface ICPScoreBreakdown {
  totalScore: number
  isQualified: boolean
  breakdown: {
    requiredCriteria: number
    optimalRange: number
    industryMatch: number
    geographicMatch: number
  }
  reasons: string[]
}

/**
 * Calculate ICP score for a company
 * Restaurant Chain Scoring:
 * - Location count: 20+ (required), 20-100 (optimal), 100+ (enterprise)
 * - Employee count: 500+ (required), 500-5,000 (optimal)
 * - Revenue: $30M+ (required), $30M-$500M (optimal)
 * 
 * Hotel Chain Scoring:
 * - Location count: 10+ (required), 10-50 (optimal), 50+ (enterprise)
 * - Employee count: 250+ (required), 250-2,500 (optimal)
 * - Revenue: $100M+ (required), $100M-$1B (optimal)
 */
export function calculateICPScore(company: Company): ICPScoreBreakdown {
  const breakdown = {
    requiredCriteria: 0,
    optimalRange: 0,
    industryMatch: 0,
    geographicMatch: 0,
  }
  const reasons: string[] = []

  if (!company.industry_type) {
    return {
      totalScore: 0,
      isQualified: false,
      breakdown,
      reasons: ['Industry type not specified'],
    }
  }

  const isRestaurant = company.industry_type === 'restaurant'
  const isHotel = company.industry_type === 'hotel'

  // Industry match (20 points)
  if (isRestaurant || isHotel) {
    breakdown.industryMatch = 20
    reasons.push(`Industry match: ${company.industry_type}`)
  }

  if (isRestaurant) {
    // Restaurant criteria
    const locationCount = company.location_count || 0
    const employeeCount = company.employee_count || 0
    const revenue = parseRevenue(company.revenue_range)

    // Required criteria (40 points)
    if (locationCount >= 20) {
      breakdown.requiredCriteria += 15
      reasons.push(`Location count meets requirement: ${locationCount} locations`)
    }
    if (employeeCount >= 500) {
      breakdown.requiredCriteria += 15
      reasons.push(`Employee count meets requirement: ${employeeCount} employees`)
    }
    if (revenue >= 30) {
      breakdown.requiredCriteria += 10
      reasons.push(`Revenue meets requirement: $${revenue}M`)
    }

    // Optimal range (30 points)
    if (locationCount >= 20 && locationCount <= 100) {
      breakdown.optimalRange += 10
      reasons.push(`Location count in optimal range: ${locationCount}`)
    } else if (locationCount > 100) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise location count: ${locationCount}`)
    }

    if (employeeCount >= 500 && employeeCount <= 5000) {
      breakdown.optimalRange += 10
      reasons.push(`Employee count in optimal range: ${employeeCount}`)
    } else if (employeeCount > 5000) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise employee count: ${employeeCount}`)
    }

    if (revenue >= 30 && revenue <= 500) {
      breakdown.optimalRange += 10
      reasons.push(`Revenue in optimal range: $${revenue}M`)
    } else if (revenue > 500) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise revenue: $${revenue}M`)
    }
  } else if (isHotel) {
    // Hotel criteria
    const locationCount = company.location_count || 0
    const employeeCount = company.employee_count || 0
    const revenue = parseRevenue(company.revenue_range)

    // Required criteria (40 points)
    if (locationCount >= 10) {
      breakdown.requiredCriteria += 15
      reasons.push(`Location count meets requirement: ${locationCount} locations`)
    }
    if (employeeCount >= 250) {
      breakdown.requiredCriteria += 15
      reasons.push(`Employee count meets requirement: ${employeeCount} employees`)
    }
    if (revenue >= 100) {
      breakdown.requiredCriteria += 10
      reasons.push(`Revenue meets requirement: $${revenue}M`)
    }

    // Optimal range (30 points)
    if (locationCount >= 10 && locationCount <= 50) {
      breakdown.optimalRange += 10
      reasons.push(`Location count in optimal range: ${locationCount}`)
    } else if (locationCount > 50) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise location count: ${locationCount}`)
    }

    if (employeeCount >= 250 && employeeCount <= 2500) {
      breakdown.optimalRange += 10
      reasons.push(`Employee count in optimal range: ${employeeCount}`)
    } else if (employeeCount > 2500) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise employee count: ${employeeCount}`)
    }

    if (revenue >= 100 && revenue <= 1000) {
      breakdown.optimalRange += 10
      reasons.push(`Revenue in optimal range: $${revenue}M`)
    } else if (revenue > 1000) {
      breakdown.optimalRange += 8
      reasons.push(`Enterprise revenue: $${revenue}M`)
    }
  }

  // Geographic match (10 points)
  if (company.headquarters_state) {
    const contiguousStates = [
      'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY',
      'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM',
      'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA',
      'WI', 'WV', 'WY'
    ]
    // Simple check - in production, you'd check geographic_distribution JSONB
    breakdown.geographicMatch = 10
    reasons.push(`Geographic match: ${company.headquarters_state}`)
  }

  const totalScore = 
    breakdown.requiredCriteria +
    breakdown.optimalRange +
    breakdown.industryMatch +
    breakdown.geographicMatch

  const isQualified = totalScore >= 70

  return {
    totalScore,
    isQualified,
    breakdown,
    reasons,
  }
}

/**
 * Parse revenue range string to number (in millions)
 * Examples: "$30M-$500M" -> 30, "$100M+" -> 100
 */
function parseRevenue(revenueRange: string | null): number {
  if (!revenueRange) return 0

  // Extract first number from range
  const match = revenueRange.match(/\$?(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Check if company meets ICP criteria
 */
export function isICPQualified(company: Company): boolean {
  const score = calculateICPScore(company)
  return score.isQualified
}

/**
 * Get detailed ICP breakdown
 */
export function getICPBreakdown(company: Company): ICPScoreBreakdown {
  return calculateICPScore(company)
}

