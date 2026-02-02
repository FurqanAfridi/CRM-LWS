import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

// Validate configuration before creating client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Supabase configuration error: Missing environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('Current values:', {
    SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Missing',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Missing',
  })
}

// Create client with fallback values if env vars are missing (will fail gracefully)
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
      autoRefreshToken: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
      detectSessionInUrl: !!(SUPABASE_URL && SUPABASE_ANON_KEY),
    },
  }
)