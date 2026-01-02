import { Database } from '../types'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export interface CompanyFilters {
  industry_type?: 'restaurant' | 'hotel'
  icp_qualified?: boolean
  location_count_min?: number
  location_count_max?: number
  offset?: number
  limit?: number
}

export async function getCompanies(filters?: CompanyFilters) {
  const params = new URLSearchParams()
  if (filters?.offset) params.append('offset', String(filters.offset))
  if (filters?.limit) params.append('limit', String(filters.limit))
  if (filters?.industry_type) params.append('industry_type', filters.industry_type)
  if (filters?.icp_qualified !== undefined) params.append('icp_qualified', String(filters.icp_qualified))

  const res = await fetch(`/api/companies?${params.toString()}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch companies')
  }
  return res.json() as Promise<Company[]>
}

export async function getCompanyById(id: string) {
  const res = await fetch(`/api/companies/${id}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch company')
  }
  return res.json() as Promise<Company>
}

export async function createCompany(company: CompanyInsert) {
  const res = await fetch('/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to create company')
  }
  return res.json() as Promise<Company>
}

export async function updateCompany(id: string, updates: CompanyUpdate) {
  const res = await fetch(`/api/companies/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to update company')
  }
  return res.json() as Promise<Company>
}

export async function deleteCompany(id: string) {
  const res = await fetch(`/api/companies/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to delete company')
  }
}

export async function calculateCompanyICPScore(companyId: string) {
  // This logic is now handled in the backend route (PATCH/POST triggers it),
  // but if we need to explicitly trigger it without changing data, we might need a specific endpoint.
  // For now, we'll just re-fetch the company which serves as a "read", assuming backend handles updates on change.
  // Actually, the backend code I wrote recalculates on PATCH.
  // So this function acts as a wrapper to update with empty payload? No, that won't trigger logic.
  // To strictly follow backend logic, we update the company with the SAME data to trigger the hook?
  // Or simpler: We just fetch the company for now, as the recalculation is an internal backend side effect.

  // Realistically, the detailed scoring logic is inside the API routes now.
  // I will just return the company's current score by fetching it.
  const company = await getCompanyById(companyId)
  return {
    totalScore: company.icp_score || 0,
    isQualified: company.icp_qualified || false,
    reasons: (company.qualification_reason || '').split('; '),
    sectionScores: {} // Detailed breakdown not available in simple fetch response currently
  }
}
