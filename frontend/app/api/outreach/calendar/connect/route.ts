import { NextRequest, NextResponse } from 'next/server'
import { createCalendarIntegration, getCalendarIntegration } from '@/lib/supabase/queries/outreach'
import { N8N_WEBHOOK_CALENDAR_OAUTH, APP_URL } from '@/lib/supabase/env'

// n8n webhook URL for OAuth initiation
const N8N_WEBHOOK_URL = N8N_WEBHOOK_CALENDAR_OAUTH || 'http://auto.lincolnwaste.co:5678/webhook/calendly-oauth'

// Calendly OAuth redirect URI - should match what's configured in Calendly app
const REDIRECT_URI = APP_URL
  ? `${APP_URL}/api/outreach/calendar/callback`
  : 'http://localhost:3000/api/outreach/calendar/callback'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider } = body

    // Only allow Calendly now
    if (!provider || provider !== 'calendly') {
      return NextResponse.json(
        { error: 'provider must be "calendly"' },
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

    // Create or update integration record (inactive until OAuth completes)
    let integration
    if (existing) {
      // Integration exists but not active - will be activated after OAuth
      integration = existing
    } else {
      // Create new integration record
      integration = await createCalendarIntegration({
        provider,
        access_token: null,
        refresh_token: null,
        expires_at: null,
        calendar_id: null,
        is_active: false,
      })
    }

    // Generate state parameter for OAuth security
    const state = `${integration.id}-${Date.now()}`

    // Call n8n webhook to initiate OAuth flow
    const oauthResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        redirect_uri: REDIRECT_URI,
        state,
      }),
    })

    if (!oauthResponse.ok) {
      const errorData = await oauthResponse.json().catch(() => ({}))
      console.error('n8n OAuth error:', errorData)
      return NextResponse.json(
        { error: errorData?.error || errorData?.message || 'Failed to initiate OAuth flow' },
        { status: oauthResponse.status }
      )
    }

    const oauthData = await oauthResponse.json()

    return NextResponse.json({
      success: true,
      oauth_url: oauthData?.oauth_url || oauthData?.url || oauthData?.authorization_url,
      state: oauthData?.state || state,
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

