import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './env'

export const createClient = () =>
  createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  )

export const supabase = createClient()