import { NextResponse } from 'next/server'

export async function GET() {
  // This is a server-side route to check if env vars are loaded
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  const hasUrl = url.trim() !== '' && url !== 'https://placeholder.supabase.co'
  const hasKey = key.trim() !== '' && key !== 'placeholder-key'
  
  return NextResponse.json({
    configured: hasUrl && hasKey,
    url: hasUrl ? `${url.substring(0, 30)}...` : 'Missing',
    key: hasKey ? 'Set' : 'Missing',
    urlLength: url.length,
    keyLength: key.length,
  })
}

