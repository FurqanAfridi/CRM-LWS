import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  calculateCompanyICPScore,
  type CompanyFilters,
} from '@/lib/supabase/queries/companies'
import { Database } from '@/lib/supabase/types'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export function useCompanies(filters?: CompanyFilters) {
  return useInfiniteQuery({
    queryKey: ['companies', filters],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        // First fetch: limit 50. Subsequent fetches: limit 30.
        const limit = pageParam === 0 ? 50 : 30
        const data = await getCompanies({ ...filters, offset: pageParam, limit })
        return data || []
      } catch (error) {
        console.error('Error fetching companies:', error)
        throw error
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage) return undefined

      // If the last page has fewer items than its limit, we've reached the end
      const lastPageLimit = allPages.length === 1 ? 50 : 30
      if (lastPage.length < lastPageLimit) return undefined

      // Calculate next offset based on total items fetched so far
      const totalfetched = allPages.reduce((acc, page) => acc + (page?.length || 0), 0)
      return totalfetched
    },
    // Keep data fresh for a bit
    staleTime: 30000,
  })
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => getCompanyById(id),
    enabled: !!id,
  })
}

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (company: CompanyInsert) => createCompany(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CompanyUpdate }) =>
      updateCompany(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] })
    },
  })
}

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

export function useCalculateICPScore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyId: string) => calculateCompanyICPScore(companyId),
    onSuccess: (_, companyId) => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}

