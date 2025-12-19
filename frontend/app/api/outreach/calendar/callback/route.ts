import { NextRequest, NextResponse } from 'next/server'
import { updateCalendarIntegration, getCalendarIntegration, createCalendarIntegration } from '@/lib/supabase/queries/outreach'

// n8n webhook URL for OAuth callback processing
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_CALENDAR_CALLBACK || 'http://auto.lincolnwaste.co:5678/webhook/calendly-callback'

export async function GET(request: NextRequest) {
  // Handle OAuth callback from Calendly (GET request with query params)
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      // Redirect to frontend with error
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_error=${encodeURIComponent(error)}`)
    }

    if (!code || !state) {
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_error=${encodeURIComponent('Missing code or state parameter')}`)
    }

    // Extract integration ID from state (format: integrationId-timestamp)
    const integrationId = state.split('-')[0]
    const existing = await getCalendarIntegration('calendly')
    
    // If no integration found, try to get by ID (if stored differently)
    // For now, we'll use the provider lookup
    if (!existing) {
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_error=${encodeURIComponent('Integration not found. Please initiate connection again.')}`)
    }

    // Call n8n webhook to exchange code for tokens
    const tokenResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        provider: 'calendly',
        code,
        state,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Token exchange error:', errorData)
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_error=${encodeURIComponent(errorData?.error || 'Failed to exchange OAuth code')}`)
    }

    const tokenData = await tokenResponse.json()

    // Update integration record with tokens
    await updateCalendarIntegration(existing.id, {
      access_token: tokenData?.access_token || tokenData?.token, // Should be encrypted in production
      refresh_token: tokenData?.refresh_token, // Should be encrypted in production
      expires_at: tokenData?.expires_at 
        ? new Date(tokenData.expires_at).toISOString() 
        : tokenData?.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      calendar_id: tokenData?.calendar_id || tokenData?.user?.uri || null,
      is_active: true,
    })

    // Redirect to frontend with success
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_success=calendly`)
  } catch (error: any) {
    console.error('Error processing calendar callback:', error)
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(`${frontendUrl}/dashboard/pipeline?oauth_error=${encodeURIComponent(error?.message || 'Internal server error')}`)
  }
}

export async function POST(request: NextRequest) {
  // Handle callback from n8n or direct API calls
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

    if (!code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      )
    }

    // Get existing integration
    const existing = await getCalendarIntegration(provider)
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found. Please initiate connection first.' },
        { status: 404 }
      )
    }

    // Call n8n webhook to exchange code for tokens
    const tokenResponse = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, code, state }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData?.error || errorData?.message || 'Failed to exchange OAuth code' },
        { status: tokenResponse.status }
      )
    }

    const tokenData = await tokenResponse.json()

    // Update integration record
    await updateCalendarIntegration(existing.id, {
      access_token: tokenData?.access_token || tokenData?.token,
      refresh_token: tokenData?.refresh_token,
      expires_at: tokenData?.expires_at 
        ? new Date(tokenData.expires_at).toISOString() 
        : tokenData?.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
          : null,
      calendar_id: tokenData?.calendar_id || tokenData?.user?.uri || null,
      is_active: true,
    })

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
