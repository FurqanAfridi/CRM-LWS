'use client'

import { QueryClientProviderWrapper } from "@/lib/providers/query-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProviderWrapper>{children}</QueryClientProviderWrapper>
}

