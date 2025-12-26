import { createClient } from '@supabase/supabase-js'
import { Database } from './types'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})