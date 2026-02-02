export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (typeof window !== 'undefined') {
  // Client-side validation
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Supabase environment variables are missing!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
  }
}

// N8N Webhooks
export const N8N_WEBHOOK_START_SEQUENCE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_START_SEQUENCE;
export const N8N_WEBHOOK_UPDATE_WARMUP = process.env.NEXT_PUBLIC_N8N_WEBHOOK_UPDATE_WARMUP_SCHEDULE;
export const N8N_WEBHOOK_VALIDATE_SEQUENCE = process.env.NEXT_PUBLIC_N8N_WEBHOOK_VALIDATE_SEQUENCE;
export const N8N_WEBHOOK_CALENDAR_OAUTH = process.env.NEXT_PUBLIC_N8N_WEBHOOK_CALENDAR_OAUTH;

// App
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
