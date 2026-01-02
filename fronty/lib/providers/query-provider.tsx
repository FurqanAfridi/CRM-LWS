'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryClientProviderWrapper({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000, // Cache for 2 minutes (increased from 30 seconds)
            refetchOnWindowFocus: false,
            retry: 1, // Retry once for network errors
            retryOnMount: false, // Prevent double fetch on mount
            refetchOnReconnect: false,
            gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time (increased from 5)
          },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

