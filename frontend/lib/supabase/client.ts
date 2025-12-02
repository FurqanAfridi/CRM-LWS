import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types'

// Get environment variables - Next.js embeds NEXT_PUBLIC_ vars at build time
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Validate configuration
const isConfigured = 
  supabaseUrl !== '' &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseAnonKey.startsWith('eyJ')

// Create Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Check if Supabase is configured
export function checkSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  
  const configured = 
    url !== '' &&
    url !== 'https://placeholder.supabase.co' &&
    url.startsWith('https://') &&
    url.includes('.supabase.co') &&
    key !== '' &&
    key !== 'placeholder-key' &&
    key.startsWith('eyJ')

  if (!configured) {
    return {
      configured: false,
      error: new Error('Supabase environment variables are not configured. Please check your .env.local file.'),
      details: {
        url: url ? 'Set (but invalid)' : 'Missing',
        key: key ? 'Set (but invalid)' : 'Missing',
      },
    }
  }

  return { configured: true }
}

// Development logging (only in development mode)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.log('🔍 Supabase Configuration:', {
    url: isConfigured ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    key: isConfigured ? 'SET' : 'MISSING',
    configured: isConfigured,
  })
  
  if (!isConfigured) {
    // eslint-disable-next-line no-console
    console.error('❌ Supabase is not configured!')
    // eslint-disable-next-line no-console
    console.error('   URL:', supabaseUrl || 'EMPTY')
    // eslint-disable-next-line no-console
    console.error('   Key:', supabaseAnonKey ? 'EXISTS' : 'EMPTY')
  }
}
