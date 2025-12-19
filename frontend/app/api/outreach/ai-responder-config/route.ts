import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAIResponderConfig, upsertAIResponderConfig } from '@/lib/supabase/queries/outreach'

// Create a server-side Supabase client for API routes
function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper to get user ID from request headers
async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabaseServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }
    
    return user.id
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    
    const config = await getAIResponderConfig(userId || null)

    return NextResponse.json({
      success: true,
      config: config || null,
    })
  } catch (error: any) {
    console.error('Error fetching AI responder config:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request)
    const body = await request.json()
    const {
      enabled,
      auto_send,
      strategy,
      response_prompt,
      response_delay_minutes,
    } = body

    // Validate required fields
    if (strategy === undefined || response_prompt === undefined) {
      return NextResponse.json(
        { error: 'strategy and response_prompt are required' },
        { status: 400 }
      )
    }

    // Validate strategy
    if (!['aggressive', 'moderate', 'conservative'].includes(strategy)) {
      return NextResponse.json(
        { error: 'strategy must be one of: aggressive, moderate, conservative' },
        { status: 400 }
      )
    }

    // Validate response_delay_minutes
    const delayMinutes = response_delay_minutes !== undefined ? parseInt(response_delay_minutes) : 0
    if (isNaN(delayMinutes) || delayMinutes < 0 || delayMinutes > 4320) {
      return NextResponse.json(
        { error: 'response_delay_minutes must be between 0 and 4320 (72 hours)' },
        { status: 400 }
      )
    }

    const config = await upsertAIResponderConfig({
      user_id: userId || null,
      enabled: enabled !== undefined ? enabled : false,
      auto_send: auto_send !== undefined ? auto_send : false,
      strategy,
      response_prompt,
      response_delay_minutes: delayMinutes,
    })

    return NextResponse.json({
      success: true,
      config,
      message: 'AI responder configuration saved successfully',
    })
  } catch (error: any) {
    console.error('Error saving AI responder config:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

