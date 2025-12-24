import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

let clientInstance: SupabaseClient<Database> | undefined
let initError: Error | undefined // Cache initialization errors

function getClient(): SupabaseClient<Database> {
  // If we already tried and failed, throw the cached error
  if (initError) throw initError

  if (clientInstance) return clientInstance

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

  const isConfigured =
    supabaseUrl !== '' &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    supabaseAnonKey !== '' &&
    supabaseAnonKey !== 'placeholder-key' &&
    supabaseAnonKey.startsWith('eyJ')

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && !clientInstance) {
    if (!isConfigured) {
      console.warn('Supabase not configured. Requests will fail.')
    }
  }

  if (!isConfigured) {
    initError = new Error('Supabase not configured: Missing or invalid environment variables')
    throw initError
  }

  try {
    clientInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    return clientInstance
  } catch (error) {
    initError = error instanceof Error ? error : new Error('Failed to create Supabase client')
    throw initError
  }
}

// Export a Proxy that initializes the client on first property access
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get: (_target, prop) => {
    // Ignore special symbols and 'then' to prevent Promise-like behavior
    if (typeof prop === 'symbol' || prop === 'then') return undefined

    const client = getClient()
    const value = (client as any)[prop]

    if (typeof value === 'function') {
      return value.bind(client)
    }

    return value
  }
})

export function checkSupabaseConfig() {
  try {
    getClient() // Just try to get the client
    return { configured: true }
  } catch (error) {
    return {
      configured: false,
      error: error instanceof Error ? error : new Error('Unknown configuration error'),
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      },
    }
  }
}