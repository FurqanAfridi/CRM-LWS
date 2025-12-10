import { NextRequest, NextResponse } from 'next/server'
import { createCalendarIntegration, getCalendarIntegration } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for OAuth initiation
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_CALENDAR_OAUTH || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    if (!provider || !['calendly', 'google', 'outlook'].includes(provider)) {
      return NextResponse.json(
        { error: 'provider must be one of: calendly, google, outlook' },
        { status: 400 }
      )
    }

    // Check if already connected
    const existing = await getCalendarIntegration(provider)
    if (existing && existing.is_active) {
      return NextResponse.json(
        { error: `${provider} is already connected` },
        { status: 400 }
      )
    }

    // Call n8n webhook to initiate OAuth flow
    const oauthResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider }),
    })

    if (!oauthResponse.ok) {
      const errorData = await oauthResponse.json()
      return NextResponse.json(
        { error: errorData?.error || 'Failed to initiate OAuth flow' },
        { status: oauthResponse.status }
      )
    }

    const oauthData = await oauthResponse.json()

    return NextResponse.json({
      success: true,
      oauth_url: oauthData?.oauth_url || oauthData?.url,
      state: oauthData?.state,
      provider,
      message: 'OAuth flow initiated',
    })
  } catch (error: any) {
    console.error('Error initiating calendar OAuth:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

