import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPipelineSummary,
  getStageBreakdown,
  getRevenueForecast,
} from '@/lib/supabase/queries/pipeline'
import { updateLead } from '@/lib/supabase/queries/leads'
import { Database } from '@/lib/supabase/types'

type LeadUpdate = Database['public']['Tables']['leads']['Update']

export function usePipelineSummary() {
  return useQuery({
    queryKey: ['pipeline', 'summary'],
    queryFn: () => getPipelineSummary(),
  })
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline', 'stages'],
    queryFn: () => getStageBreakdown(),
  })
}

export function useRevenueForecast() {
  return useQuery({
    queryKey: ['pipeline', 'forecast'],
    queryFn: () => getRevenueForecast(),
  })
}

export function useUpdateLeadStage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      updateLead(id, { stage, status: stage as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

