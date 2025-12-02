import { useQuery } from '@tanstack/react-query'
import {
  getDashboardMetrics,
  getObjectionFrequency,
  getConversionFunnel,
  getICPPerformance,
} from '@/lib/supabase/queries/analytics'

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => getDashboardMetrics(),
    retry: 0,
    retryOnMount: false, // Prevent double fetch on mount
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds instead of always fetching fresh
  })
}

export function useObjectionFrequency() {
  return useQuery({
    queryKey: ['analytics', 'objections'],
    queryFn: () => getObjectionFrequency(),
  })
}

export function useConversionFunnel() {
  return useQuery({
    queryKey: ['analytics', 'conversion'],
    queryFn: () => getConversionFunnel(),
  })
}

export function useICPPerformance() {
  return useQuery({
    queryKey: ['analytics', 'icp'],
    queryFn: () => getICPPerformance(),
  })
}

