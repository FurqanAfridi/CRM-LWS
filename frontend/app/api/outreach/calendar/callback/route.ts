import { NextRequest, NextResponse } from 'next/server'
import { updateCalendarIntegration, getCalendarIntegration } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for OAuth callback processing
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_CALENDAR_CALLBACK || 'https://auto.lincolnwaste.co/webhook/[id]'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { provider, code, state, error: oauthError } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'provider is required' },
        { status: 400 }
      )
    }

    if (oauthError) {
      return NextResponse.json(
        { error: `OAuth error: ${oauthError}` },
        { status: 400 }
      )
    }

    // Call n8n webhook to exchange code for tokens
    const tokenResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, code, state }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json()
      return NextResponse.json(
        { error: errorData?.error || 'Failed to exchange OAuth code' },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()

    // Update or create integration record
    const existing = await getCalendarIntegration(provider)
    
    if (existing) {
      await updateCalendarIntegration(existing.id, {
        access_token: tokenData?.access_token, // Should be encrypted in production
        refresh_token: tokenData?.refresh_token, // Should be encrypted in production
        expires_at: tokenData?.expires_at ? new Date(tokenData.expires_at).toISOString() : null,
        calendar_id: tokenData?.calendar_id || null,
        is_active: true,
      })
    } else {
      // Create new integration (handled by n8n or separate endpoint)
      return NextResponse.json(
        { error: 'Integration not found. Please initiate connection first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      provider,
      message: 'Calendar connected successfully',
    })
  } catch (error: any) {
    console.error('Error processing calendar callback:', error)
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

