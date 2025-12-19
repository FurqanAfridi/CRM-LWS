import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  type ContactFilters,
} from '@/lib/supabase/queries/contacts'
import { Database } from '@/lib/supabase/types'

type Contact = Database['public']['Tables']['contacts']['Row']
type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

export function useContacts(filters?: ContactFilters) {
  return useQuery({
    queryKey: ['contacts', filters],
    queryFn: () => getContacts(filters),
    retry: 0,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 30000, // Cache for 30 seconds (was 0 - causing constant refetches)
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContactById(id),
    enabled: !!id,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (contact: ContactInsert) => createContact(contact),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ContactUpdate }) =>
      updateContact(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact', variables.id] })
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

