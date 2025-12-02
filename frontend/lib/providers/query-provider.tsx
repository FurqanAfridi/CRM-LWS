'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryClientProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30000, // Cache for 30 seconds
            refetchOnWindowFocus: false,
            retry: 0, // No retries for faster failure
            retryOnMount: false, // Prevent double fetch on mount
            refetchOnReconnect: false,
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

